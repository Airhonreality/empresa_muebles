# plan_t-177 — Cierra el hueco de t-171 (toast) + deshacer manual en MoneyInput/NumberInput

## Objetivo

1. Parámetros financieros y versiones de propuesta cierran/reaccionan en cuanto disparan el
   guardado, igual que ya se hizo con el editor de ítem en t-176 — usando el `ToastProvider` que
   antes no existía.
2. Ctrl+Z (y Ctrl+Shift+Z / Ctrl+Y para rehacer) funciona de forma confiable dentro de
   `MoneyInput` y `NumberInput`, los dos únicos inputs del cotizador que filtran cada tecla con
   una regex y por eso desincronizan el undo nativo del navegador.

## Contexto (diagnóstico, 2026-09-30)

El usuario preguntó si "se puede hacer Ctrl+Z en cualquier lugar" y pidió auditar el deshacer por
campo. Revisando el código: `InputField` (texto plano) no transforma nada mientras se escribe, así
que el undo nativo del navegador ya funciona ahí sin tocar nada. Pero `MoneyInput`
(`e.target.value.replace(/[^\d]/g, "")`) y `NumberInput` (mismo patrón, agregado en t-176) SÍ
filtran cada tecla y le devuelven al input un valor distinto al que el usuario tecleó — eso es
exactamente el patrón que rompe el undo nativo de React controlado (el DOM recuerda la tecla real,
React muestra la versión filtrada, y el Ctrl+Z del navegador queda apuntando a un estado que ya no
corresponde a lo que se ve).

Separado de eso, parámetros financieros y versiones de propuesta quedaron pendientes en t-171
porque en ese momento no existía ningún mecanismo para avisar un error después de cerrar un modal
sin dejarlo bloqueado — t-176 construyó `ToastProvider` exactamente para esto, así que ahora se
puede cerrar el hueco.

## Zona única afectada

Zona: `components/veta/` (money-input, number-input, parametros-financieros-modal, versiones-
propuesta-modal) + `lib/hooks/` (useUndoHistorial nuevo)

## Tipo de tarea y riesgo derivado

```
Tipo: UI / visual
Riesgo: bajo
Frena al humano: no
```

**Checkpoint del Supervisor**: continuación de "esos 3 puntos me importan para planificar y
implementar" (2026-09-30) — respuesta "ambas" a la pregunta de alcance de deshacer (nativo por
campo + historial de acciones guardadas, esta última es t-178).

## Archivos afectados

- `lib/hooks/useUndoHistorial.ts` (crear): `HistorialDeshacer`, clase pura (sin React) que lleva
  una pila de valores con posición actual — `registrar`/`deshacer`/`rehacer`, tope de 50 pasos,
  corta la rama hacia adelante al escribir después de deshacer (igual que cualquier editor).
  `useUndoHistorial` la envuelve en un `useRef` estable. `detectarAtajoDeshacer` interpreta el
  evento de teclado (Ctrl/Cmd+Z, Shift para rehacer, o Ctrl+Y).
- `lib/hooks/useUndoHistorial.test.ts` (crear): 6 casos.
- `components/veta/money-input.tsx` (modificar): registra cada cambio filtrado en el historial;
  `onKeyDown` intercepta el atajo y aplica el valor devuelto.
- `components/veta/number-input.tsx` (modificar): mismo patrón.
- `components/veta/parametros-financieros-modal.tsx` (modificar): `guardar()` deja de ser
  `async`/esperar — dispara la mutación y cierra; el error, si llega después, se muestra por
  `mostrarError` del `ToastProvider`. Se retira `usePendingGuard` (ya no hay nada que bloquear: el
  modal se desmonta al cerrar) y el banner de error inline (sin lugar donde mostrarlo, el modal
  ya no existe).
- `components/veta/versiones-propuesta-modal.tsx` (modificar): `crearVersion`/`eliminarVersion`
  dejan de esperar el roundtrip — el modal NO se cierra solo (es un panel persistente de
  histórico), así que el banner de error inline se mantiene como estaba, solo se quita la espera
  artificial. Se retira `eliminandoId` (la fila desaparece de la lista al instante por el
  optimismo de la mutación, no queda nada que mostrar en loading).
- `arnes/tareas/t-177.json` (crear), `arnes/planes/plan_t-177.md` (crear, este archivo).

## Criterios de aceptación mecánicamente verificables

1. `HistorialDeshacer`: 6 casos cubren deshacer sin historial, deshacer/rehacer round-trip, cortar
   la rama al escribir después de un deshacer, no duplicar pasos iguales consecutivos, tope de
   tamaño.
2. `ParametrosFinancierosModal.guardar` y `VersionesPropuestaModal.crearVersion`/
   `eliminarVersion` ya no tienen `await` antes de cerrar/limpiar — inspección de código.
3. Un fallo de red en cualquiera de esas tres acciones se muestra (toast en parámetros
   financieros, banner inline en versiones — el modal que no cierra mantiene el banner).
4. `npx tsc --noEmit` limpio.
5. `npx eslint .` sin errores ni warnings nuevos.
6. `npx tsx lib/hooks/useUndoHistorial.test.ts` en verde (6/6).
7. `npx tsx lib/data/queries/optimistic.test.ts` y `npx tsx lib/utils/numero.test.ts` siguen en
   verde (confirman que t-170/t-176 no se rompieron).

## Comandos de verificación

```
npx tsc --noEmit
npx eslint components/veta/money-input.tsx components/veta/number-input.tsx components/veta/parametros-financieros-modal.tsx components/veta/versiones-propuesta-modal.tsx lib/hooks/useUndoHistorial.ts
npx tsx lib/hooks/useUndoHistorial.test.ts
npx tsx lib/data/queries/optimistic.test.ts
npx tsx lib/utils/numero.test.ts
```

## Notas

- `InputField` (texto plano) no se tocó — ya tiene undo nativo del navegador sin ningún cambio,
  confirmado por inspección (no transforma el valor mientras se escribe).
- El historial de deshacer vive solo mientras el componente del input está montado (en memoria,
  no persistido) — es deshacer DENTRO de una sesión de edición de ese campo, no sobrevive a cerrar
  el modal ni a un reload. Alcance correcto para este caso: una vez guardado, deshacer una acción
  YA CONFIRMADA es el alcance de t-178 (historial de acciones), una pieza completamente distinta.
- La rama `dev` es la Production Branch de Vercel: cualquier push a `dev` despliega a producción
  real. Mismo criterio de push que las tareas anteriores de esta sesión.
