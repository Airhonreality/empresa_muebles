# plan_t-171 — Image picker paralelo/optimista + ningún modal del cotizador falla en silencio

## Objetivo

Subir imágenes en el cotizador deja de congelar el picker completo durante ~1 minuto por lote: cada
imagen sube en paralelo con preview inmediato, y el texto de infraestructura ("R2"/"Cloudflare")
deja de ser visible para el usuario final. Además, el modal de parámetros financieros y el de
versiones de la propuesta pública dejan de fallar en silencio: si el guardado/publicado falla, el
usuario ve exactamente qué pasó en vez de que el botón se desbloquee solo sin explicación.

## Contexto (diagnóstico, 2026-09-30)

Javier reportó el image picker como "lo peor que hay": dice "R2" (nadie sabe qué es), y al
subir/pegar una imagen se congela ~1 minuto antes de desbloquear para la siguiente. Causa raíz
medida en `components/veta/image-picker.tsx`: `agregarArchivosLote` subía en un `for...await`
secuencial (N imágenes = N roundtrips completos en serie) detrás de un único booleano `isUploading`
que bloqueaba TODO el picker (URL, Examinar, drag/paste) hasta que la última terminaba. Textos
"Clonando a R2...", "Subiendo a R2...", y errores con "Cloudflare R2" quedaban expuestos en la UI.

Aparte, `ParametrosFinancierosModal.guardar()` y `VersionesPropuestaModal.crearVersion()` hacían
`await mutateAsync(...)` sin `catch`: si la Server Action fallaba (red, validación), la promesa
rechazada nunca se capturaba — `usePendingGuard.guard()` solo tiene `try/finally`, no `catch` — así
que el botón se desbloqueaba solo, sin ningún mensaje, dejando los cambios sin guardar sin aviso.
Mismo principio que t-168 (contrato): "un botón no se puede bloquear/fallar sin retroalimentación
exacta al usuario".

**Decisión de alcance explícita**: NO se cambió el momento en que estos dos modales cierran (seguir
esperando la respuesta real antes de cerrar) porque el repo no tiene un sistema de notificación/
toast global — cerrar el modal antes de confirmar el guardado dejaría fallos de red completamente
invisibles para el usuario (el problema inverso al que se está corrigiendo). Se optó por la mejora
de menor riesgo: mantener el `await`, pero mostrar el error inline si algo falla. Cerrar-antes-de-
confirmar queda como trabajo futuro explícito, condicionado a construir esa infraestructura de
notificación primero.

## Zona única afectada

Zona: `components/veta/` (ImagePicker + dos modales del cotizador) + `lib/r2/upload.ts` (mensajes
de error que llegan a esa UI)

## Tipo de tarea y riesgo derivado

```
Tipo: UI / visual
Riesgo: bajo
Frena al humano: no
```

**Checkpoint del Supervisor**: mismo pedido textual de Javier (2026-09-30) que t-170, con el
agregado explícito en el chat: "incluye la mejora del image picker que es demasiado lento".

## Archivos afectados

- `components/veta/image-picker.tsx` (modificar): `agregarArchivosLote` pasa de secuencial a
  `Promise.allSettled` en paralelo; preview optimista inmediato por archivo vía
  `URL.createObjectURL` (grid muestra miniaturas con spinner mientras suben, revocadas al asentar);
  ya no hay un `isUploading` global — solo el control de "+ URL" (clonar una sola URL) se bloquea
  mientras esa acción puntual está en vuelo; `valueRef` evita pisar imágenes agregadas por otra
  subida concurrente que asentó primero; todo el texto "R2"/"Cloudflare R2" visible al usuario se
  reemplaza por lenguaje neutro ("Subiendo...").
- `lib/r2/upload.ts` (modificar): mensajes de fallback de error (`uploadFileToR2`,
  `uploadArchivoToR2`) dejan de mencionar "Cloudflare R2".
- `components/veta/parametros-financieros-modal.tsx` (modificar): `guardar()` captura el error de
  `onGuardar` y lo muestra en un banner inline (mismo patrón visual que el picker), en vez de
  dejarlo como rechazo de promesa sin capturar.
- `components/veta/versiones-propuesta-modal.tsx` (modificar): `crearVersion()` y
  `eliminarVersion()` capturan y muestran el error de la mutación correspondiente.
- `arnes/tareas/t-171.json` (crear), `arnes/planes/plan_t-171.md` (crear, este archivo).

## Criterios de aceptación mecánicamente verificables

1. `agregarArchivosLote` usa `Promise.allSettled`, no un `for...await` secuencial — verificable
   por inspección del código.
2. Ningún string visible en JSX de `image-picker.tsx` contiene "R2" ni "Cloudflare" (verificado
   por grep tras el cambio).
3. El input de archivo, el botón "Examinar" y el drag/paste ya no quedan `disabled` mientras hay
   subidas en curso — solo el botón "+ URL" se bloquea, y solo mientras SU propia operación está
   en vuelo.
4. `ParametrosFinancierosModal` y `VersionesPropuestaModal` renderizan un `role="alert"` con el
   mensaje de error cuando la mutación correspondiente rechaza.
5. `npx tsc --noEmit` limpio.
6. `npx eslint .` sin errores ni warnings nuevos en los archivos tocados.

## Comandos de verificación

```
npx tsc --noEmit
npx eslint components/veta/image-picker.tsx components/veta/parametros-financieros-modal.tsx components/veta/versiones-propuesta-modal.tsx lib/r2/upload.ts
```

## Notas

- El botón "Publicar"/"Crear nueva versión" sigue mostrando `loading={publicar.isPending}` atado a
  la latencia real del servidor (`construirSnapshotPropuestaPublica` hace ~5-6 roundtrips
  secuenciales a Neon) — esa latencia de backend queda fuera de esta tarea, es un problema de
  servidor, no de patrón de UI; quedó documentado en el diagnóstico previo de esta misma
  conversación como candidato a revisión de rendimiento aparte.
- La rama `dev` es la Production Branch de Vercel: cualquier push a `dev` despliega a producción
  real. Javier pidió explícitamente el push como parte de esta misma instrucción (2026-09-30).
