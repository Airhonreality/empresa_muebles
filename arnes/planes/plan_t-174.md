# plan_t-174 — Pantalla de administración de acabados: alta en lote + edición simple

## Objetivo

Javier puede entrar a `/erp/catalogo/acabados`, soltar o seleccionar varias imágenes de texturas a la
vez (ej. 20 fotos de melamina), y completar nombre/marca/familia/color para cada una antes de
guardarlas — sin que una fila bloquee a las demás. También puede editar o eliminar acabados ya
existentes desde la misma lista.

## Contexto (diagnóstico, 2026-09-30)

Hoy no existe ninguna UI de alta para `catalogo_acabados` — los únicos 2 registros son mock
(`lib/data/fixtures.ts:407-410`). No hay en el repo ningún componente de carga masiva ni tabla
editable (`grep` sin resultados). Sí existen piezas reusables:
- `ImagePicker` (`components/veta/image-picker.tsx`) ya sube múltiples archivos en paralelo con
  preview optimista (`agregarArchivosLote`, mejorado en t-171) — pero su contrato es `value: string[]`
  plano, sin metadata por archivo.
- `EntityFields` (`lib/forms/`) ya resuelve render genérico de inputs agrupados (usado para ficha
  técnica de ítem, `lib/forms/ficha-tecnica-form-spec.ts`).

**Decisión de Javier (2026-09-30):** lista vertical de filas editables, NO un grid genérico tipo
Excel. Alta en lote = soltar/seleccionar N imágenes genera N filas nuevas prerellenadas con esa
imagen, pendientes de completar. Guardado por fila, independiente (mismo principio de paralelismo que
t-171: nunca bloquear todo el flujo por una operación).

## Zona única afectada

Zona: `app/erp/catalogo/` (nueva sub-ruta) + `components/veta/` (nuevo componente de fila editable)

## Tipo de tarea y riesgo derivado

```
Tipo: UI / visual + CRUD liviano
Riesgo: medio
Frena al humano: no (es aditivo, no toca pantallas existentes)
```

## Archivos afectados

- `app/erp/catalogo/acabados/page.tsx` (crear): pantalla nueva, lista de acabados existentes
  (`store.catalogoAcabados.listar()`) + zona de "soltar imágenes" en la parte superior.
- `components/veta/acabado-admin-row.tsx` (crear): una fila = miniatura (`ImagePicker` modo
  `multiple={false}`, `r2Prefix="catalogo/acabados/"`) + inputs nombre/marca/familia/color/colorHex/
  textura (reusa patrón `EntityFields`) + botón guardar/eliminar propio, con su propio estado de
  pending (no bloquea otras filas).
- `components/veta/erp-sidebar.tsx` (modificar, 1 línea): link de navegación a la nueva ruta.
- Reusa las server actions creadas en t-173 (`crearAcabadoCatalogoAction`,
  `actualizarAcabadoCatalogoAction`) — sin crear acciones nuevas.

## Flujo de alta en lote (mecánica concreta)

1. Zona de drop/selección múltiple en la parte superior de la pantalla (mismo mecanismo de
   `ImagePicker.agregarArchivosLote`, pero en vez de agregar URLs a un array, cada URL subida dispara
   la creación de una fila local nueva `{ imagenTexturaUrl: url, nombre: '', marca: '', ... }` — SIN
   persistir todavía).
2. Cada fila nueva aparece editable e incompleta (nombre vacío) en la lista, con foco visual.
3. El usuario completa nombre/marca/color por fila y pulsa guardar en ESA fila → dispara
   `crearAcabadoCatalogoAction` solo para esa fila.
4. Filas que no se completan quedan en estado local "borrador" (no se pierden al navegar dentro de la
   misma sesión de pantalla, pero tampoco se persisten solas — guardar es una acción explícita por
   fila, consistente con el resto del ERP que no auto-guarda fichas técnicas a medio completar).

## Criterios de aceptación mecánicamente verificables

1. En `/erp/catalogo/acabados`, soltar/seleccionar N imágenes genera N filas nuevas prerellenadas con
   esa imagen (verificable manualmente en `npm run dev`).
2. Cada fila guarda de forma independiente (una request por fila, no secuencial ni bloqueante para las
   demás) — inspección de código: sin `for...await` global sobre las filas.
3. Un acabado existente se puede editar (nombre/marca/familia/color/imagen) y eliminar desde la misma
   lista.
4. `npx tsc --noEmit` limpio.
5. `npx eslint .` sin errores ni warnings nuevos en los archivos tocados.
6. Link de navegación visible en `erp-sidebar.tsx` apunta a la ruta nueva.

## Comandos de verificación

```
npx tsc --noEmit
npx eslint app/erp/catalogo/acabados/page.tsx components/veta/acabado-admin-row.tsx components/veta/erp-sidebar.tsx
npm run dev   # QA manual de Javier: subir 3-5 imágenes de prueba, completar y guardar, editar una, eliminar otra
```

## Notas

- Depende de t-173 (columna `marca` + acciones de store). No depende de t-175.
- No se construye aquí ningún componente de "grid editable" reusable genérico — es una lista de filas
  concreta para acabados, deliberadamente no abstraída todavía (ver nota de alcance en plan_t-175.md
  sobre diferir la generalización hasta tener un segundo caso real).
- `r2Prefix="catalogo/acabados/"` sigue la convención ya en uso (`"catalogo/"`,
  `"catalogo/ficha-tecnica/"`, `"cotizador/espacio"`, etc., ver `AGENTS.md`/diagnóstico previo).
