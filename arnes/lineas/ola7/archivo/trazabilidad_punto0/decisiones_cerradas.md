# Decisiones Cerradas — Trazabilidad Punto-0 (Supervisor, 2026-08-07)

---

## A.1 — ESTADO DE PROYECTO ✅ CERRADO

**Decisión:** Set B extendido (A2-1-14) como canónico, enriquecido con el mapeo proyecto↔módulo.

**Estados canónicos de proyecto:**
`borrador → en_revision → cotizado → desarrollo → aprobado_compras → armado → verificado → instalado → entregado / perdida / cancelada`

`verificado` y `aprobado_compras` son estados internos de gate (el cliente ve "En armado" hasta instalación).

**Estados de módulo (gobiernan el despacho parcial):**
`por_armar → en_armado → armado → en_calidad → aprobado → en_instalacion`
+ ciclo completo: `diseño → contrata → desarrollo → compras → armado → verificación → despacho → instalación → garantía`

**Mapeo proyecto ↔ módulo:**

| Gate | Proyecto.estado | Módulo.estado |
|---|---|---|
| Cotizador | `borrador → cotizado` | `diseño` |
| E-18 (schema) | `desarrollo → aprobado_compras` | `desarrollo → compras` |
| E-21 (recepción) | `aprobado_compras` (no cambia) | `compras → por_armar` |
| Taller | `armado` (no cambia) | `por_armar → en_armado → armado` |
| E-24 (calidad) | `verificado` (interno) | `en_calidad → aprobado` |
| E-25 (instalación) | `instalado` | `en_instalacion` |
| E-26 (cierre) | `entregado` | — |
| E-36 (garantía) | — | `garantia` |

Evidencia: `glosario_h07.md:89,243-248` · `plan_f5.md:33,43,102` · `disenio_modulo_espacio.md:11` · `d3_schema_a2_1_normalizacion.md:126`.

---

## A.2 — ESTADOS DE OC ✅ CERRADO

**Decisión:** 7 estados: `solicitada → aprobada → en_pago → pagada → recibida_verificada → rechazada → cancelada`.

**No se agrega un 8° estado `en_transito`.** El tiempo entre `pagada` y `recibida_verificada` se monitorea por el campo `fecha_recepcion_esperada`.

**Tercerizados:** `mecanica_pago='subcontratacion'` con timeline `abono → tiempo → entrega → saldo` dentro de los mismos 7 estados. `fecha_recepcion_esperada` + `tiempo_entrega_dias` son campos de la OC, no estados.

Evidencia: `plan_f4.md:31,37-40` · `d3_schema_a2_1_normalizacion.md:169`.

---

## A.3 — RECEPCIÓN DE MATERIAL ✅ CERRADO

**Decisión:** Una sola tabla `recepciones_material`. Acción habilitada por rol (desarrollador, asistente de compras, o cualquier rol con permiso de recepción). `eventos.actorId + actorRol` registra quién ejecutó. Triple verificación: `checkPedidoBien ∧ checkDespachoBien ∧ checkMaterial`. Estado global derivado del predicado, no manual.

---

## A.4 — AUDITORÍA ✅ CERRADO

**Decisión:** Una sola fuente de verdad: `eventos` (append-only, 61 tipos) + `procedencia` (linaje). `audit_logs` se depreca. El código que hoy escribe en `audit_logs` se redirige a `registrarEvento(tx, ...)` en la misma transacción.

Evidencia: `d3_schema_a1_5_datos.md:44-96`.

---

## A.5 — SLA DE ENTREGA ✅ CERRADO

**Decisión:** Modelo en 4 capas con prioridad explícita:

| Capa | Dato | Cuándo se usa | Ejemplo |
|---|---|---|---|
| **OC (real, gana)** | `ordenes_compra.tiempo_entrega_dias` → `fecha_recepcion_esperada` | SLA negociado con el proveedor para esta OC. El comprador puede sobrescribirlo. | "Negocié con Placecol: 12 días" |
| **Puente (default específico)** | `catalogo_proveedor.sla_dias` | Al crear la OC, si existe registro para este proveedor+insumo | "Placecol + melamina RH 18mm = 10 días" |
| **Proveedor (default general)** | `proveedores.dias_entrega_default` | Si no hay puente específico | "Placecol = 8 días" |
| **Insumo (estimación gruesa)** | `materiales_insumos.tiempo_entrega_dias` | Solo en el cotizador, antes de crear la OC. | "Melamina ~5d, herrajes ~1d" |

**Regla de resolución:** al crear la OC, `fecha_recepcion_esperada = hoy + (catalogo_proveedor.sla_dias ?? proveedores.dias_entrega_default ?? 7)`. El comprador edita si negocia distinto.

Evidencia: `plan_f4.md:37-42` · `OLA_6_FLAG4_PRODUCTOS_CATALOGO.md:98,217`.

---

## A.6 — TAXONOMÍA ✅ CERRADO

**Decisión:** Tabla maestra `categorias` (id, nombre, tipo, padre_id, activo). Las columnas `categoria_comercial`, `segmento_comercial`, `categoria_tienda` se migran a FK → `categorias.id`. Control centralizado.

---

## PARTE B — Decisiones técnicas (axiomatizadas)

| # | Decisión | Fundamento |
|---|---|---|
| B.1 | FLAG4 (especialización) gana sobre schema.ts plano | Ola 6 |
| B.2 | `catalogo_acabados` (singular) es el canon | D-2026-08-07-C |
| B.3 | `modulos` (árbol recursivo) reemplaza `modulos_armado` | D-2026-08-07-C |
| B.4 | `veredictos_calidad` absorbido en `verificaciones` | Consolidado d3 |
| B.5 | `audit_logs` deprecado → `eventos` + `procedencia` | A.4 |
| B.6 | `valor_tienda` ≠ `precio_publico` (separación C4) | Diamante exclusivo |
| B.7 | Items referenciales (C2): 3 campos en `items_variante` | Migración aditiva |
| B.8 | `clientes.etapa_funnel`: migrar a schema.ts | A3-C3 |
| B.9 | `producciones` no se crea (sin origen) | L5 R1 |
| B.10 | UNIQUE(hijo_entidad, hijo_id) en `procedencia` | a1_5:92 |
