# Contrato de lane: goal/cotizador-vista-deluxe

> Feature nueva. Planificada 2026-07-14 por el Orquestador (Sonnet), en modo estratega:
> este documento y los prompts de cada etapa fueron redactados por el Orquestador; la
> ejecución la hacen subagentes de modelo liviano (Haiku) en este worktree, uno por etapa,
> verificados por el Orquestador antes de continuar a la siguiente. Ninguna escritura a
> `storage/db/` ocurre sin mostrar antes el `--dry` al usuario y recibir confirmación
> explícita.

## Identidad
- **Rama:** `goal/cotizador-vista-deluxe`
- **Worktree:** `../wt-cotizador-vista-deluxe` (creado desde `dev`, commit `cb69db8`)
- **Rol/modelo:** Fase 1 = plan (Sonnet, este documento). Fase 2 = schema/zap/ruta (Haiku,
  dry-run). Fase 3 = UI del componente (Haiku). Fase 4 = integración de header (Haiku).
  Fase 5 = verificación final (Sonnet, no delegada).
- **Estado:** `plan_borrador` — lista para pasar a Fase 2 (dry-run, sin escritura) tras
  este documento.

## Goal (teleología)
Reemplazar el envío de PDF de la propuesta comercial por una **vista web pública premium
por cotización** (misma información que el PDF: espacios, N variantes por espacio,
imágenes, colores, costos), accesible por un link corto autogenerado (`/propuesta/:slug`)
que aparece en el header del cotizador cuando hay una cotización activa. El PDF se
conserva como respaldo manual, no se retira.

## Contexto y decisiones de producto (confirmadas con el usuario, 2026-07-14)
- URL: `/propuesta/:slug`.
- Slug: código aleatorio no reversible (nanoid/base62, 8 caracteres) — **no** una fórmula
  derivada del id del cliente. Motivo: la vista es pública sin login; un slug adivinable
  permitiría enumerar cotizaciones de otros clientes (precios, direcciones, datos
  personales).
- El fix "correcto" de exposición de datos (filtro server-side por slug en el gateway
  genérico de lectura) pertenece al **seed**, no a este fork — ver Fase 2b y el documento
  de propuesta al seed. Este fork implementa un interim documentado como riesgo temporal
  aceptado (ver Fase 3, sección de seguridad).

## Investigación previa (verificada en código, 2026-07-14, sobre `dev` @ `cb69db8`)
- `proyectos` = cotización (`cliente_id`, `nombre_proyecto`, `estado`, `costos_operativos`,
  `imprevistos_instalacion`, `descuento_comercial`, `ajuste_arbitrario`, `aplica_iva`/
  `porcentaje_iva`). `espacio_variantes` = espacio+variante (`proyecto_id`,
  `nombre_espacio`, `nombre_variante`, `activa`, `imagenes`/`colores` JSON-string,
  `descripcion`/`descripcion_alternativa`, jornadas de mano de obra, `visible_pdf`).
  `imagenes_espacio` = galería normalizada alterna. `items_variante` = líneas de costo.
  `clientes`. Confirmado presentes en `storage/db/schema_definitions.json`.
- Cálculo de referencia: zap `exportar_propuesta_pdf` (`storage/db/scripts.json`) agrupa
  espacios por variante activa (`ev.activa && ev.visible_pdf !== false`), suma
  materiales+mano de obra por espacio, aplica `costos_operativos + imprevistos_instalacion
  - descuento_comercial + ajuste_arbitrario` → `grandTotal`. La vista deluxe debe replicar
  exactamente esta matemática (mismos campos, mismo orden) — no reinventar el cálculo.
- Precedente de slug público: `prefabricados`/`portfolio_publico` tienen campo `slug`; ruta
  `/tienda/:slug` (`storage/db/page_routes.json:405`) → bloque `veta_producto_detalle` →
  `src/components/specialized/tienda/VetaProductoDetalle.tsx`. El resolver del engine
  (`src/lib/agnostic/resolver.ts:149`) resuelve **estrictamente por id**, nunca por slug
  (ADR explícito en el archivo — no tocar, es engine). El componente existente resuelve el
  slug él mismo vía `useAppState()` (`@/context/AppContext`), que expone el store global
  completo — correcto para catálogo público, **inseguro para cotizaciones** (expondría
  todos los proyectos/clientes/precios de la empresa a cualquier visitante con un link).
- Header: no hay componente `CotizadorHeader` separado; vive inline en
  `CotizadorPro.tsx` (gate `activeCotId`/`activeCot`, ~L46/71). El patrón de
  `handleExportPdf` (`POST /api/engine` con `zap: 'exportar_propuesta_pdf'`) es el molde a
  seguir para el botón de link nuevo.

## Superficie (y SOLO esta)
- `storage/db/schema_definitions.json` → nuevo campo `slug` en `proyectos` (mismo tipo que
  `prefabricados.slug`).
- `storage/db/scripts.json` → nuevo zap `generar_link_propuesta`.
- `storage/db/page_routes.json` → nueva ruta `/propuesta/:slug`.
- `agnostic.config.ts` → registro del bloque `propuesta_deluxe`.
- Nueva carpeta `src/components/specialized/cotizador/propuesta-deluxe/` (componentes
  nuevos, ver Fase 3).
- `src/components/specialized/cotizador/CotizadorPro.tsx` → solo el área del header/botón
  de exportar (agregar botón "Copiar enlace de propuesta"), sin tocar lógica de negocio
  existente.
- `storage/fork_doc/PROPUESTA_SEED_ACCESO_PUBLICO_ACOTADO.md` (documento, redactado por el
  Orquestador, no por un worker).

<!-- lane-surface: storage/db/schema_definitions.json | storage/db/scripts.json | storage/db/page_routes.json | agnostic.config.ts | src/components/specialized/cotizador/propuesta-deluxe/** | src/components/specialized/cotizador/CotizadorPro.tsx | storage/fork_doc/PROPUESTA_SEED_ACCESO_PUBLICO_ACOTADO.md -->

## Fuera de alcance
- **NO** tocar `src/lib/agnostic/resolver.ts`, `src/app/api/vault/route.ts`, ni ningún otro
  archivo de engine (`src/app/api/`, `src/components/agnostic/`, `src/lib/agnostic/`,
  `packages/`) — el fix de filtrado server-side se propone al seed, no se implementa aquí.
- **NO** tocar `exportar_propuesta_pdf` ni el flujo de PDF existente — se conserva intacto
  como respaldo.
- **NO** tocar `ContratoModal.tsx`, `generar_contrato`, `zap_activar_produccion`,
  `registrar_abono_y_activar` — fuera del alcance de esta feature.
- **NO** tocar el schema/UI de `items_obra_civil` (lane `goal-cotizador-obra-civil-estimada`,
  ya cerrada y mergeada a `dev`).
- **NO** escribir a producción directamente ni con scripts ad-hoc — solo vía `agno` con el
  ciclo gobernado (plan → `--dry` → confirmación explícita del usuario → backup).

## Depende de / bloquea
- No depende de ninguna lane activa (parte desde `dev` ya con `items_obra_civil` mergeado).
- No bloquea nada.

---

## FASE 1 — Diseño (COMPLETA, este documento es su entregable)

### Cierre de Fase 1
- [x] Investigación de modelo de datos, zap de referencia y precedente de slug confirmada
  contra código real (`dev` @ `cb69db8`).
- [x] Decisiones de producto (URL, seguridad del slug, PDF de respaldo) confirmadas con el
  usuario.
- [x] Decisión de arquitectura del filtrado de datos (propuesta al seed + interim en fork)
  confirmada con el usuario.
- [ ] Aprobación humana explícita para iniciar Fase 2 (implícita en la aprobación de este
  plan — el usuario ya aprobó el flujo completo vía `ExitPlanMode`).

---

## FASE 2 — Schema + zap + ruta (solo dry-run en esta pasada)

### DAG
1. `agno` flujo gobernado: `plan` → `--dry` (sin confirmar) para:
   a. Agregar campo `slug` (string, único) a `proyectos`.
   b. Crear zap `generar_link_propuesta`: recibe `{ record: proyecto }`; si
      `proyecto.slug` existe, no hace nada (idempotente); si no, genera un código de 8
      caracteres base62 (alfabeto sin caracteres ambiguos: sin `0/O/1/l/I`), verifica que
      no colisione contra los `slug` existentes de `proyectos`, y lo guarda con
      `api.saveItem('proyectos', { id: proyecto.id, data: { slug } })`.
   c. Agregar ruta `/propuesta/:slug` a `page_routes.json`, `isPrivate: false`, bloque
      `{ type: 'propuesta_deluxe', blocks: [] }` — mismo patrón que la entrada de
      `/tienda/:slug`.
2. Registrar el bloque `propuesta_deluxe` en `agnostic.config.ts` apuntando al componente
   de Fase 3 (import perezoso, mismo patrón que `veta_producto_detalle`).
3. Entregar el diff completo (`--dry`) sin aplicar ninguna escritura.

### DoD de cierre de Fase 2
- [ ] Diff de `--dry` mostrado y aprobado explícitamente por el usuario.
- [ ] Solo entonces: aplicar con confirmación real + backup automático.
- [ ] `npm run agnostic:compile` sin diff pendiente (tipo `Proyectos.slug` generado).
- [ ] `npm run validate:encoding` y el validador de zaps del fork en verde.
- [ ] Commit en `goal/cotizador-vista-deluxe`, push a origin.

---

## FASE 3 — Componente deluxe (solo tras cierre de Fase 2)

### DAG
1. Crear `src/components/specialized/cotizador/propuesta-deluxe/PropuestaDeluxe.tsx`:
   resuelve el slug desde la URL, hace fetch de `proyectos` (namespace completo — ver nota
   de seguridad abajo), filtra en memoria por `slug`, y **solo entonces** pide (ya
   acotado por id) `espacio_variantes` filtrado por `proyecto_id`, `items_variante` por los
   `variante_id` resultantes, `imagenes_espacio` igual, y el `cliente` único por
   `cliente_id`. **No usar `useAppState()`** (store global de la app) para ningún dato de
   esta ruta.
2. `PropuestaHero.tsx` (cliente, proyecto, fecha, total), `EspacioShowcase.tsx` (switcher
   de variantes de solo lectura tipo `EspacioTabs.tsx`, galería, colores, descripción,
   desglose de costo por espacio), `PropuestaTotales.tsx` (gran total — misma fórmula que
   `exportar_propuesta_pdf`, extraída a una función pura compartida, no duplicada).
3. Responsive (aplicar `AGNOSTIC_RESEARCHS.md/INS_Pantallas responsive y CSS.md`):
   - Grid de espacios: `grid-template-columns: repeat(auto-fill, minmax(min(100%,340px),1fr))`.
   - `container-type: inline-size` en cada tarjeta de espacio (Container Queries).
   - Tipografía fluida `clamp()` para títulos/totales.
   - `aspect-ratio` reservado en toda imagen + lazy-load bajo el fold.
   - Hit targets ≥44×44px; hover solo bajo `@media not all and (hover: none)`.
   - Jerarquía "layer-cake": reutilizar `CollapseStrip.tsx` en modo lectura para detalle
     bajo demanda.
   - Botón "Guardar como PDF" (`window.print()` + hoja de estilo de impresión) como
     respaldo secundario, no como acción principal.

### Nota de seguridad (riesgo temporal aceptado, documentado, no bloqueante)
El fetch de `proyectos` en el paso 1 trae la tabla completa (nombres de proyecto,
direcciones, costos/descuentos, etapa comercial de TODOS los clientes) en un único
request no persistente, para poder resolver el slug en el cliente — el gateway genérico
`/api/vault?namespace=X` no soporta filtro server-side por slug hoy (ver
`PROPUESTA_SEED_ACCESO_PUBLICO_ACOTADO.md`). `espacio_variantes`/`items_variante`/
`imagenes_espacio`/`clientes` SÍ quedan acotados por id, no se cargan como tabla completa.
Este es un riesgo temporal aceptado por el usuario — **tarea de seguimiento obligatoria:**
migrar a filtro server-side en cuanto este fork reciba el sync del seed con la primitiva
propuesta.

### DoD de cierre de Fase 3
- [ ] Vista renderiza todos los espacios/variantes/imágenes/costos de una cotización real,
  con cifras idénticas al PDF del mismo proyecto.
- [ ] Responsive verificado a 320px/768px/1280px (reflow sin scroll horizontal en 320px).
- [ ] `espacio_variantes`/`items_variante`/`imagenes_espacio`/`clientes` confirmados como
  requests acotados por id (inspección de red), no tablas completas.
- [ ] Gates verdes, commit + push.

---

## FASE 4 — Integración de header (solo tras cierre de Fase 3)

### DAG
1. En `CotizadorPro.tsx`, junto al botón de exportar PDF: botón "Copiar enlace de
   propuesta". Si `activeCot.data.slug` no existe, llama `zap: 'generar_link_propuesta'`
   (mismo patrón `POST /api/engine` que `handleExportPdf`), guarda el slug devuelto, arma
   `${origin}/propuesta/${slug}`, copia al portapapeles + toast. Si ya existe, copia
   directo sin regenerar.
2. No tocar `handleExportPdf` ni el botón de PDF existente — quedan intactos como
   respaldo, uno junto al otro.

### DoD de cierre de Fase 4
- [ ] Botón visible solo cuando hay `activeCotId`.
- [ ] Primera pulsación genera y persiste el slug; pulsaciones siguientes no regeneran.
- [ ] Gates verdes, commit + push.

---

## FASE 5 — Verificación final (Sonnet, no delegada a Haiku)

- `npm run agnostic:compile` sin diff pendiente.
- `npm run validate:encoding` + validador de zaps en verde.
- Prueba end-to-end real: cotizador → botón → abrir el link en pestaña privada (sin
  sesión) → cifras idénticas al PDF del mismo proyecto.
- Prueba de responsive real a 320px/768px/1280px.
- Inspección de red confirmando el alcance de datos documentado en la Fase 3.

## Matriz de verificación
| # | Check | Comando/acción | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | Schema `slug` presente | `agno` dry-run + compile | campo nuevo, tipos regenerados | | |
| V2 | Zap idempotente | generar link 2 veces sobre el mismo proyecto | mismo slug ambas veces | | |
| V3 | Ruta pública responde | `GET /propuesta/<slug>` sin sesión | 200, vista completa | | |
| V4 | Paridad de cifras | comparar total de la vista vs. PDF del mismo proyecto | idéntico | | |
| V5 | Acotamiento de datos | inspección de red en la ruta pública | solo `proyectos` completo (aceptado); resto acotado por id | | |
| V6 | Responsive | 320/768/1280px | sin scroll horizontal, sin overlap | | |
| V7 | PDF intacto | exportar PDF de una cotización tras el cambio | idéntico a antes | | |
| V8 | Gates | `validate:encoding`, `validate:zaps`, `agnostic:compile` | verdes | | |

## Handoff
Fase 1 (este documento) → Fase 2 (Haiku, dry-run, gate humano antes de escribir) → Fase 3
(Haiku, UI) → Fase 4 (Haiku, header) → Fase 5 (Sonnet, verificación real, no delegada).
Cada fase cierra con commit + push en `goal/cotizador-vista-deluxe`, per
`storage/AGENTS.md`.
