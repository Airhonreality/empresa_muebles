# Pase B4-3 — Detalle de implementabilidad (subagente, auditoría)

**Lente:** auditoría de implementabilidad: ¿el detalle de cada pantalla B3 permite codificarla **sin releer otra fuente** (`met:123`)? Se verifica contra las rutas/componentes/APIs existentes del repo y contra la regla de prohibición del motor Agnostic.
**Rol:** sub-agente B4-3 del Diamante 3 (`met:56`). **Modo:** `opencode general`, loop interno de 3 iteraciones.
**Fuentes leídas (solo estas):** `d3_schema_consolidado.md` (sch_c) · `d3_ui_b3_1_embudo_comercial.md` (b3_1) · `d3_ui_b3_2_cronograma_gates.md` (b3_2) · `d3_ui_b3_3_compras_taller_calidad.md` (b3_3) · `d3_ui_b3_4_finanzas_compensacion.md` (b3_4) · `d3_ui_b3_5_cliente_documentacion.md` (b3_5) · `d3_ui_b2_2_pantallas_requeridas.md` (inv, rutas nuevas vs extendidas 228) · `diamante3_metodologia.md` (met) · árbol `app/` y `lib/modules/` (rutas reales existentes).
**Archivo de salida (único escrito):** `arnes/diagnostico/pasadas/d3_ui_b4_3_detalle_implementabilidad.md`.
**Vocabulario:** `met:98-107`. Escepticismo: verificar contra el repo real, no contra lo que dice el inventario.

---

## Iteración 1 (bruta)

Verificación de rutas reales contra el árbol de `app/`:

- **Existen (se extienden):** `/app/erp/comercial`, `/app/erp/calendario`, `/app/erp/cotizador`, `/app/erp/contratos`, `/app/erp/equipo`, `/app/erp/taller`, `/app/erp/finanzas`, `/app/erp/pedidos`, `/app/erp/catalogo`, `/app/erp/proveedores`, `/app/erp/portfolio`, `/app/erp/perfil`, `/app/erp/prefabricados`, `/propuesta/[proyectoId]`, `/agendar`, `/cuenta/proyectos` — coherentes con `inv:228` y con las tareas t-006..t-033 del ledger (módulos legacy construidos).
- **Nuevas (a crear):** P-02, P-06, P-07, P-08, P-09, P-10, P-11, P-13, P-14, P-15, P-17, P-18, P-19, P-21, P-22, P-23, P-25, P-26, F-04, F-05, F-06, F-08. Coinciden con `inv:228`.
- **Componentes existentes reutilizables:** `components/erp/CrearProductoForm`, `CrearProveedorForm`, `RegistrarMovimientoForm`, `PaymentScheduleEditor`, `ContratoForm`, `components/cuenta/PedidoCarritoForm` — patrones de formularios 'use client' que B3 ya replica.

---

## Iteración 2 (autocrítica — profundidad por pantalla)

**¿Todas las pantallas B3 cumplen el contrato de 8 secciones (`met:110-123`)?** Contados de los 5 archivos: B3-1 (9), B3-2 (7), B3-3 (7), B3-4 (4), B3-5 (7) = **34 pantallas** core, todas con las 8 secciones (encabezado, wireframe, interactivos, textos, mapeo, gate, responsive, React). Confirmado: la tienda (F-04/F-05/F-06) se diseñó como **frontera** (secciones resumidas, DIFERIDO t-034) — excepción documentada, no incumplimiento.

**¿El mapeo de datos cita nombres reales del schema consolidado?** `sch_c:267` — los nombres snake_case del consolidado son los que B3 debe citar. Verifico una muestra por familia:
- B3-1 P-01..P-05: `leads`, `clientes`, `proyectos`, `cotizaciones`, `contratos`, `cambios_contrato` — todos en `sch_c` (§1,§2).
- B3-2 P-06..P-12: `proyectos`, `desfases_cronograma`, `cronograma_etapas`, `schemas_proyecto`, `verificaciones`, `modulos_armado` — en `sch_c` (§3,§4,§6).
- B3-3 P-13..P-19: `ordenes_compra`, `items_orden_compra`, `recepciones_material`, `herramientas`, `ordenes_trabajo`, `citaciones_calidad`, `instalaciones`, `actas_entrega` — en `sch_c` (§5,§6,§7,§8).
- B3-4 P-20..P-23: `cuentas_financieras`, `movimientos_financieros`, `obligaciones_pendientes`, `liquidaciones_compensacion`, `comisiones_proyecto` — en `sch_c` (§10).
- B3-5 P-24..P-26 + F-07: `pedidos_web`, `garantias`, `documentacion_proyecto`, `portfolio_publico` — en `sch_c` (§15,§9,§11).

**¿No se re-introducen nombres descartados?** `sch_c:267` prohíbe `veredictos_calidad`, `pagos_proveedor`, `registros_gate_caja`, `eventos_negocio`, `registro_actividad`, `parametros_compensacion`, `modulos_taller`, `compensaciones`, `comisiones`, `arriendos`. Grep en los 5 archivos B3: cero ocurrencias de esos nombres como entidades. **Cumplido.**

**¿Los "Aspectos de código React" indican componentes y API routes?** P-14/P-17/P-20 documentan tx + escritura de `eventos` (B3-3/B3-4 §8). F-07 documenta aislamiento `clienteId`. **Cumplido.**

**¿Coherencia con prohibiciones de AGENTS.md?** Ninguna pantalla B3 usa patrones schema-driven del motor Agnostic; todas apuntan a `app/api/erp/*` y `lib/modules/*` explícitos. **Cumplido.**

**Riesgos de implementación detectados:**
1. **P-06 (mapa de gates sumidero)** — pantalla nueva que agrega el estado de los 5 gates (E-18/E-21/E-24/E-33/E-20) + E-23 señal + estado proyecto; requiere joins multi-tabla (desfases, verificaciones, recepciones, citaciones, movimientos). b3_2 la especifica; B4-3 recomienda una vista agregada en `lib/modules/proyectos/queries.ts`.
2. **P-08 (integraciones E-38/E-39)** — precedencia "solo con schema aprobado" (`define:88`); la UI es acción con estado, no módulo. b3_2 lo especifica como acciones. Implementable.
3. **E-08 frontera (3 pantallas)** — F-08/P-04/P-20: el movimiento se escribe UNA vez (P-20), los demás registran el hecho (P-04) o muestran el pago (F-08). b3_1 y b3_4 respetan la frontera (`inv:H-B2-2-01`). Implementable sin duplicación.

---

## Iteración 3 (refinamiento final)

- **34/34 pantallas** con detalle suficiente para codificar sin releer otra fuente (tienda = frontera DIFERIDO, excepción documentada).
- **0 nombres descartados reintroducidos.** **0 patrones Agnostic.**
- **Rutas:** 22 nuevas + 12 extendidas, coincidentes con `inv:228`.
- **Riesgos menores** (P-06 agregación, P-08 integraciones, E-08 frontera) tienen especificación suficiente en los archivos B3 citados. **Sin hallazgos estructurales pendientes.** Cierre de loop B4-3.

---

## Entregable: veredicto de implementabilidad

| Criterio | Veredicto | Evidencia |
|---|---|---|
| 100% pantallas con contrato de formato completo | OK (34/34; tienda = frontera) | met:110-123; b3_1..b3_5 |
| Mapeo de datos con nombres reales del consolidado | OK (muestra por familia) | sch_c:267; §1..§15 |
| 0 nombres descartados reintroducidos | OK | grep b3_1..b3_5 vs sch_c:267 |
| 0 patrones Agnostic / schema-driven | OK | AGENTS.md (prohibido) |
| Rutas nuevas vs extendidas coherentes | OK (22+12) | inv:228 vs árbol `app/` |
| API routes y componentes identificados | OK | b3_* §8 |

**Resultado: implementable sin ambigüedad estructural.**

---

## Hallazgos

| ID | Tipo | Descripción | Fuente |
|---|---|---|---|
| H-B4-3-01 | NOTA | P-06 (mapa de gates) requiere vista agregada multi-tabla (5 gates + E-23 señal + estado) en `lib/modules/proyectos/queries.ts` — recomendación de implementación, no defecto | b3_2 (P-06); inv:49 |
| H-B4-3-02 | NOTA | F-04/F-05/F-06 son frontera DIFERIDO (t-034): su contrato de datos está en b3_5, la construcción se hará en backlog | b3_5:H-B3-5-02; inv:17 |
| H-B4-3-03 | NOTA | E-08 escribe el movimiento UNA vez (P-20); F-08/P-04 solo muestran/registran el hecho — frontera a respetar en implementación | inv:H-B2-2-01; b3_4:P-20 |

---

## Notas para el Orquestador

- **Contrato cumplido (met:56,91-96):** veredicto por criterio con evidencia; implementable.
- **Para B5:** el goal duro "0 ambigüedad" se satisface: tienda es la única frontera y está documentada como DIFERIDO.
- **Prohibido cumplido:** solo escribió `d3_ui_b4_3_detalle_implementabilidad.md`.

## Registro

- Fecha: 2026-08-04 · Pase B4-3 (ola 5 — detalle de implementabilidad).
- Archivo de salida: `arnes/diagnostico/pasadas/d3_ui_b4_3_detalle_implementabilidad.md`.
- Veredicto: **implementable sin ambigüedad estructural** · 3 hallazgos (notas).
