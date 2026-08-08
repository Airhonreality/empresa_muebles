# F-08 — Propuesta Pública (`/propuesta/{slug}`)

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F7 · **Ruta:** `/propuesta/{slug}` · **Roles:** público (cliente con link)
**Fuente:** `destilacion_f3_publico.md` (destilado 2026-08-05) + legacy `PublicProposal.tsx` (454 líneas)

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `proyectos` | §3 | id, nombre_proyecto, estado, direccion_obra | Datos del proyecto |
| `espacio_variantes` | §3 | id, proyecto_id, nombre_espacio, nombre_variante, activa, colores | Navegación de espacios |
| `items_variante` | §3 | id, variante_id, catalogo_id, nombre_personalizado, cantidad, precio_unitario, total_linea, es_referencial, fuente_referencial, grupo_referencial | Ítems de cotización |
| `productos_catalogo` | §2 | id, nombre, precio_publico, precio_directo | Datos del ítem |
| `productos_tienda` | §2 | id, catalogo_id, imagen_principal_url, descripcion_diseno | Imágenes del producto |
| `contratos` | §4 | id, proyecto_id, valor_total, plazo_ejecucion_texto, garantia_anios | Si hay contrato firmado |
| `hitos_pago` | §4 | id, contrato_id, tipo, monto_o_porcentaje, razon, fecha_limite | Plan de pagos (visible si contrato existe) |
| `parametros` | §1 | clave, valor_numeric | Tarifas MO (C1: 5 params físicos → 3 tarifas calculadas) |

---

## 2. Estados que transiciona

*Sin estados transicionales — pantalla de solo lectura pública vía snapshot del proyecto.*

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Propuesta" | — | — |
| "Ambientes" | — | `espacio_variantes` |
| "Ítems incluidos" | — | `items_variante` |
| "Estimado referencial" | — | `items_variante.es_referencial=true` |
| "Mano de obra" | — | Tarifas MO calculadas |
| "Inversión total" | — | `valor_total` |
| "Guardar como PDF" | — | Acción cliente |

---

## 4. Reglas de negocio

| # | Regla | Validación |
|---|---|---|
| R1 | Propuesta = snapshot inmutable del proyecto (lectura-only) | Servidor: GET sin mutación |
| R2 | Snapshot proyecta solo campos públicos: sin `id` interno, `costo`, `margen`, `proveedor_id` | Server projection |
| R3 | MO: tarifas calculadas en runtime desde `parametros` (C1). No se almacenan en snapshot | Servidor |
| R4 | Civil estimate: agrupado por `grupo_referencial`, badge "Referencial", no suma al total contractual | Servidor + UI |
| R5 | **Sin botones de pago en la propuesta.** La propuesta es informativa, no transaccional | — |
| R6 | Viewer 3D: diseñado pero comentado en código. Se descomenta cuando exista integración SketchUp → CVC | `{/* <Viewer3DModal proyectoId={id} /> */}` |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `PropuestaPublica` | Server + Client | `proyecto`: layout de storytelling, tema light |
| `HeaderPropuesta` | Client | Sticky: título del proyecto, fecha, botón "Guardar PDF" |
| `NavegacionAmbientes` | Client | Tabs/pills: un ambiente = una pestaña |
| `GaleriaImagenes` | Client | Carrusel/foco con imágenes del espacio |
| `SelectorVariantes` | Client | Si hay variantes múltiples, toggle entre ellas |
| `SelectorColores` | Client | Chips de color con `color_hex` de `espacio_variantes.colores` |
| `ListaItems` | Client | Ítems del espacio: nombre, cantidad, imagen, precio unitario, total |
| `ItemsReferenciales` | Client | Agrupados por `grupo_referencial`, badge "Referencial" (amber), fuera del total |
| `DesgloseMO` | Client | 3 filas: Desarrollo (jornadas × tarifa_dev), Ensamblaje (× tarifa_assembly), Instalación (× tarifa_install) |
| `ResumenFinanciero` | Client | Sticky sidebar: subtotal materiales + MO + costos + IVA = total |
| `PlanPagos` | Client | Si hay contrato: tabla de `hitos_pago` con monto, razón, fecha |
| `Viewer3DPlaceholder` | Client | Comentado: `{/* Descomentar con integración SketchUp → CVC */}` |
| `BotonPDF` | Client | Genera PDF con `window.print()` o server-side |

**Tokens D4:** `mist`, tema light, `--font-display` (Fraunces para títulos), `--font-sans` (Inter)

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Trace |
|---|---|---|---|---|
| 1 | Cargar propuesta | `/propuesta/{slug}` | `GET /api/publico/propuesta/:slug` (server projection, snapshot inmutable) | — |
| 2 | Navegar ambientes | Click tab | Cambiar espacio activo | — |
| 3 | Cambiar variante | Toggle | Mostrar variante seleccionada | — |
| 4 | Guardar PDF | Click | `window.print()` o server-side PDF generation | — |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | Snapshot no expone `id`, `costo`, `margen`, `proveedor_id` | Test: response JSON no contiene campos internos |
| CA-3 | MO calculada desde `parametros` (no hardcodeada en snapshot) | Test: cambiar parámetro → siguiente GET refleja nueva tarifa |
| CA-4 | Civil estimate agrupado por `grupo_referencial`, no suma al total | Test: total = Σ items no referenciales |
| CA-5 | Sin botones de pago en la UI | Playwright: no existe elemento de pago/pasarela |
| CA-6 | Viewer 3D comentado en código (no renderiza) | `grep -c "Viewer3D" → 1` (solo comentario) |
| CA-7 | Si `contratos` existe → muestra plan de pagos | Playwright: proyecto con contrato → tabla de hitos visible |
| CA-8 | Si no hay contrato → sin plan de pagos | Playwright: proyecto sin contrato → sin tabla de hitos |

---

## 8. Nota sobre Viewer 3D

El componente `Viewer3DModal` se diseña como placeholder comentado:

```tsx
{/* Viewer 3D — DIFERIDO hasta integración SketchUp/OpenCutList → CVC */}
{/* <Viewer3DModal proyectoId={proyecto.id} /> */}
```

Al descomentar (F8), el componente recibe `proyectoId` y carga el modelo 3D desde R2/Drive. La integración real es bloqueante de F8, no de F7.
