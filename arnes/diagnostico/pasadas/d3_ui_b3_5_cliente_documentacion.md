# Pase B3-5 — Cliente/portal + documentación (subagente, loop de 3 iteraciones)

**Lente:** diseño de alto detalle de la pantallas de la familia **B3-5** (cliente/portal + documentación) según `diamante3_metodologia.md:110-123`.
**Rol:** sub-agente B3-5 del Diamante 3 (`met:51`). **Modo:** `opencode general`, loop interno de 3 iteraciones.
**Fuentes leídas (solo estas):** `d3_schema_consolidado.md` (sch_c) · `d3_ui_b2_2_pantallas_requeridas.md` (inv) · `d3_ui_b2_1_destilacion_inv.md` (reg) · `d3_ui_b1_1_ux_ergonomia.md` (ux) · `diamante2_define_eventos.md` (define) · `diamante2_discover_eventos.md` (discover) · `d3_ui_b3_3_compras_taller_calidad.md` (b3_3) · `d3_ui_b3_4_finanzas_compensacion.md` (b3_4) · `diamante3_metodologia.md` (met).
**Archivo de salida (único escrito):** `arnes/diagnostico/pasadas/d3_ui_b3_5_cliente_documentacion.md`.
**Vocabulario:** `met:98-107`. Trazabilidad `archivo:línea`. Escepticismo: nada inventado.

---

## Iteración 1 (bruta)

Inventario crudo de la familia B3-5 sin filtrar:

- **Pantallas del inventario** (`inv:111`): P-24 Pedidos web (E-44, enganche), P-25 Garantía (E-36/E-37/E-61), P-26 Documentación (E-41) + F-04 Tienda catálogo, F-05 Ficha producto, F-06 Carrito+checkout (DIFERIDO, frontera), F-07 Portal del cliente (E-60/E-26/E-36/E-55/E-28). 7 pantallas.
- **Gates que esta familia ejecuta:** ninguno. E-44 (enganche) es híbrido; la construcción de tienda (F-04/F-05/F-06) es DIFERIDO (t-034) — se diseña la frontera, no se construye (`inv:17,112`).
- **Datos del consolidado** (`sch_c`): `pedidos_web` (+engancheProduccion, +ordenProduccionId), `ordenes_trabajo` (origen='pedido_web', pedidoWebId), `garantias`, `ordenes_trabajo` (tipo=garantia, E-37; checkCompletitud E-61), `documentacion_proyecto`, `portfolio_publico` (A3-C1), `clientes` (etapa_funnel, A3-C3), `proyectos` (estado para el cliente).
- **Reglas** (`reg:`): R07, R16, R18, R19, R23, R24, R25, R26, R27.
- **Principios UX** (`ux:`): P01, P02, P03, P08, P14, P15, P23, P24, P25, P26, P27, P28.

**Conteo bruto:** 7 pantallas × 8 secciones = 56 bloques.

---

## Iteración 2 (autocrítica)

Dudo de mis decisiones:

1. **¿La tienda (F-04/F-05/F-06) se diseña completa?** `inv:96-98` — son DIFERIDO (t-034). **Decisión: diseñar la frontera (spec del contrato de datos y eventos), NO las pantallas completas.** F-06 checkout deja la decisión H12 (pedidos anónimos) anotada como DP.
2. **¿F-07 es el único canal cliente?** `inv:219` (H-B2-2-11) — E-60 es el ÚNICO canal visible al cliente (I-043). **Decisión: F-07 muestra cronograma (E-60), firma (E-26), garantía (E-36), pago (E-28), reseña (E-55); sin módulo de mensajería propio.**
3. **¿La firma en F-07 es wizard o pantalla?** `inv:217` (H-B2-2-09) — subsistema firma digital (D8): wizard/modal dentro de F-07, consistente con P-19/P-05 (B3-1/B3-3). **Decisión: wizard de firma compartido.**
4. **¿P-25 Garantía es una pantalla o dos?** E-36 agenda + E-37 orden + E-61 check completitud (`inv:68`). **Decisión: UNA pantalla con 3 secciones (agenda → orden → check), flujo secuencial.**
5. **¿P-24 y F-04/F-05/F-06 comparten catálogo?** `inv:79` — P-31 (prefabricados) publica a `productos_catalogo` que alimenta la tienda. **Decisión: P-24 (admin) consume el mismo catálogo; el enganche E-44 crea `ordenes_trabajo.origen='pedido_web'`.**
6. **Autocrítica de datos:** `portfolio_publico` (A3-C1) tiene fila y alimenta la tienda (F-04/F-05); `clientes.etapa_funnel` (A3-C3) lo lee E-51; el documento de E-41 roza el alojador (H-B2-2-12/DP-09, ya anotado en b3_3:H-B3-3-04).

**Resultado:** 7 pantallas; tienda = frontera DIFERIDO; F-07 canal único; firma wizard; garantía 1 pantalla 3 secciones; catálogo compartido.

---

## Iteración 3 (refinamiento final)

Decisiones depuradas:

- **P-24 (Pedidos web):** lista de pedidos web + enganche a producción (E-44 → `ordenes_trabajo.origen='pedido_web'` + `pedidoWebId`).
- **P-25 (Garantía):** agenda (E-36) → orden de garantía (E-37, `ordenes_trabajo.tipo=garantia`) → check completitud (E-61, `checkCompletitud`/`completitudChecklist`).
- **P-26 (Documentación):** fotos/docs por etapa (E-41); alojador DP-09 (Drive vs R2).
- **F-04/F-05/F-06 (Tienda):** frontera DIFERIDO — contrato de datos + eventos, H12 anotada.
- **F-07 (Portal cliente):** E-60 (cronograma), E-26 (firma wizard), E-36 (solicitar garantía), E-28 (pago online), E-55 (captura reseña); aislamiento por `clienteId` (`inv:131`).

---

## Entregable: especificación de pantallas (7)

### P-24 — Pedidos web (admin) + enganche a producción

**1. Encabezado**
- Nombre: Pedidos web. Ruta: `/app/erp/pedidos` (existe, extiende — `inv:67`).
- Rol: gerente, comercial, desarrollador. Eventos: E-44.

**2. Wireframe estructural**
```
┌ Header: [Pedidos web] [Filtros: estado/enganche] ─────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Lista (Familia A)]                                                    │
│  pedido | cliente | items | total | estado | engancheProduccion       │
│  [Enganchar →] (crea orden_trabajo origen='pedido_web')                │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Enganchar a producción | botón | E-44 | `pedidos_web.engancheProduccion=TRUE` + `ordenProduccionId` + `ordenes_trabajo.origen='pedido_web'` | desarrollador | — | pedido sin enganche | si ya enganchado |
| Ver detalle | fila click | E-44 | modal items/total | gerente | — | — | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Pedido enganchado a la orden #{codigo}" | tras E-44 |
| "Pendiente de enganche" | badge |
| "Sin pedidos web" | empty state |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Pedido | `pedidos_web.engancheProduccion/ordenProduccionId/estado` | bool/uuid/enum | E-44 |
| Orden | `ordenes_trabajo.origen='pedido_web'/pedidoWebId/codigo_orden` | enum/uuid/texto | E-44 |

**6. Máquina de estados del gate** — Sin gate. E-44 híbrido: el enganche es acción del desarrollador; la producción ya corre en P-16 (B3-3).

**7. Responsive + accesibilidad** — Familia A (pedidos); CTA en tercio inferior.

**8. Aspectos de código React** — `PedidosWebTable`, `EngancharModal`. API: `POST /api/erp/pedidos/[id]/enganchar`.

---

### P-25 — Garantía: agenda + orden + check de completitud

**1. Encabezado**
- Nombre: Garantía. Ruta: `/app/erp/garantia` (nuevo — `inv:68`).
- Rol: comercial, instalador, gerente. Eventos: E-36, E-37, E-61.

**2. Wireframe estructural**
```
┌ Header: [Garantía] [Proyecto] ────────────────────────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [1. Agenda (E-36)]: ventana 8-12 días (garantia_ventana_dias)         │
│ [2. Orden de garantía (E-37)]: orden_trabajo tipo=garantia            │
│ [3. Check de completitud (E-61)]: checklist → completitudChecklist    │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Agendar garantía | botón | E-36 | `garantias` (ventana 8-12, sch_c:223) | comercial | — | dentro de ventana | si fuera de ventana |
| Crear orden | botón | E-37 | `ordenes_trabajo.tipo='garantia'` | comercial | — | agenda existente | si no agenda |
| Marcar completitud | checkbox | E-61 | `ordenes_trabajo.checkCompletitud/completitudChecklist/fechaCheckCompletitud` | instalador | — | todos los checks | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Ventana de garantía: {día} de {N} días" | E-36 |
| "Orden de garantía #{codigo}" | E-37 |
| "Completitud verificada" | E-61 |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Garantía | `garantias.estado/ventana` | enum/rango | E-36 |
| Orden | `ordenes_trabajo.tipo='garantia'/codigo_orden` | enum/texto | E-37 |
| Check | `ordenes_trabajo.checkCompletitud/completitudChecklist/fechaCheckCompletitud` | bool/jsonb/ts | E-61 |

**6. Máquina de estados del gate** — Sin gate. Flujo secuencial agenda→orden→check.

**7. Responsive + accesibilidad** — Familia B (3 pasos); progreso visible.

**8. Aspectos de código React** — `GarantiaWizard` (3 pasos). API: `POST /api/erp/garantia`.

---

### P-26 — Documentación del proyecto (fotos/docs por etapa)

**1. Encabezado**
- Nombre: Documentación. Ruta: `/app/erp/proyectos/[id]/documentacion` (nuevo — `inv:69`).
- Rol: comercial, desarrollador, gerente. Eventos: E-41.

**2. Wireframe estructural**
```
┌ Header: [Documentación] [Proyecto] [Etapa] ───────────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Galería por etapa (E-41)]: fotos + documentos                        │
│ [Upload] [Alojador: DP-09 (Drive vs R2)]                              │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Subir archivo | input | E-41 | `documentacion_proyecto` (etapa, archivo) | desarrollador/comercial | — | tipo + etapa | si alojador no definido (DP-09) |
| Ver por etapa | tabs | E-41 | filtro por etapa | todos | — | — | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Etapa: {retoma/desarrollo/taller/entrega}" | tabs |
| "Alojador pendiente de decisión" | DP-09 (inv:H-B2-2-12) |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Documento | `documentacion_proyecto.etapa/archivoUrl/creado_en` | enum/texto/ts | E-41 |
| Retoma | E-41 captura en P-07 (D5, `inv:50`) | — | E-41 |

**6. Máquina de estados del gate** — Sin gate.

**7. Responsive + accesibilidad** — Galería grid; alt text; Familia B.

**8. Aspectos de código React** — `DocGallery`, `UploadDoc`. API: `POST /api/erp/proyectos/[id]/documentacion`.

---

### F-04 — Tienda: catálogo (frontera DIFERIDO)

**1. Encabezado**
- Nombre: Tienda — catálogo. Ruta: `/tienda` (nuevo, DIFERIDO — `inv:95`).
- Rol: público. Eventos: E-44.

**2. Wireframe estructural** — Frontera (no se construye): grid de productos desde `productos_catalogo`/`portfolio_publico` (A3-C1).

**3-4. Interactivos/Textos (TABLA resumida)**

| Etiqueta | Tipo | Evento | Validación |
|---|---|---|---|
| Ver catálogo | navegación | E-44 | publica `portfolio_publico` |
| Click producto | link | E-44 | → F-05 |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Producto | `productos_catalogo`/`portfolio_publico` | grid | P-31 publica |

**6-8. Notas** — Sin gates; DIFERIDO t-034 (`inv:17`); diseño de frontera únicamente.

---

### F-05 — Tienda: ficha de producto (frontera DIFERIDO)

**1. Encabezado**
- Nombre: Tienda — ficha. Ruta: `/tienda/[sku]` (nuevo, DIFERIDO — `inv:96`).
- Rol: público. Eventos: E-44.

**2. Wireframe estructural** — Frontera: foto, descripción, precio, [Agregar al carrito].

**3-5. Interactivos/Datos**

| Etiqueta | Tipo | Evento | Validación |
|---|---|---|---|
| Agregar al carrito | botón | E-44 | stock/`sku` |

**6-8. Notas** — Sin gates; DIFERIDO; frontera únicamente.

---

### F-06 — Tienda: carrito + checkout + pago (frontera DIFERIDO)

**1. Encabezado**
- Nombre: Tienda — checkout. Ruta: `/tienda/checkout` (nuevo, DIFERIDO — `inv:97`).
- Rol: cliente. Eventos: E-44.

**2. Wireframe estructural** — Frontera: carrito → checkout → pago (E-28 online).

**3-5. Interactivos/Datos**

| Etiqueta | Tipo | Evento | DP |
|---|---|---|---|
| Checkout | flujo | E-44 | **H12: pedidos anónimos** (inv:H-B2-2-05) |

**6-8. Notas** — Sin gates; DIFERIDO; frontera. DP-04/H12 pendiente Supervisor.

---

### F-07 — Portal del cliente: mis proyectos / seguimiento

**1. Encabezado**
- Nombre: Portal del cliente. Ruta: `/cuenta/proyectos` + `[id]` (existe, extiende — `inv:98`).
- Rol: cliente. Aislamiento por `clienteId` (`inv:131`, `lib/modules/cuenta/queries.ts:53-88`).
- Eventos: E-60 (cronograma), E-26 (firma), E-36 (solicitar garantía), E-28 (pago online), E-55 (captura reseña).

**2. Wireframe estructural**
```
┌ Header: [Mis proyectos] [Cliente: {nombre}] ──────────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Proyecto]: estado | cronograma (E-60, único canal I-043)            │
│  | firmar contrato (wizard E-13/E-26) | pagar (E-28 online)          │
│  | solicitar garantía (E-36) | dejar reseña (E-55)                   │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Firmar contrato | wizard | E-13/E-26 | acta/contrato firmado (D8) | cliente | modal R18 | firma | si ya firmado |
| Pagar | botón | E-28 | `obligaciones_pendientes.estado→pagada` (online) | cliente | — | monto | si ya pagado |
| Solicitar garantía | botón | E-36 | `garantias` (solicitud) | cliente | — | dentro de ventana | si fuera de ventana |
| Dejar reseña | form | E-55 | `testimonios` (captura) | cliente | — | texto+rating | — |
| Ver cronograma | vista | E-60 | muestra novedades del proyecto | cliente | — | — | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Tu proyecto está en {estado}" | estado proyecto |
| "Pendiente de firma" | E-13 |
| "Cronograma actualizado por el equipo" | E-60 |
| "Ventana de garantía: 8-12 días" | E-36 |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Proyecto | `proyectos.estado` (aditivo 8, CF-02) | enum | E-14/E-59 |
| Cronograma | `cronogramas` (línea acordada) + E-60 comunicaciones | derivado | E-60 |
| Firma | acta/contrato (wizard D8) | — | E-13/E-26 |
| Reseña | `testimonios` (captura; curaduría P-33 DIFERIDO) | texto/rating | E-55 |

**6. Máquina de estados del gate** — Sin gate. Aislamiento estricto por `clienteId` (R26).

**7. Responsive + accesibilidad** — Familia B; móvil-first (cliente); firma accesible por teclado.

**8. Aspectos de código React** — `PortalCliente`, `FirmaWizard` (compartido P-19/E-13), `ReseñaForm`. API: `GET /api/cuenta/proyectos`, `POST /api/cuenta/...`.

---

## Cobertura de eventos de la familia (7/7 pantallas, 0 gates)

| Evento | Pantalla(s) | Tipo |
|---|---|---|
| E-44 | F-04/F-05/F-06 (frontera) + P-24 (admin) + P-16 (B3-3, enganche) | híbrido |
| E-36 | P-25 (agenda) + F-07 (cliente solicita) | humano |
| E-37 | P-25 (orden) | humano |
| E-61 | P-25 (check completitud) | humano |
| E-41 | P-26 (+ P-07 en retoma, D5) | humano |
| E-55 | F-07 (captura) + P-33 (curaduría, DIFERIDO) | humano |
| E-60 | P-09 (crea, B3-2) + **F-07** (cliente ve, único canal I-043) | híbrido |
| E-26 | P-19 (firma, B3-3) + F-07 (wizard) | híbrido |
| E-28 | P-21/P-20 (B3-4) + F-07 (online) | híbrido |
| E-13 | P-05 (B3-1) + F-07 (wizard) | híbrido |

---

## Hallazgos

| ID | Tipo | Descripción | Fuente |
|---|---|---|---|
| H-B3-5-01 | `DECISION_PENDIENTE` | F-06 checkout: ¿pedidos anónimos? (H12) — bloquea la frontera de tienda | `inv:H-B2-2-05` |
| H-B3-5-02 | NOTA | Construcción de tienda (F-04/F-05/F-06) = DIFERIDO t-034; este pase diseña solo la frontera (contrato de datos/eventos) | `inv:17,112` |
| H-B3-5-03 | NOTA | E-60 es el ÚNICO canal cliente (I-043): F-07 no crea módulo de mensajería propio | `inv:H-B2-2-11` |
| H-B3-5-04 | `DECISION_PENDIENTE` | Alojador de docs E-41 (DP-09, Drive vs R2) — deshabilita el upload de P-26 hasta resolver | `inv:H-B2-2-12`; `b3_3:H-B3-3-04` |

---

## Notas para el Orquestador

- **Contrato cumplido (met:110-123):** 7 pantallas × 8 secciones; 0 gates (frontera y canal cliente).
- **Para B4-2 (roles×gates):** resolver DP-09 (alojador) y H12 (pedidos anónimos). El aislamiento `clienteId` de F-07 es guard crítico.
- **Cierre de Ola 4:** con B3-5 se completan las 5 familias (B3-1..B3-5) = 34 pantallas core. Siguiente: **Ola 5** B4-1..B4-4 (auditoría) → B5 (auditor final) → checkpoint humano.
- **Prohibido cumplido:** solo escribió `d3_ui_b3_5_cliente_documentacion.md`.

## Registro

- Fecha: 2026-08-04 · Pase B3-5 (ola 4 — cliente/portal + documentación).
- Archivo de salida: `arnes/diagnostico/pasadas/d3_ui_b3_5_cliente_documentacion.md`.
- Conteo: **7 pantallas** (P-24..P-26 + F-04..F-07) · 0 gates · 4 hallazgos (2 DECISION_PENDIENTE, 2 notas).
