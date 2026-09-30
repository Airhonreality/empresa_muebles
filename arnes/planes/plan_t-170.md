# plan_t-170 — Corrige la condición de carrera que perdía ítems del cotizador sin conexión

## Objetivo

Cuando dos o más mutaciones optimistas del cotizador (crear/actualizar/eliminar ítem, espacio,
artefacto, parámetros financieros, cliente, contrato) corren casi al mismo tiempo y una de ellas
falla (p. ej. por un corte de internet), el rollback de la que falla ya NO pisa el trabajo de las
mutaciones hermanas que sí tuvieron éxito. El usuario deja de ver ítems "titilar" o desaparecer
tras recargar la página cuando en realidad sí se habían guardado.

## Contexto (diagnóstico, 2026-09-30)

Javier reportó: se quedó sin internet cargando varios ítems a una cotización, la UI tituló, borró
todo y volvió a cargar uno por uno al volver la conexión — pero al recargar la página todo el
trabajo se había perdido. Causa raíz medida en `lib/data/queries/factory.ts`
(`useMutationOptGenerico`): cada mutación captura su propio snapshot `previous` en `onMutate`: si
falla, `onError` restauraba ese `previous` a ciegas con `setQueryData`, pisando el cache actual
—que puede tener el resultado ya confirmado de una mutación hermana que sí tuvo éxito mientras
esta fallaba—. Hallazgo colateral: `useEliminarItemMutation` no revertía cuando el servidor
respondía `false` (fila no encontrada), dejando el borrado optimista aplicado sin confirmar nunca.

## Zona única afectada

Zona: `lib/data/queries/` (capa de datos del cotizador — factory genérica + helpers puros de
optimismo + hooks de mutación) + `lib/data/stores/` (retiro de código muerto)

## Tipo de tarea y riesgo derivado

```
Tipo: Lógica de negocio / cálculo
Riesgo: alto
Frena al humano: sí
```

**Checkpoint del Supervisor**: pedido explícito de Javier en el chat (2026-09-30): "ejecuta fase 1
y 2 en secuencia, comprueba y push". Mismo patrón de aprobación que t-168 (instrucción textual del
Supervisor como veredicto, sin pasar por un plan escrito previo a la ejecución).

## Archivos afectados

- `lib/data/queries/factory.ts` (modificar): agrega `revertirOptimista` opcional a
  `OpcionesMutationOpt`; `onError` aplica un deshacer dirigido sobre el cache ACTUAL en vez de
  restaurar el `previous` capturado; `onSuccess` trata un resultado `null`/`false` como fallo
  (mismo tratamiento que un error de red); `reconciliar` ahora recibe `vars` como tercer parámetro
  (cambio retrocompatible).
- `lib/data/queries/optimistic.ts` (modificar): agrega `revertirItem`, `revertirEspacio`,
  `revertirArtefacto`, `revertirProyecto`, `revertirCliente`, `revertirContrato` — funciones puras
  que sincronizan un solo id entre el snapshot actual y uno previo, sin tocar el resto.
- `lib/data/queries/optimistic.test.ts` (modificar): 9 casos nuevos para las funciones de arriba
  (crear/actualizar/eliminar revertidos, no-op cuando no hay cambio, no pisar hermanos).
- `lib/data/queries/useCotizadorQueries.ts` (modificar): conecta `revertirOptimista` en las
  mutaciones de ítems, espacios, jornadas, artefactos, parámetros financieros, cliente y contrato.
- `lib/data/stores/CotizadorSincronizador.tsx`, `hidratador.ts`, `selectors.ts`, `types.ts`,
  `useCotizadorStore.ts`, `useCotizadorStore.test.ts` (eliminar): clúster Zustand de una migración
  previa (reemplazado por `CotizadorSnapBridge.tsx`, activo) que no se monta en ninguna ruta —
  confirmado con grep de importadores fuera del propio clúster, cero resultados.
- `arnes/tareas/t-170.json` (crear), `arnes/planes/plan_t-170.md` (crear, este archivo).

## Criterios de aceptación mecánicamente verificables

1. `revertirItem`/`revertirEspacio`/`revertirArtefacto`/`revertirCliente`/`revertirContrato`
   deshacen una creación (quitan la fila si no existía en `previo`), una actualización (restauran
   los valores de `previo`) y un soft-delete (restauran `anulado`), sin tocar otras filas del
   mismo snapshot — verificado con 9 casos de prueba en `optimistic.test.ts`.
2. `revertirProyecto`/`revertirContrato` restauran el objeto singular completo (`proyecto`/
   `contrato` + `hitos`) cuando el id coincide, no-op si no coincide.
3. Ningún archivo de `lib/data/stores/` queda importado desde fuera de sí mismo (verificado por
   grep antes de borrar — cero resultados).
4. `npx tsc --noEmit` limpio en todo el árbol.
5. `npx eslint .` sin errores nuevos en los archivos tocados.
6. `npx tsx lib/data/queries/optimistic.test.ts` en verde (36/36).

## Comandos de verificación

```
npx tsc --noEmit
npx eslint lib/data/queries/ components/veta/
npx tsx lib/data/queries/optimistic.test.ts
```

## Notas

- No se tocó `useEliminarEspacioMutation`, `useDuplicarEspacioMutation`, ni las mutaciones de
  `grupos_item`: su `aplicarOptimista` ya es `(snap) => snap` (sin cambio local real, resuelven
  por invalidación) o dependen de `invalidarSiempre`, así que el fallback genérico de `onError`
  (invalidar en vez de restaurar un snapshot viejo) ya las protege sin necesitar un deshacer
  dirigido adicional — no se amplía el alcance más allá del patrón ya existente.
- Persistencia local de respaldo (tipo localStorage, tal como lo tiene Notion) quedó
  explícitamente FUERA de esta tarea: es una capa arquitectónica nueva (requiere elegir un
  mecanismo de persistencia del cache de TanStack Query, definir qué se persiste y por cuánto
  tiempo, y decidir cómo se le avisa al usuario de "cambios sin sincronizar") que merece su propio
  plan y checkpoint, no un agregado apurado dentro de esta corrección de condición de carrera.
- La rama `dev` es la Production Branch de Vercel: cualquier push a `dev` despliega a producción
  real (`AGENTS.md` §"Modelo de repositorio y despliegue"). Esta tarea deja los cambios listos;
  Javier pidió explícitamente el push como parte de esta misma instrucción (2026-09-30).
