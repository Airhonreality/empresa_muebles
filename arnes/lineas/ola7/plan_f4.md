# Plan F4 — Compras y recepción (P-13, P-14, P-15) — Desarrollo + usabilidad

**Plan de referencia (bucle F4):** t-084 (P-13), t-085 (P-14), t-086 (P-15)
**Fuente de diseño:** `arnes/lineas/ola7/archivo/pasadas/d3_ui_b3_3_compras_taller_calidad.md` (B3-3, aprobado)
**Zona:** datos · **Tipo:** datos_contrato · **Riesgo:** alto
**Estado:** DISEÑO COMPILADO + PLAN APROBADO — Bajo la estrategia V3 no se codifica.

---

## 1. Hallazgos recuperados (fuentes del arnés)

| # | Hallazgo | Fuente | Impacto en F4 |
|---|----------|--------|---------------|
| H-B3-3-01 | Rol "compras" tipado o función del gerente → **resuelto: rol tipado dedicado** (DP-02) | `b3_3:449` | P-13 consume el rol `compras` |
| H-B3-3-02 | E-20 (caja) se especifica en P-20 (B3-4/F6), NO en P-13 | `b3_3:451` | P-13 marca frontera + dato de entrada (`monto_total`/`anticipo_monto`) |
| H-B3-3-03 | `tareas_produccion` capa 2 DIFERIDA; P-16 solo fila de salida | `b3_3:452` | No toca F4 (es taller/F5) |
| H-B3-3-04 | Alojador de docs E-41 (Drive vs R2) roza `pdf_url` de P-19 | `b3_3:454` | No bloquea F4; validar en F7 |
| H-B3-3-05 | `check_material` se captura como dato, NO en predicado P21 | `baz:455` | P-14 lo guarda, no lo exige |
| — | Vocabulario H07: **nunca el acrónimo "OC" en la UI** | `glosario_h07:48` | Todos los textos → "orden de compra" |
| — | Patrones L1 (M-06): MoneyInput, useDebounce, SmartSearch, Parallel loading, Loading+Suspense | `m06:199-214` | P-13/P-14/P-15 |
| — | Familia A responsive (tabla densa, 1ª columna sticky) | `b3_3:105` | P-13 lista OC · P-14 checklist |
| — | R16 botones deshabilitados con razón + R18 modal destrucción | `b3_3:79,103` | P-13/P-14 |
| — | Decisiones de la Ola 3 crograma → gate E-18 antes de E-20/E-21 | `plan_ola7:33` | Guard P-13 |

## 2. Alcance por tarea

### t-084 — P-13 Compra (órdenes de compra)
- **Ruta:** `/app/erp/compras` + `/app/erp/compras/[ocId]`
- **Lista:** código | proveedor | monto | estado | mecánica | fecha de entrega esperada | [Pagar]
- **Detalle:** proyecto/schema del item(si aplica), proveedor, mecánica, ítems, `monto_total`, `anticipo_monto`, timeline abono → entrega → saldo
- **Estados:** solicitada→aprobada→en_pago→pagada→recibida_verificada / rechazada / cancelada
- **Acciones:** Nueva orden · Aprobar (guard E-18) · Registrar pago → frontera E-20 · Cancelar (R18)
- **3 mecánicas:** anticipo+saldo · único · subcontratación (campos distintos)

### D-2026-08-07 — Lead time de proveedor/tercero en la OC (decisión del Supervisor)

Modelar el ciclo **abono → tiempo → entrega → saldo** dentro de `ordenes_compra`:
- **Schema `ordenes_compra` (ampliación):** `fecha_recepcion_esperada` (derivada del SLA del proveedor/tercero al crear la OC) y `tiempo_entrega_dias` (SLA declarado, por proveedor/tercero).
- **Tercerizados (vidrio, espejo, estructuras de metal, tapicería):** sin entidad propia; se modelan como `proveedores` + OC con `mecanica_pago='subcontratacion'`, y su SLA alimenta `fecha_recepcion_esperada` igual que cualquier proveedor.
- **UI P-13:** mostrar el **timeline abono → tiempo → entrega → saldo** por OC (hitos: anticipo, fecha esperada, recepción, saldo) y **avisar** cuando `fecha_recepcion_esperada` se acerque (N días) o esté vencida.
- **Cronograma (frontera E-33):** `fecha_recepcion_esperada` es el dato de entrada que el cronograma (F3/P-09) consume; no se recalcula aquí.
- **Fuente del SLA:** `materiales_insumos.tiempo_entrega_dias` ya existe (FLAG-4:98); se reutiliza/consolida en el proveedor, no se duplica a nivel insumo.
- **Nota de consistencia:** `fecha_recepcion_esperada` estaba solo en el borrador de gates (`OLA_6_GATES_SCHEMAS:102`); esta decisión la promueve al schema consolidado (`d3_schema_a2_1:169`, que hoy solo dice "fechas").

### t-085 — P-14 Recepción (gate E-21)
- **Ruta:** `/app/erp/compras/[ocId]/recepcion`
- **Checklist por ítem:** cantidad esperada / recibida · tipo· despacho· sin defectos
- **Predicado P21:** `check_pedido_bien ∧ check_despacho_bien ∧ NOT EXISTS(ítems con recibido<cantidad OR sin_defectos NOT TRUE)`
- **Estado global derivado** del predicado (no manual)
- **Acciones:** Marcar recibido-verificado (E-21, deshabilita si no P21) · Reportar defecto → E-54 origen compra (R18)

### t-086 — P-15 Herramientas (E-45)
- **Ruta:** `/app/erp/compras/herramientas`
- **Acciones:** Registrar herramienta · Marcar reposición (E-45 → orden de compra operativa `origen='operativa'`, proyecto null) · Marcar mantenimiento

## 3. Usabilidad (recomendaciones aprobadas el 2026-08-07)

1. **Vocabulario H07:** en toda la UI "orden de compra", nunca "OC".
2. **Patrones L1:** MoneyInput COP (blur formato/focus raw) en todos los montos; `useDebounce` + `useSmartSearch` en búsquedas de proveedor/catálogo; `Promise.all` en loads paralelos; Loading + `<Suspense>` en cada carga.
3. **Familia A responsive:** tablas de compras con scroll horizontal y 1ª columna sticky (caja de datos).
4. **R16:** botón deshabilitado **con razón visible**: "Faltan N ítems sin verificar", "Orden de compra sin schema aprobado (E-18)".
5. **R18:** toda acción destructiva (cancelar orden, rechazar recepción → E-54) con modal de confirmación.
6. **Checklist E-21:** filas ≥48px, checkboxes grandes, foco visible. Estado global derivado del predicado.
7. **Guard E-18 visible** como chip en la lista, no solo al aprobar.
8. **Flujo "Pagar" con contexto:** navega a la caja (P-20/F6) con `monto_total`/`anticipo_monto`, sin pérdida de contexto.
9. **Toast** de éxito/error por acción (crear orden, recibido-verificado, reportar defecto, reposición).
10. **Badge dirección `material`** (default ERP del D4) en estados de compra/recepción.

## 3.b — D-2026-08-07-B Ampliación de `proveedores` (schema + catálogo, aprobado por el Supervisor)

**Respondido por Javier:** 1) múltiples contactos por proveedor; 2) tabla puente multi-proveedor aprobada; 3) cuentas de cobro → decisión aprobada para F6.

### `proveedores` (ampliación de F0 — hoy solo 5 campos)

| Campo | Tipo | Nullable | Nota |
|-------|------|----------|------|
| `id` | uuid PK | no | |
| `nombre` | text | no | |
| `nit` | text | sí | régimen/factura |
| `categoria` | text | sí | material / servicio / ferretería / tercero |
| `telefono_comercial` | text | sí | teléfono principal del negocio |
| `direccion_despacho` | text | sí | destino de entregas |
| `ciudad` | text | sí | |
| `medio_pago` | text | sí | transferencia/efectivo/cheque... |
| `dias_entrega_default` | integer | sí | SLA del proveedor → deriva `fecha_recepcion_esperada` de la OC |
| `transportadora` | text | sí | |
| `tarifa_flete` | numeric | sí | costo transporte |
| `activo` | boolean default true | no | |
| `created_at` | timestamp | no | |

### `proveedores_contactos` (1—N, para múltiples contactos persona→teléfono)

| Campo | Tipo | Nota |
|-------|------|------|
| `id` | uuid PK | |
| `proveedor_id` | FK→proveedores NOT NULL | |
| `nombre_contacto` | text | |
| `cargo` | text | quién atiende pedidos |
| `telefono` | text | |
| `email` | text | |
| `es_principal` | boolean | |

### `catalogo_proveedor` (tabla puente multi-proveedor — resuelve la DECISION_PENDIENTE del arnés)

Un `productos_catalogo` hoy tiene **un solo `proveedor_id`** (N:1, `schema.ts:406-438`), incompatible con la realidad multi-proveedor/homologación (`logica_de_negocio:348`). Se añade la puente:

| Campo | Tipo | Nota |
|-------|------|------|
| `id` | uuid PK | |
| `catalogo_id` | FK→productos_catalogo NOT NULL | |
| `proveedor_id` | FK→proveedores NOT NULL | |
| `precio_unitario` | numeric | precio por ETESE proveedor |
| `sla_dias` | numeric | overrides `dias_entregao` si aplica |
| `activo` | boolean | |
| **unique** | (catalogo_id, proveedor_id) | |

`productos_catalogo.proveedor_id` queda como FK directo de conveniencia (proveedor principal) — no se elimina, no hay migración destructiva.

### `cuentas_cobro_proveedor` — decisión aprobada para F6

Se documenta como **decisión aprobada diferida a F6/finanzas**, no se diseña en F4. Los documentos de cobro de proveedor (facturas/micro cuentas de cobro) y transporte se diseñan junto a P-20/caja.

## 4. Verificación mecánica (solo al codificar fuera de F0-F9)

- `npx tsc --noEmit` · `npx eslint .` · `npm run db:migrate` contra dev-local · tests de gate E-21/E-18 · round-trip `ordenes_compra`/`recepciones_material`.

## 5. Regla estrategia V3

F4 produce **diseño + plan aprobado**, no código. La base F0-F2 (lógica/schema/catálogo) tampoco existe aún; se codificará al salir de la banda F0-F9.

## 6. Registro del bucle F4 (compilado 2026-08-07)

**Decisión del Supervisor (D-2026-08-07-B):** ampliar `proveedores` + contacto multi + tabla puente catálogo multi-proveedor + SLA en proveedor. Aprobado en sesión.

Hallazgos del bucle (lo que faltaba en el schema legacy y se corrige en diseño):
| # | Hallazgo | Impacto |
|---|----------|---------|
| F4-01 | `proveedores` legacy tenía solo 5 campos (sin teléfono/comercial/contacto/dirección) | → ampliación §3.b |
| F4-02 | `productos_catalogo.proveedor_id` N:1 → no soporta homologación/multi-proveedor (DECISION_PENDIENTE del arnés) | → `catalogo_proveedor` puente |
| F4-03 | Lead time (abono→tiempo→entrega→saldo) sin modelar como flujo; `fecha_recepcion_esperada` solo en borrador gates | → D-2026-08-07 (fechas+SLA en OC) |
| F4-04 | Tercerizados (vidrio/espejo/metal/tapicería) sin entidad propia | → modelados como `proveedores` + OC `subcontratacion`, SLA alimenta `fecha_recepcion_esperada` |
| F4-05 | `cuentas_cobro_proveedor` (facturas/cuentas de cobro proveedor) no diseñada |→ decisión aprobada diferida a F6/finanzas |

**Salida del bucle:** este documento + t-084/t-085/t-086 (plan_ref) + decisiones D-2026-08-07 / D-2026-08-07-B. Sin código (estrategia V3).

## Aprobación del plan

- **Cliente:** t-084 · **Plan:** este documento (`plan_f4.md`) aplica a t-084/t-085/t-086.
- **Revisor:** Javier (Supervisor) · **Estado:** pendiente · **Fecha de aprobación:** __
- **D-2026-08-07 (lead time en OC):** aprobado por Javier en sesión — Fechas+SLA en OC.
- **D-2026-08-07-B (proveedores):** aprobado — múltiples contactos, tabla puente `catalogo_proveedor`, `cuentas_cobro_proveedor` diferida a F6.

## Referencias

- Fuente de diseño: `d3_ui_b3_3_compras_taller_calidad.md`
- Vocabulario: `glosario_h07.md`
- Patrones L1: `m06_capa_tecnica_transversal.md`
- Estrategia: `estado.md` (§ Estrategia general V3)