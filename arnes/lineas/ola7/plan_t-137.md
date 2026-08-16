# Plan: el hub de proyecto (`/erp/proyectos/[proyectoId]`) reemplaza la grilla de emojis por un timeline de gates derivado + agrega navegación Nodos→Espacios→Módulos→Ítem, según `disenio_dashboard_proyecto.md` (alcance recortado: Slice 1+2, sin overlays)

**ID de tarea**: t-137
**Zona**: `app/erp/proyectos/[proyectoId]/` (solo `page.tsx`, no las subrutas)
**Tipo**: UI / visual
**Riesgo**: bajo — **sin cambio de schema** (N1-N5 del diseño quedan explícitamente fuera de este slice)

## Alcance aprobado por Javier (checkpoint verbal, 2026-08-15): "Slice 1+2"

El diseño completo (`disenio_dashboard_proyecto.md`) tiene 12 componentes y 4 tipos de overlay. Esta tarea implementa SOLO:

1. **Timeline de gates derivado** (reemplaza la grilla de cards/emojis actual). Nodos reales: E-18 Esquema, E-21 Recepción, E-24 Calidad, E-33 Desfase (transversal), E-20 Caja (transversal), E-23 Citación (señal), E-25 Instalación, E-26 Entrega. Estilo: chip minimalista igual al badge de t-136 (punto + label mini, sin bordes, pulso solo en el nodo "actual"). **Cero emojis** (Javier lo pidió explícito: "cards estáticas y emojis hardcodeados").
2. **Bifurcaciones visuales**: cada `reprocesos.porProyecto(proyectoId)` con `origen` en {schema, calidad, instalacion} se pinta como rama junto al nodo del gate correspondiente (E-18/E-24/E-25). **Sin distinguir abierta/cerrada** — eso requiere `reprocesos.estado` (N1), que NO existe hoy y no se agrega en este slice (riesgo de schema, fuera de alcance).
3. **Árbol operativo Nodos→Espacios→Módulos→Ítem/planos**: navegación con `store.espacios.porProyecto()` → `store.modulos.porProyecto()` (agrupados por `espacioVarianteId` si el campo existe, si no por proyecto completo) → click en módulo muestra `store.modulosArtefactos.porModulo()` + `store.items.porVariante()` del espacio.
4. **Panel de dirección y datos de instalación**: `proyecto.direccionObra` + `store.instalaciones.porProyecto()` (fechas, observaciones, fotos) + fecha prevista si `store.cronogramas.porProyecto()`/`cronogramaEtapas` están disponibles.

## Explícitamente FUERA de este slice (no lo implementes)

- Los 4 overlays (`GateOverlay`, `OverlayRetoma`, `VeredictoModal`, `QuickActionModal`) — las acciones (Aprobar/Rechazar schema, Retoma, Cronograma, etc.) **siguen navegando a sus páginas completas existentes** (`/retoma`, `/desarrollo`, `/cronograma`, `/calidad`, `/instalacion`, `/entrega`, `/documentos`, `/portafolio`) — **conserva la grilla de tarjetas "Ir a X" tal cual existe hoy**, solo muévela debajo del timeline/árbol nuevos.
- N1-N5 del diseño (cualquier columna/tabla nueva) — cero cambios de schema.
- Tests dedicados (`__tests__/dashboard/*.test.ts`) — no se piden en este slice, la verificación es tsc/eslint/inspección.
- `bom_materiales` en el panel de ítem: si no existe un método de store para leerlo, se omite (no se inventa).

## Archivos afectados

- `app/erp/proyectos/[proyectoId]/page.tsx`: reescribir — timeline derivado + árbol + panel instalación + grilla "Ir a X" conservada.

## Criterios de aceptación

1. `grep -r "✅\|🔴\|⏳\|⚠️\|📦\|💰\|🔔\|✔️" app/erp/proyectos/[proyectoId]/page.tsx` = 0 resultados.
2. El timeline muestra los gates reales (E-18/E-21/E-24/E-33/E-20/E-23/E-25/E-26) derivados de datos del store (`verificaciones`, `recepcionesMaterial`, `desfasesCronograma` — nombre real puede diferir, verificar en `contracts.ts` —, `citacionesCalidad`, `instalaciones`, `actasEntrega`), nunca asentados a mano.
3. El nodo E-21 (Recepción) y E-20 (Caja) dejan de ser placeholders "sin datos" (usan `recepcionesMaterial.porProyecto()` y `cuentasFinancieras.disponible()`/`obligacionesPendientes` reales — el comentario actual "Badges sin datos: E-21/E-20 requieren métodos porProyecto() no disponibles" ya no aplica, esos métodos sí existen hoy).
4. Bifurcaciones de `reprocesos.porProyecto(proyectoId)` se muestran como rama visual junto al nodo correspondiente (sin distinguir abierta/cerrada).
5. Existe un árbol Espacios→Módulos navegable con al menos 2 niveles (click en espacio muestra sus módulos; click en módulo muestra sus artefactos/ítems si el store los expone).
6. La grilla "Ir a X" (Retoma, Esquema, Cronograma, Calidad, Instalación, Entrega, Documentos, Portafolio) sigue funcionando exactamente igual que hoy (mismos hrefs).
7. `npx tsc --noEmit` = 0 errores nuevos.
8. `npx eslint app/erp/proyectos/` = 0 errores nuevos.

## Verificación

- `grep` de emojis (criterio 1)
- `npx tsc --noEmit` (criterio 7)
- `npx eslint app/erp/proyectos/` (criterio 8)
- Inspección de código contra `disenio_dashboard_proyecto.md` §2.4, §5 (solo los componentes de este slice), §9

## Notas

- El pronunciamiento sobre el hallazgo diferido D-16 (gates por nodo vs. por proyecto) ya está en `disenio_dashboard_proyecto.md` §9: v1 evalúa gates por proyecto, esto NO cambia en este slice.
- Reusa el patrón de chip minimalista de `app/erp/comercial/page.tsx` (t-136): mismo mecanismo de punto+label+pulso vía los tokens `--badge-dot-*`/`--badge-label-*` y la clase `animate-dot-mini` ya agregados a `app/globals.css` — no reinventar un segundo sistema de badges.
