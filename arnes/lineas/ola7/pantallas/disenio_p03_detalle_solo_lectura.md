# P-03 — Detalle Cotización (Solo Lectura)

**Fecha:** 2026-08-05 · **Estado:** propuesta · **Fase:** F2 · **Ruta:** `/app/erp/cotizador/[id]/detalle` · **Roles:** `admin`, `comercial`, `taller`, `finanzas`

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`). No redefinas schemas aquí.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `proyectos` | §3 Comercial | id, estado, nombre_proyecto, cliente_id, direccion_obra, tipo_proyecto, costos_operativos, imprevistos_instalacion, descuento_comercial, ajuste_arbitrario, aplica_iva, porcentaje_iva, garantia_anios, comercial_id | Header display: nombre, estado (badge), tipo, dirección, costos, IVA, garantía |
| `clientes` | §3 Comercial | id, nombre, documento, telefono, email | Display: "Nombre (tel) · email" — link a `/erp/clientes/[id]` |
| `espacio_variantes` | §3 Comercial | id, nombre_espacio, activa, visible_pdf, proyecto_id | EspacioCard (read-only): 11 strips colapsables por espacio |
| `items_variante` | §3 Comercial | id, descripcion, cantidad, precio_unitario, es_referencial, fuente_referencial, grupo_referencial, producto_catalogo_id | ItemRow display: descripción, und, cant, precio, total, badges referencial |
| `contratos` | §4 Contratos | id, codigo, valor_total, estado, proyecto_id | ContratoDisplay: si existe → datos + hitos tabla; si no → card "Sin contrato" |
| `hitos_pago` | §4 Contratos | id, orden, tipo, monto, razon, fecha_limite, estado_pago, contrato_id | Tabla read-only de hitos dentro de ContratoDisplay |
| `parametros` | §1 Cimientos F0 | clave, valor | Configuración Taller: tarifas calculadas (costo_hora_taller, tarifa_desarrollo, tarifa_ensamblaje, tarifa_instalacion) |
| `modulos` | §8 Producción | — | — Pendiente de definir en iteración de diseño |

---

## 2. Estados que transiciona

*Cita los estados del REGISTRO DE ENTIDADES y del glosario H07.*

— Pendiente de definir en iteración de diseño. P-03 es vista de solo lectura: no ejecuta transiciones de estado. El usuario puede ver el estado actual del proyecto como badge, pero no puede cambiarlo desde esta pantalla.

---

## 3. Vocabulario H07 (labels visibles)

*Cita del `glosario_h07.md`. Todo label de UI sale de aquí.*

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Cotizador — Solo Lectura" | — | — (título de página) |
| "Activa" | `activa` | `proyectos.estado` |
| "Enviada" | `enviada` | `proyectos.estado` |
| "Cotizado" | `cotizado` | `proyectos.estado` |
| "En Contrato" | `en_contrato` | `proyectos.estado` |
| "Proyecto a medida" | `proyecto_a_medida` | `proyectos.tipo_proyecto` |
| "Producto fijo (prefabricado)" | `producto_fijo` | `proyectos.tipo_proyecto` |
| "Servicio técnico" | `servicio_tecnico` | `proyectos.tipo_proyecto` |
| "Dirección de obra" | `direccion_obra` | `proyectos.direccion_obra` |
| "Costos operativos" | `costos_operativos` | `proyectos.costos_operativos` |
| "Imprevistos instalación" | `imprevistos_instalacion` | `proyectos.imprevistos_instalacion` |
| "Descuento comercial" | `descuento_comercial` | `proyectos.descuento_comercial` |
| "Ajuste arbitrario" | `ajuste_arbitrario` | `proyectos.ajuste_arbitrario` |
| "IVA" | `aplica_iva` / `porcentaje_iva` | `proyectos.aplica_iva`, `proyectos.porcentaje_iva` |
| "Garantía" | `garantia_anios` | `proyectos.garantia_anios` |
| "Referencial" | `es_referencial` | `items_variante.es_referencial` |
| "Volver al Kanban" | — | — (botón footer) |
| "Abrir Editor" | — | — (botón footer, condicional) |
| "Sin contrato generado" | — | — (card placeholder) |
| "Generar Contrato" | — | — (botón condicional) |
| "Ver PDF" | — | — (botón si contrato `estado='firmado'`) |
| "Desarrollo técnico" | — | — (label mano de obra) |
| "Ensamblaje taller" | — | — (label mano de obra) |
| "Instalación obra" | — | — (label mano de obra) |
| "Jornadas" | — | — (label mano de obra) |
| "Tarifa" | — | — (label mano de obra) |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | La pantalla es de solo lectura: no se permite ninguna mutación (sin `useAutoSave`, sin `MoneyInput` editable, sin drag-drop, sin botones de acción de escritura) | Client (prop `readonly={true}` en todos los componentes) | Test: `grep -r "useAutoSave\|MoneyInput\|drag-drop" app/erp/cotizador/` en vista readonly → 0 resultados |
| R2 | Acceso P-03 vs P-04 por rol: usuarios `taller`, `finanzas`, `supervisora_qa`, `compras` siempre ven P-03. `comercial`/`admin` ven P-03 solo si `?readonly=true` | Client (`page.tsx` evalúa `session.user.rol` + `searchParams.readonly`) | Test: login como `taller` → navegar a `/erp/cotizador/abc` → vista readonly |
| R3 | Botón "Abrir Editor" solo visible si rol ∈ {`comercial`, `admin`} Y estado ∈ {`activa`, `enviada`, `en_contrato`} | Client: renderizado condicional | Test: login como `comercial` con proyecto en `activa` → botón visible. Login como `taller` → botón no visible |
| R4 | Botón "Ver PDF" solo visible si `contrato.estado = 'firmado'` | Client: renderizado condicional | Test: contrato `firmado` → botón visible. Contrato `borrador` → botón no visible |
| R5 | Botón "Generar Contrato" solo si no existe contrato, rol ∈ {`comercial`, `admin`}, y estado proyecto permite | Client: renderizado condicional | Test: proyecto sin contrato, rol `comercial` → botón visible. Con contrato → no visible |
| R6 | ContratoDisplay muestra datos + hitos read-only; si no existe contrato, muestra card "Sin contrato generado" | Client: renderizado condicional | Test: `grep "Sin contrato generado"` en vista sin contrato |
| R7 | Mismo layout y componentes que P-04, pero renderizados con prop `readonly={true}`. Un solo componente `CotizadorPage` → `CotizadorClient` con prop `readonly` | Client | Test: comparar árbol de componentes P-04 vs P-03 — misma estructura, distinta prop |
| R8 | Misma ruta que P-04: `/app/erp/cotizador/[proyectoId]/page.tsx` — diferencia por query param `?readonly=true` o por rol | Routing | Test: `router.push('/erp/cotizador/abc?readonly=true')` → P-03 |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `CotizadorPage` | Server + Client (page.tsx) | `params: { proyectoId }, searchParams: { readonly? }` | `proyectos` | `--color-primary`, `Fraunces`, Suspense |
| `CotizadorClient` | Client | `proyectoId: string, readonly: boolean` | `proyectos`, `clientes`, `espacio_variantes` | Layout 3-columnas (sidebar 280px + central flex-1 + panel derecha 320px) |
| `HeaderProyectoDisplay` | Display (sidebar) | `proyecto: Proyecto, cliente: Cliente` | `proyectos`, `clientes` | Labels formateados: nombre (heading), cliente "Nombre (tel) · email", badge estado, badge tipo, dirección multilínea, costos COP formateado, descuento rojo si > 0, ajuste verde/rojo, IVA "Sí (19%)"/"No", garantía "N años" |
| `EstadoBadge` | Display | `estado: string` | `proyectos.estado` | Badge color (tabla P-01) |
| `ConfigTallerDisplay` | Display (read-only) | `params: Parametro[]` | `parametros` | Muestra params físicos + 3 tarifas calculadas (desarrollo, ensamblaje, instalación) en formato árbol jerárquico |
| `EspacioCardReadOnly` | Client | `espacio: EspacioVariante, items: ItemVariante[], readonly: true` | `espacio_variantes`, `items_variante` | 11 CollapseStrips colapsables, sin botones de edición, `--radius-md` |
| `ItemRowDisplay` | Display (tabla) | `item: ItemVariante` | `items_variante` | Columnas: Descripción, Und, Cant, Precio (COP), Total (COP). Badge amber "Referencial" + tooltip `fuente_referencial` si `es_referencial=true`. Agrupación presupuesto adicional en Collapse 11 |
| `ManoObraDisplay` | Display | `jornadas: {desarrollo, ensamblaje, instalacion}, tarifas: {desarrollo, ensamblaje, instalacion}` | — (derivado de `parametros`) | 3 filas: "Desarrollo técnico Jornadas: X Tarifa: $Y", "Ensamblaje taller Jornadas: X Tarifa: $Y", "Instalación obra Jornadas: X Tarifa: $Y". Subtotal MO COP formateado |
| `ResumenTotals` | Display | `totales: {materiales, manoObra, subtotal, costos, imprevistos, descuento, ajuste, iva, total, totalConIva}` | `proyectos`, `items_variante` | Panel derecha 320px, idéntico cálculo a P-04 |
| `ContratoDisplay` | Display | `contrato: Contrato \| null, hitos: HitoPago[], proyectoEstado: string` | `contratos`, `hitos_pago` | Si existe: secciones 1-4 datos display + tabla hitos read-only (orden, tipo, monto/%, razón, fecha límite, estado pago) + botón `[Ver PDF]` si `firmado`. Si no: card "Sin contrato generado" + `[Generar Contrato]` condicional |
| `FooterAcciones` | Client | `readonly: boolean, rol: string, proyectoEstado: string` | — | `[← Volver al Kanban]` siempre + `[Abrir Editor]` condicional (rol comercial/admin + estado permite) |

**Patrones M-06 L1 usados:** `useSmartSearch` (solo si se incluye navegación entre proyectos en header), `Suspense` + loading states, `COP` formatter, primitivas `components/veta/` (Card, Badge, Table, Collapse, Button ghost)

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | `page.tsx` mount | `Promise.all([proyectos.findById, clientes.findById, espacio_variantes.byProyecto, items_variante.byProyecto, contratos.byProyecto, parametros.vigentes])` | Determinar `readonly` vía `searchParams.readonly \|\| !['comercial','admin'].includes(session.user.rol)` | — |
| 2 | Renderizar HeaderProyectoDisplay | Datos cargados | Muestra nombre, cliente link, estado badge, tipo badge, dirección, costos formateados COP, IVA, garantía | — | — |
| 3 | Renderizar ConfigTallerDisplay | Datos cargados | Muestra params físicos + 3 tarifas calculadas en formato árbol jerárquico | — | — |
| 4 | Renderizar EspacioCardReadOnly | Datos cargados | 11 CollapseStrips colapsables por espacio. Sin botones de edición, sin drag-drop | — | — |
| 5 | Renderizar ItemRowDisplay (tabla) | EspacioCard expandido | Tabla: descripción, und, cant, precio COP, total COP. Badge amber "Referencial" + tooltip si `es_referencial` | — | — |
| 6 | Renderizar ManoObraDisplay | Espacio expandido → Collapse MO | Jornadas + tarifas + subtotal read-only | — | — |
| 7 | Renderizar PresupuestoAdicionalDisplay | Espacio expandido → Collapse 11 | Agrupado por `grupo_referencial`, badges referencial, sin botones `[+ Item ref]` ni "Anexar a catálogo" | — | — |
| 8 | Renderizar ResumenTotals | Datos cargados | Panel derecha: mismo cálculo que P-04 (materiales, MO, subtotal, costos, imprev, desc, ajuste, IVA, total, total+IVA) | — | — |
| 9 | Renderizar ContratoDisplay | Datos cargados | Si contrato existe → secciones 1-4 display + tabla hitos + `[Ver PDF]` si firmado. Si no → card "Sin contrato generado" + `[Generar Contrato]` condicional | — | — |
| 10 | Volver al Kanban | Click `[← Volver al Kanban]` | `router.back()` o `/erp/comercial` | — | — |
| 11 | Abrir Editor | Click `[Abrir Editor]` | Navega a `/erp/cotizador/[id]` sin `readonly` (P-04) | Solo si rol `comercial`/`admin` + estado ∈ {`activa`, `enviada`, `en_contrato`} | — |
| 12 | Generar Contrato (desde P-03) | Click `[Generar Contrato]` en card "Sin contrato" | Abre ContratoModal en modo creación (igual que P-04) | Solo si rol `comercial`/`admin` y estado proyecto permite | — |
| 13 | Ver PDF | Click `[Ver PDF]` | Abre PDF del contrato firmado | Solo si `contrato.estado = 'firmado'` | — |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en archivos de esta pantalla | `eslint app/erp/cotizador/` |
| CA-3 | Mismo layout P-04 pero todo display-only (sin inputs editables) | `grep -r "useAutoSave\|MoneyInput\|drag-drop" app/erp/cotizador/` (en ruta readonly) = 0 |
| CA-4 | Header proyecto: todos los campos como labels formateados (COP, badges, links) | `grep "HeaderProyectoDisplay"` ≥ 1 |
| CA-5 | Config Taller: muestra params físicos + 3 tarifas calculadas (read-only) | `grep "ConfigTallerDisplay"` ≥ 1 |
| CA-6 | Transiciones: read-only (igual P-04) | — Pendiente de definir en iteración de diseño |
| CA-7 | EspacioCard: 11 strips colapsables, sin botones de edición | `grep "EspacioCardReadOnly"` ≥ 1 |
| CA-8 | ItemRow tabla: display descripción, und, cant, precio, total + badge referencial | `grep "ItemRowDisplay"` ≥ 1 |
| CA-9 | Mano de Obra: jornadas + tarifas + subtotal (read-only) | `grep "ManoObraDisplay"` ≥ 1 |
| CA-10 | Presupuesto Adicional: agrupado por `grupo_referencial`, badges referencial | Test: items con `grupo_referencial='Electrodomésticos'` → agrupados bajo ese grupo |
| CA-11 | Resumen Grand Totals: idéntico a P-04 (mismo cálculo) | Test: comparar totales P-04 vs P-03 con mismos datos → iguales |
| CA-12 | Contrato: si existe → display completo + hitos tabla; si no → card "Sin contrato" + botón condicional | Test: proyecto con contrato → `grep "ContratoDisplay"`. Sin contrato → `grep "Sin contrato generado"` |
| CA-13 | Footer: `[Volver al Kanban]` siempre + `[Abrir Editor]` condicional | Test: `grep "Volver al Kanban\|Abrir Editor"` en footer |
| CA-14 | Routing: misma página que P-04, prop `readonly` controla vista | `grep "readonly" app/erp/cotizador/\[proyectoId\]/page.tsx` |
| CA-15 | Rol `taller` ve P-03 por defecto (sin `?readonly=true`) | Test: login taller → `/erp/cotizador/abc` → vista readonly |
| CA-16 | Rol `comercial` ve P-04 por defecto, P-03 con `?readonly=true` | Test: login comercial → `/erp/cotizador/abc` → editor. `?readonly=true` → solo lectura |
| CA-17 | Accesibilidad: focus visible, ARIA en tablas, reduced-motion | `grep "aria-\|focus-ring\|prefers-reduced-motion"` en componentes P-03 |
| CA-18 | Sin `useAutoSave`, sin `MoneyInput` editable, sin drag-drop en todo el árbol | `grep -r "useAutoSave" app/erp/cotizador/` (en modo readonly) → 0 |

---

## 8. Verificación de integridad (pre-entrega)

Antes de marcar el diseño como "aprobado", el Iniciador verifica:

- [ ] Toda entidad en §1 existe en el `REGISTRO_DE_ENTIDADES.md`
- [ ] Todo estado en §2 existe en el `REGISTRO_DE_ENTIDADES.md` y en `glosario_h07.md`
- [ ] Todo label en §3 existe en `glosario_h07.md`
- [ ] Toda regla en §4 tiene verificación mecánica (no "se ve bien")
- [ ] Todo componente en §5 usa tokens D4 y patrones M-06 L1
- [ ] Todo comportamiento en §6 traza a un evento E-XX del `diamante2_define_eventos.md`
- [ ] Los criterios de aceptación en §7 son ejecutables (no opinables)
