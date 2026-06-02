
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

