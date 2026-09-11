# Decisión axiomática — Header de entidad + Versionado de propuesta pública (2026-09-10)

**Disparador:** auditoría de Javier sobre la pantalla Cotizador (2026-09-10, puntos 2/2.1/3 de su mensaje). Diagnóstico previo (Explore agents, mismo día) encontró dos contradicciones reales en el arnés, no solo deuda de código. Este documento aplica **diseño axiomático (Suh)** — mapeo Requerimiento Funcional (FR) → Parámetro de Diseño (DP), Axioma de Independencia (cada DP resuelve su FR sin acoplar los demás) y Axioma de Información (entre diseños que cumplen el Axioma de Independencia, gana el de menor complejidad) — para cerrar ambas con una decisión final, no con otra ronda de propuestas.

**Autorización:** Javier, en esta misma sesión (2026-09-10): *"apliquemos el diseño axiomático para definir las decisiones finales y borrar el ruido del arnés"*. Este documento es el checkpoint de diseño para `t-154` y `t-156`. Falta todavía el checkpoint de plan de código (Iniciador) antes de que `t-155`/`t-156` ejecuten en `lib/db/schema.ts` o en pantallas reales.

---

## Decisión 1 — Header de entidad + submódulo de acciones contextuales (cierra `t-154`)

### Qué disparó la decisión

`arnes/estado.md` (líneas 403-411) e `INDEX.md` (líneas 65-70) describen una línea `ui-slots` — doctrina "Composición + estados semánticos", hallazgos H1-H6, 4 fases, declarada **prerrequisito de bloqueo** de `ZU_05..ZU_08` — como si existiera. Verificado con `find` + `git log --all` sobre todas las ramas: **`arnes/lineas/ui-slots/` nunca se escribió. Cero archivos, cero commits.** Es ruido puro: una decisión que quedó registrada como tomada sin que su artefacto se produjera nunca.

El código real confirma exactamente la queja de Javier: tres headers de detalle de entidad, cada uno ad-hoc —
- `app/erp/cotizador/[proyectoId]/page.tsx:342-421` (sticky, compacto, 6 botones sueltos, más una segunda barra completamente distinta para mobile con solo 3 de esos 6 — bug `t-151`).
- `app/erp/proyectos/[proyectoId]/page.tsx:526-547` (grande, apilado, sin sticky).
- `app/erp/compras/[ordenCompraId]/page.tsx:170-178` (simple, con "volver").
- Un cuarto patrón interno, `VistaSoloLectura` (`cotizador/[proyectoId]/page.tsx:796-819`).

Ninguno reutiliza nada de `components/veta/`.

### FR → DP

| # | Requerimiento Funcional (FR) | Parámetro de Diseño (DP) |
|---|---|---|
| FR1 | Mostrar metadata de una entidad (código, nombre, cliente, estado) en el header de su pantalla de detalle | DP1: `EntityHeader` — componente de presentación puro, recibe metadata como props tipadas |
| FR2 | Editar esa metadata sin salir de la pantalla | DP2: trigger de edición (ícono) dentro de `EntityHeader`, que abre por composición un modal específico de la entidad (no genérico — el `EditarProyectoModal` ya existente sigue siendo el modal de Proyecto/Cotizador; `EntityHeader` solo dispara `onEditar`, no conoce el contenido del form) |
| FR3 | Mostrar acciones de la pantalla (publicar, editar, eliminar, presentar…) agrupadas por intención, no como fila plana | DP3: `EntityActionsBar` — recibe un array de descriptores de acción (`{ label, icon, variant: 'primary'\|'secondary'\|'destructive', onClick }`), agrupa visualmente por `variant`, no conoce la lógica de negocio de cada botón |
| FR4 | El mismo patrón sirve para Cotizador, Proyecto y pantallas futuras sin duplicar estructura | DP4: `EntityHeader`/`EntityActionsBar` viven en `components/veta/`, consumidos 100% por props — cero conocimiento de rutas/entidades específicas |
| FR5 | Funcionar en mobile y desktop sin una segunda implementación paralela | DP5: un único layout responsive resuelto **dentro** de `EntityActionsBar` (colapso a menú "⋮" en mobile para acciones secundarias/destructivas, la o las 1-2 acciones primarias siempre visibles) — no dos barras separadas mantenidas a mano |

### Axioma de independencia

DP1 (metadata) y DP3 (acciones) son componentes separados, compuestos por el header de cada pantalla — no hay una sola "super-clase" que intente resolver ambos FR a la vez (eso fue, en parte, lo que generó el espagueti actual: garantía/IVA/navegación/destructivo todo en la misma fila). La matriz de diseño es esencialmente diagonal: tocar DP3 (agregar una acción nueva a Compras) no obliga a tocar DP1, y viceversa.

### Axioma de información — por qué se **cancela** el alcance completo de `ui-slots`

La doctrina H1-H6 y las 4 fases originales de `ui-slots` (inventario/taxonomía momento→slot, primitivas core, piloto, **contrato formal a `nucleo/`**) son una solución de información alta: gobiernan un problema — consistencia de *todos* los estados de interfaz de *todo* el ERP (loading/empty/error/success, etc.) — mucho más amplio que el que hoy tiene evidencia real de dolor (headers de detalle de 3 pantallas). Construir el aparato completo ahora, sin más de 2-3 pantallas que lo demanden, viola el Axioma de Información: hay un diseño más simple (DP1-DP5 arriba) que cumple el Axioma de Independencia igual de bien con una fracción de la complejidad.

**Decisión final:**
1. **La línea `ui-slots` con su alcance original (4 fases, contrato a `nucleo/`, taxonomía completa de estados de momento) queda CANCELADA.** No se resucita — nunca tuvo artefactos, y resucitarla completa hoy sería sobre-ingeniería para el problema real.
2. **En su lugar:** `t-154` construye directamente `components/veta/entity-header.tsx` + `components/veta/entity-actions-bar.tsx` (DP1-DP5 de arriba), sin la ceremonia de fases/gobierno. Los hallazgos H1-H6 se conservan como *cita de fundamento de diseño* (siguen siendo una síntesis válida de por qué la consistencia estructural importa), no como gate de proceso.
3. El **piloto real que sí se construyó** bajo el paraguas de "ui-slots" (`alert-slot.tsx`, `empty-state.tsx`, chips de filtro en `/erp/cotizador`, commit ya en `dev`) **se conserva intacto** — no se revierte nada, esos componentes ya sirven un propósito real y no dependen de la ceremonia cancelada.
4. El bloqueo declarado sobre `ZU_05..ZU_08` ("no empiezan su rediseño ergonómico hasta que `ui-slots` entregue su contrato mínimo") se **redirige**: la condición de desbloqueo pasa a ser "`EntityHeader`/`EntityActionsBar` de `t-154` existen y están aplicados en al menos 2 pantallas (`t-155`)", no un contrato en `nucleo/` que nunca se escribió.

---

## Decisión 2 — Versionado real de la propuesta pública (cierra `t-156`)

### Qué disparó la decisión — la contradicción

Tres fuentes, tres respuestas distintas a "¿la propuesta pública es un snapshot o una vista en vivo?":

1. **`disenio_F08_propuesta_publica.md`** (2026-08-07, regla R1): *"Propuesta = snapshot inmutable del proyecto (lectura-only)"*.
2. **`estado_ola7.md:426`** (t-031, 2026-08-02 — **anterior** a F-08): *"La versión nueva no tiene snapshot: consulta el proyecto en vivo... no puede mostrar un total viejo por diseño"*. `arnes/tareas/t-031.json` explica el porqué: el **legacy** tenía un snapshot (`propuestas_publicas.snapshot_json`) que sufrió un **incidente real documentado** — desincronización de `unit_price`/`total`, mostrando un total que ya no coincidía con la realidad. t-031 eligió consulta en vivo *a propósito*, para que esa clase de bug fuera estructuralmente imposible.
3. **Diseño histórico archivado** (`archivo/pasadas/pasada3_flujo_datos.md`, hallazgo **P3-07**, y `d3_schema_a1_1/a1_5_contextos/datos.md`): sí propuso una tabla `cotizaciones` con `version`/`snapshotProyecto` (jsonb)/`publicadaAt`, identificó el riesgo exacto ("snapshot congelado vs. proyecto vivo editándose... dos versiones sin relación declarada") y pidió una **política de versión** que **nunca se resolvió formalmente** — la tabla no llegó al diseño vigente.

El código real hoy implementa (2), no (1): `obtenerPropuestaPublicaAction` (`lib/data/actions/public.ts:230-323`) hace `SELECT` en vivo en cada request. F-08 (1) nunca se construyó.

### Por qué esto NO es repetir el bug del legacy

El pedido de Javier (punto 3: botón "publicar/nueva versión" que congela un timestamp humano, la vista pública no se actualiza sola, tabs de versiones para el cliente) es, en la superficie, exactamente lo que causó el incidente que t-031 evitó. La diferencia axiomática está en el DP, no en el FR: el legacy tenía **un solo campo mutable** (`snapshot_json`) que se sobreescribía en el sitio y podía quedar parcialmente actualizado (de ahí que `unit_price` y `total` se desincronizaran *entre sí dentro del mismo snapshot*). El diseño de abajo usa **inserciones nuevas, nunca updates in-place**, cada una completa y versionada — la clase de bug del legacy queda cerrada por construcción, no por evitar el feature.

### FR → DP

| # | Requerimiento Funcional (FR) | Parámetro de Diseño (DP) |
|---|---|---|
| FR1 | El cliente ve una propuesta estable tras "publicar" — no cambia bajo sus pies mientras decide | DP1: tabla nueva `propuestas_versiones` (`proyectoId` FK, `version` int, `snapshotJson` jsonb, `publicadaEn` timestamp, `publicadaPorId` FK usuario) — **insert-only**, nunca update |
| FR2 | El vendedor sigue editando el proyecto libremente sin afectar lo que el cliente ve, hasta la próxima publicación | DP2: `obtenerPropuestaPublicaAction` deja de hacer `SELECT` en vivo de `proyectos`/`espacioVariantes`/`itemsVariante` — pasa a leer `SELECT ... WHERE proyectoId = ? ORDER BY version DESC LIMIT 1` y deserializar `snapshotJson` |
| FR3 | Trazabilidad: qué vio el cliente y cuándo | DP3: gratis por construcción de DP1 — cada fila es un registro histórico inmutable, no hace falta tabla de log aparte |
| FR4 | El cliente ve el histórico de versiones publicadas (tabs) | DP4: portal cliente lee todas las filas de `propuestas_versiones` para ese proyecto (`ORDER BY version ASC`), un tab por fila, mismo componente de render que hoy, alimentado con `snapshotJson` en vez de datos en vivo |
| FR5 | Botón cambia de "Publicar" a "Crear nueva versión" según haya o no versión previa | DP5: `publicarPropuestaAction`/`crearNuevaVersionAction` — arma `snapshotJson` con el MISMO query que hoy usa `obtenerPropuestaPublicaAction` en vivo (reutilización directa, cero lógica de cálculo nueva), inserta `version = COALESCE(MAX(version), 0) + 1` |
| FR6 | Nunca dos versiones del mismo dato sin relación declarada (cierra P3-07 explícitamente) | DP6: `version` + `proyectoId` es la relación declarada; "la vigente" es siempre `MAX(version)` — sin ambigüedad, sin campo booleano `esActual` que pueda quedar en dos filas a la vez |

### Axioma de independencia

FR1/FR2 se resuelven con el mismo par DP1+DP2 (separación física lectura pública vs. lectura en vivo) — aceptable: son la misma necesidad raíz (desacoplar), no un acoplamiento espurio. FR4 (DP4) no interfiere con FR1/FR2: es una lectura adicional sobre la misma tabla. FR6 (DP6) es una propiedad del esquema, no un componente aparte — no compite con nada.

### Axioma de información — por qué snapshot JSONB y no versionar cada tabla hija

Alternativa descartada: crear `espacio_variantes_version`/`items_variante_version` normalizadas, con FK a `propuestas_versiones.id`. Cumple el Axioma de Independencia igual de bien, pero multiplica migraciones, joins y superficie de bug por 3-4 tablas nuevas para congelar algo que **ya se sabe armar como JSON** (es exactamente lo que hace hoy `obtenerPropuestaPublicaAction` antes de servirlo — solo que en vez de servirlo también se guarda). Menor información/complejidad, mismo resultado observable: **gana el snapshot JSONB único** (DP1).

### Decisión final

1. **`disenio_F08_propuesta_publica.md` R1 ("snapshot inmutable") queda CONFIRMADO como la decisión vigente** — no se construyó nunca, pero era la decisión correcta.
2. **`estado_ola7.md:426` (t-031) queda marcado SUPERADO** — no porque estuviera mal en 2026-08-02 (evitó correctamente el bug del legacy con la información que tenía), sino porque la decisión de negocio cambió: ahora sí se quiere snapshot, con el mecanismo (DP1-DP6) que cierra la clase de bug que t-031 evitaba.
3. **P3-07 queda CERRADO**: la "política de versión" que pedía el Define y nunca se resolvió es exactamente DP1+DP6.
4. Modelo de datos concreto para que el Iniciador escriba el plan de código de `t-156`: tabla `propuestas_versiones` según DP1, dos Server Actions nuevas (`publicarPropuestaAction`, o una sola con lógica de "si no existe versión, publicar; si existe, nueva versión"), reescritura de `obtenerPropuestaPublicaAction`, UI del botón (label dinámico + timestamp humano de última publicación) y tabs en portal cliente.

---

## Impacto en el arnés (ruido a limpiar, aplicado en esta misma sesión)

- `arnes/estado.md` líneas 403-411 (sección "LÍNEA ui-slots ABIERTA"): corregida — declara que los archivos nunca existieron y remite a esta decisión.
- `arnes/estado.md` línea ~385 ("Prerrequisito transversal... consume `ui-slots`"): redirigida a `t-154`/`t-155`.
- `arnes/INDEX.md` líneas 65-70 (sección 3.c ui-slots): corregida, ya no lista archivos inexistentes.
- `arnes/lineas/ola7/tecnico/zustand-migration/ZU_03_pln_roadmap_fases.md` líneas 11-13: redirigida a `t-154`/`t-155` en vez de `arnes/lineas/ui-slots/plan_ui-slots.md` (inexistente).
- `arnes/tareas/t-154.json`/`t-156.json`: actualizados con `plan_ref` a este documento y `estado` reflejando que la decisión de diseño ya está tomada (falta el plan de código del Iniciador).
