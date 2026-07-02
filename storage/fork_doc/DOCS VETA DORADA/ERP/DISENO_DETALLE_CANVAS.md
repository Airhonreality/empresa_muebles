# 📐 Diseño de Detalle: Tablero Canvas en Formato de Filas (Tree Schema)

Este documento establece las especificaciones técnicas y el plano de UI canónico para la reestructuración de los tableros Kanban del ERP Veta de Oro (Comercial y Producción). Sustituimos la diagramación tradicional en columnas verticales por un esquema de árbol vertical de filas colapsables, optimizando el rendimiento cognitivo y la biomecánica en pantallas de cualquier resolución.

---

## 🏛️ 1. Paradigma Arquitectónico y Diseño Axiomático

La transición de columnas a filas colapsables se fundamenta en las siguientes leyes del diseño de software y experiencia cognitiva:

1.  **Axioma 1: Independencia Funcional (Nam P. Suh):**
    *   *Fisiología:* Cada etapa operativa (ej: *Pendiente*, *En Proceso*, *Instalación*) actúa de forma aislada.
    *   *Implementación:* Al estructurar el tablero en filas colapsables independientes, el usuario puede manipular y observar una etapa sin que las demás reclamen ancho de banda visual ni recursos de renderizado.
2.  **Ley de Fitts ($MT = a + b \log_2(1 + D/W)$):**
    *   *Fisiología:* El tiempo de movimiento ($MT$) para avanzar un proyecto en columnas anchas es alto y propenso a errores.
    *   *Implementación:* Reemplazamos la acción de arrastrar y soltar (Drag & Drop) por botones de acción estandarizados en el extremo derecho de cada fila (ej: "Iniciar Fabricación", "Iniciar Instalación"). Esto reduce la distancia ($D$) y optimiza el tamaño del objetivo táctil ($W$), haciendo la transición de etapas instantánea.
3.  **Higiene de la Lectura Web (Layer-Cake Scanning):**
    *   *Fisiología:* En pantallas de alta densidad informativa, la mente escanea saltando entre cabeceras jerárquicas y alineaciones ordenadas.
    *   *Implementación:* Diseñamos las filas del proyecto divididas en 3 columnas estables (Identificación, Tareas Siguientes, Acciones Rápidas) con alineaciones tipográficas dedicadas, maximizando la escaneabilidad en zigzag (*Lawn-Mower Pattern*).

---

## 📐 2. Plano de UI Exacto (Diagramación de Bloques)

El tablero se renderiza en una sola pantalla adaptativa vertical sin desbordamiento horizontal:

```text
+-----------------------------------------------------------------------------+
| CENTRO OPERATIVO (Layout Adaptativo)                                        |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [v] PENDIENTE (3 Proyectos)                                                |
|      +-------------------------------------------------------------------+  |
|      | OT-1002 | Cocina Veta Oro   | Tareas Sig:                         |  |
|      | Cliente: Juan Pérez         | [ ] 1. Corte de tableros (Oper. 1)  |  |
|      | Entrega: 12-Ago-2026        | [ ] 2. Pegado de canto (Oper. 2)    |  |
|      | --------------------------- | ----------------------------------- |  |
|      | Borde HSL: Amber (4px)      | Accion: [ INICIAR FABRICACIÓN (Azul) ]|  |
|      +-------------------------------------------------------------------+  |
|                                                                             |
|  [v] EN PROCESO (2 Proyectos)                                               |
|      +-------------------------------------------------------------------+  |
|      | OT-0994 | Closets Apt. 402  | Tareas Sig:                         |  |
|      | Cliente: María Gómez        | [ ] 1. Ensamble de cajones          |  |
|      | Entrega: 15-Ago-2026        | [x] 2. Ranurado trasera (Completada)|  |
|      | --------------------------- | ----------------------------------- |  |
|      | Borde HSL: Blue (4px)       | Accion: [ INICIAR INSTALACIÓN (Viol) ]|  |
|      +-------------------------------------------------------------------+  |
|                                                                             |
|  [>] INSTALACIÓN (0 Proyectos) - Naranja (Colapsado por defecto)            |
|                                                                             |
|  [>] ENTREGADA (14 Proyectos) - Verde (Colapsado por defecto)               |
|                                                                             |
+-----------------------------------------------------------------------------+
```

---

## 📁 3. Estructura de Componentes y Submódulos `.tsx`

Para ejecutar la reestructuración completa, adaptamos y creamos los siguientes archivos:

### 1. `src/components/specialized/kanban/KanbanCanvas.tsx` (Componente Base)
*   **Rol:** Renderizador genérico del esquema de filas colapsables.
*   **Comportamiento:**
    *   Recibe el listado de registros (`records`), las etapas (`stages`), la clave de estado (`stageKey`) y la función para mover tarjetas (`onMoveCard`).
    *   Mantiene un estado de acordeón local (`expandedStages`) para recordar qué secciones están abiertas.
    *   Agrupa los proyectos verticalmente en lugar de horizontalmente.

### 2. `src/components/specialized/kanban/ProductionKanban.tsx` (Control de Taller)
*   **Rol:** Resuelve la lógica de datos específicos de fabricación.
*   **Comportamiento:**
    *   Carga las órdenes de trabajo, los proyectos y las tareas del taller.
    *   Mapea los proyectos a la cuadrícula de filas utilizando `KanbanCanvas`.
    *   Contiene pestañas superiores para alternar entre el **Tablero de Taller** y la **Central de Abastecimiento**.

### 3. `src/components/specialized/kanban/ProductionCard.tsx` (Fila del Proyecto)
*   **Rol:** Renderiza la fila de un proyecto en el taller y controla las interacciones in situ.
*   **Comportamiento:**
    *   **Columna Izquierda (Identificación):** Muestra el código OT, cliente y fecha de entrega.
    *   **Columna Central (Tareas Siguientes):** Filtra y renderiza los próximos **2 registros activos de `tareas_produccion`** del proyecto. Permite marcarlos como completados haciendo clic directamente en el checkbox.
    *   **Columna Derecha (Acciones Contextuales):** Muestra botones rápidos de cambio de estado basados en la fase actual y un botón de acceso rápido para desplegar el lateral de detalles (`ProjectDetails`).

### 4. `src/components/specialized/kanban/ComercialKanban.tsx` & `ComercialCard.tsx`
*   **Rol:** Módulo Comercial adaptado al formato de filas.
*   **Comportamiento:**
    *   Estructura las oportunidades por fases comerciales: *Lead*, *Propuesta*, *En Contrato*.
    *   **Acciones de Fila:** Permite previsualizar la propuesta comercial en PDF y ejecutar el botón de conversión de etapa a Producción.

---

## 🛠️ 4. Interacciones Operativas e Hitos Técnicos

### A. Tareas Siguientes In Situ (Control Táctil)
*   En la columna central de la fila, el checkbox de la tarea interactúa inmediatamente con la API:
    1.  Al presionar la casilla, se realiza una actualización optimista en la interfaz (la tarea se marca como completada y se tacha visualmente).
    2.  Se realiza una petición POST a `/api/vault` para cambiar el estado de la tarea en `tareas_produccion` a `'completada'`.
    3.  La barra de progreso general de la fila se actualiza de manera reactiva recalculando la relación de tareas terminadas sobre el total.

### B. Botones de Avance Estandarizados (Filtros de Fase)
La columna de acciones expone un solo botón principal según la etapa para guiar el flujo operativo:
*   **Pendiente:** Botón `"Iniciar Fabricación"` $\rightarrow$ Mueve la orden a `en_proceso`.
*   **En Proceso:** Botón `"Iniciar Instalación"` $\rightarrow$ Mueve la orden a `instalacion`.
*   **Instalación:** Botón `"Completar Entrega"` $\rightarrow$ Mueve la orden a `entregada`.
*   **Entregada / Garantía:** Badge de estado estático o botón de cierre.

---

## ⚡ 5. Contrato de Datos, API Vault y Gestión de Estado

Los tableros interactúan dinámicamente con la base de datos JSON local. La sincronización se rige por las siguientes llamadas a la API `/api/vault`:

1.  **Lectura Inicial y Sincronización:**
    ```typescript
    // fetch de registros correspondientes al namespace principal
    const res = await fetch('/api/vault?namespace=ordenes_trabajo')
    const { records } = await res.json()
    ```
2.  **Mutación de Estado de Orden (Zap o Escritura Directa):**
    *   Al cambiar de etapa desde los botones rápidos, se escribe en `ordenes_trabajo`:
    ```typescript
    await fetch('/api/vault', {
      method: 'POST',
      body: JSON.stringify({
        action: 'WRITE',
        namespace: 'ordenes_trabajo',
        record: { id: orderId, data: { ...orderData, estado: newStage } }
      })
    })
    ```
    *   Si el avance es de CRM Comercial a Producción, se invoca a `/api/engine` pasando el zap `zap_activar_produccion`.

---

## ⚠️ 6. Alineación de Estilo, CSS Responsivo y Tokens de Color HSL

### A. CSS de Adaptabilidad Móvil (Conforme a Reflow y Zoom)
*   **Contenedor Elástico de Fila:**
    ```css
    .row-card-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
      gap: 1.25rem;
      align-items: center;
      border-left: 4px solid var(--stage-color-hsl);
      padding: clamp(0.75rem, calc(0.5rem + 1vw), 1.25rem);
      background-color: #ffffff;
      border-radius: 0.75rem;
    }
    ```
*   **Hit Target Mínimo:** Todos los elementos interactivos (checkboxes de tareas y botones rápidos de etapa) se especifican con una altura de control de **48px** (`h-12`) o un padding mínimo de interacción de **44px** de área activa en móviles coarse para evitar errores dactilares.

### B. Tokens de Color HSL Estables (Place Cells)
Utilizamos colores de contraste WCAG 2.1 Level AA para la identificación cromática de fases:

| Etapa / Fase | Color Token | Clase de Borde CSS | Clase de Badge / Dot CSS |
| :--- | :--- | :--- | :--- |
| **Pendiente** | Slate | `border-l-slate-400` | `bg-slate-100 text-slate-700` / `bg-slate-400` |
| **En Proceso** | Blue | `border-l-blue-500` | `bg-blue-50 text-blue-700` / `bg-blue-500` |
| **Instalación**| Orange | `border-l-orange-500`| `bg-orange-50 text-orange-700` / `bg-orange-500` |
| **Entregada**  | Green | `border-l-emerald-500`| `bg-emerald-50 text-emerald-700` / `bg-emerald-500` |
| **Garantía**   | Red/Rose | `border-l-rose-500`  | `bg-rose-50 text-rose-700` / `bg-rose-500` |
