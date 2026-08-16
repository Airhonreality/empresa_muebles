# Plan: la card del Kanban Comercial (P-01) implementa la jerarquía cliente→proyecto→dirección, badge minimalista y controles rápidos de estado in-card, según `disenio_p01_kanban_comercial.md` §"Revisión v3"

**ID de tarea**: t-136
**Zona**: `app/erp/comercial/` (UI de producto) + `app/globals.css` (tokens D4 nuevos del badge)
**Tipo**: UI / visual
**Riesgo**: bajo (sin cambio de schema, sin nueva máquina de estados — reusa `parametros.transiciones_proyecto` ya validada)

## Objetivo

La card de proyecto en `/erp/comercial` deja de mostrar precio y usa: título=cliente, subtítulo=proyecto·tipo, detalle=dirección; el badge de estado pasa de pastilla con borde a punto minimalista pulsante con halo; y aparecen dos botones rápidos (Avanzar/Retornar) que saltan al destino canónico de la matriz de transiciones vigente, junto al menú ⋮ existente. Aprobado por Javier en vivo (checkpoint informal: "implementa", tras revisar `disenio_p01_kanban_comercial.md` v3).

## Archivos afectados

- `app/erp/comercial/page.tsx`: modificar — reescribe `ProjectCard` (jerarquía, badge, controles); agrega cálculo de variantes activas/total a `projectStats`.
- `app/globals.css`: modificar — agrega 5 tokens propuestos por el diseño (`--badge-dot-size`, `--badge-dot-pulse-duration`, `--badge-dot-glow`, `--badge-label-size`, `--badge-label-weight`) + keyframe/utility `animate-dot-mini` (reusa el patrón ya existente de `animate-dot-subtle`, con `currentColor` + `box-shadow` para el halo).

## Criterios de aceptación

1. La card no renderiza ningún monto en COP (el `total_estimado` deja de imprimirse).
2. El primer texto visible de la card es `clientes.nombre`; el segundo es `proyectos.nombre_proyecto` + `proyectos.tipo_proyecto`; el tercero es `proyectos.direccion_obra` (o se omite la línea si es `null`, sin dejar hueco visual roto).
3. El badge de estado no tiene borde ni caja de fondo: es un punto de `--badge-dot-size` + label a `--badge-label-size`/peso 300.
4. En columnas editables el punto pulsa (glow vía `box-shadow`); en columnas solo-lectura (Producción, Archivo) el punto es estático (sin clase de animación).
5. El botón "Avanzar" solo aparece si el destino canónico de la tabla v3.3 está en `estadosPosibles` (intersección ya validada contra `parametros.transiciones_proyecto`); mismo criterio para "Retornar".
6. `npx tsc --noEmit` = 0 errores nuevos.
7. `npx eslint app/erp/comercial app/globals.css` = 0 errores nuevos.
8. `next build` no introduce errores nuevos en `/erp/comercial` (los `ECONNREFUSED` de otras rutas por falta de DB local son preexistentes y esperados).

## Verificación

- `npx tsc --noEmit` (criterios 6)
- `npx eslint app/erp/comercial/ app/globals.css` (criterio 7)
- Inspección de código + lectura del diff contra `disenio_p01_kanban_comercial.md` §"Revisión v3" (criterios 1-5)
- `npx next build` (criterio 8)

## Notas

- El botón "Archivar" (perdida/cancelada) ya existía en el código antes de esta tarea y no está en el alcance de la tabla v3.3 (que solo define Avanzar/Retornar). Se conserva sin rediseñar — no es parte del pedido de Javier y quitarlo sería alcance no autorizado.
- Colores del punto de estado: se reusa el mapeo de color ya vigente por columna en `COLUMNAS_KANBAN` (stone/sky/amber/emerald/red/gray), no la paleta amber/blue/orange/violet/green/muted que cita el §2 histórico del documento de diseño — esa paleta nunca estuvo implementada en el código real y no es parte de este cambio.
- Los labels "Proyecto a medida"/"Servicio técnico" de `tipoProyecto` quedan marcados en el diseño como propuestos pendientes de `glosario_h07.md`; se muestran igual en la card (Javier ya vio y aprobó el diseño completo), pero quedan pendientes de la actualización formal del glosario como tarea aparte.
