# F-07 — Portal del Cliente (Proyectos, Pagos, Garantía)

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F7 · **Rutas:** `/cuenta/proyectos`, `/cuenta/proyectos/[id]`, `/cuenta/garantia` · **Roles:** cliente (autenticado)

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `proyectos` | §3 | id, nombre_proyecto, estado, direccion_obra, cliente_id | Lista de mis proyectos |
| `espacio_variantes` | §3 | id, proyecto_id, nombre_espacio | Espacios del proyecto |
| `modulos` | §8 | id, nombre_modulo, estado, tipo_modulo, espacio_variante_id | Módulos instalados (para garantía) |
| `contratos` | §4 | id, proyecto_id, codigo_contrato, valor_total, plazo_ejecucion_texto, garantia_anios | Detalle del contrato |
| `hitos_pago` | §4 | id, contrato_id, tipo, monto_o_porcentaje, razon, fecha_limite | Plan de pagos |
| `obligaciones_pendientes` | §9 | id, descripcion, origen, monto_total, monto_pagado, fecha_vencimiento, estado, proyecto_id, contrato_id | Abonos y saldos del cliente |
| `movimientos_financieros` | §9 | id, fecha, descripcion, tipo, monto, obligacion_id | Historial de pagos |
| `comunicaciones_progreso` | §5 | id, proyecto_id, tipo, contenido, visible_al_cliente, fecha | Progreso E-60 |
| `instalaciones` | §8 | id, proyecto_id, estado, rango_fecha_inicio, rango_fecha_fin | Fechas de instalación |
| `actas_entrega` | §8 | id, proyecto_id, estado, pdf_url | Acta de entrega |
| `casos_garantia` | §8 | id, proyecto_id, modulo_id, descripcion, fotos, estado, dentro_garantia_contractual | Garantías reportadas |
| `citas_garantia` | §8 | id, caso_id, fecha, resultado | Visitas de diagnóstico |

---

## 2. Estados que transiciona

| Estado origen | Acción | Estado destino | Validación |
|---|---|---|---|
| — | Cliente reporta garantía | `reportado` | Proyecto en estado `entregado`. Módulo seleccionado del árbol |
| — | Cliente ve acta de entrega | — | Solo si `actas_entrega.estado='generada'` o posterior |

**Regla de visibilidad de garantía:** el botón "Reportar garantía" solo aparece si `proyectos.estado = 'entregado'`. Las garantías solo aplican sobre módulos `en_instalacion` o `aprobado` (ya instalados/entregados).

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Mis proyectos" | — | `proyectos` |
| "En diseño" | `cotizado` / `desarrollo` | `proyectos.estado` |
| "En taller" | `armado` | `proyectos.estado` |
| "En instalación" | `en_instalacion` | `proyectos.estado` |
| "Entregado" | `entregado` | `proyectos.estado` |
| "Abonos y saldos" | — | `obligaciones_pendientes` |
| "Reportar garantía" | — | `casos_garantia` |
| "Acta de entrega" | — | `actas_entrega` |
| "Progreso" | — | `comunicaciones_progreso` |

---

## 4. Reglas de negocio

| # | Regla | Validación |
|---|---|---|
| R1 | Solo proyectos del cliente autenticado | `WHERE cliente_id = session.clienteId` |
| R2 | Garantía: solo visible si `proyectos.estado = 'entregado'` | Servidor: botón no renderiza si `estado ≠ 'entregado'` |
| R3 | Garantía: solo sobre módulos en estado `en_instalacion` o `aprobado` (instalados/entregados) | Árbol de módulos filtrado |
| R4 | `comunicaciones_progreso` filtradas por `visible_al_cliente=true` | Servidor: solo E-60 con `visibleAlCliente=true` |
| R5 | Montos financieros visibles: `monto_total`, `monto_pagado`, `saldo`. Sin costos internos | Server projection |
| R6 | Acta de entrega: PDF descargable solo si `estado='generada'` o posterior | Servidor |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `MisProyectosLista` | Server + Client | Lista de proyectos del cliente con badge de estado |
| `ProyectoDetalleCliente` | Server + Client | `proyecto`: estado, progreso E-60, espacios, línea de tiempo |
| `AbonosSaldosPanel` | Client | Tabla de `obligaciones_pendientes`: hito, monto, pagado, saldo, fecha |
| `ProgresoCliente` | Client | Timeline de `comunicaciones_progreso` (solo cambios positivos) |
| `ActaEntregaCliente` | Client | Vista previa PDF + botón descargar |
| `ArbolModulosSelector` | Client | Árbol del proyecto: módulos instalados para seleccionar en garantía |
| `ReportarGarantiaCliente` | Client | Reutiliza `ReportarGarantiaModal` de P-20 |
| `GarantiaHistorialCliente` | Client | Lista de `casos_garantia` del cliente con estado |

**Tokens D4:** `mist`, tema light, `--font-sans` (Inter), mobile-first

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Trace |
|---|---|---|---|---|
| 1 | Cargar portal | Mount | `GET /api/cuenta/proyectos` (proyectos + resumen financiero) | — |
| 2 | Ver detalle | Click proyecto | `GET /api/cuenta/proyectos/:id` (espacios, módulos, hitos, obligaciones, progreso) | — |
| 3 | Reportar garantía | Click "Reportar" → seleccionar módulo → fotos + descripción → submit | `POST /api/cuenta/garantia` | E-36 |
| 4 | Ver acta | Click "Acta de entrega" | `GET /api/cuenta/actas/:id` → PDF | — |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | Cliente B no ve proyectos de cliente A (aislamiento R26) | Test: GET con sesión B → 0 resultados de A |
| CA-3 | Botón garantía invisible si `proyectos.estado ≠ 'entregado'` | Playwright: proyecto en `armado` → no existe botón |
| CA-4 | Árbol de módulos solo muestra `en_instalacion` o `aprobado` | Test: módulo en `por_armar` → no aparece en selector |
| CA-5 | Abonos/saldos: `monto_total`, `monto_pagado`, `saldo` visibles. Sin `costo`, `margen` | Test: response no contiene campos internos |
| CA-6 | Progreso E-60: solo `visible_al_cliente=true` | Test: GET comunicaciones → todas tienen `visibleAlCliente=true` |
| CA-7 | Acta descargable si `estado='generada'` | Playwright: link de descarga existe |
