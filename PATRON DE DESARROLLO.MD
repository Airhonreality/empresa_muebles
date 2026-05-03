# 🏛️ GUÍA DE DESARROLLO: CORE AGNÓSTICO (Agnosticidad Radical)

> **"El código es el motor, los datos son la entrada, y la arquitectura es el filtro."**  
> Esta aplicación no se construye con páginas; se construye con **Sincronización de Estado**.

---

## 🧘 1. Filosofía: Agnosticidad Radical
Un desarrollador no crea "páginas web". Crea **Componentes Independientes** que reaccionan a las **Entidades** (datos) almacenadas en el **Data Store** (Base de Datos Local).

*   **Sin Páginas**: No existen archivos `.html` o componentes React que representen una "página" entera. Existe un `RouteRegistry` que define qué componentes deben renderizarse según la URL.
*   **Sin Hardcode**: Ningún texto, imagen o enlace debe vivir en el código de un componente. Todo debe ser inyectado desde el Data Store.

---

## 📡 2. El Ciclo de Sincronización (Core Protocol)

La comunicación en el sistema sigue este flujo inmutable:

1.  **Enrutamiento (Router)**: El usuario cambia la URL. El `AppRouter` consulta el `RouteRegistry` y detecta qué **Componentes** necesita la vista actual.
2.  **Montaje (Component)**: El componente se monta y usa el hook `useDataSync(ID)`.
3.  **Sincronización (Service)**: El Hook le pide al `DataConnector` (Singleton) la entidad asociada a ese ID.
4.  **Actualización (AppState)**: Los datos llegan, se guardan en el `AppState` (Estado Global), y el componente se renderiza con la entidad fresca.

---

## 📦 3. Entidades vs. Estructura (Tablas Maestras)

El sistema se divide en dos tipos de información crítica:

### A. El Store de Entidades (`local_database.json`)
Es el corazón de la aplicación. Contiene colecciones de objetos crudos (Noticias, Eventos, Proyectos).
*   **Estructura de la Entidad**: Cada objeto debe tener un `slug` (identidad única) y un bloque de `metadata` o `data.content`.
*   **Tablas Maestras**: Tratamos el JSON como una base de datos. Cada llave (ej: `DATA_ENTRIES`) es una "Tabla" de la cual los componentes consumen datos.

### B. El Mapa de Componentes (`ComponentMap`)
Define cómo se ve la estructura fija del satélite (Navbars, Heros, Footers).
*   Se encuentra en `NomonBridge.js`.
*   Permite cambiar el título del portal o los links del menú sin tocar un solo archivo de React.

---

## 🛠️ 4. El Constructor de Entidades (Entity Builder)
Ubicada en `/admin/builder`, es la herramienta para que un usuario no-técnico cree registros.
*   **Formularios Dinámicos**: El formulario cambia sus campos según la "Clase de Entidad" seleccionada.
*   **Persistencia Directa**: Gracias a las API routes de Next.js, los cambios en el Builder se escriben físicamente en el servidor (o localmente en desarrollo).

---

## 📐 5. Reglas de Construcción para un Dev

### I. Los Componentes (UI Components)
*   Deben ser **Autónomos**: Cada componente debe saber pedir sus propios datos.
*   Deben ser **Resilientes**: Si el dato no llega, deben mostrar un estado de "Cargando" o un Skeleton, nunca romperse.
*   **Diseño Responsivo**: El diseño es Mobile-First. Todo debe ser `flex`, `grid`, `%`, `vw` o `rem`.

### II. El Service (Lógica de Datos)
*   Vive en `src/core/logic/DataConnector.ts`.
*   Es el único que tiene permiso para acceder al Store. Los componentes solo "solicitan", el Service "entrega".

---

## 📝 Ejemplo de una Implementación Exitosa

Para agregar una nueva sección a la aplicación:
1.  **Crea el Componente**: `src/ui/components/NuevoComponente.tsx`.
2.  **Regístralo**: Añade la referencia en `src/ui/ComponentRegistry.tsx`.
3.  **Define la Ruta**: Agrégalo a la ruta deseada en `src/ui/RouteRegistry.ts`.
4.  **Crea la Entidad**: Ve al Builder y crea el contenido para ese componente.

---
*Firma: Asistente Antigravity - Estandarización de Arquitectura.*