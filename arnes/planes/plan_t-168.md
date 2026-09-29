# plan_t-168 — Retroalimentación exacta de validación en el modal de contrato

## Objetivo

Ningún botón del modal de contrato puede quedar deshabilitado sin que el usuario vea, en el
propio modal y junto al botón, la lista exacta de los campos que falta completar y por qué
cada uno está bloqueando la acción.

## Contexto (diagnóstico mecánico, 2026-09-29)

Javier reportó el botón "Generar Contrato" deshabilitado sin explicación. Causa raíz medida
en `app/erp/cotizador/ContratoModal.tsx`:

1. `esValido` (línea 402) es una cadena `&&` de 9 condiciones. Un solo booleano.
2. Cuando `esValido` es falso, la única retroalimentación es un párrafo genérico (línea 757)
   que lista las 6 categorías de requisitos sin decir cuál falta, ni dónde, ni por qué.
3. Ese párrafo **no existía antes de t-166**: el commit `7999b83^` no tenía ningún bloque
   `!esValido`. En la versión previa el botón se deshabilitaba en silencio absoluto.
4. La cadena de condiciones pasó de 5 a 9 requisitos: `hitos.length > 0` pasó a `> 1`, y se
   agregaron `plazoSemanas`, `alcanceSuministros` y `anexoPropuestaIdentificacion`. Un
   contrato que era válido ayer puede estar bloqueado hoy sin que nada explique el cambio.
5. **Bug de default (líneas 165-167):** `alcanceSuministros` y `anexoPropuestaIdentificacion`
   usan `?? PLANTILLA`, que solo cae en `null`/`undefined`. Si la fila llega con cadena vacía
   `''` —que es lo que produce un `.trim()` guardado en `core.ts:298-299` cuando el campo se
   manda vacío— el `??` NO reemplaza, el campo se ve vacío y `esValido` queda `false` para
   siempre. El usuario ve un textarea vacío y un botón muerto.
6. **Violación de la DoD #15 (verificada en `app/globals.css`):** el mensaje de error del pie
   usa `border-error-border bg-error-bg`, y ninguno de los dos tokens existe. Solo existe
   `--color-error-text`, `--color-error-fill` y `--color-error-stroke`. Tailwind descarta la
   clase en silencio: el mensaje de error se renderiza sin borde ni fondo.

## Zona única afectada

Zona: `contratos`

## Tipo de tarea y riesgo derivado

```
Tipo: UI / visual
Riesgo: bajo
Frena al humano: no
```

## Archivos afectados

- `lib/data/contrato-validacion.ts` (crear — módulo puro, sin React, sin store, sin I/O,
  testeable con el patrón `node:assert` + `tsx` del repo, igual que `lib/data/contrato-items.ts`)
- `lib/data/contrato-validacion.test.ts` (crear)
- `app/erp/cotizador/ContratoModal.tsx` (modificar)
- `arnes/tareas/t-168.json` (crear)
- `arnes/planes/plan_t-168.md` (crear — este archivo)

## Criterios de aceptación mecánicamente verificables

Criterios de UX, citados por número de `arnes/lineas/ola7/tecnico/checklist_progreso_pantallas.md`:

- **DoD 8 (el control se puede encontrar):** con el botón deshabilitado, el modal renderiza
  junto al botón un elemento `role="alert"` con un `<li>` por cada requisito pendiente, y cada
  `<li>` nombra el campo. Verificable por inspección del DOM.
- **DoD 15 (tokens existen):** ninguna clase nueva referencia un token `--color-*` inexistente.
  Se corrige `border-error-border bg-error-bg` → `border-error-stroke bg-error-fill`.
- Cada campo que bloquea la acción muestra su error inline vía la prop `error` que ya
  soportan `InputField` y `MoneyInput` (ambas la renderizan con `role="alert"`), sin
  replicar el patrón a mano.
- `requisitosPendientes()` devuelve TODOS los requisitos incumplidos, no solo el primero: un
  caso de prueba con 4 campos vacíos devuelve 4 elementos.
- `esValido` queda exactamente igual de estricto que antes: la función se verifica con una
  tabla de casos contra las 9 condiciones de la línea 402. Ninguna se relaja.
- El default de `alcanceSuministros` / `anexoPropuestaIdentificacion` también se aplica cuando
  el valor es cadena vacía, no solo cuando es `null`.
- **DoD 6 (higiene):** se pega el output crudo de los 4 comandos de la sección 2 del checklist.

## Comandos de verificación

Declarados en `AGENTS.md` §"Comandos de verificación" y DoD §2 punto 6:

```
npx tsc --noEmit                                   (todos los criterios)
npx eslint .                                       (criterios de estilo y tokens)
DATA_IMPL=mock npx next build                      (DoD 6, punto 6)
npx tsx lib/data/contrato-validacion.test.ts       (criterios de la función pura)
npx tsx lib/data/mock-store.test.ts                (DoD 6, punto 6)
```

## Nota de despliegue

La rama `dev` es la Production Branch de Vercel: **cualquier push a `dev` despliega a
producción real** (`AGENTS.md` §"Modelo de repositorio y despliegue"). Esta tarea deja los
cambios en el working tree; el push es decisión del Supervisor.
