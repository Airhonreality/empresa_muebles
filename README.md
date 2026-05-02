# 🛰️ AGNOSTIC SEED | Sistema Operativo de Materia (MMS)

Bienvenido a la **Semilla Agnóstica Soberana**. Este repositorio no es una página web; es un **Motor de Proyección de Realidades Digitales** diseñado bajo el paradigma del Agnosticismo Radical.

## 🏛️ Visión Arquitectónica (Axiomas)

El sistema opera bajo cuatro pilares fundamentales que eliminan el acoplamiento técnico y garantizan la soberanía del dato:

1.  **El Cerebro (MMS Level 2)**: El sistema es un contenedor vacío que se autoconfigura al arrancar leyendo su propio ADN (`META_CLASSES` y `SYSTEM_CONFIG`) desde el Silo.
2.  **El Cuerpo (Geometric Engine)**: Un sistema de diseño basado en matemática pura (12 columnas) sin dependencia de librerías externas ni unidades absolutas (Pixeles).
3.  **La Vista (Sovereign Projections)**: Las "páginas" no existen en el código. Son entidades `VIEW_PROJECTION` que el Router "encarna" dinámicamente según la URL.
4.  **La Voluntad (Workflow Engine)**: La lógica de negocio no vive en los botones; vive en entidades `SYSTEM_WORKFLOWS` que ejecutan acciones atómicas transaccionales.

---

## 🛠️ Componentes del Sistema

### 🧠 Core (The Score)
*   **AgnosticBridge**: Orquestador de persistencia con soporte para estrategias múltiples (GitHub / LocalVault).
*   **WorkflowEngine**: Motor que procesa secuencias de acciones (Validar, Persistir, Notificar) mediante Intenciones.
*   **SovereignContext**: El estado reactivo global que mantiene la "Resonancia" entre el Silo y la UI.

### 🎨 Visual (The Body)
*   **MateriaComposer**: Intérprete geométrico de bloques. Soporta Markdown Pro, Grids Dinámicos y Triggers Soberanos.
*   **Auto-Layout (12 Columns)**: Sistema de diseño fluido Mobile-First basado exclusivamente en porcentajes y unidades relativas (`rem`, `vw`, `vh`).

### ⚒️ La Forja (The Forge)
Herramienta de autoría fragmentada en capas axiomáticas:
*   **Alfa (Identidad)**: Gestión de Slugs y metadatos de identidad.
*   **Sigma (Gobernanza)**: Roles, contextos y seguridad.
*   **Omega (Materia)**: Constructor de bloques y composición geométrica.

---

## 📐 Estándares de Desarrollo Soberano

Para mantener la integridad de la semilla, todo desarrollador debe respetar estas leyes:

1.  **Ley de Proporción**: Está terminantemente prohibido usar `px`. Usa `%` para anchos, `rem` para tipografía y `vw/vh` para espaciado.
2.  **Ley de Ceguera**: El código nunca debe saber qué está pintando. Si escribes la palabra "Factura" o "Proyecto" fuera de un JSON, has fallado.
3.  **Ley de Intención**: Los botones nunca deben tener lógica `if/else`. Deben emitir una `Intent_ID` que será resuelta por el WorkflowEngine.
4.  **Ley de Materia**: Todo lo que cambie el comportamiento del sistema debe ser una Entidad en el Silo, no un cambio en el código fuente.

---

## 📜 MANIFIESTO DEL AGNOSTICISMO RADICAL

1.  **El Código es Estéril**: El código fuente no debe contener conceptos de negocio (ERP, CRM, Factura). Es solo un intérprete de materia.
2.  **La Realidad es JSON**: Toda la lógica, flujos y estructuras viven en el Silo de Materia. Cambiar el JSON es cambiar la realidad del sistema.
3.  **La Semilla es Virgen**: Este repositorio debe permanecer libre de lógica específica. Los proyectos se "encarnan" en él, pero no lo habitan permanentemente.
4.  **Soberanía Total**: El desarrollador no es esclavo del framework; el framework es una herramienta transparente para proyectar intenciones.

---

## 📂 Estructura de Soberanía (The Silo)

Para mantener la semilla virgen, el sistema utiliza la carpeta `matter-silo/`:

*   **`matter-silo/materia.json`**: Aquí reside el "ADN" de tu proyecto (ERP, etc.). Este archivo está en `.gitignore` para que puedas trabajar en múltiples proyectos usando la misma semilla sin mezclar lógicas.
*   **`matter-silo/assets/`**: Almacenamiento de archivos binarios, imágenes y documentos del proyecto actual.

### Cómo usar esta Semilla para tus Proyectos:
1.  **Clona** este repositorio.
2.  **Configura** tu Silo Local (ejecutando `node vault-server.js`).
3.  **Proyecta**: Toda la lógica que crees en la Forja se guardará en `matter-silo/`.
4.  **Extrae**: Si deseas iniciar un nuevo proyecto, simplemente limpia el Silo o apunta el Bridge a una nueva ubicación. El motor permanece intacto.

---

## 🚀 Secuencia de Ignición (Setup)

1.  **Instalación**: `npm install`
2.  **Configuración**: Crea un archivo `.env` basado en `.env.example`.
3.  **Lanzar el Silo**: `node vault-server.js` (En una terminal dedicada).
4.  **Arranque App**: `npm run dev`
5.  **Primeros Pasos**: Accede a `/forge` y comienza a definir tu realidad.

---

## 📜 Licencia de Soberanía
Este sistema es una semilla virgen. Su propósito es servir como base para cualquier ecosistema digital que requiera **Soberanía Técnica Total**.

**Sintoniza la frecuencia. Crea realidad.** 🛰️⚖️🏛️
