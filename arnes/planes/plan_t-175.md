# plan_t-175 — Cotizador: varios acabados por espacio con texto libre de destino + alta rápida inline

## Objetivo

En el cotizador, un espacio puede tener varios acabados asociados, cada uno con un texto libre que
dice para qué parte del mueble es (ej. "fachadas de módulo X", "mesón de isla"), persistidos de forma
relacional. Además, se puede crear un acabado nuevo (con imagen) sin salir de la pantalla del
cotizador.

## Contexto (diagnóstico, 2026-09-30)

`components/veta/acabado-picker.tsx` ya resuelve selección múltiple contra `catalogo_acabados` + un
input de "tono no catalogado" (`:252-275`), pero persiste contra `espacio_variantes.colores` (jsonb,
`lib/db/schema.ts:263`) vía `app/erp/cotizador/[proyectoId]/page.tsx:2451-2514` — un array plano sin
fila relacional ni texto de destino por acabado seleccionado.

El patrón "crear entidad sin salir de pantalla" ya existe, pero duplicado y no generalizado:
`SmartSearch.onCreateNew` (`components/veta/smart-search.tsx:23-24,160-169`, cableado solo a "ítem
libre" del cotizador) y `HybridClientSelector` (`app/erp/cotizador/new/page.tsx:149-227`, local, un
solo campo, no reusado ni dentro del propio cotizador — `editar-proyecto-modal.tsx` usa un `<select>`
plano sin creación). `arnes/estado.md:16` deja pendiente una "primitiva UI agnóstica de selector/
creador de entidad reusable" — pero este mismo repo ya canceló explícitamente un esfuerzo de
abstracción prematura análogo (`ui-slots`, 2026-09-10, ver
`decision_axiomatica_2026-09-10_header_entidad_y_versionado_propuesta.md`) por sobre-ingeniería: se
diseñó en abstracto antes de tener casos concretos, y terminó sin ningún archivo escrito.

**Decisión de Javier (2026-09-30):** construir el patrón concreto para acabados ahora (igual
simplicidad que el resto del ERP); NO construir todavía la primitiva universal. Si en el futuro
aparece un tercer caso real (más allá de clientes y acabados) que la justifique, ahí se generaliza
extrayendo lo común — no antes.

## Zona única afectada

Zona: `components/veta/acabado-picker.tsx` + `app/erp/cotizador/[proyectoId]/page.tsx` +
`lib/data/` (acciones de `espacio_variante_acabados`, creadas en t-173)

## Tipo de tarea y riesgo derivado

```
Tipo: Lógica de negocio / cálculo (persistencia relacional reemplaza snapshot jsonb)
Riesgo: alto
Frena al humano: sí
```

## Archivos afectados

- `components/veta/acabado-picker.tsx` (modificar):
  - `AcabadoItem`/el array controlado pasa de `(AcabadoItem | string)[]` a un wrapper
    `{ acabado: AcabadoItem; descripcionUso: string }[]` — cada chip seleccionado muestra un input de
    texto libre (el destino) junto al swatch, no solo un botón "×".
  - La sección "Otro tono no catalogado" (`:252-275`) se extiende con un botón "+ Nuevo acabado" que
    abre un modal mínimo (nombre, marca, color, imagen vía `ImagePicker` single) — al guardar, llama a
    `crearAcabadoCatalogoAction` (de t-173) y agrega el resultado a la selección automáticamente,
    mismo patrón que `onCreateNew` de `SmartSearch`.
- `app/erp/cotizador/[proyectoId]/page.tsx` (modificar, `:2451-2514`):
  - El estado `colores` deja de hidratarse desde `espacio.colores` (jsonb) y pasa a hidratarse desde
    `store.espacioVarianteAcabados.listarPorEspacio(espacio.id)` (acción de t-173).
  - El guardado deja de llamar `store.espacios.actualizar(espacio.id, { colores, ... })` para esa
    parte y pasa a llamar `reemplazarAcabadosEspacioAction(espacio.id, items)`.
- `lib/data/actions/acabados.ts` (de t-173, puede requerir ajuste menor de firma si la UI necesita un
  shape distinto al previsto).
- `arnes/tareas/t-175.json` (ya creado), `arnes/planes/plan_t-175.md` (este archivo).

## Criterios de aceptación mecánicamente verificables

1. Un espacio puede guardar N acabados, cada uno con su propio texto de destino, persistidos en
   `espacio_variante_acabados` (no en jsonb).
2. Reabrir el cotizador para ese espacio muestra los acabados ya guardados con su texto de destino
   intacto (round-trip).
3. Se puede crear un acabado nuevo (con imagen) desde el picker del cotizador sin navegar fuera de la
   pantalla, y queda inmediatamente seleccionable en la misma sesión.
4. Ninguna llamada de este flujo escribe en `espacio_variantes.colores` — verificable por
   `grep -n "colores" app/erp/cotizador/[proyectoId]/page.tsx` tras el cambio (sin escrituras nuevas
   en el flujo de guardado de este picker).
5. `npx tsc --noEmit` limpio.
6. `npx eslint .` sin errores ni warnings nuevos en los archivos tocados.
7. La migración de t-173 ya está aplicada y verificada contra producción antes de este deploy
   (precondición, no se re-verifica aquí).

## Comandos de verificación

```
npx tsc --noEmit
npx eslint components/veta/acabado-picker.tsx app/erp/cotizador/[proyectoId]/page.tsx
grep -n "colores" app/erp/cotizador/[proyectoId]/page.tsx
npm run dev   # QA manual de Javier: abrir un espacio, agregar 2 acabados con destino distinto, guardar, recargar, confirmar que persiste
```

## Notas

- Depende de t-173 (tabla + acciones) y t-174 (mismo flujo de creación de acabado, para no divergir el
  form de alta entre la pantalla de administración y el modal inline del cotizador — idealmente ambos
  llaman a la misma acción `crearAcabadoCatalogoAction` con el mismo shape de datos).
- `espacio_variantes.colores` (columna) no se elimina físicamente en esta tarea — solo deja de ser la
  fuente de verdad. Dropear la columna es limpieza futura, una vez confirmado en producción que nada
  más la lee.
- Riesgo "alto" y "frena al humano: sí" porque esta tarea reemplaza la fuente de verdad de un dato ya
  usado en producción (acabados de espacios existentes) — requiere decidir antes de ejecutar si hace
  falta un backfill de los pocos `espacio_variantes.colores` reales que existan hoy en la base de
  producción (verificar conteo real antes de asumir que son solo los 2 mocks de `fixtures.ts`).
- La rama `dev` es la Production Branch de Vercel: cualquier push despliega al dominio público real de
  inmediato (ver `AGENTS.md`).
