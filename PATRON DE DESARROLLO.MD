# 🏛️ MANIFIESTO DE DESARROLLO: PARADIGMA REDNOMON (Agnosticidad Radical)

> **"El código es el proyector, la materia es la luz, y la estructura es la lente."**  
> Este satélite no se construye con páginas; se construye con **Axiomas de Resonancia**.

---

## 🧘 1. Filosofía: Agnosticidad Radical
Un desarrollador en REDNOMON no crea "páginas web". Crea **Actores Soberanos** que reaccionan a la **Materia** (datos) almacenada en el **Silo** (Base de Datos Local).

*   **Sin Páginas**: No existen archivos `.html` o componentes React que representen una "página" entera. Existe un `RouteRegistry` que define qué componentes (actores) deben proyectarse según la URL.
*   **Sin Hardcode**: Ningún texto, imagen o enlace debe vivir en el código de un componente. Todo debe ser inyectado desde el Silo.

---

## 📡 2. El Ciclo de Resonancia (Indra Protocol)

La comunicación en el sistema sigue este flujo inmutable:

1.  **Ignición (Router)**: El usuario cambia la URL. El `SovereignRouter` consulta el `RouteRegistry` y detecta qué **Actores** necesita la realidad actual.
2.  **Invocación (Actor)**: El componente (Actor) se monta y usa el hook `useIndraResonance(ID)`.
3.  **Resonancia (Bridge)**: El Hook le pide al `NomonBridge` (Singleton) la materia asociada a ese ID.
4.  **Cristalización (AppState)**: Los datos llegan, se guardan en el `AppState` (Estado Global), y el componente se renderiza con la materia fresca.

---

## 📦 3. Materia vs. Estructura (Tablas Maestras)

El sistema se divide en dos tipos de información crítica:

### A. El Silo de Materia (`local_database.json`)
Es el corazón del satélite. Contiene colecciones de objetos crudos (Noticias, Eventos, Proyectos).
*   **Estructura de la Materia**: Cada objeto debe tener un `slug` (identidad única) y un bloque de `metadata` o `data.content`.
*   **Tablas Maestras**: Tratamos el JSON como una hoja de cálculo. Cada llave (ej: `NOMON_ENTRIES`) es una "Tabla" de la cual los componentes "beben".

### B. El Mapa de Componentes (`ComponentMap`)
Define cómo se ve la estructura fija del satélite (Navbars, Heros, Footers).
*   Se encuentra en `NomonBridge.js`.
*   Permite cambiar el título del portal o los links del menú sin tocar un solo archivo de React.

---

## 🛠️ 4. El Constructor de Realidad (La Forja)
Ubicada en `/admin/forge`, es la herramienta para que un usuario no-técnico cree realidad.
*   **Proyección Dinámica**: El formulario cambia sus campos según la "Clase de Entidad" seleccionada.
*   **Persistencia Física**: Gracias al Middleware de Vite, los cambios en la Forja se escriben físicamente en el disco duro, permitiendo un flujo de trabajo 100% offline y persistente.

---

## 📐 5. Reglas de Construcción para un Dev

### I. Los Actores (UI Components)
*   Deben ser **Soberanos**: Cada componente debe saber pedir sus propios datos.
*   Deben ser **Resilientes**: Si el dato no llega, deben mostrar un estado de "Cargando" o un Skeleton, nunca romperse.
*   **Procentajes, no Píxeles**: El diseño es Mobile-First. Todo debe ser `flex`, `grid`, `%`, `vw` o `rem`.

### II. El Bridge (Lógica de Negocio)
*   Vive en `src/score/logic/NomonBridge.js`.
*   Es el único que tiene permiso para tocar el Silo. Los componentes solo "piden", el Bridge "entrega".

---

## 📝 Ejemplo de una Proyección Exitosa

Para agregar una nueva sección al satélite:
1.  **Crea el Actor**: `src/ui/components/NuevoActor.jsx`.
2.  **Regístralo**: Añade la referencia en `src/ui/ComponentRegistry.jsx`.
3.  **Define la Estructura**: Agrégalo a la ruta deseada en `src/ui/RouteRegistry.js`.
4.  **Forja la Materia**: Ve a la Forja y crea el contenido para ese actor.

---
*Firma: La IA Antigravity - Guardiana del Canon de Indra.*