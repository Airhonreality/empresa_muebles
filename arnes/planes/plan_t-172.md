# plan_t-172 — Zod en el borde de escritura del cotizador (Lote 1: dinero/contratos)

## Objetivo

Las Server Actions de escritura del cotizador que tocan dinero y datos maestros (ítems,
parámetros financieros, espacio/jornadas, cliente) validan su entrada en runtime con Zod antes de
tocar la base de datos. Un payload malformado (tipo incorrecto, campo requerido vacío, número
negativo donde no corresponde) se rechaza con un mensaje claro en español, en vez de llegar crudo
al `insert`/`update` o fallar más tarde con un error críptico de Postgres.

## Contexto (diagnóstico, 2026-09-30)

El usuario preguntó "¿para qué sirve Zod realmente? ¿es necesaria para nuestro goal?" tras el
diagnóstico de lentitud/pérdida de datos del cotizador (t-170/t-171). Se confirmó que Zod no está
integrado en ninguna parte del código fuente (0 resultados de `zod` fuera de `node_modules`,
confirmado por auditoría de agente), con validación 100% manual (`if` sueltos, `Math.min/max`,
`.trim()`) tipada solo con TypeScript — que desaparece en runtime. Hay un incidente real de
producción documentado en el propio código (`lib/data/actions/core.ts`, comentario en
`actualizarParametrosFinancierosAction`): "numeric field overflow" el 2026-09-11 por falta de
validación runtime en `porcentajeIva`.

Existía un plan formal para esto, archivado y nunca ejecutado:
`arnes/lineas/ola7/tecnico/plan_zod_validacion_runtime.md` (rama `arnes-historico-fase0`, ligado a
`arnes/tareas/t-164.json`, estado `ejecutor: null`). Esta tarea retoma ese plan en vez de diseñar
desde cero, ejecutando su "Lote 1 (crítico: dinero/contratos)".

## Zona única afectada

Zona: `lib/validacion/` (nuevo) + `lib/data/actions/core.ts` (borde de escritura del cotizador)

## Tipo de tarea y riesgo derivado

```
Tipo: Lógica de negocio / cálculo
Riesgo: alto
Frena al humano: sí
```

**Checkpoint del Supervisor**: continuación directa del pedido de Javier (2026-09-30) de ejecutar
"todo en secuencia" tras t-170/t-171, con la pregunta explícita sobre el propósito de Zod resuelta
en el chat antes de ejecutar — mismo patrón de aprobación textual que t-168/t-170/t-171.

## Archivos afectados

- `lib/validacion/validar.ts` (crear): wrapper único `validarEntrada(schema, dato)` — `safeParse`
  + error claro en español con la ruta del campo que falló.
- `lib/validacion/cotizador.ts` (crear): schemas Zod para ítems (crear/actualizar), espacios
  (crear/actualizar), jornadas, parámetros financieros, cliente (crear/actualizar). Tipos
  derivados con `z.infer` — cero re-declaración manual.
- `lib/validacion/cotizador.test.ts` (crear): 21 casos (`node:assert` + `tsx`, sin DB).
- `lib/data/actions/core.ts` (modificar): `crearItemAction`, `actualizarItemAction`,
  `crearEspacioAction`, `actualizarEspacioAction`, `actualizarJornadasAction`,
  `actualizarParametrosFinancierosAction`, `crearClienteAction`, `actualizarClienteAction` llaman
  `validarEntrada` al inicio y usan el dato validado para el resto de la función.
- `package.json` / `package-lock.json` (modificar): `zod` pasa de dependencia transitiva a
  dependencia directa (`npm install zod`, resolvió `^4.6.5`).
- `arnes/tareas/t-172.json` (crear), `arnes/planes/plan_t-172.md` (crear, este archivo).

## Decisiones de diseño (y por qué no se hizo distinto)

- **Ids sin formato UUID forzado.** Los schemas validan que los ids/llaves foráneas sean strings
  no vacíos, NO que tengan formato UUID. Los fixtures de prueba existentes
  (`lib/data/queries/optimistic.test.ts`) usan ids como `'esp-1'`/`'it-1'` — exigir UUID
  rechazaría datos legítimos que la propia base de datos no considera inválidos. Validar forma y
  tipo, no una convención de id, es más seguro con el riesgo de regresión que marca el plan
  original ("Zod rechaza payloads legítimos que la UI envíe").
- **El clamp de `porcentajeIva` (0-100) en `actualizarParametrosFinancierosAction` NO se tocó.**
  Zod rechaza ahora lo que no es ni siquiera un número (`"abc"`, negativo) ANTES de llegar al
  clamp; el clamp sigue resolviendo el rango exacto exactamente como lo dejó el incidente de
  2026-09-11. Cambiar el clamp a un rechazo duro habría sido una decisión de producto nueva (UX:
  ¿se avisa y rechaza, o se corrige en silencio?) fuera del alcance de "agregar validación
  runtime".
- **No se validó `email` con formato estricto.** El campo puede llegar como `null` o cadena vacía
  desde formularios existentes no auditados uno por uno en esta tarea; forzar formato de email
  habría arriesgado rechazar guardados legítimos. Se valida solo que sea string/null.
- **No se tocaron `crearProyectoAction`/`actualizarProyectoAction`/contrato/hitos.** Quedan para
  un lote siguiente — el pedido explícito fue "ítems, parámetros financieros, espacio, jornadas,
  cliente", el subconjunto de mayor frecuencia de escritura y el que ya tuvo el incidente real.

## Criterios de aceptación mecánicamente verificables

1. Las 8 acciones listadas arriba llaman `validarEntrada` antes de cualquier `db.insert`/
   `db.update`.
2. Los tipos exportados de `lib/validacion/cotizador.ts` se derivan con `z.infer`, ninguno se
   re-declara a mano.
3. 21 casos de prueba en `lib/validacion/cotizador.test.ts` cubren: payload válido mínimo,
   campo requerido vacío, numérico-como-texto inválido/negativo, enum fuera de rango, patch
   parcial vacío válido, y que el mensaje de error incluye la ruta del campo.
4. `npx tsc --noEmit` limpio en todo el árbol.
5. `npx eslint .` sin errores ni warnings nuevos (el repo ya tenía deuda preexistente en
   `scripts/`, no tocada por esta tarea).
6. `npx tsx lib/validacion/cotizador.test.ts` en verde (21/21).
7. `npx tsx lib/data/queries/optimistic.test.ts` sigue en verde (36/36) — confirma que t-170 no se
   rompió al tocar `core.ts`.

## Comandos de verificación

```
npx tsc --noEmit
npx eslint .
npx tsx lib/validacion/cotizador.test.ts
npx tsx lib/data/queries/optimistic.test.ts
```

## Notas

- Lote 2 (operativo: producción, taller/calidad/entrega/garantía) y Lote 3 (maestro/tienda:
  catálogo, productos tienda, portafolio) del plan archivado quedan explícitamente fuera — son
  trabajo futuro, cada uno con su propio checkpoint, siguiendo la regla del plan original de no
  expandir el alcance por lote.
- El protocolo de agente para CRUD seguro sobre producción (Fase D del plan archivado,
  `scripts/crud-erp.ts`) tampoco se ejecuta acá — queda delineado en el plan original como tarea
  propia de una sesión futura.
- La rama `dev` es la Production Branch de Vercel: cualquier push a `dev` despliega a producción
  real. Mismo criterio de push que t-170/t-171 (pedido explícito de Javier de ejecutar en
  secuencia y continuar el mismo patrón).
