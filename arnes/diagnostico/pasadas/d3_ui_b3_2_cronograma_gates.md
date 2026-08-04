# Pase B3-2 — Control de cronograma + gates (subagente, loop de 3 iteraciones)

**Lente:** diseño de alto detalle de las pantallas de la familia **B3-2** (control de cronograma + gates) según el contrato de formato de `diamante3_metodologia.md:110-123`.
**Rol:** sub-agente B3-2 del Diamante 3 (`met:50`). **Modo:** `opencode general`, loop interno de 3 iteraciones.
**Fuentes leídas (solo estas):** `d3_schema_consolidado.md` (sch_c: schema objetivo + predicados de gates §6) · `d3_ui_b2_2_pantallas_requeridas.md` (inv) · `d3_ui_b2_1_destilacion_inv.md` (reg) · `d3_ui_b1_1_ux_ergonomia.md` (ux) · `diamante2_define_eventos.md` (define) · `diamante2_discover_eventos.md` (discover) · `d3_ui_b3_1_embudo_comercial.md` (b3_1) · `diamante3_metodologia.md` (met).
**Archivo de salida (único escrito):** `arnes/diagnostico/pasadas/d3_ui_b3_2_cronograma_gates.md`.
**Vocabulario:** `met:98-107`. Trazabilidad `archivo:línea`. Escepticismo: nada inventado; lo no escrito → `DECISION_PENDIENTE`.

---

## Iteración 1 (bruta)

Inventario crudo de la familia B3-2 sin filtrar:

- **Pantallas del inventario** (`inv:108`): P-06 Proyectos+mapa de gates (sumidero), P-07 Retoma, P-08 Desarrollo/schema, P-09 Cronograma doble, P-10 Novedades críticas, P-11 Check 15 días, P-12 Equipo/roles/verificador. 7 pantallas.
- **Gates que esta familia ejecuta** (`sch_c:§6`): **E-18** (check de schema, en P-08), **E-33** (cambio de cronograma con causa, en P-09); P-06 es el sumidero de TODOS (E-18/E-21/E-24/E-33/E-20/E-23, deep-links). E-23/E-24 viven en B3-3 (P-17) pero P-06 los muestra; E-21 en B3-3 (P-14); E-20 en B3-3 (P-13/P-20).
- **Datos del consolidado** (`sch_c:§3-4-5`): `estimaciones`, `cronogramas`, `cronograma_etapas` (línea contractual/interna), `desfases_cronograma` (causa+composición+aplicado), `novedades_criticas` (SLA 5-24h), `check_15_dias` (3 desenlaces), `comunicaciones_progreso` (E-60), `retomas`, `schemas_proyecto`, `bom_materiales`, `verificaciones`, `reprocesos`, `roles`/`personas`/`personas_roles`/`asignaciones_proyecto`, `proyectos.verificador_id`/`fecha_entrada_desarrollo`/`comercial_vendedor_id`.
- **Reglas** (`reg:`): R03 dos lenguajes (línea contractual inmutable vs interna movible), R16 gates con guard + decisión manual E-33 justificada, R18 confirmación destructiva (E-54 reproceso recalcula), R20 decision-first, R21 5-7 KPIs, R40 calendar math + timezone, R04 prevención de olvido (recálculo automático), R06 rastreabilidad, R05 matemática en servidor.
- **Principios UX** (`ux:`): P01 una tarea, P03 visibilidad de estado, P08 gates con guard, P10 progressive disclosure (composición causal expandible), P20 decision-first.

**Conteo bruto:** 7 pantallas × 8 secciones = 56 bloques.

---

## Iteración 2 (autocrítica)

Dudo de mis decisiones:

1. **¿P-06 (mapa de gates) es una pantalla o un resumen de otras?** `inv:49` la marca como **sumidero** que deep-linkea a las pantallas operativas donde cada gate se ejecuta. **Decisión: es el panel del proyecto** con el timeline de estados de los 5 gates (E-18/E-21/E-24/E-33/E-20) + E-23 señal, estado/guard pendiente y deep-links (R03/R16). Es la "visibilidad permanente del estado" de P03 a nivel proyecto.
2. **¿E-33 exige `composicion_causal` jsonb?** `sch_c:§6` el predicado exige `jsonb_array_length(composicion_causal)>0`. La UI debe ofrecer una composición causal tipada (causa primaria + factores) — no texto libre únicamente. **Decisión: editor de composición causal con checkboxes de factores + motivo libre; `decision_manual`/`justificacion_manual` solo en la rama de decisión manual del gerente.**
3. **¿El check de 15 días (E-59) tiene 3 desenlaces o es binario?** Define/I-025: log de producción + 3 desenlaces (todo_bien / novedad / extremo) (`sch_c:§4`; `inv:54`). **Decisión: 3 desenlaces con campos distintos por desenlace.**
4. **¿La fila del taller (P-16, B3-3) alimenta E-59?** Sí — `modulos_armado` es input de E-59/E-34 (decisión B2, `inv:59`). **Decisión: P-11 lee la fila de `modulos_armado` (B3-3) como dato de insumos en taller; se referencia, no se rediseña.**
5. **¿P-12 (equipo/verificador) pertenece a esta familia?** `inv:55` la agrupa en B3-2 como **infraestructura de gates** (designa `proyectos.verificador_id`). **Decisión: sí — es precondición de E-18/E-24.** Se especifica la designación por despacho, no el rol-vs-persona completo (eso es de implementación).
6. **Autocrítica de datos:** el adelanto (E-59 desenlace feliz) "no tiene ruta por E-33; su rama negativa castigaría el éxito" (Bloque C del Define, `estado.md`). **Decisión: el adelanto positivo es un cambio sancionado que NO pasa por el desfase E-33 — se registra como `comunicaciones_progreso` E-60 (adelanto_instalacion) y `instalaciones.adelantada_por→check_15_dias` (B3-3).** No inventar un E-33 positivo.

**Resultado:** 7 pantallas confirmadas; P-06 como sumidero; E-33 con editor de composición causal tipado; E-59 con 3 desenlaces; adelanto positivo fuera de E-33.

---

## Iteración 3 (refinamiento final)

Decisiones depuradas:

- **Los 5 gates + E-23 señal se ven en P-06 como timeline** con estado (icono+texto+color, R14), guard pendiente y deep-link a la pantalla operativa (R16). El gerente ve el panel de decisión primero (R20).
- **E-18 se ejecuta en P-08** (veredicto del comercial vendedor, D3) y **E-33 en P-09** (causa estructurada + decisión manual del gerente). La línea contractual es inmutable; solo la interna se recalcula (R03).
- **SLA de novedad crítica (E-34):** ventana 5-24h con escalación y registro (`sch_c:§4`); la UI muestra chip de temporizador (R17) y el historial de escalación.
- **Recalculo automático (R04):** al aplicar un desfase, el servidor recalcula fechas de la línea interna; la UI muestra "Recalculado por causa {x}" sin pedir acción.
- **Responsive:** cronograma = Familia A (tabla densa con scroll, R34); novedades = Familia B; móvil-first.

---

## Entregable: especificación de pantallas (7)

### P-06 — Proyectos: lista + detalle con mapa de gates (sumidero)

**1. Encabezado**
- Nombre: Proyectos. Ruta: `/app/erp/proyectos` + `/app/erp/proyectos/[id]` (nuevo — `inv:49`).
- Rol: comercial, gerente, desarrollador, diseñador. Contexto: Transversal.
- Eventos: E-14 (resumen), E-05/E-51 (estado proyecto), E-59 (badge), E-34 (badge). **Sumidero de los 5 gates (E-18/E-21/E-24/E-33/E-20) + E-23 señal (no gate).**

**2. Wireframe estructural**
```
┌ Header: [Proyectos] [Buscar] [Filtros: estado/verificador] ────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Lista de proyectos (Familia B: cards en móvil)]                       │
│  card: nombre | estado | cliente | badge gate pendiente | fecha        │
│ ── Detalle /app/erp/proyectos/[id] ───────────────────────────────────  │
│ Header: [← Volver] [Proyecto] [estado] [verificador]                   │
│ [Mapa de gates (timeline horizontal)]                                  │
│  E-18 schema → E-21 recepción → E-24 calidad → E-33 cronograma         │
│  E-23 citación · E-20 caja  (icono+texto+color, deep-link)             │
│ [Panel "Requiere tu decisión"] (gerente): gates bloqueados + acción    │
│ [Resumen: cronograma, check 15 días badge, novedades badge]            │
└───────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Tarjeta de proyecto | card-link | — | → detalle `[id]` | comercial/gerente/dev/diseñador | — | — | — |
| Deep-link a P-08 (E-18) | chip | E-18 | → `/desarrollo` | desarrollador/comercial | — | — | si gate en estado inicial |
| Deep-link a P-14 (E-21) | chip | E-21 | → `/compras/[ocId]/recepcion` | desarrollador | — | — | si sin OC |
| Deep-link a P-17 (E-23/E-24) | chip | E-23/E-24 | → `/calidad` | comercial/dev | — | — | — |
| Deep-link a P-09 (E-33) | chip | E-33 | → `/cronograma` | gerente/comercial/dev | — | — | — |
| Deep-link a P-20 (E-20) | chip | E-20 | → `/finanzas` | gerente | — | — | — |
| Resolver decisión (caja) | botón | E-20 | → P-20 con contexto | gerente | — | — | si no hay bloqueo |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Requiere tu decisión" | panel de gerente (R20) |
| "E-18: falta veredicto de schema" | guard pendiente en el timeline (R16) |
| "Check de 15 días: novedad" | badge E-59 |
| "Novedad crítica abierta (SLA 5-24 h)" | badge E-34 |
| "No hay proyectos aún" | empty state (P26) |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Nombre/estado | `proyectos.nombre_proyecto/estado` | texto/enum | E-05.. |
| Cliente | `proyectos.cliente_id → clientes.nombre` | texto | E-51 |
| Verificador | `proyectos.verificador_id → personas.nombre` | texto | D3/I-035 |
| Estado gates | `verificaciones.tipo_gate/veredicto` + `recepciones_material.estado` + `desfases_cronograma` + `eventos` | derivado | lectura |
| Badge check 15 | `check_15_dias.desenlace` | enum | E-59 |
| Badge novedad | `novedades_criticas.estado` | enum | E-34 |

**6. Máquina de estados del gate** — **Sumidero de lectura** de los 5 gates (E-18/E-21/E-24/E-33/E-20) + estado del proyecto; no ejecuta transiciones (deep-links). El guard pendiente se muestra como razón visible del botón deshabilitado (R16).

**7. Responsive + accesibilidad** — Lista Familia B (cards <768px); timeline horizontal con scroll accesible; badges ≥48px; contraste AA.

**8. Aspectos de código React** — Server component con `db.query.proyectos.findMany({with:{...}})`, `MapaGatesTimeline`, `DecisionPanel` (solo gerente). Hooks: refresh tras navegación.

---

### P-07 — Retoma de medidas

**1. Encabezado**
- Nombre: Retoma de medidas. Ruta: `/app/erp/proyectos/[id]/retoma` (nuevo — `inv:50`).
- Rol: comercial, desarrollador. Eventos: E-15, E-41 (captura D5), E-16 (dispara anomalía).

**2. Wireframe estructural**
```
┌ Header: [Retoma] [Proyecto] [fecha] [comercial + desarrollador] ──────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Sección: medidas por módulo]    [Sección: fotos/documentos (E-41)]    │
│  módulo → medidas jsonb           [📷 capturar] → documentos_proyecto  │
│  obstáculos / electrodomésticos    etapa=retoma, tipo=foto              │
│ [Anomalía detectada?] checkbox → dispara E-16 (cambio de contrato)     │
│ [Autoguardado ✓]  [Cerrar retoma (E-15)]                              │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Medidas por módulo | inputs jsonb | E-15 | autosave | comercial/dev | — | constraints | — |
| Capturar foto | botón 📷 | E-41 | crea `documentos_proyecto` (etapa=retoma) | comercial/dev | cámara rechazada → subir archivo | imagen | — |
| Marcar anomalía | checkbox | E-16 | dispara flujo de cambio de contrato | comercial/dev | — | requiere descripción | — |
| Cerrar retoma | botón | E-15 | marca retoma completa + fecha | comercial | — | requiere medidas mínimas | si autosave no completo |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Retoma en curso — se guarda sola" | autosave (R26) |
| "Anomalía detectada — se abre un cambio de contrato" | tras checkbox E-16 |
| "Medidas registradas por módulo" | éxito |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Medidas | `retomas.medidas/notas_retoma/electrodomesticos/obstaculos` | jsonb | E-15 |
| Anomalía | `retomas.anomalia_detectada` | bool | E-16 |
| Docs | `documentos_proyecto.archivo_url/tipo/alojador` | texto/enum | E-41 |

**6. Máquina de estados del gate** — Ninguna. La anomalía E-16 → flujo de cambio (P-05/B3-1) → E-33 (P-09).

**7. Responsive + accesibilidad** — Punto de verdad en campo (R28): foto con captura directa; móvil-first; inputs ≥16px; autosave con indicador.

**8. Aspectos de código React** — `RetomaForm` (autosave debounce), `CapturaFoto` (camera API), `AnomaliaCheck`. API: `PUT /api/erp/proyectos/[id]/retoma`, `POST /api/erp/proyectos/[id]/documentos`.

---

### P-08 — Desarrollo técnico / schema (BOM + veredicto E-18 + integraciones)

**1. Encabezado**
- Nombre: Desarrollo técnico. Ruta: `/app/erp/proyectos/[id]/desarrollo` (nuevo — `inv:51`).
- Rol: desarrollador (ejecuta), comercial (veredicto E-18, D3), gerente (ve).
- Eventos: E-17, **E-18**, E-54, E-38, E-39.

**2. Wireframe estructural**
```
┌ Header: [Desarrollo] [Proyecto] [verificador: {comercial vendedor}] ──┐
├──────────────────────────────────────────────────────────────────────┤
│ [Schema (E-17): versiones + estado]  [BOM (E-17): materiales + linaje] │
│  version actual | estado schema      [BOM item] [origen cotización]     │
│ [Integraciones (E-38/E-39)]: solo con schema aprobado (precedencia)    │
│  [Generar modelo 3D]  [Enviar a corte]                                 │
│ [Veredicto E-18 (bloque del comercial)]: [Aprobar] [Rechazar]          │
│   guard: verificado = comercial vendedor (proyectos.verificador_id)    │
│ [Reprocesos (E-54)]: origen schema → módulo/componente → culpable      │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Subir schema (versión) | botón | E-17 | `schemas_proyecto.version+1` (borrador) | desarrollador | — | schema_datos válido | — |
| Marcar schema para revisión | botón | E-17 | `estado→para_revision` | desarrollador | — | — | si sin schema |
| **Aprobar schema** | botón primario | **E-18** | `verificaciones.tipo_gate='schema',veredicto='aprobado'` + `proyectos.estado→desarrollo` + `fecha_entrada_desarrollo` | **comercial vendedor (D3)** | modal R18 (irreversible) | — | si `verificador_id≠rol actual` O no para_revision |
| Rechazar schema | botón rojo | E-18 | veredicto='rechazado' → `schemas_proyecto.estado→en_reproceso` | comercial vendedor | — | detalle requerido | idem |
| Generar modelo 3D | botón | E-38 | `modelos_3d.estado→generado` | desarrollador | — | — | **si schema NO aprobado (precedencia E-18)** |
| Enviar a corte | botón | E-39 | `pedidos_corte.estado→enviado` | desarrollador | — | archivo_cvc | si no modelo generado |
| Reprocesar módulo | botón | E-54 | `reprocesos` (origen schema, módulo/componente, culpable) → recalcula cronograma | desarrollador/gerente | modal R18 "reprocesar X recalcula cronograma y comisiones" | módulo+componente | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Schema v3 — pendiente de veredicto" | estado |
| "Falta veredicto del comercial vendedor" | guard E-18 (R16) |
| "Solo se puede enviar a corte con schema aprobado" | deshabilitado E-38/E-39 (precedencia) |
| "Reprocesar módulo X recalcula el cronograma y las comisiones" | modal R18 (E-54) |
| "Rechazado — motivo: {detalle}" | tras E-18 rechazo |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Schema | `schemas_proyecto.version/estado/schema_datos/aprobado_por_rol` | int/enum/jsonb | E-17 |
| BOM | `bom_materiales.catalogo_id/nombre/cantidad/unidad/linaje_item_id` | texto/numeric | E-17 |
| Veredicto | `verificaciones.tipo_gate='schema'/veredicto/verificador_id/creado_en` | enum/enum/uuid/ts | **E-18** |
| t0 | `proyectos.fecha_entrada_desarrollo` | timestamp | E-18 (DET-02) |
| Modelos | `modelos_3d.estado/herramienta` | enum | E-38 |
| Corte | `pedidos_corte.archivo_cvc/proveedor_corte` | texto | E-39 |
| Reproceso | `reprocesos.origen/modulo/componente/culpable` | enum/enum/enum/enum | E-54 |

**6. Máquina de estados del gate — E-18 (el gate de esta pantalla)**

`P18(p) = p.estado='desarrollo' ∧ ∃v∈verificaciones: v.proyecto_id=p.id ∧ v.tipo_gate='schema' ∧ v.veredicto='aprobado' ∧ v.verificador_id=p.verificador_id ∧ v.creado_en ≥ p.fecha_entrada_desarrollo` (`sch_c:§6`).

- UI: botón "Aprobar" habilitado SOLO si `verificador_id` = rol actual (verificador único = comercial vendedor, D3) y schema `para_revision`. Al aprobar, el servidor escribe la fila `verificaciones` + el estado y `fecha_entrada_desarrollo` en el MISMO `tx` (regla A1-5:214) y loguea `eventos` con payload.
- Rama negativa: rechazo → `schemas_proyecto.estado='en_reproceso'` (E-54) con `reprocesos.origen='schema'`.
- E-38/E-39 deshabilitados hasta `P18` true (precedencia define:88).

**7. Responsive + accesibilidad** — BOM como Familia A (scroll); veredicto como bloque fijo en móvil; foco visible; modal R18 con focus trap.

**8. Aspectos de código React** — `SchemaEditor` (versionado), `BomTable`, `VeredictoE18` (client, guard de rol), `IntegracionesPanel` (estado), `ReprocesosList`. API: `POST /api/erp/proyectos/[id]/schema`, `POST /api/erp/proyectos/[id]/veredicto` (E-18, un tx). Validación: rol vía `requireEmpleado(['comercial'])` + `verificador_id`.

---

### P-09 — Cronograma doble (línea contractual + línea interna)

**1. Encabezado**
- Nombre: Cronograma. Ruta: `/app/erp/cronograma` + `/app/erp/proyectos/[id]/cronograma` (nuevo — `inv:52`).
- Rol: gerente, comercial, desarrollador, instalador. Eventos: E-14, **E-33**, E-52 (acordada), E-59 (desencadena), E-60 (crea comunicación).

**2. Wireframe estructural**
```
┌ Header: [Cronograma] [Proyecto] [promesa: 7 semanas] ─────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Tabla de doble línea (Familia A)]                                     │
│  Etapa       | Contractual (inmutable) | Interna (movible) | Estado   │
│  Aprobación  | 12-jul                 | 12-jul            | ✅        │
│  Compras     | 19-jul                 | 21-jul ⚠          | en_curso │
│  Ensamblaje  | 26-jul                 | 28-jul            | pendiente│
│  Instalación | 02-ago                 | 04-ago            | pendiente│
│ [Desfase E-33 (modal/panel)]: causa + composición causal + motivo     │
│  → [Aplicar desfase] recalcula línea interna SOLO (R03)               │
│ [Decisión manual (gerente)]: justificacion + quien decidió            │
│ [Comunicación E-60]: solo cambio positivo → cliente (adelanto)        │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Crear desfase | botón | E-33 | abre editor de causa | gerente/comercial/dev | — | causa + motivo | — |
| Seleccionar causa | select | E-33 | `desfases_cronograma.causa` (interna/externa/cambio_contrato) | gerente/comercial/dev | — | enum | — |
| Composición causal | checkboxs | E-33 | `composicion_causal` jsonb (≥1 factor) | — | — | ≥1 factor (predicado) | — |
| Motivo | textarea | E-33 | `motivo` (length>0) | — | — | requerido | — |
| **Aplicar desfase** | botón primario | **E-33** | `desfases_cronograma.aplicado=true` + recálculo SOLO línea interna (servidor) | gerente (decide) | modal R18 "recalcula fechas internas y comisiones" | P33 completo | si causa sin composición |
| Decisión manual | form | E-33 | `decision_manual/justificacion_manual` + quién decidió | gerente | — | justificación | — |
| Crear comunicación (adelanto) | botón | E-60 | `comunicaciones_progreso` (tipo=adelanto_instalacion, visible_cliente=true) | sistema/comercial | — | — | solo si E-59 feliz |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Línea contractual — no se modifica" | columna inmutable (R03) |
| "Recalculado por causa: {x}" | tras aplicar E-33 (R04) |
| "Causa interna — las comisiones se reducen" | warning (mapeo gate→token) |
| "Causa externa / cambio de contrato" | info |
| "Adelantamos tu entrega — se notifica al cliente" | E-60 adelanto |
| "Esta acción recalcula el cronograma interno y las comisiones" | modal R18 |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Etapas | `cronograma_etapas.etapa/linea/fecha_inicio/fecha_fin/estado` | enum/enum/ts/ts/enum | E-14 |
| Promesa | `cronogramas.base_semanas` + `parametros.promesa_semanas` (7) | int | E-14/I-024 |
| Causa | `desfases_cronograma.causa` | enum | E-33 |
| Composición | `desfases_cronograma.composicion_causal` | jsonb | E-33 |
| Aplicado | `desfases_cronograma.aplicado` | bool | E-33 (DET-03) |
| Decisión manual | `desfases_cronograma.decision_manual/justificacion_manual` | bool/texto | E-33 |
| Comunicación | `comunicaciones_progreso.tipo/contenido/visible_al_cliente/canal` | enum/texto/bool/enum | E-60 |

**6. Máquina de estados del gate — E-33 (el gate de esta pantalla)**

`P33(p) = ∃d∈desfases_cronograma: d.proyecto_id=p.id ∧ d.aplicado=true ∧ d.causa∈{'interna','externa','cambio_contrato'} ∧ length(d.motivo)>0 ∧ jsonb_array_length(d.composicion_causal)>0` → recálculo SOLO de `cronograma_etapas.linea='interna'` (`sch_c:§6`).

- La línea `contractual` NUNCA se recalcula (inmutable, I-034); solo la `interna`.
- El adelanto positivo (E-59 feliz) NO pasa por E-33 — se registra como E-60 y `instalaciones.adelantada_por` (B3-3). (Bloque C resuelto, `estado.md`.)
- Decisión manual: `decision_manual=true` + `justificacion_manual` registra la desviación (D4: determinismo de existencia, no de verdad).

**7. Responsive + accesibilidad** — Familia A (overflow-x + 1ª columna sticky); doble línea con distinción visual contractual/interna además de texto (R14); R40 timezone en fechas.

**8. Aspectos de código React** — `CronogramaDobleTabla`, `DesfaseEditor` (composición causal), `DecisionManualForm`, `ComunicacionE60`. API: `POST /api/erp/proyectos/[id]/desfases` (aplica P33 + recálculo en tx), `POST /api/erp/proyectos/[id]/comunicaciones`. Cálculo de fechas en servidor (R05/R40).

---

### P-10 — Novedades críticas (SLA 5-24 h)

**1. Encabezado**
- Nombre: Novedades críticas. Ruta: `/app/erp/cronograma/novedades` (nuevo — `inv:53`).
- Rol: todos (registran), gerente (ve/escala). Eventos: E-34.

**2. Wireframe estructural**
```
┌ Header: [Novedades críticas] [Filtros: estado/SLA] ───────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Lista (Familia B)]                                                    │
│  card: descripción | fase | chip SLA 5-24h | estado | escalado a      │
│   (temporizador si abierta)                                            │
│ [+ Registrar novedad] → formulario: descripción + fase                 │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Registrar novedad | botón | E-34 | `novedades_criticas` (estado=abierta, hora_entrada, ventana 5-24h) | todos los roles | — | descripción+fase | — |
| Escalar | botón | E-34 | `estado→escalada` + `escalado_a` | gerente | — | destino | si estado≠abierta |
| Marcar resuelta | botón | E-34 | `estado→resuelta` + `cumplio_sla` | gerente | — | — | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Vence en {h}:{mm}" | chip (R17) |
| "SLA vencido — escalado al gerente" | alert (define:135, sin multa) |
| "No hay novedades críticas" | empty state |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Ventana | `novedades_criticas.ventana_sla_horas` (5-24) | int | E-34 |
| Hitos | `hora_entrada/hora_resolucion` | timestamp | E-34 |
| Cumplimiento | `cumplio_sla` | bool | E-34 |
| Escalación | `escalado_a → personas` | uuid | E-34 |

**6. Máquina de estados del gate** — Sin gate. SLA con escalación automática (R04) y registro; sin multa (I-054).

**7. Responsive + accesibilidad** — Cards ≥48px; temporizador con icono+texto; focus visible.

**8. Aspectos de código React** — `NovedadesList`, `NovedadForm`, `SlaChip` (compartido con P-01). API: `POST /api/erp/novedades`, `PATCH /api/erp/novedades/[id]`.

---

### P-11 — Check de los 15 días (log de producción + 3 desenlaces)

**1. Encabezado**
- Nombre: Check de los 15 días. Ruta: `/app/erp/proyectos/[id]/check-15-dias` (nuevo — `inv:54`).
- Rol: gerente, desarrollador, comercial. Eventos: E-59.

**2. Wireframe estructural**
```
┌ Header: [Check de 15 días] [Proyecto] [fecha del check] ──────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Estado de producción (lee fila del taller, B3-3)]:                   │
│  insumos en taller | comprados o pagados | proyectos en fila          │
│ [Desenlace (3, I-025)]:                                               │
│  ○ Todo bien → adelanto instalación (E-60 + instalaciones adelantada) │
│  ○ Novedad → decisión + acción                                        │
│  ○ Extremo → escalar + comisiones reducidas (E-35, B3-4)              │
│ [Confirmar check] → log + alimenta E-25/E-35/E-60                     │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Desenlace todo_bien | radio | E-59 | `check_15_dias.desenlace='todo_bien'` → dispara E-60 adelanto | gerente | — | — | — |
| Desenlace novedad | radio | E-59 | `desenlace='novedad'` + decisión | gerente | — | decisión requerida | — |
| Desenlace extremo | radio | E-59 | `desenlace='extremo'` + comisiones reducidas | gerente | modal R18 | — | — |
| Confirmar check | botón | E-59 | fija `check_15_dias` (fecha + log) | gerente | — | requiere desenlace | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Check a los 15 días: promesa de entrega" | encabezado (I-024) |
| "Todo listo — adelantamos la instalación" | todo_bien |
| "Novedad detectada — se define acción" | novedad |
| "Situación extrema — se escala y se reducen comisiones" | extremo (I-025/3) |
| "Este check alimenta el cronograma y las comisiones" | nota (E-59→E-25/E-35/E-60) |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Insumos | `check_15_dias.insumos_en_taller/comprados_o_pagados/proyectos_en_fila` | texto/bool | E-59 (lectura fila taller) |
| Desenlace | `check_15_dias.desenlace` | enum (3) | E-59 |
| Decisión | `check_15_dias.decision` | texto | E-59 |
| Comisiones | `check_15_dias.comisiones_reducidas` | bool | E-59→E-35 |

**6. Máquina de estados del gate** — Ninguna transición de gate; dispara E-60 (adelanto) y alimenta E-25/E-35.

**7. Responsive + accesibilidad** — Cards por desenlace; radios grandes (≥48px); textura de contraste.

**8. Aspectos de código React** — `Check15Form` (3 desenlaces condicionales). API: `POST /api/erp/proyectos/[id]/check-15-dias`. Lee `modulos_armado` (B3-3) para el estado de producción.

---

### P-12 — Equipo / roles / designación de verificador

**1. Encabezado**
- Nombre: Equipo. Ruta: `/app/erp/equipo` (existe, extiende — `inv:55`).
- Rol: gerente (admin). Eventos: E-18/E-24 (asignación `proyectos.verificador_id`).

**2. Wireframe estructural**
```
┌ Header: [Equipo] [Roles] ─────────────────────────────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Lista de personas → roles (personas_roles)]                          │
│  persona | roles activos | estado                                    │
│ [Designación del verificador por despacho]:                           │
│  proyecto → verificador (comercial vendedor) = proyectos.verificador_id │
│  (precondición de los guards E-18/E-24, D3/I-035)                     │
│ [+ Crear empleado] (t-018 existente)                                  │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Asignar rol | select | — | `personas_roles` (activo) | gerente | — | rol tipado | — |
| Designar verificador | select | — | `proyectos.verificador_id→personas` | gerente | — | persona con rol comercial | si proyecto sin estado apropiado |
| Crear empleado | botón | — | `usuarios` + `personas` (t-018) | admin | — | email+rol | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Verificador único por despacho" | header del bloque (D3) |
| "El verificador aprueba E-18 y E-24" | nota (I-035) |
| "Sin personal aún" | empty state |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Personas | `personas.*` | texto | CF-19 |
| Roles | `personas_roles.rol_id/activo/desde` | uuid/bool/ts | N-02 |
| Verificador | `proyectos.verificador_id→personas` | uuid | CF-20/D3 |

**6. Máquina de estados del gate** — Infraestructura: la designación del verificador es precondición de E-18/E-24 (`define:153`). Sin transiciones propias.

**7. Responsive + accesibilidad** — Lista Familia B; selects accesibles; ≥48px.

**8. Aspectos de código React** — `EquipoList`, `VerificadorForm`, `CrearEmpleadoForm` (existe t-018). API: `POST /api/erp/equipo`, `PATCH /api/erp/proyectos/[id]/verificador`.

---

## Cobertura de eventos de la familia (7/7 pantallas, gates E-18/E-33 ejecutados aquí)

| Evento | Pantalla(s) | Tipo |
|---|---|---|
| E-14 | P-06 (resumen) + P-09 | sistema |
| **E-18** | **P-08** (ejecuta) + P-06 (sumidero) + P-12 (infra) | **GATE** |
| **E-33** | **P-09** (ejecuta) + P-06 (sumidero) | **GATE** |
| E-34 | P-10 (+ P-06 badge) | híbrido |
| E-52 | P-04 (B3-1 proyecta) + P-09 (acordada) | frontera |
| E-59 | P-11 (+ P-06 badge) | híbrido |
| E-60 | P-09 (crea) + F-07 (B3-5) | híbrido |
| E-15 | P-07 | humano |
| E-17 | P-08 | humano |
| E-54 | P-08 (+ P-14/P-17/P-18 en B3-3) | híbrido |
| E-38/E-39 | P-08 (integraciones, precedencia E-18) | sistema |
| E-41 | P-07 (captura retoma) | humano |

---

## Hallazgos

| ID | Tipo | Descripción | Fuente |
|---|---|---|---|
| H-B3-2-01 | `DECISION_PENDIENTE` | `base_comision_tamano` (E-35, DP-06): el desenlace extremo del check 15 (P-11) reduce comisiones — confirmar base de cálculo (valor_total vs subtotal) antes del corte | `sch_c:DP-06`; `a2_5:198` |
| H-B3-2-02 | `DECISION_PENDIENTE` | Veracidad de la composición causal E-33 (D4, DP-04): este pase usa determinismo de existencia; confirmar si se audita la verdad del trazado | `sch_c:DP-04` |
| H-B3-2-03 | GAP heredado | Glosario único de estados/verbos (reg:H07) — los labels de gates ("Aprobar schema", "Aplicar desfase") deben unificarse para B4 | `reg:H07` |
| H-B3-2-04 | NOTA | Adelanto positivo (E-59→E-60) fuera de E-33: la rama negativa de E-33 no castiga el éxito (Bloque C del Define resuelto) | `estado.md`; `define:116` |
| H-B3-2-05 | NOTA | La fila del taller (`modulos_armado`) es input de P-11 (E-59) y P-10 (E-34) — se referencia desde B3-3 (P-16), no se rediseña | `inv:59` |
| H-B3-2-06 | `DECISION_PENDIENTE` | `sla_novedad_critica` (5/24h) y `holgura_cronograma_max_dias` (5) provienen del mapa, no del Define (DP-08) — validar fuente | `sch_c:DP-08` |

---

## Notas para el Orquestador

- **Contrato cumplido (met:110-123):** 7 pantallas × 8 secciones; los gates E-18 (P-08) y E-33 (P-09) tienen máquina de estados completa con predicados del `sch_c:§6`; P-06 es sumidero de lectura de los 5 gates + E-23 señal.
- **Para B3-3:** P-11 lee `modulos_armado` (P-16); E-24 se ejecuta en P-17 (calidad, B3-3) y este pase solo lo sumidera; E-21 en P-14; E-20 en P-13/P-20.
- **Para B4-1 (determinismo):** predicados E-18/E-33 listos para auditar contra UI; verificar que la atomicidad `eventos`+mutación viva en la implementación (A1-5:214).
- **Prohibido cumplido:** solo escribió `d3_ui_b3_2_cronograma_gates.md`.

## Registro

- Fecha: 2026-08-04 · Pase B3-2 (ola 4 — control de cronograma + gates).
- Archivo de salida: `arnes/diagnostico/pasadas/d3_ui_b3_2_cronograma_gates.md`.
- Conteo: **7 pantallas** · gates E-18/E-33 ejecutados + 4 sumiderados · 6 hallazgos (3 DECISION_PENDIENTE, 1 GAP heredado, 2 notas).
