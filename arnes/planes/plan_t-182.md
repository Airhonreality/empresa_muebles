# Plan t-182 — Auditoría de huérfanos, columnas y relaciones

## Objetivo
Producir evidencia mecánica para depurar el ERP sin borrar a ciegas. El entregable es un
informe y un plan de retiro por fases; **ninguna eliminación destructiva ocurre en esta tarea**.

## Alcance
- ~70 tablas de `lib/db/schema.ts`.
- Rutas de `app/erp/**` y entradas de `components/veta/erp-sidebar.tsx`.
- Server Actions de `lib/data/actions/**`, contratos de `lib/data/contracts.ts`, stores mock/drizzle.
- Scripts de `scripts/**`, tests y migraciones.
- Dependencias del sitio público (`app/(publico)/**`, `app/(tienda)/**`, APIs públicas).

## Método
1. Inventario cruzado tabla ↔ columnas ↔ FKs ↔ rutas ↔ acciones ↔ componentes ↔ tests.
2. Evidencia de uso:
   - `rg` de imports, llamadas y strings de tabla/columna;
   - conteo de filas y última escritura por tabla en la base real (solo lectura);
   - dependencias de vistas/funciones de Postgres (`pg_depend`);
   - revisión de navegación y links.
3. Clasificación por elemento:
   - `esencial` (ciclo núcleo: cotizador, proyectos, clientes, catálogo, contratos, finanzas simple);
   - `soporte` (auth/equipo, parámetros, documentos);
   - `congelado` (funcional pero fuera de foco);
   - `dependencia_publica` (portafolio, garantía, tienda);
   - `candidato_eliminar` (sin lecturas/escrituras/datos/dependencias).
4. Plan de retiro por fases:
   - Fase A: sidebar y rutas;
   - Fase B: Server Actions y contratos del store;
   - Fase C: tablas/columnas en migraciones separadas, con respaldo y rollback.
5. Informe final con tabla de decisiones y lista explícita de lo que NO se toca.

## Reglas
- "Vacío en la base" no es evidencia de desuso: hay columnas escritas por flujos de pago.
- Cada lote destructivo requiere checkpoint del Supervisor.
- No mezclar esta tarea con funcionalidad nueva (t-181).
