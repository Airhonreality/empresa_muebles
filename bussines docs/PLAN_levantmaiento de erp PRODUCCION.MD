De acuerdo. He analizado los documentos y he compilado un plan de acción detallado para implementar el subsistema de control de producción, siguiendo estrictamente las reglas y patrones definidos en tu arquitectura.

Este plan se enfoca en crear la base de datos, las rutas y los componentes necesarios para la vista de producción, tal como se describe en el `erp_architecture_blueprint.md`.

### Plan: Implementación del Subsistema de Control de Producción

Este plan establece los pasos para crear los esquemas de datos, las rutas y los componentes de UI para el módulo de producción, destinado a coordinadores y carpinteros.

**Fase 1: Modelado de Datos y Configuración Inicial**

1.  **Crear el schema `proveedores`**: Usaremos el CLI para definir la entidad que almacena los proveedores de materiales.
2.  **Crear el schema `ordenes_trabajo`**: Definiremos la entidad central que representa una orden de producción, vinculada a una cotización.
3.  **Crear el schema `tareas_produccion`**: Definiremos las tareas individuales que componen una orden de trabajo, asignadas a operarios.
4.  **Compilar tipos de TypeScript**: Ejecutaremos `npm run agnostic:compile` para que los nuevos esquemas estén disponibles en el código con tipado estático.

**Fase 2: Creación de la Interfaz de Producción**

5.  **Crear la ruta `/app/production`**: Usaremos el CLI para registrar la nueva página en el sistema de rutas del ERP.
6.  **Crear el componente `ProductionDashboard`**: Desarrollaremos un nuevo componente especializado en `src/components/specialized/ProductionDashboard.tsx`. Este componente renderizará condicionalmente la vista para el "Coordinador" o para el "Carpintero" según el rol del usuario.
7.  **Registrar el nuevo bloque**: Actualizaremos agnostic.config.ts para que el motor de renderizado reconozca el `production_dashboard`.
8.  **Asociar el bloque a la ruta**: Usaremos el CLI para colocar el nuevo bloque `production_dashboard` en la ruta `/app/production`, vinculándolo al contexto `ordenes_trabajo`.

**Fase 3: Desarrollo de las Vistas Específicas**

9.  **Implementar la vista del Coordinador**: Dentro de `ProductionDashboard`, crearemos una vista de tabla (`AgnosticTable`) o Kanban que muestre todas las `ordenes_trabajo` y su estado.
10. **Implementar la vista del Carpintero**: Dentro de `ProductionDashboard`, crearemos una lista de tareas (`AgnosticCollection`) que muestre solo las `tareas_produccion` asignadas al usuario actual, ordenadas por prioridad.

**Archivos Relevantes**
*   erp_architecture_blueprint.md: El documento guía que define los requisitos.
*   `Comandos CLI.md`: Las instrucciones para usar la herramienta `agno` y no editar JSONs manualmente.
*   `Interfaces Custom.md`: El inventario de componentes de UI que usaremos para construir las vistas.
*   agnostic.config.ts: Donde registraremos el nuevo componente especializado.
*   `src/components/specialized/ProductionDashboard.tsx`: El nuevo archivo que contendrá la lógica de la interfaz de producción.

**Verificación**
1.  Al finalizar, un usuario con rol "Coordinador" que navegue a `/app/production` deberá ver una tabla con todas las órdenes de trabajo.
2.  Un usuario con rol "Carpintero" que navegue a la misma ruta deberá ver únicamente su lista de tareas para el día.
3.  Los comandos del CLI deberán ejecutarse sin errores y los cambios se reflejarán en los archivos de storage.

Este plan sigue el "Diseño Axiomático" y las reglas de tu proyecto, asegurando que la nueva funcionalidad se integre de forma limpia y mantenible.

