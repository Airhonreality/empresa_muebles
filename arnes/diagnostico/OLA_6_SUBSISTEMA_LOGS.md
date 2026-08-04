# Ola 6 — Subsistema de logs robusto (trazabilidad + KPIs + observabilidad)

**Supervisor:** Javier  
**Status:** ✅ APROBADO (2026-08-04)  
**Propósito:** Sistema de logging que es LA fuente de verdad para auditoría, trazabilidad de decisiones y generación automática de KPIs.

---

## Axioma

> "Los logs robustos permiten que el gate de influencias externas funcione. El log es lo que permite trazarlo todo y debe ser un subsistema dedicado en generación de KPIs."

**Traducción técnica:** No es solo auditoría. Es infraestructura de observabilidad que:
1. Registra TODAS las acciones (append-only)
2. Permite derivar KPIs sin consultas complejas (materialización)
3. Habilita alertas automáticas (desviaciones de patrón)
4. Fundamenta la trazabilidad de cada decisión (quién, qué, cuándo, por qué, con qué datos)

---

## 4 capas del subsistema

### Capa 1: Logs core (append-only, sin procesamiento)

**Tabla: `audit_logs`** (ya definida en OLA_6_SCHEMAS_APROBADOS.md)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Quién actuó
  actor_id UUID NOT NULL REFERENCES usuarios(id),
  actor_rol VARCHAR,
  
  -- Qué hizo
  accion VARCHAR NOT NULL (enum: 'crear', 'editar', 'aprobar', 'rechazar', 'calcular', 'pagar', 'bloquear', 'autorizar'),
  
  -- Sobre qué
  entidad_tipo VARCHAR (enum: 'proyecto', 'nómina', 'contrato', 'cotizacion', 'desfase', 'parametro', 'orden_compra', 'movimiento'),
  entidad_id UUID,
  
  -- Cambios
  cambios_json JSONB (anterior/nuevo/justificacion),
  
  -- Gate evaluado (si aplica)
  gate_evaluado VARCHAR (enum: 'E-18', 'E-20', 'E-21', 'E-24', 'E-33'),
  
  -- Decisión
  decision VARCHAR (enum: 'aprobado', 'rechazado', 'requiere_supervisor', 'calculado'),
  
  -- Contexto
  ip_origen VARCHAR,
  razon_texto TEXT
);
```

**Propiedades:**
- Nunca se actualiza (append-only)
- Nunca se borra (auditoría legal)
- Indexado por timestamp + entidad_id para queries rápidas
- Tamaño esperado: ~500k filas/mes en operación normal

---

### Capa 2: Agregación de logs (materialización diaria)

**Tabla: `log_aggregates_diarios`** (calculada cada noche)

```sql
CREATE TABLE log_aggregates_diarios (
  id UUID PRIMARY KEY,
  fecha_dia DATE NOT NULL,
  
  -- Volumen
  total_acciones INTEGER,
  acciones_por_tipo JSONB (map: accion → count),
  
  -- Decisiones
  total_aprobadas INTEGER,
  total_rechazadas INTEGER,
  tasa_rechazo_pct DECIMAL,
  
  -- Gates
  gates_ejecutados JSONB (map: gate → count, decision),
  
  -- Actores
  actores_activos_json JSONB (array de actor_id con cuenta de acciones),
  
  -- Entidades
  entidades_por_tipo JSONB (map: tipo → count, varianza),
  
  -- KPI derivados
  tiempo_promedio_aprobacion_min DECIMAL,
  entidades_bloqueadas INTEGER,
  
  -- Anomalías detectadas
  anomalias_json JSONB (array de {tipo, descripcion, severidad}),
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

**Script de cálculo (noche, 22h):**
```sql
INSERT INTO log_aggregates_diarios (fecha_dia, ...) 
SELECT 
  DATE(timestamp) as fecha_dia,
  COUNT(*) as total_acciones,
  jsonb_object_agg(accion, COUNT(*)) as acciones_por_tipo,
  COUNT(CASE WHEN decision='aprobado' THEN 1 END) as total_aprobadas,
  ...
FROM audit_logs
WHERE DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day'
GROUP BY DATE(timestamp);
```

---

### Capa 3: KPIs estratégicos (derivados, consultables)

**Vista: `kpi_operativos_mes`** (resumen del mes en curso)

```sql
CREATE VIEW kpi_operativos_mes AS
SELECT 
  DATE_TRUNC('month', CURRENT_DATE) as mes,
  
  -- Productividad
  COUNT(DISTINCT DATE(a.timestamp)) as dias_activos,
  COUNT(*) as total_acciones,
  COUNT(*) FILTER (WHERE a.decision='aprobado') as decisiones_aprobadas,
  ROUND(100.0 * COUNT(*) FILTER (WHERE a.decision='aprobado') / COUNT(*), 2) as tasa_aprobacion_pct,
  
  -- Bottlenecks
  MAX(a.timestamp) - MIN(a.timestamp) as tiempo_ventana,
  ROUND(AVG(EXTRACT(EPOCH FROM (LAG(a.timestamp) OVER (ORDER BY a.timestamp) - a.timestamp))) / 60, 2) as tiempo_promedio_entre_acciones_min,
  
  -- Gates
  COUNT(DISTINCT a.gate_evaluado) as gates_ejecutados,
  jsonb_object_agg(a.gate_evaluado, COUNT(*)) as ejecuciones_por_gate,
  
  -- Actores
  COUNT(DISTINCT a.actor_id) as actores_unicos,
  COUNT(DISTINCT a.entidad_id) as entidades_tocadas,
  
  -- Riesgo
  COUNT(*) FILTER (WHERE a.decision='rechazado') as decisiones_rechazadas,
  COUNT(*) FILTER (WHERE a.razon_texto LIKE '%bloqueante%') as acciones_bloqueantes
  
FROM audit_logs a
WHERE DATE_TRUNC('month', a.timestamp) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY 1;
```

**Ejemplos de queries a KPIs:**
```sql
-- ¿Cuál es la tasa de rechazo por actor?
SELECT a.actor_id, COUNT(*) FILTER (WHERE a.decision='rechazado') * 100 / COUNT(*) as tasa_rechazo
FROM audit_logs a
WHERE DATE_TRUNC('week', a.timestamp) = DATE_TRUNC('week', CURRENT_DATE)
GROUP BY a.actor_id;

-- ¿Cuánto demora un gate E-20 en promedio (de solicitud a aprobación)?
SELECT 
  a1.entidad_id,
  a2.timestamp - a1.timestamp as duracion
FROM audit_logs a1
JOIN audit_logs a2 ON a1.entidad_id = a2.entidad_id 
  AND a2.gate_evaluado = 'E-20' 
  AND a2.decision = 'aprobado'
WHERE a1.gate_evaluado = 'E-20' AND a1.decision IS NULL
ORDER BY duracion DESC;
```

---

### Capa 4: Alertas automáticas (reglas sobre logs)

**Tabla: `log_alerts`** (disparadas por reglas)

```sql
CREATE TABLE log_alerts (
  id UUID PRIMARY KEY,
  nombre_alerta VARCHAR NOT NULL,
  severidad VARCHAR (enum: 'info', 'warning', 'critical'),
  descripcion TEXT,
  
  -- Qué disparó la alerta
  condicion_sql TEXT (la regla que se evaluó),
  coincidencias JSONB (filas que la cumplieron),
  
  -- Cuándo
  detectado_en TIMESTAMPTZ DEFAULT NOW(),
  resuelto_en TIMESTAMPTZ,
  
  -- Acción recomendada
  accion_sugerida TEXT,
  
  estado VARCHAR (enum: 'activa', 'investigada', 'falsa_alarma', 'resuelta')
);
```

**Reglas de alerta (evaluadas cada hora):**

```sql
-- ALERTA 1: Tasa de rechazo anormal
INSERT INTO log_alerts (nombre_alerta, severidad, condicion_sql, ...)
SELECT 
  'Tasa de rechazo anormal en últimas 4h',
  'warning',
  'tasa_rechazo > 30%',
  jsonb_build_object(
    'periodo', 'últimas 4 horas',
    'tasa_rechazo', ROUND(100.0 * COUNT(*) FILTER (WHERE decision='rechazado') / COUNT(*), 2),
    'total_acciones', COUNT(*),
    'razones_rechazo', jsonb_object_agg(razon_texto, COUNT(*))
  )
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '4 hours'
HAVING COUNT(*) > 10 AND COUNT(*) FILTER (WHERE decision='rechazado') * 100 / COUNT(*) > 30;

-- ALERTA 2: Gate bloqueante sin resolver
INSERT INTO log_alerts (nombre_alerta, severidad, condicion_sql, ...)
SELECT 
  'Gate E-20 (caja) bloqueante sin autorización > 2h',
  'critical',
  'gate=E-20 AND decision=rechazado AND duracion > 120min',
  jsonb_build_object(
    'entidad_id', entidad_id,
    'proyecto', p.nombre,
    'monto_bloqueado', oc.monto_total_cop,
    'razon_bloqueo', a.razon_texto,
    'tiempo_bloqueado_min', EXTRACT(EPOCH FROM (NOW() - a.timestamp)) / 60
  )
FROM audit_logs a
LEFT JOIN ordenes_compra oc ON a.entidad_id = oc.id
LEFT JOIN proyectos p ON oc.proyecto_id = p.id
WHERE a.gate_evaluado = 'E-20' 
  AND a.decision = 'rechazado'
  AND NOW() - a.timestamp > INTERVAL '2 hours'
  AND NOT EXISTS (
    SELECT 1 FROM audit_logs a2 
    WHERE a2.entidad_id = a.entidad_id 
      AND a2.decision = 'aprobado'
      AND a2.timestamp > a.timestamp
  );

-- ALERTA 3: Desfase de cronograma no justificado
INSERT INTO log_alerts (nombre_alerta, severidad, condicion_sql, ...)
SELECT 
  'Desfase cronograma sin composición_causal',
  'warning',
  'desfase_aplicado=TRUE AND composicion_causal IS NULL',
  jsonb_build_object(
    'proyecto_id', p.id,
    'proyecto_nombre', p.nombre,
    'dias_desfase', dc.dias_desfase,
    'causa_declarada', dc.causa,
    'creado_hace_min', EXTRACT(EPOCH FROM (NOW() - dc.creado_en)) / 60
  )
FROM desfases_cronograma dc
LEFT JOIN proyectos p ON dc.proyecto_id = p.id
WHERE dc.aplicado = TRUE 
  AND (dc.composicion_causal IS NULL OR jsonb_array_length(dc.composicion_causal) = 0)
  AND NOW() - dc.creado_en > INTERVAL '30 minutes';

-- ALERTA 4: Comisiones inesperadas (fuera de rango histórico)
INSERT INTO log_alerts (nombre_alerta, severidad, condicion_sql, ...)
SELECT 
  'Comisión calculada fuera de rango (μ ± 2σ)',
  'info',
  'comision_mes > (μ + 2σ) OR comision_mes < (μ - 2σ)',
  jsonb_build_object(
    'empleado_id', c.persona_id,
    'comision_calculada', c.monto_comision,
    'promedio_historico', (SELECT AVG(monto_comision) FROM compensaciones WHERE persona_id = c.persona_id LIMIT 12),
    'desviacion_pct', ROUND(100.0 * (c.monto_comision - hist_avg) / hist_avg, 2)
  )
FROM compensaciones c
CROSS JOIN (
  SELECT AVG(monto_comision) as hist_avg 
  FROM compensaciones 
  WHERE persona_id = c.persona_id
  LIMIT 12
) stats
WHERE c.monto_comision > stats.hist_avg * 2 
   OR c.monto_comision < stats.hist_avg / 2;
```

---

## Protocolo de trazabilidad de decisiones

**Pregunta:** "¿Por qué se rechazó la nómina de Carlos en marzo?"

**Respuesta (query única):**

```sql
WITH decision_chain AS (
  SELECT 
    a.*,
    ROW_NUMBER() OVER (ORDER BY a.timestamp) as paso,
    LAG(a.id) OVER (ORDER BY a.timestamp) as paso_anterior
  FROM audit_logs a
  WHERE a.entidad_tipo = 'nómina' 
    AND a.entidad_id = '<nómina_carlos_marzo>'
  ORDER BY a.timestamp
)
SELECT 
  paso,
  a.timestamp,
  a.actor_id || ' (' || a.actor_rol || ')' as quien,
  a.accion,
  CASE 
    WHEN a.accion = 'calcular' THEN 'Nómina calculada'
    WHEN a.accion = 'rechazar' THEN 'Rechazada: ' || a.razon_texto
    WHEN a.accion = 'aprobar' THEN 'Aprobada por supervisor'
  END as qué,
  a.gate_evaluado,
  a.decision,
  a.cambios_json->>'justificacion' as por_qué
FROM decision_chain a
ORDER BY paso;
```

**Output esperado:**
```
paso | timestamp | quien | accion | qué | gate | decision | por_qué
-----|-----------|-------|--------|-----|------|----------|----------
1 | 2026-08-15 09:30 | sistema (nómina) | calcular | Nómina calculada | null | calculado | null
2 | 2026-08-15 10:15 | javier (gerente) | editar | [verificó desfase] | E-33 | calculado | "Desfase >5d sin autorizar"
3 | 2026-08-15 11:00 | supervisora (qa) | rechazar | Rechazada: desfase no resuelto | null | rechazado | "Gate E-33 no pasó; cronograma 15d atrasado, sin causa documentada"
4 | 2026-08-15 14:30 | javier (gerente) | autorizar | [resuelto desfase] | E-33 | aprobado | "Autorizado: cambio de contrato justificado. Cliente aceptó entrega semana 2 de septiembre"
5 | 2026-08-16 09:00 | supervisora (qa) | aprobar | Aprobada por supervisor | null | aprobado | "Desfase resuelto, comisiones recalculadas"
```

**De esta trazabilidad se extrae:**
- **Quién rechazó:** supervisora
- **Cuándo:** 2026-08-15 11:00
- **Por qué:** Gate E-33 falló (desfase sin causa)
- **Cómo se resolvió:** Javier autorizó cambio de contrato al cliente
- **Verificable:** Cada paso tiene entidad_id para auditoría cruzada

---

## Integración con gates (E-18, E-20, E-21, E-24, E-33)

**Cada gate genera un registro en audit_logs:**

```sql
-- Ejemplo: Gate E-33 se evalúa, se rechaza, se registra

-- 1. Sistema evalúa E-33
SELECT * FROM desfases_cronograma dc
WHERE dc.proyecto_id = '...' 
  AND (dc.composicion_causal IS NULL OR jsonb_array_length(dc.composicion_causal) = 0)
-- Resultado: FAIL (sin causa)

-- 2. Se registra en audit_logs
INSERT INTO audit_logs (
  actor_id, actor_rol, accion, entidad_tipo, entidad_id,
  gate_evaluado, decision, razon_texto, cambios_json
) VALUES (
  NULL, 'sistema', 'calcular', 'desfase', '<desfase_id>',
  'E-33', 'rechazado', 
  'Desfase sin justificación causal documentada',
  jsonb_build_object(
    'dias_desfase', 15,
    'causa_declarada', 'interna',
    'composicion_causal', null,
    'motivo_rechazo', 'Falta justificación de causa (composicion_causal vacío)'
  )
);

-- 3. Se dispara alerta (si aplica la regla)
-- Alerta #3 se ejecuta, detecta este desfase
```

---

## Checklist de integración (Ola 7)

- [ ] Tabla `audit_logs` creada con indexes en (timestamp, entidad_id, gate_evaluado)
- [ ] Script nocturno `log_aggregates_diarios` en cron (22h)
- [ ] Vista `kpi_operativos_mes` funcional
- [ ] 4 alertas core implementadas (tasa rechazo, E-20 bloqueante, desfase sin causa, comisiones anomalías)
- [ ] Cada gate dispara INSERT en `audit_logs` al evaluarse
- [ ] Query de trazabilidad funcional (test con nómina real)
- [ ] Dashboard/pantalla P-20 (caja) muestra KPIs en tiempo real
- [ ] Alertas routeadas a Supervisor (email/Slack)

---

## Propiedades axiomáticas

| Propiedad | Cumple | Nota |
|---|---|---|
| **Append-only** | ✅ | Nunca se edita ni borra audit_logs |
| **Verdad única** | ✅ | Un único log por acción + decisión |
| **Trazable** | ✅ | De cualquier decisión → cadena de pasos |
| **Auditable legalmente** | ✅ | Timestamps, actor, cambios, justificación |
| **Observable** | ✅ | KPIs derivados sin ETL externo |
| **Alerta-capaz** | ✅ | Reglas detectan anomalías automáticamente |
| **No-acoplado a gates** | ✅ | Los gates SE INTEGRAN, no los crea |

---

**Registro:** 2026-08-04 · Ola 6 · Subsistema de LOGS aprobado

