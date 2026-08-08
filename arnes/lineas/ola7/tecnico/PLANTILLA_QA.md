# PLANTILLA DE QA Y CORTE

**Contrato vivo.** Todo plan de QA de fase o corte final (F9 y futuras auditorías de entrega) sigue esta estructura. El objetivo: evidencia mecánica cruda, sin interpretación. QA no opina — ejecuta comandos y pega el output.

**Aplica a fases tipo:** verificación de gates, auditoría de trazabilidad, checklist de corte, QA pre-merge.

---

## Fase — [Nombre de la fase]

**Fecha:** YYYY-MM-DD · **Estado:** [propuesta / aprobado] · **Fase:** FX · **Riesgo:** [alto / medio / bajo]

---

## 1. Gates a verificar

*Cada gate del sistema. Predicado exacto del `REGISTRO_DE_ENTIDADES` y `OLA_6_GATES_SCHEMAS.md`. Se verifica con datos reales en dev-local.*

| Gate | Predicado SQL | Datos de prueba (proyecto/orden) | Resultado esperado | ¿Pasó? |
|---|---|---|---|---|
| E-18 | `estado='desarrollo' ∧ verificaciones.tipo_gate='schema' APROBADO ∧ verificador_id=comercial_id` | Proyecto sin verificación de schema aprobada | `false` → OC bloqueada | ☐ |
| E-20 | `Σ saldo_actual − Σ por_pagar(monto_total−monto_pagado) ≥ monto_solicitado` | Caja con saldo insuficiente para OC de $5M | `false` → pago bloqueado | ☐ |
| E-21 | `check_pedido_bien ∧ check_despacho_bien ∧ ¬∃item(recibido<cantidad ∨ sin_defectos≠TRUE)` | Recepción con 1 ítem defectuoso | `false` → recepción no verificada | ☐ |
| E-24 | `estado='armado' ∧ ∃citacion_citada ∧ ∃verificacion_aprobada ∧ verificador_id=comercial_id` | Proyecto armado con citación de calidad pero sin veredicto | `false` → instalación bloqueada | ☐ |
| E-33 | `∃desfase_aplicado ∧ causa∈{interna,externa,cambio_contrato} ∧ motivo>0` | Cronograma sin desfases | `false` → sin alerta | ☐ |

**Regla:** cada gate se prueba en **3 escenarios**: (a) debe bloquear, (b) debe permitir, (c) caso borde (datos justo en el límite).

---

## 2. Trazabilidad de eventos (audit_logs)

*Para cada evento del sistema, se verifica que una acción dispara una entrada en `audit_logs` con la cadena completa actor→acción→entidad→timestamp.*

| # | Evento (E-XX) | Acción disparadora | Query de verificación | Entrada esperada en `audit_logs` | ¿OK? |
|---|---|---|---|---|---|
| 1 | E-09 (cotización enviada) | `PATCH /api/erp/proyectos/:id {estado:'cotizado'}` | `SELECT * FROM audit_logs WHERE entidad='proyectos' AND accion='cambio_estado' AND entidad_id=$1 ORDER BY created_at DESC LIMIT 1` | `actor_id`, `accion='cambio_estado'`, `detalle` contiene 'cotizado' | ☐ |
| 2 | E-18 (schema aprobado) | Aprobar verificación de schema | `SELECT * FROM audit_logs WHERE entidad='verificaciones' AND accion='aprobar' AND tipo_gate='schema'` | Registro con `verificador_id` correcto | ☐ |
| — | ... (61 eventos) | | | | ☐ |

**Cobertura mínima:** 61/61 eventos con al menos 1 entrada de auditoría verificable. Eventos que no generan `audit_logs` se listan explícitamente con justificación.

---

## 3. Checklist de corte (gate de salida F0–F9)

*Condiciones del `ESTRUCTURA_OUTPUT_PRE_CODIGO.md` §4. Cada una se verifica con evidencia, no con "sí, está".*

| # | Condición | Evidencia | ¿OK? |
|---|---|---|---|
| 1 | `REGISTRO_DE_ENTIDADES.md` sin contradicciones | `grep` de nombres duplicados y FKs huérfanas: output vacío | ☐ |
| 2 | 6/6 decisiones de negocio cerradas | `decisiones_cerradas.md` existe y tiene 6 entradas con veredicto | ☐ |
| 3 | 10/10 decisiones técnicas axiomatizadas | Mismo archivo, sección B, 10 entradas | ☐ |
| 4 | Plan de cada fase F0–F9 aprobado | `ls arnes/lineas/ola7/plan_f*.md arnes/lineas/ola7/tecnico/plan_t-*.md arnes/lineas/ola7/tecnico/plan_f{8,9}.md` | ☐ |
| 5 | Diseños de pantalla completos | `grep -l "Entidades que consume" arnes/lineas/ola7/pantallas/disenio_*.md \| wc -l` = conteo de pantallas diseñadas | ☐ |
| 6 | 5 gates con predicados documentados | `grep -c "P18\|P20\|P21\|P24\|P33" arnes/lineas/ola7/plan_ola7_maestro.md` ≥ 5 | ☐ |
| 7 | Glosario H07 completo | `grep -c "=>" arnes/nucleo/glosario_h07.md` ≥ N entidades+estados | ☐ |
| 8 | M-06 L1 declarado | `m06_capa_tecnica_transversal.md` existe, 14 patrones listados | ☐ |
| 9 | Migración de schema validada | `npm run db:generate` output pegado abajo, sin errores | ☐ |
| 10 | Checkpoint Supervisor | Veredicto explícito del Supervisor registrado en `estado.md` | ☐ |

---

## 4. Evidencia mecánica

*Output crudo de comandos de verificación global. QA pega el resultado textual, no un resumen.*

### 4.1 Tipos

```
$ npx tsc --noEmit
[pegar output completo]
```

### 4.2 Lint

```
$ npx eslint .
[pegar output completo]
```

### 4.3 Build

```
$ npx next build
[pegar output completo — se esperan ECONNREFUSED en páginas con datos, no errores de tipo]
```

### 4.4 Tests

```
$ for f in lib/modules/**/*.test.ts; do DATABASE_URL="postgres://..." npx tsx "$f"; done
[pegar output de cada test — PASS o FAIL con stack trace]
```

### 4.5 Migración

```
$ npm run db:migrate
[pegar output completo]
```

---

## 5. Reporte de hallazgos

*Solo se llena si hay bugs encontrados durante QA. Si no hay hallazgos, se escribe "Sin hallazgos — todas las verificaciones pasaron en el primer intento."*

| # | Severidad | Descripción | Archivo | Reproducible con | Estado |
|---|---|---|---|---|---|
| — | 🔴 crítica / 🟡 media / 🟢 baja | | | | abierto / corregido / no-reproducible |

**Regla:** un hallazgo 🔴 crítica bloquea la fase hasta que se corrige y se re-ejecuta la verificación que falló.

---

## 6. Veredicto

| Item | Resultado |
|---|---|
| Gates (5/5) | ☐ Todos pasan / ☐ Fallos: [lista] |
| Trazabilidad (61/61 eventos) | ☐ Todos trazables / ☐ Sin cobertura: [lista] |
| Checklist de corte (10/10) | ☐ Todas verdes / ☐ Pendientes: [lista] |
| Evidencia mecánica | ☐ tsc 0 / eslint 0 / build OK / tests PASS / migrate OK |
| Hallazgos bloqueantes | ☐ Ninguno / ☐ [lista] |

**Veredicto final:** ☐ APROBADO — listo para corte / ☐ RECHAZADO — re-abrir con hallazgos corregidos

---

**Firma del QA:** [nombre del agente]  
**Fecha de ejecución:** YYYY-MM-DD  
**Firma del Supervisor:** [pendiente]
