# plan_t-176 — Parser de números agnóstico al separador + primitiva de toast + 2 botones lentos restantes

## Objetivo

1. Escribir "4,5" o "4.5" en un campo de cantidad/jornadas (`NumberInput`) da el mismo resultado,
   sin depender del navegador/SO del usuario. Se elimina el landmine de `formatNumber` que
   explicaría un corte de magnitud silencioso si algún día recibe un string ya formateado.
2. Crear un espacio y guardar/eliminar/reemplazar un ítem en el cotizador dejan de sentirse
   lentos: el control reacciona en cuanto el cambio optimista aplica, no cuando responde el
   servidor — con una primitiva de notificación nueva (`ToastProvider`) para no perder visibilidad
   de errores al cerrar antes de confirmar.

## Contexto (diagnóstico, 2026-09-30)

Dos diagnósticos de agente (solo lectura) sobre el cotizador:

**Botones lentos restantes** (tras t-171): "Crear espacio" y el editor de ítem (Guardar/Eliminar/
Confirmar reemplazo) ya usan mutaciones optimistas (`useCrearEspacioMutation`,
`useActualizarItemMutation`, etc. — el cache cambia al instante), pero sus `loading`/`disabled`
seguían atados a `await`/`usePendingGuard` sobre la respuesta completa del servidor. Mismo patrón
ya corregido en t-171 para parámetros financieros/versiones, pendiente acá.

**Formato numérico**: el usuario reportó un glitch transitorio ("1.000.000 se ve como 10.000 un
instante, luego toma su valor real") y problemas generales de punto/coma al escribir decimales.
Hallazgos:
- `NumberInput` (`components/veta/number-input.tsx`) era un `<input type="number">` nativo sin
  ninguna capa propia de parseo — el manejo de "," vs "." quedaba 100% a merced del navegador/SO.
- `lib/utils/format.ts`: `formatNumber` hacía `parseFloat(num)` directo sobre un string sin
  despojar separadores de miles — si algún día recibe "1.000.000" ya formateado, da `1` (se
  detiene en el primer "." extra), exactamente el tipo de corte de magnitud reportado. Sin
  llamador activo al momento del diagnóstico (código muerto, pero una trampa real).
- `parseMoney` estaba duplicado literal en `components/veta/money-input.tsx` y
  `components/veta/smart-search.tsx`; esta última además usaba `toLocaleString()` sin locale fijo
  (formato dependiente del navegador del usuario, inconsistente con el resto de la UI en es-CO).
- El glitch puntual exacto que vio el usuario no se pudo fijar a una línea concreta (no hay hoy un
  llamador que dispare la trampa de `formatNumber`) — la hipótesis más defendible es un
  timing/race de render, agravada por la falta de una sola fuente de verdad de parseo. Quedan
  ~5 reimplementaciones adicionales de `parseNum`/`formatCOP` (item-editor-modal, item-descriptor-
  modal, página del cotizador, propuesta pública) que hoy son seguras porque los valores de la DB
  son siempre dígitos puros — se documentan como deuda latente, NO se tocan en esta tarea (una de
  ellas vive en la propuesta pública, cara al cliente, y merece su propio pase con más cuidado).

**Decisión del usuario (2026-09-30, en vivo)**: el peso colombiano no maneja decimales
(`MoneyInput` ya fuerza `maximumFractionDigits: 0`) — el parser nuevo es solo para cantidades/
jornadas (`NumberInput`), no para dinero. `MoneyInput` sigue tratando cualquier separador como
ruido a descartar (ya lo hacía bien para esa regla de negocio).

## Zona única afectada

Zona: `components/veta/` (NumberInput, item-editor-modal, toast-provider, smart-search) +
`lib/utils/` (numero.ts nuevo, format.ts) + `app/erp/layout.tsx` + `app/erp/cotizador/[proyectoId]/page.tsx`

## Tipo de tarea y riesgo derivado

```
Tipo: UI / visual
Riesgo: bajo
Frena al humano: no
```

**Checkpoint del Supervisor**: continuación de "seguir diagnosticando a detalle" + pregunta
resuelta en vivo sobre decimales en COP (2026-09-30).

## Archivos afectados

- `lib/utils/numero.ts` (crear): `normalizarNumeroTexto`/`parseNumeroFlexible` — única fuente de
  verdad para texto-a-número agnóstico al separador, pensada para cantidades/jornadas.
- `lib/utils/numero.test.ts` (crear): 14 casos.
- `lib/utils/format.ts` (modificar): `formatNumber` normaliza con `normalizarNumeroTexto` antes de
  `parseFloat`.
- `components/veta/number-input.tsx` (modificar): de `<input type="number">` nativo a `text`
  controlado, normaliza al perder foco (mismo patrón focus/blur que `MoneyInput`).
- `components/veta/smart-search.tsx` (modificar): quita el `parseMoney` duplicado (importa el de
  `money-input.tsx`, el único con importadores externos reales), fija el locale del
  `toLocaleString()` suelto a `Intl.NumberFormat('es-CO')`.
- `components/veta/toast-provider.tsx` (crear): primitiva de notificación global mínima
  (`mostrarError`), pieza que faltaba para poder cerrar un modal/control antes de confirmar el
  guardado sin perder visibilidad de un fallo posterior.
- `app/erp/layout.tsx` (modificar): monta `ToastProvider` envolviendo `ErpShell`.
- `components/veta/item-editor-modal.tsx` (modificar): `handleGuardarCambios`/
  `handleConfirmarReemplazo`/`handleEliminar` cierran el modal en cuanto disparan la mutación
  (ya optimista), en vez de esperar el roundtrip; error posterior se avisa por `ToastProvider` en
  vez de perderse como rechazo de promesa sin capturar. Se retiran los estados `guardando`/
  `eliminando` (ya no hay nada que bloquear: el modal se desmonta al cerrar).
- `app/erp/cotizador/[proyectoId]/page.tsx` (modificar): `crearEspacio` deja de depender de
  `usePendingGuard`/`await` — limpia el formulario de inmediato (ya tiene `nombreFinal` conocido
  del lado cliente, no necesita esperar la respuesta del servidor para eso), avisa por toast si la
  creación falla después. `aplicarPreset` (flujo de plantillas, multi-paso real) sigue usando el
  guard sin cambios — no es el mismo tipo de acción.
- `arnes/tareas/t-176.json` (crear), `arnes/planes/plan_t-176.md` (crear, este archivo).

## Criterios de aceptación mecánicamente verificables

1. `normalizarNumeroTexto`/`parseNumeroFlexible`: 14 casos cubren coma/punto como decimal único,
   coma/punto repetido como miles, ambos presentes (gana el de más a la derecha), texto vacío,
   sin dígitos, caracteres extra mezclados.
2. `formatNumber('1.000.000')` ya no da `1` — normaliza antes de `parseFloat`.
3. `parseMoney` tiene una sola definición real (`money-input.tsx`); `smart-search.tsx` la importa.
4. `NumberInput` es un `type="text"` con `inputMode="decimal"`, no un `type="number"` nativo.
5. Cerrar el editor de ítem (guardar/reemplazar/eliminar) y crear un espacio ya no esperan la
   respuesta del servidor antes de limpiar/cerrar — verificable por inspección (sin `await` antes
   del cierre/limpieza).
6. Un error posterior en cualquiera de esas acciones aparece en un `role="alert"` del
   `ToastProvider`, nunca como una promesa rechazada sin capturar.
7. `npx tsc --noEmit` limpio en todo el árbol.
8. `npx eslint .` sin errores ni warnings nuevos en los archivos tocados.
9. `npx tsx lib/utils/numero.test.ts` en verde (14/14).
10. `npx tsx lib/data/queries/optimistic.test.ts` sigue en verde (36/36) — confirma que t-170 no
    se rompió.

## Comandos de verificación

```
npx tsc --noEmit
npx eslint app/erp/cotizador/[proyectoId]/page.tsx app/erp/layout.tsx components/veta/item-editor-modal.tsx components/veta/number-input.tsx components/veta/smart-search.tsx components/veta/toast-provider.tsx lib/utils/format.ts lib/utils/numero.ts
npx tsx lib/utils/numero.test.ts
npx tsx lib/data/queries/optimistic.test.ts
```

## Notas

- **Deliberadamente fuera de esta pasada**: las ~5 reimplementaciones restantes de `parseNum`/
  `formatCOP` (`item-editor-modal.tsx`, `item-descriptor-modal.tsx`, el resto de
  `page.tsx` del cotizador, `PropuestaPublicaClient.tsx`) — son seguras hoy porque la DB siempre
  entrega dígitos puros, pero son deuda latente. Una de ellas vive en la propuesta pública (cara
  al cliente final); tocarla merece su propio pase con más cuidado, no un barrido apurado.
- `ContratoModal` (dos escrituras secuenciales reales: cliente + contrato) y "Duplicar espacio"/
  "grupos de ítems" (sin ningún feedback, baja frecuencia de uso) quedan fuera — señalados en el
  diagnóstico pero de menor prioridad que los dos botones de mayor frecuencia corregidos acá.
- El glitch puntual exacto reportado por el usuario ("1.000.000 → 10.000 un instante") no se pudo
  fijar a una línea concreta con certeza — se corrigió el mecanismo más probable (`formatNumber`)
  y se consolidó la duplicación, pero si el glitch persiste después de este despliegue hace falta
  reproducirlo con DevTools abierto (Network + Console) para capturar el valor exacto en el
  instante del salto.
- La rama `dev` es la Production Branch de Vercel: cualquier push a `dev` despliega a producción
  real. Mismo criterio de push que t-170/t-171/t-172 (pedido explícito de continuar en secuencia).
