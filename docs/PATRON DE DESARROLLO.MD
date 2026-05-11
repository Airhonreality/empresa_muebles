# 🏛️ GUÍA DE DESARROLLO: CORE AGNÓSTICO (Agnosticidad Radical)

> **"El código es el motor, los datos son la entrada, y la arquitectura es el filtro."**  
> Esta aplicación no se construye con páginas; se construye con **Sincronización de Estado y Proyección de Bloques**.

---

## 🧘 1. Filosofía: Agnosticidad Radical
Un desarrollador no crea "páginas web". Crea **Módulos Independientes** que reaccionan a la **Materia** (datos) almacenada en el **Silo Soberano** (Storage).

*   **Sin Páginas**: No existen archivos `.html` o componentes React que representen una "página" entera. Existe un `page_routes.json` que define qué bloques deben proyectarse según la URL.
*   **Sin Hardcode**: Ningún texto, imagen o enlace debe vivir en el código del motor. Todo debe ser inyectado desde el Silo mediante el **AgnosticAPI**.

---

## 📡 2. El Ciclo de Sincronización (SIP - Sovereign Interaction Protocol)

La comunicación en el sistema sigue este flujo inmutable:

1.  **Enrutamiento (Router)**: El usuario cambia la URL. El motor consulta el `page_routes.json` del Silo.
2.  **Proyección (AgnosticRenderer)**: El motor identifica los módulos dinámicos necesarios y los inyecta en la zona de visualización.
3.  **Hidratación (AgnosticAPI)**: El módulo se monta y utiliza el Bridge (`api.getGlobalData`) para obtener su materia.
4.  **Acción (Workflow Engine)**: Cualquier mutación o lógica compleja se despacha como un `INTENT` hacia el servidor, que ejecuta la acción correspondiente desde la carpeta `/actions` del Silo.

---

## 📦 3. Entidades vs. Estructura (El ADN del Silo)

El sistema se divide en dos tipos de información crítica dentro de la carpeta `db/`:

### A. El ADN de la Materia (`schema_definitions.json`)
Define qué es cada cosa (Clientes, Proyectos, Items). Contiene las etiquetas, tipos de campo y el **Projection Map** que dicta cómo se ve la materia en la UI.

### B. El Mapa de Navegación (`page_routes.json`)
Define la estructura de las vistas. Permite cambiar el layout de una página o añadir bloques enteros sin tocar un solo archivo de código fuente.

---

## 🛠️ 4. El Arquitecto de Esquemas (Schema Architect)
Ubicada en `/schema`, es la herramienta para que el arquitecto defina el ADN del sistema.
*   **Formularios Dinámicos**: Se autoconstruyen basados en las definiciones del esquema.
*   **Soberanía de Persistencia**: Los cambios se escriben directamente en el Silo (Local o Remoto vía GitHub API).

---

## 📐 5. Reglas de Construcción para un Dev

### I. Los Bloques (UI Modules)
*   Deben ser **Agnósticos**: No deben conocer nombres de tablas o IDs hardcodeados. Deben usar `api.getSchema()` para descubrir etiquetas.
*   Deben ser **Vanilla JS**: Exportan una función `setup(container, api)` para máxima portabilidad.
*   **Diseño Responsivo**: Uso estricto de variables CSS (`var(--primary)`) para respetar el tema del Silo.

### II. Las Acciones (Server-Side Logic)
*   Viven en la carpeta `/actions` del Silo.
*   Son los únicos lugares permitidos para lógica de negocio (ej: calcular un total, enviar un correo).

---
*Firma: Asistente Antigravity - Estandarización de Arquitectura Soberana.*