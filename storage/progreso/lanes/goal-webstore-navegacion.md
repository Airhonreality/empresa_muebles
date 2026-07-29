# Lane: navegación

## Objetivo

Definir y documentar la mejora de navegación principal del proyecto para que la entrada a las áreas públicas y operativas sea clara, consistente y fácil de mantener.

## Archivos permitidos

- `storage/progreso/lanes/goal-webstore-navegacion.md`

## Archivos prohibidos

- Cualquier archivo fuera de `storage/progreso/lanes/`
- `storage/db/**`
- `src/**`
- `packages/**`
- `agnostic.config.ts`

## Criterios de aceptación

- El objetivo queda acotado a navegación y no mezcla páginas, SEO ni integración de datos.
- La superficie permitida y prohibida queda explícita.
- El documento describe una base de trabajo utilizable por otras lanes sin ambigüedad.
- El estado inicial queda registrado como documentación pendiente de ejecución.

## Estado

`implementado_verificado`

## Evidencia

- Menú implementado en `src/components/specialized/VetaHeader.tsx` y `src/components/specialized/public/PublicSiteChrome.tsx`.
- Build de producción completado; las rutas públicas nuevas aparecen en el manifiesto de Next.js.
