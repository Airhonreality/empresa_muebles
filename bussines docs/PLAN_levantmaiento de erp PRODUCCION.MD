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

Entendido. Agradezco la aclaración. El feedback es crucial para que la herramienta se ajuste al flujo de trabajo real y no a una abstracción genérica. Olvidemos el plan anterior; esta nueva visión es mucho más potente y específica.

He re-diseñado el plan de la interfaz de producción para que se alinee con esta lógica de negocio de un "directorio de proyectos" navegable, optimizado para la agilidad en campo y con una jerarquía de información clara.

### Nuevo Plan de Interfaz para Control de Producción (`/app/production`)

**Visión:** La pantalla de producción será un **Directorio de Proyectos Activos**, un lienzo de control centralizado que permite una navegación profunda desde la vista macro (todos los proyectos) hasta el detalle micro (una tarea o un modelo 3D específico), todo dentro de una misma pantalla para no perder el contexto.

**Estructura y Componentes Clave:**

#### 1. Lienzo Principal: El Árbol de Proyectos

*   **Componente Raíz:** `AgnosticCollection` renderizando las `ordenes_trabajo`.
*   **Categorización:** Se usarán `Tabs` en la parte superior para el filtro principal: **"En Curso"** y **"Garantía/Post-Venta"**. Esto segmenta el directorio completo.
*   **Vista de Proyectos:**
    *   Cada `orden_trabajo` se mostrará como un `Card` expandible (usando un `Accordion` como contenedor principal).
    *   **Contenido del `Card` (Plegado):**
        *   Título: `codigo_orden` y nombre del `cliente`.
        *   Progreso: Una barra de progreso visual (calculada a partir de las `tareas_produccion` completadas).
        *   Fecha de Entrega: `fecha_entrega` con un indicador de urgencia si está próxima.

#### 2. Vista Expandida: El Detalle del Proyecto (2 Columnas)

Al tocar un `Card` de proyecto, este se expande *inline* mostrando un layout de dos columnas (en móvil, la segunda columna aparecerá debajo de la primera).

*   **Columna 1: Lista de Pendientes del Proyecto**
    *   **Componente:** `AgnosticCollection` anidada, mostrando las `tareas_produccion` relacionadas con esa `orden_trabajo`.
    *   **Interacción:** Cada tarea será un `Accordion` o un `Collapsible` de Radix. Al tocarla, se expandirá para mostrar `notas`, `operario_id` asignado y botones de acción (`Pausar`, `Finalizar`).

*   **Columna 2: Información Ágil y Acciones Clave**
    *   **Componente:** Un `Card` o un contenedor simple con una lista de acciones.
    *   **Contenido:**
        1.  **Dirección:** La dirección del proyecto con un `Button` de ícono (`Copy`) para copiarla al portapapeles.
        2.  **Botón "Ver Modelo 3D":** Un `Button` prominente que activa el modal del visualizador.

#### 3. El Visualizador 3D (Modal de Inmersión)

Al presionar "Ver Modelo 3D", se abrirá un `Sheet` o `Dialog` que ocupará gran parte de la pantalla para una experiencia inmersiva.

*   **Navegación Principal (Pestañas por Espacio):**
    *   Se usarán `Tabs` en la parte superior. Cada `Tab` corresponde a un `espacio_variante` de la cotización original (ej. "Cocina", "Baño", "Closet").
*   **Contenido de cada Pestaña de Espacio:**
    *   **Visualizador 3D:** El componente de visualización WebGL/Three.js mostrando los modelos 3D (`.glb`) de los `items_variante` que pertenecen a ese espacio.
    *   **Sub-Navegación (dentro del espacio):**
        *   **Pestaña "Ítems Cotizados":** Una lista de los `items_variante` de ese espacio, para relacionar el modelo 3D con el despiece.
        *   **Pestaña "Pendientes del Espacio":** Una lista filtrada de las `tareas_produccion` que aplican *únicamente* a ese espacio.
        *   **Pestaña "Multimedia":** Galería de imágenes o documentos adjuntos a ese espacio.

**Flujo de Navegación (Ergonomía Cognitiva):**

1.  **Vista Macro:** El usuario llega a `/app/production` y ve la lista de proyectos en curso.
2.  **Selección de Contexto:** Toca el proyecto en el que va a trabajar (ej. "OT-2026-005 - Cliente Pérez").
3.  **Vista de Proyecto:** El proyecto se expande. El usuario puede revisar los pendientes generales o copiar la dirección.
4.  **Inmersión en Detalle:** Toca "Ver Modelo 3D".
5.  **Navegación Espacial:** Dentro del modal, cambia a la pestaña "Cocina".
6.  **Análisis Micro:** Rota el modelo 3D de la cocina, revisa la lista de ítems y las tareas específicas para el armado de la cocina.
7.  **Retorno:** Cierra el modal y vuelve a la vista de proyecto expandida, sin haber perdido nunca el contexto del proyecto "OT-2026-005".
8.  **Cambio de Contexto:** Pliega el proyecto actual y expande otro.

Este diseño satisface la necesidad de una estructura jerárquica (Árbol de Nodos), prioriza la información clave para el trabajo en campo (móvil-primero) y mantiene el contexto del usuario en todo momento, reduciendo la carga cognitiva.

Excelente. He integrado tus nuevos requerimientos en un plan de acción final, mucho más detallado y modular.

Este plan no solo construye la interfaz de producción, sino que también establece la estructura de navegación del ERP, todo bajo los principios de diseño axiomático y utilizando el inventario de componentes de `Interfaces Custom.md` para garantizar una implementación no monolítica.

### Plan de Implementación Detallado: UI de Producción y Navegación ERP

**Principio Axiomático Guía:** Cada componente tendrá una única responsabilidad funcional (Axioma 1: Independencia). La información presentada será la mínima necesaria para la acción requerida (Axioma 2: Minimalismo de Información).

---

#### **Fase 1: Modelado de Datos (Ya iniciado)**

Esta fase consiste en definir la estructura de la información.

1.  **Crear Schemas Faltantes:**
    *   **Acción:** Ejecutar los comandos del CLI `agno` para crear los schemas `proveedores` y `tareas_produccion`, tal como se describe en el `erp_architecture_blueprint.md`. El schema `ordenes_trabajo` ya fue creado.
    *   **Justificación Axiomática:** Cada schema representa una "cosa" fundamental e independiente en el dominio del negocio.

2.  **Compilar Tipos:**
    *   **Acción:** Ejecutar `npm run agnostic:compile`.
    *   **Justificación Axiomática:** Genera un contrato de información explícito (`agnostic-schemas.ts`), asegurando que todos los componentes hablen el mismo lenguaje de datos sin ambigüedad.

---

#### **Fase 2: Estructura de Navegación y Acceso (Menús y Rutas)**

Esta fase crea el "esqueleto" de la aplicación, separando claramente el mundo público del ERP privado.

3.  **Crear el Menú del ERP (`/app`):**
    *   **Acción:** Usar el CLI para crear una barra de navegación principal para el ERP.
        *   `npx tsx agno.ts create-nav erp_main brand:label:"Mi Empresa":path:/app/dashboard`
        *   Luego, agregar los enlaces permitidos:
        *   `npx tsx agno.ts add-link erp_main "Dashboard" /app/dashboard Home`
        *   `npx tsx agno.ts add-link erp_main "Cotizaciones" /app/quoting FileText`
        *   `npx tsx agno.ts add-link erp_main "Catálogo" /app/catalog HardDrive`
        *   `npx tsx agno.ts add-link erp_main "Producción" /app/production Factory`
    *   **Justificación Axiomática:** Se crea una única fuente de verdad (`erp_main`) para la navegación del ERP. El motor se encargará de filtrar las rutas que el usuario no tiene permiso para ver, manteniendo la independencia funcional.

4.  **Crear el Menú Público (`/`):**
    *   **Acción:** Crear una barra de navegación separada para el sitio público.
        *   `npx tsx agno.ts create-nav public_main brand:label:"Mi Empresa":path:/`
        *   `npx tsx agno.ts add-link public_main "Portafolio" /portfolio GalleryHorizontal`
        *   `npx tsx agno.ts add-link public_main "Diseño" /design Brush`
        *   `npx tsx agno.ts add-link public_main "Contacto" /contact Mail`
    *   **Justificación Axiomática:** Separa completamente la navegación pública de la privada, evitando cualquier acoplamiento.

5.  **Implementar el Layout Privado (`src/app/app/layout.tsx`):**
    *   **Acción:** Modificar este layout para que incluya:
        *   El componente `<AgnosticNavbar nav_id="erp_main" />`.
        *   Un `<AgnosticBelt />` minimalista para mostrar la ubicación actual del usuario.
        *   Un menú de usuario (usando `Popover` o `DropdownMenu` de Radix) que muestre el nombre del usuario activo y un botón de "Cerrar Sesión".
    *   **Justificación Axiomática:** Este layout actúa como el "chasis" del ERP, proveyendo contexto y navegación consistentes sin conocer el contenido específico de cada página.

---

#### **Fase 3: Construcción de la Interfaz de Producción (No Monolítica)**

Descomponemos la compleja interfaz del directorio de proyectos en componentes especializados, cada uno con una única función.

6.  **Crear el Componente `ProjectNode` (`src/components/specialized/ProjectNode.tsx`):**
    *   **Responsabilidad:** Renderizar un único proyecto (`orden_trabajo`) como una tarjeta expandible.
    *   **Componentes a usar:** `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`, `Card`, `Progress`.
    *   **Lógica interna:** Recibirá una `orden_trabajo` como prop. El `AccordionTrigger` mostrará el resumen (código, cliente, progreso). El `AccordionContent` contendrá las dos columnas de detalle.

7.  **Crear el Componente `ProjectDetails` (`src/components/specialized/ProjectDetails.tsx`):**
    *   **Responsabilidad:** Renderizar el contenido de las dos columnas cuando un `ProjectNode` se expande.
    *   **Componentes a usar:** Layout de dos columnas (Flexbox/Grid), `Button` con ícono `Copy`, y el botón que abrirá el modal 3D.
    *   **Lógica interna:** Recibirá la `orden_trabajo` y las `tareas_produccion` asociadas. Renderizará la lista de pendientes en la primera columna y la información ágil en la segunda.

8.  **Crear el Componente `Viewer3DModal` (`src/components/specialized/Viewer3DModal.tsx`):**
    *   **Responsabilidad:** Gestionar el modal del visualizador 3D.
    *   **Componentes a usar:** `Dialog` o `Sheet` para el modal, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` para la navegación por espacios.
    *   **Lógica interna:**
        *   Recibirá los `espacio_variantes` y los `items_variante` de la cotización original.
        *   Usará el patrón de `useRef` para el renderizador de Three.js, como se especifica en `Interfaces Custom.md`, para evitar fugas de memoria.
        *   Cada `TabsContent` mostrará el modelo 3D y las sub-pestañas de "Ítems" y "Pendientes" para ese espacio.

9.  **Crear el Componente Orquestador `ProductionDirectory` (`src/components/specialized/ProductionDirectory.tsx`):**
    *   **Responsabilidad:** Ser el punto de entrada principal. Orquesta todos los demás componentes.
    *   **Componentes a usar:** `Tabs` para "En Curso" / "Garantía", `AgnosticCollection`.
    *   **Lógica interna:**
        *   Recibirá todas las `ordenes_trabajo` como `records` desde el motor.
        *   Usará `useRelationData` para cargar eficientemente las `tareas_produccion` y `clientes` necesarios.
        *   Filtrará los proyectos según la pestaña activa ("En Curso" / "Garantía").
        *   Iterará sobre los proyectos filtrados, renderizando un componente `ProjectNode` para cada uno.

---

#### **Fase 4: Registro y Ensamble Final**

10. **Registrar los Nuevos Bloques:**
    *   **Acción:** Editar agnostic.config.ts y registrar el bloque orquestador.
        ```typescript
        // agnostic.config.ts
        // ...
        blocks: {
          // ... otros bloques
          production_directory: () => import('./src/components/specialized/ProductionDirectory'),
        }
        ```
    *   **Justificación Axiomática:** Hacemos que el motor conozca nuestro nuevo componente sin acoplarlo al núcleo.

11. **Crear la Ruta y Vincular el Bloque:**
    *   **Acción:** Usar el CLI para crear la página y asignarle el bloque.
        *   `npx tsx agno.ts create-route /app/production "Directorio de Producción"`
        *   `npx tsx agno.ts add-block /app/production production_directory context:ordenes_trabajo`
    *   **Justificación Axiomática:** Declaramos la existencia de la página y le decimos qué "función" (bloque) debe renderizar, manteniendo la separación entre la definición de la ruta y su implementación visual.

Este plan descompone la tarea en partes funcionalmente independientes, utiliza el sistema de diseño existente y sigue las reglas de la arquitectura para una implementación limpia, escalable y no monolítica.

Se han creado 8 tareas pendientes