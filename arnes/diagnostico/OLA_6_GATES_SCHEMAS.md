# Ola 6 — Auditoría de schemas por GATE (validación final)

**Supervisor:** Javier  
**Objetivo:** Verificar que CADA GATE tiene todos sus schemas claramente definidos  
**Status:** ⏳ Validación

---

## Gate E-18: Aprobación de schema (desarrollo → compras)

**Predicado:** `estado='desarrollo' ∧ verificaciones.tipo_gate='schema' APROBADO ∧ verificador_id=p.verificador_id ∧ creado_en ≥ fecha_entrada_desarrollo`

**Pantalla ejecutora:** P-08 (Desarrollo/schema)

### Schemas requeridos:

#### 1. `proyectos` (ampliada)
```sql
ALTER TABLE proyectos ADD COLUMN (
  estado VARCHAR (enum: 'cotizacion','desarrollo','compra','armado','instalacion','entrega','garantia'),
  verificador_id UUID REFERENCES usuarios(id),
  fecha_entrada_desarrollo TIMESTAMPTZ,
  comercial_vendedor_id UUID REFERENCES usuarios(id)
);
```

#### 2. `schemas_proyecto` (nueva)
```sql
CREATE TABLE schemas_proyecto (
  id UUID PRIMARY KEY,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id),
  version_numero INTEGER,
  contenido_json JSONB (BOM, especificaciones, medidas),
  estado VARCHAR (enum: 'borrador', 'pendiente_revision', 'aprobado', 'rechazado'),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  creado_por_id UUID REFERENCES usuarios(id),
  actualizado_en TIMESTAMPTZ
);
```

#### 3. `verificaciones` (nueva, multipropósito)
```sql
CREATE TABLE verificaciones (
  id UUID PRIMARY KEY,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id),
  tipo_gate VARCHAR NOT NULL (enum: 'schema', 'recepcion', 'calidad'),
  
  -- Verificador (comercial o gerente)
  verificador_id UUID NOT NULL REFERENCES usuarios(id),
  verificador_rol VARCHAR (cached: 'comercial', 'gerente'),
  
  -- Veredicto
  veredicto VARCHAR (enum: 'aprobado', 'rechazado', 'pendiente'),
  fecha_verificacion TIMESTAMPTZ,
  observaciones TEXT,
  
  -- Para E-18 específicamente
  schema_id UUID REFERENCES schemas_proyecto(id),
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

### Validación E-18:
- ✅ `proyectos.estado = 'desarrollo'` → existe
- ✅ `verificaciones.tipo_gate = 'schema' AND veredicto = 'aprobado'` → existe
- ✅ `verificaciones.verificador_id = proyectos.verificador_id` → compatible
- ✅ `verificaciones.creado_en ≥ proyectos.fecha_entrada_desarrollo` → comparable

**ESTADO:** ✅ ESQUEMAS COMPLETOS PARA E-18

---

## Gate E-21: Triple verificación de recepción

**Predicado:** `check_pedido_bien ∧ check_despacho_bien ∧ ¬∃item(recibido_cantidad<cantidad ∨ sin_defectos≠TRUE)`

**Pantalla ejecutora:** P-14 (Recepción)

### Schemas requeridos:

#### 1. `ordenes_compra` (nueva)
```sql
CREATE TABLE ordenes_compra (
  id UUID PRIMARY KEY,
  proyecto_id UUID REFERENCES proyectos(id),
  schema_id UUID REFERENCES schemas_proyecto(id),
  
  -- Origen
  origen VARCHAR (enum: 'proyecto', 'operativa'),
  estado VARCHAR (enum: 'creada', 'enviada', 'recibida', 'rechazada'),
  
  -- Montos
  monto_total_cop INTEGER NOT NULL,
  anticipo_monto_cop INTEGER DEFAULT 0,
  
  -- Proveedor
  proveedor_id UUID NOT NULL REFERENCES proveedores(id),
  
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  fecha_envio TIMESTAMPTZ,
  fecha_recepcion_esperada DATE
);
```

#### 2. `items_orden_compra` (nueva)
```sql
CREATE TABLE items_orden_compra (
  id UUID PRIMARY KEY,
  orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id),
  
  -- Qué se pidió
  insumo_id UUID REFERENCES catalogo_insumos(id),
  cantidad_solicitada DECIMAL NOT NULL,
  cantidad_recibida DECIMAL DEFAULT 0,
  
  -- Calidad
  sin_defectos BOOLEAN DEFAULT null,
  notas_recepcion TEXT,
  
  -- Precio
  precio_unitario_cop DECIMAL NOT NULL,
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `recepciones` (nueva)
```sql
CREATE TABLE recepciones (
  id UUID PRIMARY KEY,
  orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id),
  
  -- Los 3 checks
  check_pedido_bien BOOLEAN NOT NULL DEFAULT false,
  check_despacho_bien BOOLEAN NOT NULL DEFAULT false,
  -- check_items se calcula: ¬∃item(recibido_cantidad < cantidad ∨ sin_defectos ≠ TRUE)
  
  -- Quién recibió
  recibido_por_id UUID NOT NULL REFERENCES usuarios(id),
  
  fecha_recepcion TIMESTAMPTZ DEFAULT NOW(),
  observaciones TEXT,
  
  aprobado_por_id UUID REFERENCES usuarios(id),
  fecha_aprobacion TIMESTAMPTZ
);
```

### Validación E-21:
- ✅ `recepciones.check_pedido_bien = TRUE` → existe
- ✅ `recepciones.check_despacho_bien = TRUE` → existe
- ✅ `¬∃items_orden_compra where (cantidad_recibida < cantidad_solicitada ∨ sin_defectos ≠ TRUE)` → validable en query

**ESTADO:** ✅ ESQUEMAS COMPLETOS PARA E-21

---

## Gate E-24: Aprobación de calidad

**Predicado:** `estado='armado' ∧ citacion_citada ∧ verificaciones.tipo_gate='calidad' APROBADO ∧ verificador_id=p.verificador_id ∧ creado_en ≥ citado_en`

**Pantalla ejecutora:** P-17 (Calidad)

### Schemas requeridos:

#### 1. `citaciones_calidad` (nueva)
```sql
CREATE TABLE citaciones_calidad (
  id UUID PRIMARY KEY,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id),
  
  citado_para_fecha DATE NOT NULL,
  confirmado_para_fecha DATE,
  
  -- Quién va a verificar
  verificador_id UUID NOT NULL REFERENCES usuarios(id),
  
  estado VARCHAR (enum: 'pendiente', 'confirmada', 'ejecutada', 'cancelada'),
  
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  confirmado_en TIMESTAMPTZ
);
```

#### 2. `veredictos_calidad` (nueva)
```sql
CREATE TABLE veredictos_calidad (
  id UUID PRIMARY KEY,
  citacion_calidad_id UUID NOT NULL REFERENCES citaciones_calidad(id),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id),
  
  -- Veredicto
  veredicto VARCHAR (enum: 'aprobado', 'rechazado_total', 'reproceso_parcial'),
  fecha_veredicto TIMESTAMPTZ DEFAULT NOW(),
  
  -- Si rechazado/parcial
  razon_rechazo TEXT,
  items_a_reprocesar JSONB (array de componentes o módulos),
  
  aprobado_por_id UUID REFERENCES usuarios(id)
);
```

#### 3. `verificaciones` (reutilizada)
```
-- MISMO objeto de E-18, pero con tipo_gate='calidad'
-- y adicional: citacion_calidad_id FK
ALTER TABLE verificaciones ADD COLUMN (
  citacion_calidad_id UUID REFERENCES citaciones_calidad(id)
);
```

### Validación E-24:
- ✅ `proyectos.estado = 'armado'` → existe (enum de proyectos)
- ✅ `citaciones_calidad.estado IN ('confirmada', 'ejecutada')` → "citada"
- ✅ `verificaciones.tipo_gate = 'calidad' AND veredicto = 'aprobado'` → existe
- ✅ `verificaciones.verificador_id = proyectos.verificador_id` → compatible
- ✅ `verificaciones.creado_en ≥ citaciones_calidad.confirmado_en` → comparable

**ESTADO:** ✅ ESQUEMAS COMPLETOS PARA E-24

---

## Gate E-33: Autorización de desfase cronograma (recálculo)

**Predicado:** `∃desfase_aplicado ∧ causa ∈ {interna, externa, cambio_contrato} ∧ motivo > 0 ∧ composicion_causal > 0` → recálculo SOLO `linea='interna'`

**Pantalla ejecutora:** P-09 (Cronograma doble)

### Schemas requeridos:

#### 1. `cronogramas` (nueva)
```sql
CREATE TABLE cronogramas (
  id UUID PRIMARY KEY,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id),
  
  promesa_semanas INTEGER DEFAULT 7,
  base_cronograma_semanas INTEGER DEFAULT 4,
  holgura_maxima_dias INTEGER DEFAULT 5,
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `cronograma_etapas` (nueva)
```sql
CREATE TABLE cronograma_etapas (
  id UUID PRIMARY KEY,
  cronograma_id UUID NOT NULL REFERENCES cronogramas(id),
  
  linea VARCHAR NOT NULL (enum: 'contractual', 'interna'),
  numero_etapa INTEGER,
  nombre_etapa VARCHAR (e.g. 'Compra', 'Armado', 'Instalación'),
  
  fecha_ideal DATE,
  fecha_real DATE,
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `desfases_cronograma` (nueva)
```sql
CREATE TABLE desfases_cronograma (
  id UUID PRIMARY KEY,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id),
  cronograma_id UUID REFERENCES cronogramas(id),
  
  -- Desfase
  dias_desfase INTEGER NOT NULL,
  aplicado BOOLEAN DEFAULT false,
  
  -- Causal (3 orígenes)
  causa VARCHAR NOT NULL (enum: 'interna', 'externa', 'cambio_contrato'),
  composicion_causal JSONB NOT NULL (JSON con justificación humana),
  
  -- Auditoría
  creado_por_id UUID REFERENCES usuarios(id),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  
  -- Autorización
  autorizado_por_id UUID REFERENCES usuarios(id),
  autorizado_en TIMESTAMPTZ,
  
  -- Si es recálculo
  resultado_recalculo_json JSONB (nuevas fechas de etapas)
);
```

#### 4. `cambios_contrato` (nueva)
```sql
CREATE TABLE cambios_contrato (
  id UUID PRIMARY KEY,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id),
  
  tipo_cambio VARCHAR (enum: 'alcance', 'cronograma', 'precio', 'materiales'),
  descripcion TEXT,
  
  aprobado_por_id UUID REFERENCES usuarios(id),
  aprobado_en TIMESTAMPTZ,
  
  -- Dispara E-33 si cambio de cronograma
  dispara_desfase BOOLEAN DEFAULT false,
  desfase_id UUID REFERENCES desfases_cronograma(id),
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

### Validación E-33:
- ✅ `desfases_cronograma.aplicado = TRUE` → existe
- ✅ `desfases_cronograma.causa IN ('interna', 'externa', 'cambio_contrato')` → enum
- ✅ `desfases_cronograma.dias_desfase > 0` → integer, comparable
- ✅ `desfases_cronograma.composicion_causal IS NOT NULL AND jsonb_array_length() > 0` → validable
- ✅ Recálculo de `linea='interna'` en query → columna linea en cronograma_etapas

**ESTADO:** ✅ ESQUEMAS COMPLETOS PARA E-33

---

## Gate E-20: Bloqueo de caja (disponibilidad de fondos)

**Predicado:** `caja_disponible = Σ saldo_actual − Σ por_pagar(pendiente,atrasada)(monto_total−monto_pagado) ≥ monto_pago` (bloqueante)

**Pantalla ejecutora:** P-20 (Caja) + P-13 (Compras)

### Schemas requeridos:

#### 1. `cuentas_financieras` (nueva)
```sql
CREATE TABLE cuentas_financieras (
  id UUID PRIMARY KEY,
  persona_id UUID NOT NULL REFERENCES personas(id),
  tipo_cuenta VARCHAR (enum: 'empresa', 'empleado_comisiones', 'socio'),
  
  saldo_actual_cop DECIMAL NOT NULL DEFAULT 0,
  saldo_acumulado_mes_cop DECIMAL DEFAULT 0,
  
  -- Auditoría
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `obligaciones_pendientes` (nueva)
```sql
CREATE TABLE obligaciones_pendientes (
  id UUID PRIMARY KEY,
  proyecto_id UUID REFERENCES proyectos(id),
  
  -- Origen
  tipo_obligacion VARCHAR (enum: 'pago_proveedor', 'anticipo_cliente', 'pago_nomina', 'arriendo'),
  
  monto_total_cop INTEGER NOT NULL,
  monto_pagado_cop INTEGER DEFAULT 0,
  
  -- Estado
  estado VARCHAR (enum: 'pendiente', 'parcial', 'pagada', 'atrasada'),
  fecha_vencimiento DATE,
  
  -- Cuenta de destino
  cuenta_destino_id UUID REFERENCES cuentas_financieras(id),
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `movimientos_financieros` (nueva)
```sql
CREATE TABLE movimientos_financieros (
  id UUID PRIMARY KEY,
  tipo_movimiento VARCHAR (enum: 'ingreso', 'egreso'),
  
  -- De qué
  cuenta_origen_id UUID REFERENCES cuentas_financieras(id),
  cuenta_destino_id UUID REFERENCES cuentas_financieras(id),
  
  monto_cop INTEGER NOT NULL,
  
  -- Referencia
  obligacion_id UUID REFERENCES obligaciones_pendientes(id),
  
  fecha_movimiento TIMESTAMPTZ DEFAULT NOW(),
  
  -- Auditoría
  autorizado_por_id UUID REFERENCES usuarios(id),
  nota TEXT
);
```

#### 4. `excepciones_gate` (nueva, para E-20)
```sql
CREATE TABLE excepciones_gate (
  id UUID PRIMARY KEY,
  proyecto_id UUID REFERENCES proyectos(id),
  gate_id VARCHAR (e.g. 'E-20'),
  
  -- La excepción
  motivo TEXT (e.g. "Caja negativa, pero gerente autoriza compra urgente"),
  
  autorizado_por_id UUID NOT NULL REFERENCES usuarios(id),
  autorizado_en TIMESTAMPTZ DEFAULT NOW(),
  
  -- Efecto
  permite_bypass BOOLEAN DEFAULT false,
  duracion_hasta TIMESTAMPTZ (null = indefinido),
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

### Validación E-20:
- ✅ Cálculo `caja_disponible = Σ saldo_actual − Σ por_pagar` → ambas tablas existen
- ✅ `por_pagar(pendiente, atrasada)` → estado enum en obligaciones_pendientes
- ✅ `monto_pagado` en obligaciones_pendientes → comparable
- ✅ Bloqueo sin bypass → excepciones_gate para autorizar si es necesario

**ESTADO:** ✅ ESQUEMAS COMPLETOS PARA E-20

---

## Resumen de cobertura de gates

| Gate | Pantalla | Schemas core | Validación | Status |
|---|---|---|---|---|
| E-18 | P-08 | proyectos, schemas_proyecto, verificaciones | estado + verificación + fecha | ✅ COMPLETO |
| E-21 | P-14 | ordenes_compra, items_oc, recepciones | 3 checks + items sin defectos | ✅ COMPLETO |
| E-24 | P-17 | citaciones_calidad, veredictos_calidad, verificaciones | estado + citación + veredicto | ✅ COMPLETO |
| E-33 | P-09 | cronogramas, cronograma_etapas, desfases, cambios_contrato | desfase + causa + composición causal | ✅ COMPLETO |
| E-20 | P-20, P-13 | cuentas_financieras, obligaciones_pendientes, movimientos, excepciones_gate | caja_disponible ≥ monto | ✅ COMPLETO |

---

## ¿Faltan schemas?

**Revisión cruzada:**

1. ✅ `proyectos` — ampliada con estado, verificador_id, fechas
2. ✅ `usuarios` y `personas_roles` — ya en schema base
3. ✅ `proveedores` — FK en ordenes_compra, catalogo_herrajes, catalogo_insumos
4. ✅ `catalogo_herrajes`, `catalogo_insumos`, `catalogo_componentes`, `catalogo_espacios` — para cotizador
5. ✅ `catalogo_procesos` — para nóminas + costos
6. ✅ `configuracion_nomina` — para dualidad tiempo/módulo
7. ✅ `audit_logs` — para trazabilidad
8. ✅ `eventos` — para auditoría de negocio (ya existe en schema base)

**¿Faltan?** (Pregunta para validar):
- ¿`tareas_produccion` (capa 2, taller)? → DIFERIDO, no para Ola 7
- ¿`facturas` (facturación DIAN)? → DIFERIDO, no para Ola 7
- ¿Otros?

---

**PREGUNTA FINAL PARA SUPERVISOR:**

¿Están todos los schemas de cada gate claramente definidos? ¿Falta algo para que Ola 7 pueda codificarse sin ambigüedad?

