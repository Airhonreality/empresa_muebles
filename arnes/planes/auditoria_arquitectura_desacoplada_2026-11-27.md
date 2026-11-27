# Auditoría de arquitectura desacoplada del ERP — 2026-11-27

**Origen:** subagente de solo lectura, lanzado por el Supervisor junto con el trabajo de t-200.
**Alcance:** `app/erp/`, `lib/`, `components/veta/`. Lentes: hardcode, desacoplamiento y diseño axiomático (Suh).
**Estado:** informe de hallazgos. No registra tareas por sí mismo: cada recomendación debe abrirse como tarea en `arnes/tareas/` antes de ejecutarse.
**Verificación:** no se corrieron `tsc`, `eslint` ni tests sobre el repo completo. Es lectura con grep y lectura puntual. Ver la sección final.

---

## Resumen ejecutivo

- Dos hardcodes de riesgo alto: los datos del emisor (NIT, cuenta bancaria) escritos en el código de contratos y cobros, y una segunda matriz de transiciones de estado en `comercial/page.tsx` que compite con el parámetro `transiciones_proyecto`.
- El precio de fallback `130000` aparece 13 veces, y hay 29 funciones de formato de moneda duplicadas.
- El cotizador (`[proyectoId]/page.tsx`, 3560 líneas, 62 `useState`) mezcla UI, cálculo de tarifas y formularios. `image-picker.tsx` mezcla ingesta, compresión, R2 y presentación, y lo usan 18 archivos.
- El patrón declarativo de campos (`EntityFields`) respeta AGENTS.md porque su vocabulario está cerrado en tres tipos. Conviene mantenerlo así.
- No hay cruces de imports entre `(datastore)` y `(modern)`, y `app/(publico)` no importa el store real. Son puntos a favor.

## Hallazgos de hardcode (priorizados por impacto)

| # | Archivo:línea | Hardcodeado | Debería venir de | Esfuerzo | Riesgo |
|---|---|---|---|---|---|
| 1 | `app/erp/(modern)/cotizador/[proyectoId]/cuenta-cobro/page.tsx:15-26` | Objeto `EMISOR`: NIT, cédula del representante, teléfono, cuenta bancaria | Configuración del negocio (parámetros o un módulo de config único) | S | Alto |
| 2 | Mismos datos del emisor en `cotizador/[proyectoId]/contrato/page.tsx:308-312, 693-694`, `lib/pdf/cotizacion.ts:557, 619`, `app/(publico)/propuesta/[proyectoId]/PropuestaPrintDocument.tsx:879-880`, `components/veta/app-shell.tsx:241, 245`, `lib/seo/jsonld.ts:97` | Mismo dato en 8 o más sitios | Una sola fuente | S | Alto |
| 3 | `app/erp/(datastore)/comercial/page.tsx:33-41` (`ACCIONES_POR_ESTADO`) y `:17-23` (`MACRO_FASE_POR_ESTADO`) | Segunda matriz de transiciones, distinta de `lib/data/transiciones-proyecto.ts:7-18` y del parámetro | Solo `parametros.transicionesProyecto()` | M | Alto |
| 4 | `130000` como fallback: `app/(publico)/layout.tsx:5,10`, `conocenos/page.tsx:12,17`, `page.tsx:133`, `como-trabajamos/page.tsx:11,16`, `components/veta/asesoria-boton.tsx:23,29,30`, `components/veta/espacio-landing.tsx:119` | Precio de asesoría 3D (13 ocurrencias) | Parámetro, sin fallback silencioso | S | Medio |
| 5 | `cotizador/[proyectoId]/page.tsx:142-157` (`ESTADO_LABELS_HEADER`), `:1107` (`['activa','enviada','en_contrato']`), `:83` (`HORAS_POR_JORNADA = 8`) | Etiquetas de estado, permiso de edición por estado, jornada laboral | Módulo de dominio de estados y parámetros | M | Medio |
| 6 | `proyectos/[proyectoId]/page.tsx:94, 736` | Listas de estados con semántica de negocio | Mismo módulo de dominio | S | Medio |
| 7 | `garantia/page.tsx:9-11`; `taller/page.tsx:17, 43, 79` | Estados y etiquetas de garantía repetidos | Un solo catálogo de estados | S | Medio |
| 8 | `proyectos/[proyectoId]/cronograma/page.tsx:248` | Etapas `['aprobacion','compras','ensamblaje','instalacion']` | Constante de dominio compartida | S | Medio |
| 9 | `contrato/page.tsx:85` (`MESES`) | Meses en español escritos a mano | `Intl` o constante compartida | S | Bajo |
| 10 | `portafolio/nuevo/page.tsx:16` y `proyectos/[proyectoId]/portafolio/page.tsx:14` | `TIPOS_PROYECTO` duplicado | Una constante | S | Bajo |
| 11 | 27 usos de `r2Prefix="..."` (ej. `producto-form-modal.tsx:355, 365`, `acabado-picker.tsx:286`, `garantia/page.tsx:187`) | Prefijos de almacenamiento en la UI | Lo define el caso de uso en lib, no la pantalla | S | Bajo |
| 12 | 29 definiciones de `formatCOP`/`fmtCOP`/`formatearPrecio`/`formatCurrency` (ej. `lib/data/presentacion.ts:31`, `components/cotizador/ItemRow.tsx:12`) | Duplicación, aunque `lib/utils/format.ts` existe y lo usan 12 archivos | `lib/utils/format.ts` | S | Bajo |
| 13 | 13 pantallas con arrays de estado literales | Listas de negocio en componentes | Dominio compartido | M (en conjunto) | Medio |

## Hallazgos de desacoplamiento y axiomas

- **Cotizador como God-page.** `app/erp/(modern)/cotizador/[proyectoId]/page.tsx` tiene 3560 líneas. `CotizadorPageInner` (líneas 173 a 1065) concentra estado de formularios y render. Además contiene cálculo de negocio: `derivarTarifas` (:105), `buildJornadasMap` (:117), `obtenerParametrosJornadas` (:125). Viola el Axioma 1: un cambio en la tarifa de mano de obra obliga a tocar la pantalla. Los formularios `FormArtefacto` (:3224), `FormArtefactoEdicion` (:3340) y `FormDetallesEspacio` (:3435) viven en el mismo archivo.
- **`components/veta/image-picker.tsx` (406 líneas).** Mezcla ingesta (:161, :244, :253), compresión con canvas (:29, :59-61), subida a R2 (:166), clonación desde URL (:141) y presentación. Importa `lib/r2/upload` y `lib/r2/sanitize` directamente (:4-5). Lo usan 18 archivos. Ya está cubierto por t-200.
- **Modales de negocio dentro de `components/veta/`.** 31 archivos importan `lib/data`, `lib/db` o acciones (conteo grep). Ejemplos: `editar-proyecto-modal.tsx:6`, `reportar-garantia-modal.tsx:9`, `proyecto-rapido-modal.tsx:7`. `components/veta` debería ser primitivas de presentación, según AGENTS.md. Además hay 10 archivos que usan `useDataStore` directamente.
- **Orquestación en el cliente.** `components/veta/PlantillaEditorModal.tsx` (645 líneas) hace 9 llamadas de servidor en secuencia (:132, :272, :285, :287, :306, :313, :326). Crea plantilla, grupos e ítems uno por uno desde el cliente, sin transacción. Riesgo de estado parcial.
- **Dos paradigmas de datos conviven.** `(datastore)` tiene 26 archivos con `useDataStore`; `(modern)` tiene 2. Las decisiones vigentes ya fijan TanStack Query para el cotizador, así que la migración está pendiente y no es un error nuevo.
- **Lógica de dominio duplicada entre adaptadores.** La lectura de `transiciones_proyecto` aparece en `lib/data/mock-store.ts:208-210, 769` y en `lib/data/drizzle-impl.ts:499-500`. Un cambio de regla hay que hacerlo dos veces.
- **Listas universales duplicadas.** `lib/data/contrato-items.ts:66` (`CAMPOS_UNIVERSALES`) y `lib/propuesta/comparar-variantes.ts:234` (mismo nombre, mismo propósito).
- **Overlays de modal hechos a mano.** 16 archivos usan `fixed inset-0` directamente, en lugar de un shell común.
- **Positivo.** No hay imports relativos cruzados entre `(datastore)` y `(modern)`. `app/(publico)` no importa `useDataStore` ni `getDataStore`.

## Patrón tipo→input: nombre y veredicto frente a AGENTS.md

- **Dónde está.** `components/veta/entity-fields.tsx:34` define `EntityFieldSpec<T> = Text | Money | Number`. El despachador `EntityFields` (:46-80) mapea `kind` a `InputField`, `MoneyInput` o `NumberInput`. Las especificaciones concretas están en `components/veta/proveedor-form-modal.tsx:70-101`, `components/veta/producto-form-modal.tsx:68-79`, `lib/forms/acabado-form-spec.ts:14`, `lib/forms/cliente-form-spec.ts:37` y `lib/forms/ficha-tecnica-form-spec.ts`.
- **Patrones relacionados.** Hay 4 tablas con columnas declarativas (`key`/`label`): `compras/page.tsx:208`, `pedidos-web/page.tsx:140`, `proveedores/page.tsx:183` y `finanzas/page.tsx:221`. No verificado si comparten un componente.
- **Nombre técnico.** Especificación declarativa de campos (*field descriptors*) con despacho cerrado por tipo, es decir, un *widget map* fijo. La variante genérica que AGENTS.md prohíbe sería *schema-driven UI* o *server-driven UI*, como react-jsonschema-form (RJSF) o formularios generados desde JSON Schema o desde la base. Referencias reconocibles de la variante acotada: `Form.Item` de Ant Design y `<Field component>` de Formik.
- **Veredicto.** Respeta AGENTS.md mientras se cumplan tres condiciones: el vocabulario de `kind` se mantiene cerrado (hoy 3), las especificaciones son código TypeScript y no datos leídos de la base, y no se agregan tipos de forma especulativa. Cumple Axioma 1 (agregar un campo no toca el renderizador) y Axioma 2 (poca información por especificación). Recomendación: conservarlo como la versión acotada, no convertirlo en motor.
- **Lo que no hay que aceptar.** Un `kind: 'json'`, un `kind` resuelto desde la base, o un registro abierto de widgets.

**Nota del Supervisor:** t-200 usa este mismo criterio. Es un mapa fijo de cuatro tipos de campo (texto, selección, booleano; `numero` queda fuera hasta que un contexto lo necesite), declarado por el contexto, sin motor genérico. Hay que confirmar con el Supervisor que esto cabe en la prohibición de AGENTS.md antes de P4.

## Recomendaciones priorizadas (tareas acotadas para el ledger)

1. **Centralizar el emisor.** Una sola fuente para NIT, representante, teléfono y cuenta bancaria. Reemplazar los 8 sitios. Esfuerzo S, riesgo alto. Requiere checkpoint del Supervisor porque toca documentos contractuales.
2. **Eliminar la matriz duplicada de `comercial`.** Quitar `ACCIONES_POR_ESTADO` y `MACRO_FASE_POR_ESTADO` y leer solo el parámetro. Mover la matriz de macro-fases a `lib/data/transiciones-proyecto.ts`. Esfuerzo M, riesgo alto.
3. **Quitar el fallback `130000`.** Un único helper de precio de asesoría con error explícito. Esfuerzo S, riesgo medio.
4. **Módulo de dominio de estados.** Un archivo con etiquetas, transiciones permitidas y gates por estado, usado en cotizador, proyectos, garantía y taller. Esfuerzo M, riesgo medio.
5. **Extraer cálculo del cotizador.** Mover `derivarTarifas`, `buildJornadasMap` y `obtenerParametrosJornadas` a `lib/` como funciones puras con tests. Mover los formularios a archivos propios. Esfuerzo M, riesgo medio. Coordinar con la migración a TanStack Query.
6. **Partir `image-picker`.** Ya en curso con t-200 (capas 0–3). Esfuerzo M, riesgo medio.
7. **Mover la orquestación de `PlantillaEditorModal`** a una acción de servidor transaccional de una sola llamada. Esfuerzo M, riesgo medio.
8. **Unificar formateadores** en `lib/utils/format.ts` (29 definiciones). Esfuerzo S, riesgo bajo.
9. **Constantes de dominio pequeñas.** `TIPOS_PROYECTO`, `MESES`, etapas del cronograma y prefijos R2. Esfuerzo S, riesgo bajo.
10. **Mover modales de negocio** fuera de `components/veta/` y crear un shell de modal común. Esfuerzo M, riesgo bajo.

## Qué NO se verificó

- No se ejecutaron `tsc`, `eslint`, tests ni `next build` como parte de la auditoría.
- No se revisaron los 54 usos de `as const` en 40 archivos, ni las listas de `(datastore)`/`(modern)` archivo por archivo.
- No se confirmó si los valores de estado, emisor o tarifas existen como parámetros en la base. Solo se verificó que el código los escribe a mano.
- No se revisó el ledger ni las tareas registradas.
- No se verificó si las 4 tablas con columnas declarativas comparten un componente común.
- No se revisó en profundidad `lib/data/snapshot-tables.ts` ni la compresión en `lib/r2/`.
- Los conteos de `components/veta` (31 archivos) y `fixed inset-0` (16 archivos) son de grep. Pueden incluir comentarios o falsos positivos.
- El conteo de 29 formateadores es aproximado. Incluye un `formatCurrency` en `components/veta/finanzas/movimiento-libro-card.tsx:27` que podría tener otra firma.
