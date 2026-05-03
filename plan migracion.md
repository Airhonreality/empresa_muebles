# 🏗️ Mapa de Migración: Framework Agnóstico (Core Engine)

Para crear la réplica agnóstica para el ERP, estos son los componentes base que debemos extraer y limpiar de toda referencia específica para convertirlos en un framework universal.

## 1. El Cerebro (Core Logic)
Estos archivos son el motor de la agnosticidad. No se tocan, solo se renombran sus constantes si es necesario.
*   `src/core/SovereignContext.tsx`: El proveedor de estado global.
*   `src/core/AppState.ts`: La única fuente de verdad reactiva.
*   `src/core/logic/DataConnector.ts`: El servicio de comunicación.
*   `src/core/logic/DataVault.ts`: Persistencia local.
*   `src/core/hooks/useDataSync.ts`: El hook que sincroniza componentes con el estado.

## 2. El Intérprete (Visual Engine)
Los componentes que proyectan la materia basada en contratos JSON.
*   `src/ui/components/EntityComposer.tsx`: El constructor de layouts por bloques.
*   `src/ui/components/DataCard.tsx`: El componente visual base de información.
*   `src/ui/components/Grid.tsx`: El contenedor de rejilla inteligente.
*   `src/ui/components/EntityRelations.tsx`: El visualizador de relaciones entre entidades.
*   `src/ui/AppRouter.tsx`: El sistema de rutas basado en identificadores.

## 3. La Forja (The Builder)
La interfaz administrativa para gestionar las entidades.
*   `src/ui/components/EntityBuilder.tsx`: El panel de administración agnóstico.

## 4. Evolución del Constructor de Landings
Para el ERP, el constructor de landings (MateriaComposer) ahora soporta:
*   `DYNAMIC_GRID`: Ya no pide "proyectos", pide `classes: ["ENTITY_ORDER", "ENTITY_CLIENT"]`.
*   `GALLERY`: Visualización de activos físicos.
*   `SYNC`: Vinculación de una entidad con otra (ej: Vincular una Factura con su Cliente).

---

## 🚀 Próximos Pasos para el ERP
1.  **Clonar este mapa**: Crear un repo vacío.
2.  **Limpieza de Estética**: Mover los estilos específicos de Nomon a un `theme-nomon.css` y dejar un `theme-agnostic.css` base.
3.  **Inyección de Esquemas**: Configurar el Bridge para que apunte al nuevo repositorio de datos del ERP.
4.  **Capacidades ERP**: Añadir bloques tipo `FORM_BLOCK` y `CHART_BLOCK` al `MateriaComposer`.

ruta origen del repo:
C:\Users\javir\Documents\DEVs\NOMON WEB