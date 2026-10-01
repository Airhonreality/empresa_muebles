# plan_t-179 — Ctrl+Z global para acciones ya guardadas (ítems del cotizador)

## Objetivo

Crear, editar o eliminar un ítem del cotizador y arrepentirse: Ctrl+Z (fuera de cualquier campo de
texto) deshace la última de esas tres acciones **ya confirmada en la base de datos** — vuelve a
llamar al servidor con los valores anteriores, no solo toca el caché local.

## Contexto (diagnóstico, 2026-09-30/2026-10-01)

El usuario preguntó si "se puede hacer Ctrl+Z en cualquier lugar, en cualquier instancia: textos,
números, ítems" y pidió planificar e implementar junto con el cierre de los huecos de t-170/t-171.
Se distinguió explícitamente de t-177 (deshacer mientras se escribe un campo, antes de guardar):
esto es deshacer una acción que YA se guardó.

**Hallazgo en vivo durante la implementación**: otra sesión trabajando en paralelo sobre el mismo
repo ya había extendido `ToastProvider` con un `mostrarInfo(mensaje, accion)` — un botón
"Deshacer" puntual para una acción específica (reclasificar un ítem referencial/contractual).
Se confirmó con el usuario antes de seguir: ambos mecanismos son compatibles (uno es un atajo
global de teclado para cualquier acción de ítem, el otro es un botón puntual en un toast para un
caso de uso concreto) — no hubo necesidad de rediseñar nada, solo de reusar el `mostrarInfo` ya
existente para la confirmación del Ctrl+Z.

**Alcance acotado a ítems, no a los 5 tipos de entidad de t-170**: `eliminarEspacioAction` tiene un
guard (`VarianteNoEliminableError`) y una cascada propia (borra `espacios_artefactos`, luego
ítems, luego el espacio) que no se auditó en esta pasada; extender el undo a espacios/cliente/
parámetros financieros de forma correcta requiere entender esos casos uno por uno, no se quiso
apurar. Ítems es además el caso que el usuario reportó directamente (el incidente de pérdida de
ítems que originó todo este diagnóstico).

## Zona única afectada

Zona: `lib/data/queries/` (historial-deshacer.ts nuevo + cotizador-compat.tsx) +
`components/veta/historial-deshacer-listener.tsx` (nuevo) + `app/erp/cotizador/[proyectoId]/layout.tsx`

## Tipo de tarea y riesgo derivado

```
Tipo: Lógica de negocio / cálculo
Riesgo: alto
Frena al humano: sí
```

**Checkpoint del Supervisor**: continuación de "esos 3 puntos me importan para planificar y
implementar" + respuesta "ambas" sobre alcance de deshacer + confirmación explícita de seguir con
el Ctrl+Z general tras el hallazgo del `mostrarInfo` de la otra sesión (2026-10-01).

## Archivos afectados

- `lib/data/queries/historial-deshacer.ts` (crear): pila en memoria por proyecto
  (`registrarAccionDeshacer`/`deshacerUltimaAccion`/`hayAccionesPorDeshacer`, LIFO, tope de 20) +
  `patchInverso` (helper genérico: construye el patch inverso tomando de `anterior` solo las
  claves presentes en `patch`).
- `lib/data/queries/historial-deshacer.test.ts` (crear): 9 casos.
- `lib/data/queries/cotizador-compat.tsx` (modificar — **vía staging aislado, ver Notas**):
  `items.crear/actualizar/eliminar` registran una entrada de deshacer después de que la mutación
  resuelve con éxito. `eliminar` reconstruye el ítem con `crearItemAction` + fuerza
  `anulado: false` con `actualizarItemAction` — cubre tanto el hard-delete (sin contrato/BOM, la
  fila ya no existe, el create la recrea) como el soft-delete (con contrato/BOM, la fila sigue con
  `anulado: true`, el create es un no-op por `onConflictDoNothing` y el update es el que de verdad
  restaura) sin que el cliente necesite saber cuál de los dos pasó en el servidor.
- `components/veta/historial-deshacer-listener.tsx` (crear): listener de `keydown` a nivel de
  documento. Ctrl/Cmd+Z (sin Shift) deshace la última acción SOLO si el foco no está dentro de un
  input/textarea/select/contentEditable — si estás escribiendo, el undo del campo (t-177) o el
  nativo del navegador mandan, nunca se salta a deshacer algo ya guardado sin que el usuario lo
  busque explícitamente. Usa `mostrarInfo`/`mostrarError` del `ToastProvider` ya existente.
- `app/erp/cotizador/[proyectoId]/layout.tsx` (modificar): monta el listener junto al banner y al
  `CotizadorSnapBridge`.
- `arnes/tareas/t-179.json` (crear), `arnes/planes/plan_t-179.md` (crear, este archivo).

## Criterios de aceptación mecánicamente verificables

1. `historial-deshacer.ts`: 9 casos cubren deshacer sin nada registrado, orden LIFO, que la pila
   se vacía tras agotarse, que las pilas de proyectos distintos no se mezclan, que un deshacer que
   falla propaga el error sin volver a registrarse, y `patchInverso` con patch parcial/vacío.
2. `items.crear/actualizar/eliminar` en `cotizador-compat.tsx` registran una entrada de deshacer
   solo después de que la mutación al servidor resuelve (no antes, no si falla).
3. El listener de teclado ignora Ctrl+Z cuando `document.activeElement` es un campo editable.
4. `npx tsc --noEmit` limpio.
5. `npx eslint .` sin errores ni warnings nuevos.
6. `npx tsx lib/data/queries/historial-deshacer.test.ts` en verde (9/9).
7. `npx tsx lib/data/queries/optimistic.test.ts` sigue en verde (36/36) — confirma que t-170 no se
   rompió al tocar `cotizador-compat.tsx`.

## Comandos de verificación

```
npx tsc --noEmit
npx eslint lib/data/queries/cotizador-compat.tsx lib/data/queries/historial-deshacer.ts components/veta/historial-deshacer-listener.tsx "app/erp/cotizador/[proyectoId]/layout.tsx"
npx tsx lib/data/queries/historial-deshacer.test.ts
npx tsx lib/data/queries/optimistic.test.ts
```

## Notas

- **Staging aislado de `cotizador-compat.tsx`**: al momento de implementar esta tarea, otra sesión
  tenía cambios SIN COMITEAR en ese mismo archivo (catálogo de acabados: `espacioVarianteAcabados`,
  `catalogoAcabados.crear`). Para no comitear trabajo ajeno sin terminar junto con el mío, el commit
  de esta tarea se armó reconstruyendo "último commit + SOLO mis dos cambios" como blob aislado
  (`git hash-object` + `git update-index --cacheinfo`), sin tocar el archivo real del working tree
  — la otra sesión conserva sus cambios intactos para comitearlos cuando estén listos. Verificado
  con un swap temporal + `tsc --noEmit` (los únicos errores que aparecieron fueron por la AUSENCIA
  esperada de las APIs de acabados en `page.tsx`, confirmando que mi porción es autocontenida) y
  restaurado de inmediato.
- **Deliberadamente fuera de esta pasada**: extender el historial de deshacer a espacios, cliente,
  parámetros financieros y contrato — mismo principio que t-170 (esos 5 tipos ya tienen
  `revertirX` para el caché local), pero el undo de una acción YA GUARDADA necesita re-invocar el
  server action correcto con los valores anteriores, y `eliminarEspacioAction` tiene un guard
  (`VarianteNoEliminableError`) + cascada propia que no se auditó acá — se prefirió entregar ítems
  correcto y bien probado antes que estirar a 5 entidades con mayor riesgo de un bug sutil en los
  casos menos comunes.
- No hay "rehacer" (redo) para el historial de acciones — alcance explícitamente acotado a
  deshacer; t-177 sí tiene redo porque ahí la complejidad es mínima (una pila en memoria del
  propio campo).
- La rama `dev` es la Production Branch de Vercel: cualquier push a `dev` despliega a producción
  real y toca el flujo de escritura de ítems de TODOS los usuarios del cotizador.
