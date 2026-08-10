# Registro de hallazgos del prototipo F10 (PoC 4)

**Contrato vivo** · plan_f10.md §3 · **Fecha:** 2026-08-08 · **Fase:** F10 · **Responsable:** Supervisor (aprueba los POC) + Orquestador (actualiza REGISTRO/glosario/disenios)

---

## POC-01 — Rediseño del kanban comercial (P-01)

**Severidad:** alto · **Pantalla:** P-01 Kanban Comercial · **Flujo:** revisión live del prototipo por el Supervisor (2026-08-08) sobre el kanban con 8 columnas legacy

### Hallazgo 1: Falta estado intermedio entre Cotización Enviada y En Contrato

- **Diseño original:** `disenio_p01_kanban_comercial.md` §2 — columnas `enviada → en_contrato`
- **Realidad encontrada:** entre enviar una cotización y generar un contrato, el comercial y el cliente mantienen reuniones/negociaciones. No existe columna para ese estado pre-contrato.
- **Tipo de mutación:** `logica_negocio` + `schema`
- **Decisión:** agregar estado `negociacion` (label: "En Negociación") en la máquina kanban. Transiciones: `enviada → negociacion → en_contrato`; con retroceso `negociacion → enviada` para re-cotizar y `negociacion → perdida`.
- **Artefactos modificados:**
  - `lib/data/fixtures.ts` — `parametros.transiciones_proyecto` (nuevas transiciones); `PROYECTOS` (fixture proj09 en estado `negociacion`)
  - `app/erp/comercial/page.tsx` — columna kanban `negociacion`
  - `arnes/nucleo/glosario_h07.md` B.0 — label "En Negociación"
  - `arnes/nucleo/REGISTRO_DE_ENTIDADES.md` — marcado `[POC-01]` en `proyectos` (sin DDL, acumulado para F10-E)
  - `arnes/lineas/ola7/pantallas/disenio_p01_kanban_comercial.md` — nuevo estado + transiciones

### Hallazgo 2: Columnas Entregado / Perdida / Cancelada generan ruido en el kanban comercial

- **Diseño original:** `disenio_p01_kanban_comercial.md` §2 — 8 columnas incluyendo `entregado`, `perdida`, `cancelada` como columnas kanban
- **Realidad encontrada:** al comercial no le interesa ver estas columnas. Perdida y cancelada son terminales que deben ir a un bucket común ("Archivo"). Entregado es un resultado de producción, no una columna del kanban comercial. El comercial sí necesita ver sub-estados de producción relevantes (verificación de garantía que hace el gate él mismo, instalación, posible garantía) + lista de proyectos vendidos — pero esto es un alcance pendiente, no un bug.
- **Tipo de mutación:** `solo_ui` (columnas kanban) + `gate` (`transiciones_proyecto` — validación de transiciones desde `produccion` a entregado/cancelada ahora no se muestran como botones en el kanban)
- **Decisión:** eliminar `entregado`, `perdida`, `cancelada` como columnas individuales del kanban. Agregar columna **Archivo** que agrega `perdida + cancelada` (read-only, sin transiciones). Las transiciones desde `produccion` a `entregado`/`cancelada` permanecen en el parametro mock pero no son accionables desde el kanban comercial (la columna Producción es `editable: false`).
- **Artefactos modificados:**
  - `app/erp/comercial/page.tsx` — `COLUMNAS_KANBAN` con columna Archivo agregada, sin entregado/perdida/cancelada
  - `arnes/lineas/ola7/pantallas/disenio_p01_kanban_comercial.md` — actualizado

### Hallazgo 3: No mostrar IDs internos en UI

- **Diseño original:** `disenio_p01_kanban_comercial.md` §5.3 — la card kanban mostraba el ID en el panel expandido
- **Realidad encontrada:** los IDs de base de datos no son relevantes para humanos y no deben aparecer en la UI salvo para depuración técnica
- **Tipo de mutación:** `solo_ui`
- **Decisión:** remover el ID del panel expandido de `ProjectCard`. Anotar como principio de diseño en el proceso: no mostrar IDs internos en ninguna UI salvo que sea estrictamente necesario.
- **Artefactos modificados:**
  - `app/erp/comercial/page.tsx` — removida línea `<p>ID: {proyecto.id.slice(0, 12)}</p>`
  - `arnes/lineas/ola7/pantallas/disenio_p01_kanban_comercial.md` — notado en criterios

### Hallazgo 4 (pendiente — no implementado en B1): Visibilidad de producción para el comercial

- **Diseño original:** el comercial solo ve el kanban con estado `produccion`
- **Realidad encontrada:** el comercial necesita ver sub-estados de producción que le competen (verificación de garantía que él mismo gatea, instalación, garantía activa) + una lista de sus proyectos vendidos
- **Tipo de mutación:** `logica_negocio` (alcance de pantalla / gate)
- **Decisión:** pendiente de diseño. Se anota como hallazgo abierto para bloques posteriores (B2 cronograma/gates o B4 taller/calidad). No bloquea B1.
- **Artefactos modificados:** ninguno por ahora (nota en este registro)

---

## POC-09 — Artefacto del espacio + Ficha de catálogo

**Severidad:** medio · **Pantalla:** P-04 Cotizador / catálogo · **Flujo:** revisión del prototipo (2026-08-09)

### Hallazgo: `espacios_artefactos` implementado en mock; `productos_atributos` nunca materializada

- **Realidad encontrada:** `espacios_artefactos` (INSTANCIA) ya existe en `schema.ts:191` desde E2 (2026-08-06) y se implementó en el prototipo mock (interfaz `EspacioArtefacto` en `contracts.ts`, fixtures, Collapse "Artefactos del espacio" con crear/editar). En cambio, la **ficha técnica del catálogo (CLASE)** decidida en `plan_t-075.md` (#2: ficha dinámica por tipo de producto, 1:1 con `productos_catalogo`) nunca se materializó en schema, REGISTRO §2 ni contratos TS.
- **Tipo de mutación:** `schema` (clase) — `solo_ui` (instancia ya implementada)
- **Decisión:** la instancia queda como está. La clase (ficha dinámica) se delega a un mini-diámetro propio (diseño axiomático FR/DP, campos dinámicos según tipo, alineación con REGISTRO §2). Sin duplicidad: instancia ≠ clase. No bloquea B1.
- **Artefactos modificados:** `lib/data/contracts.ts`, `lib/data/mock-store.ts`, `lib/data/fixtures.ts`, `app/erp/cotizador/[proyectoId]/page.tsx`, `arnes/nucleo/REGISTRO_DE_ENTIDADES.md` (§3), `arnes/nucleo/glosario_h07.md` (§A), `disenio_p04_cotizador.md` (12 CollapseStrips, entidad consumida §1, label H07 §3)

---

## POC-10 — Bugs de interactividad del cotizador/kanban (compilado B1)

**Severidad:** alto · **Pantalla:** P-04 Cotizador, P-01 Kanban, P-02 Nueva Cotización · **Flujo:** uso real del prototipo (2026-08-09). Todos son fallos de la capa técnica runtime M-06 L1 que NO estaba validada — consolidan la entrada del diamante técnico M-07.

### Hallazgo 1: Inputs de jornadas sin validación de formato

- **Realidad encontrada:** los inputs de jornadas (`dev`/`ens`/`inst` en `EspacioCard`) aceptan cualquier string; `parseFloat` deriva en `NaN` silencioso que inyecta `NaN` en totales.
- **Tipo de mutación:** `solo_ui` (contrato de codificación)
- **Decisión:** validar con regex `/^[0-9]*\.?[0-9]*$/` en el handler de cambio; cosificar en M-07 (patrón NumberInput validado).

### Hallazgo 2: `espaciosBase` no reactivo (store mutable)

- **Realidad encontrada:** `store.espacios` es un array mutable; el `useMemo` con dep `[proyecto, trigger, store.espacios]` no se recalcula porque la referencia `store.espacios` nunca cambia. El costo de ensamblaje/ítems no refresca sin `trigger` manual.
- **Tipo de mutación:** `solo_ui` (contrato de reactividad)
- **Decisión:** el data layer mock DEBE ser reactivo (suscripción/emit en cada mutación) o las pantallas forzar `trigger` en cada acción. Regla cosificada en M-07.

### Hallazgo 3: "Deshacer" no aparece — historial fuera de `columnData`

- **Realidad encontrada:** `columnData` (kanban) depende de `[proyectos, trigger]` pero no re-lee `historialEstado`; el botón "Deshacer" de `ProjectCard` no se muestra tras un cambio de estado.
- **Tipo de mutación:** `solo_ui`
- **Decisión:** incluir `historial` en las dependencias del memo o leer historial en el render de `ProjectCard` (ya lee el store directamente — hizo falta `trigger` en el card).

### Hallazgo 4: `parametrosJornadas` memoizado con dep `[store]` inmutable

- **Realidad encontrada:** `obtenerParametrosJornadas(store)` y `derivarTarifas(store)` en `useMemo([store])` no reaccionan a cambios en `store.parametros.actualizar()` porque `store` es referencia estable.
- **Tipo de mutación:** `solo_ui` (contrato de reactividad)
- **Decisión:** hacer el memo dependiente del valor computado (p.ej. `store.parametros.listar()`) o del `trigger`; regla en M-07.

### Hallazgo 5: `/erp/cotizador/new` sin validación de nombre obligatorio

- **Realidad encontrada:** `handleSubmit` hace `return` silencioso si el nombre está vacío, sin feedback al usuario ni estado de error.
- **Tipo de mutación:** `solo_ui`
- **Decisión:** validar con mensaje de error visible (patrón InputField con `error`); volcar en M-07.

### Hallazgo 6: `store.proyectos.crear` no crea espacio inicial con jornadas default

- **Realidad encontrada:** al crear un proyecto nuevo no existe ningún `espacio_variante`, así que el cotizador abre vacío y el usuario tiene que crear el primer espacio a mano.
- **Tipo de mutación:** `logica_negocio` (comportamiento esperado del mock store)
- **Decisión:** `proyectos.crear` crea un espacio inicial (`nombreEspacio` por tipo de proyecto) con jornadas `'0'`; o la pantalla `/new` lo crea explícitamente. Definir en el diseño P-02.

### Hallazgo 7: `ContratoModal.valorTotal` solo suma ítems (no incluye costo MO)

- **Realidad encontrada:** `calcularValorTotal` en `ContratoModal.tsx` suma solo `totalLinea` de ítems; el costo de mano de obra calculado en el cotizador (jornadas × tarifas) no se arrastra al contrato.
- **Tipo de mutación:** `logica_negocio` (gap de consistencia del valor contractual)
- **Decisión:** pasar el componente MO desde el cotizador al modal (o recalcular con `calcularCostoTotal`) para que `valorTotal` del contrato refleje el total de la cotización. Anotar en M-07 / diseño P-05.

---

## POC-11 — Adelanto de F11 (`app/erp/finanzas`) sin plan aprobado

**Severidad:** medio · **Flujo:** hallazgo de auditoría de proceso (2026-08-09)

### Hallazgo: pantalla y módulo finanzas construidos fuera del bloque B1 de F10

- **Realidad encontrada:** `app/erp/finanzas/page.tsx`, `app/erp/finanzas/parametros/page.tsx` y `lib/modules/finanzas/` (fórmulas `calcularCostoEnsamblaje`, `PARAMETROS_DEFAULT`) existen en working tree sin `plan_f11.md` aprobado ni tarea en ledger — son de F11 (panel de parametrización), fuera del alcance del bloque 1 de `plan_f10.md` §2.
- **Tipo de mutación:** `solo_ui` (adelanto de pantalla sin plan)
- **Decisión (2026-08-09):** **conservar como borrador en working tree** — el módulo de finanzas es REQUERIDO ya por B1 (P-04 calcula tarifas MO con `lib/modules/finanzas/`). Se documenta `[POC-11]` y se formaliza `plan_f11.md` cuando se abra F11. No se elimina código.
- **Artefactos modificados:** `app/erp/finanzas/**`, `lib/modules/finanzas/**` (ninguno — se conservan), `estado_ola7.md` (nota de F11 adelantada)

---

## POC-12 — "Producto fijo" NO es del flujo comercial; pantalla D-Desarrollo (P-27)

**Severidad:** alto · **Pantalla:** P-01 Kanban, P-02 Nueva Cotización, P-04 Cotizador · **Flujo:** auditoría aud3 (2026-08-09) — revisión campo-por-campo del cotizador por el Supervisor

### Hallazgo: el comercial no crea productos fijos

- **Diseño original:** `disenio_p02_nueva_cotizacion.md` ofrece `tipo_proyecto` con opción `producto_fijo`; `app/erp/cotizador/new/page.tsx` expone radio "Producto Fijo"; P-04 ItemRow tiene `[Nuevo producto]` / "Anexar a catálogo" que crean `productos_catalogo` desde el cotizador.
- **Realidad encontrada:** crear un producto fijo es trabajo del área **diseño-desarrollo** (definir la CLASE: ficha comercial, precio, imagen, publicado_web), no del comercial. El comercial consume el catálogo, no lo crea.
- **Tipo de mutación:** `logica_negocio` (dueño del goal) + `solo_ui` (flujo comercial)
- **Decisión del Supervisor (2026-08-09, opción a):** crear la pantalla **P-27 "Catálogo de productos (D-Desarrollo)"** en el plan — es la dueña del goal "crear producto fijo". Retirar `producto_fijo` del flujo de creación comercial (kanban, nueva cotización) y de la creación inline de catálogo en P-04 (esa responsabilidad pasa a P-27 al estilo POC-09 clase↔instancia). Los productos creados en P-27 se consumen (no se crean) en P-04 vía SmartSearch.
- **Artefactos modificados:**
  - `arnes/lineas/ola7/pantallas/disenio_p27_catalogo_diseno_desarrollo.md` — NUEVO (diseño de la pantalla)
  - `app/erp/cotizador/new/page.tsx` — retirado radio `producto_fijo`; `tipoProyecto` queda `personalizado`
  - `arnes/lineas/ola7/pantallas/disenio_p01_kanban_comercial.md` — aclarado que el kanban consume catálogo, no lo crea
  - `arnes/lineas/ola7/pantallas/disenio_p02_nueva_cotizacion.md` — `producto_fijo` retirado de opciones de creación
  - `arnes/lineas/ola7/pantallas/disenio_p04_cotizador.md` — `[Nuevo producto]` y "Anexar a catálogo" redirigen a P-27 (no crear inline)
  - `arnes/lineas/ola7/tecnico/plan_f10.md` — P-27 añadida al bloque B1
  - `arnes/nucleo/REGISTRO_DE_ENTIDADES.md` — nota de terminología (enum `personalizado` vs diseño `proyecto_a_medida`), pendiente para migración

---

## POC-13 — Interactividad del cotizador y costeo híbrido (plan aprobado 2026-08-09)

**Severidad:** medio-alto · **Pantallas:** P-04 Cotizador, P-05 Contrato, P-01 Kanban, P-02 Nueva Cotización · **Flujo:** auditoría aud3 campo-por-campo + plan de fases aprobado por el Supervisor (semántica decidida: **tarifa horaria + jornadas por espacio**). Ejecutado el 2026-08-09.

### Hallazgo: el costeo "por tiempo" existía en el módulo pero no estaba conectado a la cotización ni al contrato

- **Realidad encontrada:** `lib/modules/finanzas` (POC-11) definía `ParametrosJornadas` y `PARAMETROS_DEFAULT` con tarifas en `'0'`; el cotizador derivaba tarifas desde parámetros del taller (arriendo mensual, factor logística) sin relación con el panel de finanzas, y `ContratoModal.calcularValorTotal` tenía la rama `por_tiempo` como `TODO` (POC-10#7: el MO no entraba al valor contractual).
- **Tipo de mutación:** `logica_negocio` (conexión runtime panel→cotizador→contrato) + `solo_ui` (pantalla técnica del espacio, hitos, kanban)
- **Decisión del Supervisor (2026-08-09):** implementar la capa `por_tiempo` con la semántica "tarifa horaria × jornadas por espacio". Una jornada = 8 horas-hombre. Las tarifas salen de las claves `valor_hora_*` que ya escribe el panel de finanzas.
- **Correcciones aplicadas:**
  1. `derivarTarifas` en `[proyectoId]/page.tsx` lee `parametros.valor_hora_{desarrollador,carpintero,auxiliar}` (COP/hora) × `HORAS_POR_JORNADA` (8) → tarifas COP/jornada por rol. Fixtures `par14-19`: `tipo_costo_default='por_tiempo'`, `valor_hora_*` (35k/30k/25k), `arriendo_taller_por_dia`, `dias_habiles_por_mes`.
  2. `ContratoModal` recibe prop `manoDeObra` y `calcularValorTotal` suma materiales + MO (se elimina el TODO). El MO por espacio se muestra como "Total MO (jornadas × tarifa)".
  3. Inputs de jornadas validados con regex `/^[0-9]*\.?[0-9]*$/` (cierra POC-10#1: sin `NaN` silencioso).
  4. **Hitos con autocalcule (P-05):** si el último hito es porcentaje y vale 0, se rellena con el restante para cerrar la suma a 100% (ej. 5×16% + 6º = 20% restante). Nota visible en UI.
  5. **Pantalla técnica del espacio:** nuevo `FormDetallesEspacio` expone `nombreEspacio`, `nombreVariante`, `descripción`, `descripciónAlternativa`, `activa`, `visiblePdf`, `colores`, `fotosEspacio`, `fotosDisenio`, `fotosReferencia` → nuevo método `espacios.actualizar` (contracts + mock-store + stub drizzle).
  6. **Artefactos:** se corrige el hallazgo preliminar de aud3 — el Collapse "Artefactos del espacio" SÍ se renderiza con crear/editar/validar operativos (POC-09). No se requirió código nuevo.
  7. **`HybridClientSelector`** en `/erp/cotizador/new` (combobox + crear on-the-fly → nuevo método `clientes.crear`), reemplaza el `<select>` (diseño P-02 §5.4).
  8. **Kanban:** botones de `ProjectCard` limitados a 1 avanzar (siguiente estado válido hacia adelante) / 1 retroceder (historial) / Archivar (`perdida`→`cancelada`), en vez de la matriz completa de transiciones. El botón header "+ Nuevo Proyecto" ya existía y funciona.
  9. **Scrollbars de marca (D4):** token set en `app/globals.css` (escala dorada, thumb sutil).
  10. **`retoma` documentada** en `disenio_p01` §2/§3 (era gap documental; el código ya estaba correcto).
- **Artefactos modificados:**
  - `lib/data/contracts.ts` (clientes.crear, espacios.actualizar), `lib/data/mock-store.ts`, `lib/data/drizzle-impl.ts`, `lib/data/fixtures.ts` (par14-19)
  - `app/erp/cotizador/[proyectoId]/page.tsx` (tarifas runtime, regex, detalles del espacio, MO al modal)
  - `app/erp/cotizador/ContratoModal.tsx` (manoDeObra + autocalcule de hitos)
  - `app/erp/cotizador/new/page.tsx` (HybridClientSelector)
  - `app/erp/comercial/page.tsx` (botones limitados)
  - `app/globals.css` (scrollbars)
  - `arnes/lineas/ola7/pantallas/disenio_p01_kanban_comercial.md` (estado `retoma`)

### Adenda — revisión del Supervisor tras checkpoint manual (2026-08-09)

Retroalimentación del Supervisor sobre el prototipo y correcciones aplicadas:

1. **Ítems que no aparecían al agregarlos** (P-04): el store mock no es reactivo (POC-10#2); `EspacioCard` mutaba `store.items`/`store.artefactos` sin refrescar el padre, así que la lista quedaba en el snapshot anterior. **Fix:** se cablea `onRefresh` tras crear/editar/anular ítems y guardar artefactos (crear y editar). Renombrar variante vía `FormDetallesEspacio` también refresca.
2. **Badges/parámetros internos en la UI del kanban:** se elimina la pill "Transiciones desde parametros.transiciones_proyecto (C3)" del header de P-01 (no es label de negocio; es ruido técnico).
3. **Botón "regresar" faltante en varios estados:** la matriz `parametros.transiciones_proyecto` y `ACCIONES_POR_ESTADO` omitían `negociacion → enviada` (re-cotizar, previsto en `disenio_p01` §2). **Fix:** se agrega `enviada` a las transiciones de `negociacion` en fixtures y ACCIONES; además el botón de regresar ahora usa la transición válida hacia atrás más próxima cuando no hay historial (antes solo aparecía con `ultimoHistorial`).
4. **Badges que salían del límite de la tarjeta:** el nombre del proyecto no truncaba y empujaba la fila de botones/badge fuera del slot de la columna `w-72`. **Fix:** `min-w-0 flex-1 truncate` en el título de `ProjectCard`.

---

## Verificación de integridad

- [x] POC-01 documenta todos los hallazgos encontrados (trace a pantalla, severity, mutation type)
- [x] POC-09/POC-10/POC-11/POC-13 registran los hallazgos de B1 con severidad, tipo de mutación y decisión
- [x] Los artefactos modificados están listados (pantalla, fixtures, contratos)
- [x] Las mutaciones de schema están marcadas `[POC-NN]` en REGISTRO — sin DDL ejecutado
- [x] Los hallazgos no reabren la banda F0–F9 ni el bucle de trazabilidad
- [x] Evidencia mecánica B1 (2026-08-09): `tsc --noEmit` 0 · `eslint .` 0 · `next build` 14/14 rutas (DATA_IMPL=mock)
- [x] Evidencia mecánica POC-13 (2026-08-09): `tsc --noEmit` 0 · `eslint .` 0 · `next build` 14/14 rutas (DATA_IMPL=mock)

---

---

## POC-14 — M-07 materializado: contrato de reactividad implementado

**Severidad:** alto · **Pantallas:** P-01 Kanban, P-04 Cotizador, P-05 Contrato, Finanzas/Parámetros · **Flujo:** el Supervisor reportó (2026-08-09) ~10 vueltas de debugging sin lograr que el cotizador dejara renombrar un espacio. Traza directa del código mostró que el flujo de guardado ya estaba bien cableado (campo, store, refresh) — el síntoma seguía siendo la causa raíz genérica de POC-10#2/#4 (store mutable sin reactividad), no un bug puntual del rename.

- **Realidad encontrada:** POC-10#2 y POC-10#4 ya habían decidido "el data layer mock DEBE ser reactivo... regla cosificada en M-07" (2026-08-09), pero `M-07` nunca se creó como archivo — la decisión quedó en prosa sin dónde aterrizar. Cada pantalla nueva de B1 reinventó su propio `trigger`/`onRefresh` manual, y sin un test de round-trip (exigido por `arnes/roles/qa.md` para tareas de tipo `datos`), no había forma mecánica de distinguir "el store está roto" de "la pantalla no se refrescó" de "estás probando contra un dev server viejo".
- **Tipo de mutación:** `logica_negocio` (contrato de reactividad) + `mutacion_arnes` (nuevo artefacto M-07)
- **Decisión:** materializar M-07 ahora, no aplazarlo de nuevo. Ver `m07_capa_reactividad.md` para el detalle completo.
- **Artefactos modificados:**
  - `arnes/lineas/ola7/tecnico/m07_capa_reactividad.md` — **nuevo.** El contrato + qué cambió + qué NO se hizo + regla para pantallas nuevas.
  - `lib/data/contracts.ts` — `DataStore` gana `subscribe`/`getVersion`.
  - `lib/data/mock-store.ts` — `notify()` en cada mutación de cada dominio.
  - `lib/data/drizzle-impl.ts` — stubs no-op de `subscribe`/`getVersion`.
  - `lib/data/index.ts` — nuevo hook `useDataStore()`.
  - `lib/data/mock-store.test.ts` — **nuevo.** 12 pruebas de round-trip, incluida la regresión exacta del rename de espacio.
  - `eslint.config.mjs` — `no-restricted-imports` bloquea `getDataStore` en `app/**`.
  - 6 pantallas migradas a `useDataStore()`: `comercial/page.tsx`, `cotizador/[proyectoId]/page.tsx`, `cotizador/new/page.tsx`, `cotizador/page.tsx`, `cotizador/ContratoModal.tsx`, `finanzas/parametros/page.tsx` — se elimina todo `trigger`/`setTrigger`/`onRefresh` manual.
  - `plan_f10.md` §1.2 — referencia al contrato M-07 para pantallas nuevas de B2 en adelante.
- **Verificación:** `tsc --noEmit` 0 · `eslint .` 0 · `DATA_IMPL=mock next build` 14/14 rutas · `npx tsx lib/data/mock-store.test.ts` 12/12 OK.

---

## POC-15 — Auditoría B1: duplicar variante, presupuesto adicional referencial, discoverability de fotos/helpers

**Severidad:** alto · **Pantalla:** P-04 Cotizador · **Flujo:** auditoría manual del Supervisor sobre el formulario de espacio y el cotizador (2026-08-09), 3 hallazgos + 1 encontrado durante la investigación.

### Hallazgo 1: sin opción para crear variante de espacio (vacía o clonada)

- **Realidad encontrada:** `disenio_p04_cotizador.md:252,254` especifica "duplicar" (header) y "add/dup/del/rename/reorder" (tabs de variantes); el legado (`destilacion_cotizador_contrato.md:53,157,229`) lo tenía funcionando. `lib/data/` no tenía ningún método de clonación — gap de implementación puro, no de diseño.
- **Bug destapado durante la investigación:** `materialesTotal`/`moDev`/`moEns`/`moInst` sumaban sobre TODAS las variantes de `espaciosBase`, sin filtrar por `activa`. `REGISTRO_DE_ENTIDADES.md:73` y `glosario_h07.md:47` confirman "variantes alternativas (una activa)" — sin este filtro, duplicar una variante para comparar precio habría duplicado el total real silenciosamente.
- **Decisión:** `espacios.duplicar(id, {vacio, nuevoNombreEspacio?})` (clona items+artefactos si no es vacío) + `espacios.marcarActiva(id)` (exclusividad por grupo, atómico en el store). Totales del cotizador y `ContratoModal` filtran ahora por variante activa del grupo.
- **Artefactos modificados:** `lib/data/{contracts,mock-store,drizzle-impl}.ts`, `app/erp/cotizador/[proyectoId]/page.tsx` (botón Duplicar + badges "N variantes"/"Marcar como activa" en `EspacioCard`).

### Hallazgo 2: artefactos sin precio/cantidad para "presupuesto adicional"

- **Realidad encontrada:** el precio NO va en `EspacioArtefacto` — violaría el axioma ya declarado en `logica_de_negocio.md:293-320` (independencia económica CLASE/INSTANCIA), confirmado por `REGISTRO_DE_ENTIDADES.md:52-53,75`. La feature real ("obra civil estimada vs. carpintería contratada") ya estaba especificada en detalle sobre `items_variante`: `disenio_p04_cotizador.md:277-296,323-346` (Collapse 11/12, `es_referencial`/`fuente_referencial`/`grupo_referencial`) — nunca implementada.
- **Decisión:** implementar exactamente lo ya diseñado, sin inventar. `ItemVariante` gana los 3 campos; checkbox "Referencial" + Fuente + Grupo en cada fila de ítem; sección "Presupuesto Adicional (Referenciales)" agrupada por `grupoReferencial` con total separado ("no incluido en contrato"); excluidos de `materialesTotal` y de `ContratoModal` (valor + objeto + especificaciones).
- **Bug destapado durante la implementación:** `ItemVariante.totalLinea` nunca se recalculaba en `items.crear`/`items.actualizar` — dependía de que el caller lo pasara, y ningún caller lo hacía. Todo ítem creado o editado después del seed de fixtures quedaba con total $0 en los Grand Totals, silenciosamente. Corregido: `totalLinea` ahora se deriva siempre en el store (`cantidad × precioUnitario`), no se acepta del caller.
- **Artefactos modificados:** `lib/data/contracts.ts` (`ItemVariante` + firmas `items.crear`/`actualizar`), `lib/data/mock-store.ts` (defaults + derivación de `totalLinea`), `lib/data/fixtures.ts` (10 items existentes + 1 nuevo item referencial de demo), `app/erp/cotizador/[proyectoId]/page.tsx`.

### Hallazgo 3: selector de imágenes pobre + campos sin ayuda

- **Realidad encontrada:** no había ningún primitivo de upload/dropzone en `components/veta/` (0 resultados); el diseño solo nombraba `SmartImageInput` (`disenio_p04_cotizador.md:258`) sin especificar mecánica. `glosario_h07.md` no tiene definiciones de negocio para `descripcionAlternativa`/`activa`/`visiblePdf` — no había fuente canónica que citar como tooltip.
- **Decisión:** nuevo primitivo D4 `components/veta/image-picker.tsx` (grid de miniaturas, arrastrar/pegar/URL en un solo control, 0 dependencias nuevas — `URL.createObjectURL` para archivos, consistente con que F10 sigue siendo mock sin storage real). Movido arriba en `FormDetallesEspacio`. Texto de ayuda **persistente** (no solo hover) bajo los 3 campos confusos — se optó por texto siempre visible en vez de tooltip-on-hover porque el problema de origen fue exactamente "un control escondido"; un hover oculto repite el mismo riesgo. Redacción del texto marcada como no-canónica (no hay fuente en `glosario_h07.md` de la que citar).
- **Artefactos modificados:** `components/veta/image-picker.tsx` (nuevo), `app/erp/cotizador/[proyectoId]/page.tsx` (`FormDetallesEspacio`).

### Verificación (los 3 hallazgos + el bug destapado)

- `npx tsc --noEmit` = 0 · `npx eslint .` = 0 · `DATA_IMPL=mock npx next build` = 14/14 rutas
- `npx tsx lib/data/mock-store.test.ts` = 17/17 OK (6 casos nuevos: duplicar vacío/clonado/grupo-nuevo, marcarActiva, round-trip de referenciales incl. derivación de `totalLinea`)

**Veredicto de paralelización (pregunta del Supervisor):** con esto cerrado, `lib/data/contracts.ts` queda estable para B2 (cronograma/gates), que no comparte superficie de contrato con `items_variante`/`espacios`. Ya es seguro lanzar un lote de sub-agentes para B2 en paralelo, siguiendo `checklist_progreso_pantallas.md` (round-trip test por dominio nuevo, no tocar `lib/data/{contracts,mock-store,index}.ts` desde dos lotes a la vez).

---

## POC-16 — Auditoría B1 (2ª pasada): jerarquía cognitiva espacio/variante, visibilidad, zonas referenciales, discoverability

**Severidad:** alto · **Pantalla:** P-04 Cotizador · **Flujo:** segunda auditoría manual del Supervisor sobre lo entregado en POC-15, con capturas de pantalla del prototipo real. 5 hallazgos.

### Hallazgo 1: la jerarquía espacio→variante no se entendía en la UI

- **Realidad encontrada:** una variante es un branch de un espacio (`REGISTRO_DE_ENTIDADES.md:73`, "variantes alternativas, una activa"), pero POC-15 la representaba como una tarjeta hermana más (con un badge "Activa · N variantes") — visualmente indistinguible de un espacio distinto. Sin diseño cognitivo de la jerarquía.
- **Decisión:** reestructurar `EspacioCard` en dos componentes: `EspacioGroup` (contenedor por `nombreEspacio`, header + tabs) y `VarianteContenido` (contenido de la variante seleccionada, sin borde propio). Las variantes son tabs reales dentro de la tarjeta del espacio — clic en una tab cambia qué variante se ve, con un punto verde marcando cuál es la activa y un banner "estás viendo una variante de comparación" cuando la tab abierta no es la activa. El total del header siempre refleja la variante activa, no la que se está mirando (evita que "espiar" una alternativa mueva números en otro lado de la pantalla).
- **Artefactos modificados:** `app/erp/cotizador/[proyectoId]/page.tsx` (split completo de `EspacioCard`; el render del padre ahora agrupa `espaciosBase` por `nombreEspacio` antes de mapear).

### Hallazgo 2: "Visible en PDF" — nombre, alcance y ergonomía

- **Decisión:** renombrado a `visibleEnPropuestaPublica` (afecta PDF + pantalla de propuesta pública, no solo PDF) en la capa mock (`lib/data/`). **No se tocó `lib/db/schema.ts`** (columna real `visible_pdf`) — es zona `datos`/F0 protegida por checkpoint de AGENTS.md; el rename ahí queda pendiente para la migración real (ya anticipado como mutación de schema por hallazgo en `plan_f10.md` §4). Movido de checkbox en el formulario a ícono de ojo en el header de `EspacioGroup`, junto al lápiz de renombrar y el ícono de duplicar.
- **Artefactos modificados:** `lib/data/contracts.ts`, `lib/data/mock-store.ts`, `lib/data/fixtures.ts`, `app/erp/cotizador/[proyectoId]/page.tsx`.

### Hallazgo 3: badge de "Referencial" muy grande, sin frontera visual con los ítems cotizados

- **Decisión:** los ítems referenciales ya no aparecen en la tabla "Ítems" — viven exclusivamente en su propia zona "Presupuesto Adicional (Referenciales)", separada por un borde punteado ámbar. Dentro de esa zona, un punto minimalista (no un `Badge`) marca cada fila — la zona ya está rotulada, repetir "Referencial" por ítem era redundante. Cada ítem tiene un ícono para moverse entre zonas (cotizado ↔ referencial) en vez del checkbox que antes convivía con cantidad/precio en cada fila.
- **Artefactos modificados:** `app/erp/cotizador/[proyectoId]/page.tsx` (`VarianteContenido`).

### Hallazgo 4: "Detalles del espacio" con "+" oculto y sin información relevante

- **Decisión:** el trigger de texto "+ Editar" se reemplazó por una fila-preview siempre visible: miniatura (primera foto disponible) + descripción + colores (si hay) + ícono de lápiz — mismo lenguaje de ícono que el resto de la pantalla, sin excavar para saber si vale la pena abrir el formulario.
- **Artefactos modificados:** `app/erp/cotizador/[proyectoId]/page.tsx` (`VarianteContenido`).

### Hallazgo 5: el campo "URL Foto" de artefactos no usaba el selector de imagen inteligente

- **Realidad encontrada:** `FormArtefacto`/`FormArtefactoEdicion` seguían con `<input type="text" placeholder="https://...">` mientras `FormDetallesEspacio` ya usaba `ImagePicker` (POC-15) — inconsistencia de componente para el mismo tipo de dato.
- **Decisión:** `ImagePicker` gana prop `multiple` (default `true`); `multiple={false}` reemplaza en vez de acumular y muestra una miniatura grande en vez de grilla — usado ahora en ambos formularios de artefacto. Regla cosificada en `checklist_progreso_pantallas.md` punto 11: todo input de imagen futuro (P-27 catálogo incluido) usa este componente, sin excepción.
- **Artefactos modificados:** `components/veta/image-picker.tsx`, `app/erp/cotizador/[proyectoId]/page.tsx`.

### Verificación

- `npx tsc --noEmit` = 0 · `npx eslint .` = 0 · `DATA_IMPL=mock npx next build` = 14/14 rutas · `npx tsx lib/data/mock-store.test.ts` = 17/17 OK (sin cambios de contrato en `lib/data/mock-store.ts` más allá del rename de `visibleEnPropuestaPublica`, ya cubierto por los tests existentes de `espacios.actualizar`/`duplicar`)

---

## POC-17 — Cierre de B2 Lotes A/B (F3 cronograma/gates): 7 pantallas + navegación conectada

**Severidad:** alto · **Pantallas:** P-06, P-07, P-08, P-09, P-10, P-11, P-12 · **Flujo:** Javier pegó dos reportes de agentes distintos (uno proponiendo rutas API reales, otro reportando B2-0 completo) y pidió lanzar sub-agentes Haiku para terminar B2 y dejar el sistema navegable. Se investigó el estado real (3 agentes de exploración) antes de ejecutar — ninguno de los dos reportes se tomó al pie de la letra.

- **Confirmado por investigación directa (no por los reportes):** B2-0 (capa de datos F3: `lib/data/contracts.ts` con 14 entidades, `lib/modules/f3/gates.ts`, fixtures) estaba completo y verificado — 44 tests (29 mock-store + 15 gates) ya pasaban antes de tocar código. Las pantallas (Lotes A/B/C) estaban en 0% real pese al reporte que sugería lo contrario — de ahí que Javier no viera navegación nueva.
- **Descartado:** la propuesta de rutas `/api/publico/*`/`/api/erp/*` con Drizzle real de uno de los reportes — viola `plan_f10.md:115` (ninguna conexión real durante F10) y `contracts.ts:3` (las pantallas nunca importan `lib/db/`). `lib/db/client.ts` es una conexión REAL a dev-local de Neon, no un stub — de haberse construido tal cual, habría tocado base de datos real. Archivado para F10-E.
- **Corrección aplicada a los dos lotes antes de ejecutar:** `disenio_f3_cronograma_gates.md` §6 "Comportamiento" describe llamadas `POST/PATCH /api/erp/...` — son de una versión del diseño anterior al pivote a F10-mock (2026-08-08). Se instruyó explícitamente a ambos agentes mapear cada acción a un método del store (`store.desfases.aplicar()`, `store.verificaciones.emitirVeredicto()`, etc.) en vez de rutas API — mismo tipo de error que el reporte descartado arriba.
- **Ejecución:** 2 sub-agentes Haiku en paralelo, archivos disjuntos por diseño de `plan_t-B2.md` (Lote A: `app/erp/proyectos/[proyectoId]/cronograma/`; Lote B: `app/erp/proyectos/[proyectoId]/{page,retoma,desarrollo}.tsx`, `app/erp/equipo/`, `app/erp/gates/`, `components/veta/erp-shell.tsx`). Ninguno tocó `lib/data/` — B2-0 ya exponía todos los métodos de store necesarios.
- **Labels:** se usaron los canónicos de `glosario_h07.md` ("Novedad crítica", no "Novedades de producción" que proponía sin respaldo uno de los reportes).
- **Hallazgos de consolidación (verificación propia post-lotes, no reportados por los agentes):**
  1. `components/veta/erp-shell.tsx` usaba `getDataStore()` directo — fuera del alcance del guante de eslint (`app/**`) porque vive en `components/`. Lote B lo corrigió a `useDataStore()` de oficio.
  2. 3 warnings de `react-hooks/exhaustive-deps` en la página de cronograma (memoizar sobre un arreglo que ya cambia cada render no memoiza nada) — corregido quitando el `useMemo` innecesario (arreglos pequeños de mock, no ameritan memoización).
  3. **Navegación desconectada pese a que las pantallas compilaban:** el hub (P-06) no enlazaba a `/cronograma` (la pantalla del otro lote); el kanban comercial (`/erp/comercial`) no tenía ningún link al hub — solo se llegaba vía `/erp/gates`, y solo para proyectos en etapa "desarrollo". Corregido: tercera tarjeta "Cronograma" en el hub, botón "Proyecto" en cada card del kanban, y "← Volver" en las 3 sub-páginas (retoma/desarrollo/cronograma, la última no lo tenía).
  4. Un reporte de build con error en `app/erp/cotizador/new/page.tsx` (Lote A) resultó ser una condición de carrera transitoria (build corrido mientras el otro lote aún escribía) — verificado limpio en la corrida de consolidación.
- **Fuera de alcance (decisión explícita, no pendiente):** Lote C (rediseño kanban P-01 a estados canónicos) — `disenio_p01_kanban_comercial.md` no tiene todavía las columnas/transiciones del rediseño; construirlo a ciegas arriesga rehacer una pantalla ya aprobada en B1/Auditorías 1-2. Espera a que Javier revise A+B primero.
- **Nada de esto está commiteado** — sigue en el working tree, a la espera de que Javier decida cuándo.

### Verificación

`npx tsc --noEmit` = 0 · `npx eslint .` = 0 errores, 0 warnings · `npx tsx lib/data/mock-store.test.ts` = 29/29 · `npx tsx lib/modules/f3/gates.test.ts` = 15/15 · `DATA_IMPL=mock npx next build` = 16/16 rutas (5 nuevas: `/erp/equipo`, `/erp/gates`, `/erp/proyectos/[proyectoId]`, `/erp/proyectos/[proyectoId]/cronograma`, `/erp/proyectos/[proyectoId]/desarrollo`, `/erp/proyectos/[proyectoId]/retoma`).

**Próximo POC:** reservado para Lote C (kanban P-01) o hallazgos de la revisión manual de Javier sobre B2.

---

## POC-18 — Cierre del lote F5/F6/F-02/F-03/F-07: 11 pantallas + auth real + tooling opencode/Zen

**Severidad:** alto · **Pantallas:** P-16 a P-23 (taller/calidad/instalación/entrega/garantía/finanzas), P-27 (catálogo), F-02 (tienda), F-03 (portafolio), F-07 (portal cliente), P-03 (modo solo-lectura del cotizador), F-08 (propuesta pública) · **Flujo:** Javier pidió paralelizar el siguiente lote de pantallas "listas para codificar" (14 reportadas). Investigación previa (igual que B2→B2-0) mostró que solo P-03 y F-08 estaban realmente listas; las otras 12 necesitaban una capa de datos previa (15 entidades nuevas) o, en el caso de F-07, un mecanismo de auth que no existía en el repo.

- **Decisión de arquitectura (Supervisor, 2026-08-09):** F-07 requiere sesión de cliente autenticado (`WHERE cliente_id = session.clienteId`). En vez de mockear o diferir, Javier instruyó construir auth real ahora con `iron-session` — la sesión es independiente del eje mock/Drizzle y sobrevive la migración F10-E sin reescribirse, a diferencia de los datos. Alcance: login email+documento contra `Cliente` existente (sin password, sin campos nuevos), `SESSION_SECRET` nuevo en `.env.local`, `lib/auth/session.ts` (`getSession`/`login`/`logout`/`requireSesionCliente`), guard server-side en cada página de `app/(publico)/cuenta/**`.
- **Cambio de tooling (instrucción explícita de Javier, 2026-08-09):** a partir de este lote, los sub-agentes se lanzan vía `opencode run` con modelos Zen/OpenRouter free (`arnes/MODELOS.md` §2.1), no con el Agent tool de Claude — Claude se estaba por quedar sin rate limit. Claude pasa a reservarse para revisar/verificar/corregir, no para generar el código de los lotes. 5 modelos usados, todos distintos entre sí (rotación respetada): `big-pickle` (F5), `deepseek-v4-flash-free` (P-27), `laguna-s-2.1-free` (F6), `mimo-v2.5-free` (F-07), `north-mini-code-free` → relanzado con `nemotron-3-ultra-free` (F-02/F-03, ver más abajo).
- **Ejecución:** P-03 y F-08 los hizo Claude directo (sin sub-agente, tarea chica). Datos previos (`lib/data/{contracts,mock-store,fixtures,drizzle-impl,index}.ts`, 21 entidades/extensiones nuevas + `lib/modules/f4f5f6/gates.ts` con 12 tests) los construyó un único agente serializado antes de repartir las pantallas, evitando choques de 4 lotes sobre los mismos archivos (mismo patrón que B2-0). Auth (F-07-0) se construyó en paralelo por ser un dominio (`lib/auth/`) sin intersección con `lib/data/`. Luego 5 lotes de UI en paralelo, archivos disjuntos, un solo dueño por archivo de nav compartido (`erp-shell.tsx` → lote F6; `app-shell.tsx` → lote F-02/F-03).
- **Bug de RSC resuelto en consolidación:** `lib/auth/session.ts` (server-only) importaba `lib/data/index.ts`, que también exporta el hook `useDataStore` — Next marcó todo el archivo como necesitado de `'use client'`, rompiendo el uso server-side. Corregido separando la factory pura `getDataStore()` a `lib/data/store.ts` (cero imports de React); `index.ts` la re-exporta y define `useDataStore()` aparte.
- **Fricción real en un lote (`laguna-s-2.1-free`, F6 finanzas):** el modelo más débil de la rotación — falló un `Write` por JSON mal formado en un archivo grande (se recuperó con heredoc bash), un typo de variable, una prop inválida en `Badge`, y varios `react-hooks/exhaustive-deps` que resolvió quitando `useMemo` de derivaciones baratas (mismo patrón ya establecido en `cronograma/page.tsx`). Verificó limpio pese a la fricción. Reportó honestamente (en vez de inventar) que `store.cuentasCobroProveedor.anular()` no existía y no tocó `lib/data/` para no pisar a los demás lotes — deshabilitó el botón "Anular" y dejó el gap documentado.
- **Lote F-02/F-03 (`north-mini-code-free`) se colgó, no falló:** quedó ~2h40min sin producir ningún output real (solo el banner de arranque), con CPU casi en cero — proceso vivo pero no avanzando, no una corrida lenta. Se mató el proceso (`kill`) y se relanzó el mismo prompt con `nemotron-3-ultra-free`, que lo completó limpio en la siguiente corrida (4 páginas, nav actualizada, 0 gaps de `lib/data/`, build 27/27).
- **Hallazgos de consolidación (verificación propia post-lotes, no reportados por los agentes):**
  1. `store.cuentasCobroProveedor.anular()` — gap real (el tipo `EstadoCuentaCobro` ya incluía `'anulada'`, el mutator nunca se escribió). Agregado por Claude en consolidación (`mock-store.ts`, `contracts.ts`, `drizzle-impl.ts` stub) siguiendo R18 del diseño P-23 (anular válido desde cualquier estado, requiere modal de confirmación) — se cableó el botón + modal en `app/erp/finanzas/cuentas-cobro/page.tsx`, que el lote F6 había dejado sin UI.
  2. Labels de nav sin tilde (`Garantia`, `Catalogo` en `erp-shell.tsx`) — corregidos a `Garantía`/`Catálogo` (canónicos de `glosario_h07.md`). El supuesto typo `/erp/talleral` reportado en el resumen en prosa de un agente resultó ser un error de redacción del propio agente, no del código — el href real siempre fue `/erp/taller`, verificado leyendo el archivo directamente antes de tocar nada.
  3. **Navegación desconectada, otra vez, en el mismo punto que B2 (P-06/hub):** `app/erp/proyectos/[proyectoId]/page.tsx` (hub del proyecto) enlazaba a Retoma/Esquema/Cronograma pero no a las 3 pantallas nuevas del proyecto (Calidad, Instalación, Entrega) — corregido agregando sus 3 tarjetas al grid de acciones, mismo patrón visual. `/erp/garantia` (P-20) y `/erp/catalogo` (P-27) sí estaban en `ERP_NAV`, alcanzables.
  4. `/cuenta` (portal cliente, F-07) no tenía ningún punto de entrada en `app-shell.tsx` — como estaba anticipado (se le dijo explícitamente al lote F-02/F-03 que no lo tocara), lo cableó Claude en consolidación: `{ href: '/cuenta', label: 'Mi cuenta', desc: 'Portal cliente' }`.
  5. `/cuenta/garantia` (F-07) era una ruta huérfana — solo enlazaba *hacia* `/cuenta` (botón "← Volver"), nada enlazaba *hacia* ella desde `/cuenta`. Corregido agregando un botón "Garantía" en el header de `mis-proyectos-lista.tsx`.
  6. Un error real de tipos preexistente en `app/erp/comercial/page.tsx` (modificado fuera de este lote, por el usuario o un linter, entre turnos) — `ProjectCard` leía `store.proyectos.historialEstado(...)` sin recibir `store` como prop (solo `espaciosTodos`/`itemsTodos`). Corregido agregando `store` al tipo de props y al call site; no se tocó ninguna otra lógica del archivo.
- **Corrección sobre `descripcionAlternativa` (falsa alarma, no es una regresión):** durante la construcción de F-08 se encontró que `EspacioVariante.descripcionAlternativa` no existía y se usó `esp.descripcion` en su lugar. En consolidación se verificó la causa: **no es un bug** — es una limpieza deliberada y ya aprobada por el Supervisor en la 3ª pasada de Auditoría B1 (2026-08-09, ver `tecnico/checklist_requisitos_b1_cierre.md` ítems 1.4/8.1, ambos "✅ Cumplido"): el campo se eliminó a propósito de `contracts.ts`/`mock-store.ts`/`fixtures.ts`/`lib/db/schema.ts` porque el diseño converge a una sola descripción pública por variante (la activación se controla desde el header/tab, no desde un segundo campo de texto). F-08 usando `esp.descripcion` fue la elección correcta desde el principio, no un workaround. Se corrige acá porque el resumen de la sesión anterior (post-compactación) lo había registrado por error como "regresión sin diagnosticar".
- **Nada de esto está commiteado** — sigue en el working tree, a la espera de que Javier decida cuándo.

### Verificación

`npx tsc --noEmit` = 0 · `npx eslint .` = 0 errores, 4 warnings (`@next/next/no-img-element`, no bloqueantes, mismo patrón ya aceptado en el resto del repo) · `npx tsx lib/data/mock-store.test.ts` = 51/51 · `npx tsx lib/modules/f3/gates.test.ts` = 15/15 · `npx tsx lib/modules/f4f5f6/gates.test.ts` = 12/12 · `DATA_IMPL=mock npx next build` = 27/27 rutas.

**Próximo POC:** reservado para la revisión manual de Javier sobre este lote o el Lote C pendiente de B2 (kanban P-01).

---

## POC-19 — Diamante F4 (Compras) + cierre de F7: 5 pantallas (P-13/P-14/P-15/P-24/P-26)

**Severidad:** alto · **Pantallas:** P-13 (orden de compra), P-14 (recepción de material, E-21), P-15 (herramientas, E-45), P-24 (pedidos web, E-44), P-26 (documentación del proyecto, E-41) · **Flujo:** al pedir un balance de decisiones pendientes y tareas para el lanzamiento final, Javier confirmó un hallazgo de POC-18 (F4/Compras nunca tuvo diseño ni código, pese a estar en el plan maestro original) y ordenó abrir el diamante correspondiente **antes** de escribir código — "no se puede volver a iniciar una fase si la anterior no está completa". Se rechazó explícitamente repetir el error de POC-18 (pantallas sin `disenio_PXX.md`).

- **Investigación de alcance real (antes de diseñar):** el plan maestro reservaba P-13/P-14/P-15 (F4) y P-24/P-25/P-26 (F7) con una numeración vieja, nunca actualizada tras la renumeración real de pantallas. Se confirmó por lectura directa que **P-25 (histórico) ya está construido — es el mismo P-20 (garantía) del lote F5/F6**, cerrando ese ítem sin trabajo nuevo. También se confirmó que `ordenesCompra.crear()`/`proveedores.crear()` ya existían en el store desde el lote anterior (nadie los llamaba) — P-13 resultó ser más chico de lo estimado.
- **Decisión de alojador de documentos (P-26), bloqueada desde 2026-08-03:** resuelta por el Supervisor — Cloudflare R2 para todas las imágenes del sistema; Google Drive se mantiene **sin integración API**, exclusivamente vía Google Drive Desktop instalado localmente por los diseñadores para el flujo SketchUp/SDK; el ERP solo guarda un enlace de texto, no sube ni valida nada de Drive.
- **Diseño:** 5 documentos `disenio_PXX.md` nuevos en `arnes/lineas/ola7/pantallas/`, formato `PLANTILLA_PANTALLA.md` completo (8 secciones), citando `REGISTRO_DE_ENTIDADES.md` §7/§8/§10 y `glosario_h07.md` B.9/B.10/B.19. `documentos_proyecto` (P-26) se materializa por primera vez — existía solo en un pase histórico de Diamante 3, nunca llegó al REGISTRO ni a `lib/db/schema.ts`.
- **Capa de datos previa (yo, Claude, directo — no delegado):** 4 entidades nuevas (`ItemOrdenCompra`, `RecepcionMaterial`, `Herramienta`, `DocumentoProyecto`) + 2 extensiones (`PedidoWeb.proyectoId`, `OrigenReproceso` con `'recepcion'`) + `lib/modules/f4/gates.ts` (`puedeCrearOrdenCompra`, reutiliza `P18` de F3 sin reinventarlo) con test dedicado. Verificado antes de repartir pantallas: 55 tests mock-store (4 nuevos), 3 tests f4/gates, build limpio.
- **Ejecución:** 4 lotes `opencode`/Zen en paralelo (Compras P-13+P-14 juntas por compartir árbol de archivos; Herramientas; Pedidos-web; Documentación — esta última única con permiso de tocar `app/erp/proyectos/[proyectoId]/page.tsx` para agregar su tarjeta al hub).
- **Fricción de tooling — 2 de 6 corridas fallaron en silencio (patrón nuevo, distinto del colgado de POC-18):** `deepseek-v4-flash-free` (Herramientas) y `ling-3.0-tiny-free` (Pedidos-web) leyeron todo el contexto solicitado y terminaron con exit code 0 **sin escribir ningún archivo** — ni error, ni archivo parcial, ni reporte de gap. Detectado verificando la existencia del archivo esperado (no solo el exit code de la tarea), no por ningún mensaje de fallo del proceso. Relanzados con `nemotron-3-ultra-free` y `mimo-v2.5-free` respectivamente — ambos cerraron limpio en el reintento. Rotación final: `big-pickle` (Compras), `nemotron-3-ultra-free` (Herramientas), `mimo-v2.5-free` (Pedidos-web), `longcat-2.0-free` (Documentación).
- **Hallazgo de consolidación (verificación propia post-lotes):** navegación — se agregaron 3 ítems a `ERP_NAV` en `components/veta/erp-shell.tsx` (Compras, Herramientas, Pedidos web); ninguno de los 4 lotes tocó ese archivo (instrucción explícita), evitando el choque que sí ocurrió en POC-17/POC-18.
- **Gaps menores reportados por los lotes, aceptados tal cual (no bloquean):** guard E-18/rol solo client-side en P-13 (mismo patrón que el resto del ERP, el store nunca revalida gates — confirmado como convención establecida antes de diseñar, no una laguna nueva); motivo de rechazo de OC no se persiste (`ordenesCompra.actualizarEstado` no tiene campo para eso); sin fixture de OC en estado `pagada`, el flujo de P-14 solo se ve completo tras pagar una OC vía P-21 en la demo.
- **Nada de esto está commiteado** — sigue en el working tree, a la espera de que Javier decida cuándo.

### Verificación

`npx tsc --noEmit` = 0 · `npx eslint .` = 0 errores, 5 warnings (`@next/next/no-img-element`, no bloqueantes) · `npx tsx lib/data/mock-store.test.ts` = 55/55 · `npx tsx lib/modules/f3/gates.test.ts` = 15/15 · `npx tsx lib/modules/f4/gates.test.ts` = 3/3 (nuevo) · `npx tsx lib/modules/f4f5f6/gates.test.ts` = 12/12 · `DATA_IMPL=mock npx next build` = 30/30 rutas.

**Próximo POC:** reservado para la revisión manual de Javier sobre F4/F7, el Lote C pendiente de B2 (kanban P-01), o el arranque de F10-E (migración a backend real) una vez el prototipo mock esté aprobado.
