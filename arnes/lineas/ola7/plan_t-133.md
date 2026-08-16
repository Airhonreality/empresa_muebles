# Plan: la grilla pública de portafolio muestra la foto real del proyecto

**ID de tarea**: t-133
**Zona**: sitio público (`app/(publico)/portafolio/`)
**Tipo**: UI / visual
**Riesgo**: bajo

## Objetivo

La grilla pública `/portafolio` muestra la foto real del proyecto (`imagenPortafolioUrl` o la primera de `galeriaPortafolioUrl`) en cada tarjeta, en vez de un placeholder con la inicial del título siempre — sin importar si el proyecto tiene foto o no.

## Contexto

Hallazgo real de una auditoría externa (2026-08-15), verificado contra código: `PortafolioCard` en `app/(publico)/portafolio/page.tsx` nunca leía `imagenPortafolioUrl`/`galeriaPortafolioUrl`, así que ningún proyecto publicado mostraba foto en la grilla — el detalle (`/portafolio/[slug]`) sí las renderiza correctamente. La causa NO es (a diferencia de lo que planteaba la auditoría) que falte wiring a Neon/R2: ambas rutas ya leen del mismo store (`useDataStore()`, mock o drizzle según `DATA_IMPL`) — es un componente que directamente no tenía el `<img>`.

## Archivos afectados

- `app/(publico)/portafolio/page.tsx` (modificar): `PortafolioCard` renderiza `<img>` cuando `imagenPortafolioUrl || galeriaPortafolioUrl[0]` existe; mantiene el placeholder de inicial como fallback cuando el proyecto no tiene ninguna foto cargada.

## Criterios de aceptación

1. Un proyecto de portafolio con `imagenPortafolioUrl` no nulo muestra esa imagen como `<img>` en su tarjeta de la grilla `/portafolio`.
2. Un proyecto con `imagenPortafolioUrl: null` pero `galeriaPortafolioUrl` no vacío muestra la primera imagen de la galería.
3. Un proyecto sin ninguna imagen (ambos campos vacíos) sigue mostrando el placeholder de inicial (sin romper el diseño existente).
4. `npx tsc --noEmit` sale sin errores.
5. `npx eslint .` no agrega errores nuevos en el archivo modificado (los warnings preexistentes de `<img>` vs `next/image` son aceptables — mismo patrón que el resto del sitio público).
6. `DATA_IMPL=mock npx next build` compila las 31 rutas sin error nuevo.

## Verificación

- `npx tsc --noEmit`: criterio 4.
- `npx eslint "app/(publico)/portafolio/**/*.tsx"`: criterio 5.
- `DATA_IMPL=mock npx next build`: criterio 6.
- Inspección directa del componente (criterios 1-3): no hay fixture con imagen real en `lib/data/fixtures.ts` para un smoke test visual en mock; se verifica por lectura de código y por los dos casos ya cubiertos por el detalle (`[slug]`), que usa la misma fuente de datos.

## Notas

Ejecutado en la misma sesión que t-134 por instrucción explícita del Supervisor (2026-08-15) para dejar el portafolio público listo para pruebas reales apenas se complete el corte a Vercel con `DATA_IMPL=drizzle`.
