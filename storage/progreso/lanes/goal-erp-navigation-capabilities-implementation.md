# Lane: navegación ERP y capacidades

Estado: implementada en la rama `goal/erp-navigation-capabilities`; pendiente de promoción humana.

## Resultado

- Se añadió un puerto genérico y opcional `applicationShell` al contrato de configuración del motor.
- El fork registra `ErpApplicationShell` y conserva el fallback del layout anterior cuando el puerto no existe.
- La autoridad del menú es un solo registro `nav_erp_main` en `app_navbars`; los menús por rol anteriores quedan fuera del runtime de esta shell.
- El menú global queda reducido a Inicio, Comercial, Proyectos, Producción, Finanzas, Calendario, Catálogo y Más.
- Proyectos tiene una entrada real que compone `proyectos`, `espacio_variantes` y `ordenes_trabajo`; no sustituye el tablero de ejecución de Producción.
- Inicio tiene una entrada real `/app/dashboard` con indicadores de proyectos vigentes, órdenes abiertas, obligaciones pendientes y tareas vencidas.
- Cada ruta interna declara `allowed_lists`; además existe una comprobación server-side genérica antes de renderizar la ruta.

## Evidencia

- `npm run validate:storage`: PASS.
- `npm run validate:encoding`: PASS.
- Tests de capacidades y autorización: 6/6 PASS.
- Todas las entradas navegables de `nav_erp_main` existen en `page_routes.json`.
- `tsc` no reporta errores en los archivos de esta lane. El repositorio conserva errores previos fuera de la lane en `VetaHome`, `VetaPortfolio` y scripts de mantenimiento.

## Gate pendiente

El puerto `applicationShell` es una mejora genérica del engine, no una regla de negocio. Requiere revisión del seed antes de sincronizarlo a otras forks. La configuración concreta, la shell y las rutas ERP permanecen en la capa fork.
