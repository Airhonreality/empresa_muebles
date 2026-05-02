Listed directory NOMON%20WEB
Listed directory src
Listed directory score
Listed directory ui
Listed directory logic
Listed directory hooks
Listed directory components
Viewed NomonBridge.js:1-263
Viewed MateriaComposer.jsx:1-358

He explorado el repositorio `NOMON WEB` y he analizado los archivos clave. Tienes una base arquitectónica muy potente, pero como bien dices, hay mucha "gravedad" (acoplamiento) con el proyecto Nomon (URLs de GitHub, nombres de constantes, estilos inline).

Aquí tienes el **Roadmap de Migración y Estandarización** para crear tu repositorio semilla:

---

### 🗺️ Road Map: De Nomon a Agnostic Seed

#### **Fase 1: El Núcleo Soberano (Core Logic)**
*Objetivo: Desacoplar la inteligencia del almacenamiento.*

1.  **Refactor de `AgnosticBridge.js` (Ex-NomonBridge)**:
    *   **Estandarización**: Cambiar las constantes `owner`, `repo` y `token` por `process.env` (Vite usa `import.meta.env`).
    *   **Estrategias Intercambiables**: Extender la clase `PersistenceStrategy` para que sea fácil añadir `SupabaseStrategy` o `LocalStorageStrategy` sin tocar el resto del código.
    *   **Protocolo de Comunicación**: Formalizar los mensajes `ATOM_READ`, `CREATE`, `UPDATE` en una interfaz limpia.
2.  **Universalización de `SovereignContext`**:
    *   Limpiar el estado inicial para que no espere `NOMON_ENTRIES` por defecto, sino que reciba una configuración de "Contextos de Datos".
3.  **Evolución de `useIndraResonance`**:
    *   Hacer que el hook sea paramétrico: `useIndraResonance('CLIENTES')` en lugar de estar atado a la estructura de Nomon.

#### **Fase 2: El Motor Visual (Visual Engine)**
*Objetivo: Pasar de estilos "hardcoded" a un sistema de diseño inyectable.*

1.  **Arquitectura CSS "Virgen"**:
    *   Extraer todos los estilos del `dangerouslySetInnerHTML` de `MateriaComposer.jsx`.
    *   Crear un sistema de **Variables CSS** en `src/styles/theme-base.css` (colores, espaciados, bordes).
    *   Implementar un modo oscuro/claro nativo desde el core.
2.  **Componentes Materia 2.0**:
    *   **`DataCard.jsx`**: Recrearlo con un diseño más minimalista y premium, usando CSS Grid nativo.
    *   **`MateriaComposer.jsx`**:
        *   Convertir `LIBRARY_RESOURCE` en un bloque genérico `ACTION_CARD`.
        *   Añadir el soporte para `FORM_BLOCK` y `CHART_BLOCK` (vital para el ERP).
    *   **`Grid.jsx`**: Hacerlo verdaderamente inteligente, que soporte layouts de "Masonry" o "Strict Grid" vía props.

#### **Fase 3: La Forja de Creación (The Forge)**
*Objetivo: Modularizar la herramienta de administración.*

1.  **Descomposición de `MateriaForge.jsx`**:
    *   Actualmente es un archivo de 39KB. Hay que dividirlo en:
        *   `ForgeEditor.jsx` (El editor de JSON/Markdown).
        *   `ForgePreview.jsx` (La vista previa en tiempo real).
        *   `ForgeSidebar.jsx` (Gestión de slugs y metadatos).
2.  **Sistema de Rutas Dinámico**:
    *   Asegurar que `SovereignRouter` pueda leer la estructura de navegación directamente del Bridge, permitiendo crear páginas nuevas sin tocar una sola línea de código React.

#### **Fase 4: Estandarización y Seed Setup**
*Objetivo: Preparar el repo para "clonar y usar".*

1.  **Contrato de Datos (Schemas)**:
    *   Crear una carpeta `src/score/schemas` con ejemplos de JSON para cada tipo de bloque. Esto servirá de guía para otros desarrolladores.
2.  **Documentación Técnica**:
    *   Redactar el `README.md` explicando la filosofía: *Data-Driven UI* y *Sovereign Persistence*.
3.  **Limpieza de Dependencias**:
    *   Asegurar que el `package.json` sea ligero y solo tenga lo esencial (React, Lucide, Markdown Editor).

---
Edited road%20map.md
Viewed road%20map.md:54-72

Para implementar la **Fase 1 (Núcleo Soberano)** bajo el paradigma de **Agnosticismo Radical**, debemos construir un sistema que trate a los datos no como "registros de base de datos", sino como **Materia viva** que fluye a través de diferentes estados de realidad (Local vs. Remoto).

Aquí tienes el detalle técnico profundo de la Fase 1, anticipando fallos y validando la filosofía:

---

### 🏗️ Detalle Profundo: Fase 1 - El Núcleo Soberano

#### 1. El Protocolo UQO (Universal Query Object)
En lugar de llamar a funciones como `getProjects()` o `saveUser()`, el sistema hablará exclusivamente a través de **UQOs**. 

*   **Cómo sería:** Un objeto JSON estandarizado: `{ protocol: 'ATOM_READ', context: 'CLIENTES', filter: { status: 'active' } }`.
*   **Punto Crítico:** La tentación de añadir lógica de negocio en el Bridge. **Error de Escalabilidad:** Si el Bridge "sabe" que un cliente necesita un campo `email`, deja de ser agnóstico. El Bridge solo debe mover bytes.
*   **Resiliencia:** Si el protocolo falla, el Bridge debe devolver un `FALLBACK_PAYLOAD` extraído de la última sincronización exitosa.
*   **Validación Agnóstica:** El Bridge no conoce el esquema; solo conoce el **transporte**.

#### 2. AgnosticBridge: Arquitectura de Estrategias (The Multi-Silo)
El `NomonBridge` actual está "casado" con GitHub. El nuevo `AgnosticBridge` será un **Orquestador de Silos**.

*   **Desarrollo:** Implementar un `SiloFactory` que cargue la estrategia (GitHub, Supabase, LocalStorage) basada en una variable de entorno.
*   **Error de Escalabilidad:** Bloquear la UI mientras se espera al Bridge. 
*   **Solución de Resiliencia (Circuit Breaker):** Si la `GitHubStrategy` tarda más de 3 segundos, el Bridge activa automáticamente la `LocalVaultStrategy` y marca el estado como "Desincronizado".
*   **Validación Agnóstica:** Puedes cambiar de GitHub a un servidor propio en 5 segundos cambiando una línea en el `.env`.

#### 3. SovereignContext: El Estado de Verdad Único
El contexto actual es un "Cajón de Sastre". El nuevo debe ser un **Registro de Contextos Dinámico**.

*   **Desarrollo:** El `SovereignContext` debe permitir la "Inyección de Namespaces". Al iniciar, el AppState dice: "Voy a manejar los contextos `ORDENES`, `FACTURAS` y `ENTIDADES`".
*   **Punto Crítico (Carrera de Datos):** Dos componentes actualizando la misma materia al mismo tiempo.
*   **Solución (Atomic Updates):** Implementar un sistema de **Queue (Cola)** en el AppState. Los cambios se encolan y se "cristalizan" uno a uno en el Bridge.
*   **Validación Agnóstica:** El estado no tiene propiedades fijas como `state.projects`; tiene un mapa `state.materia[context_id]`.

#### 4. useIndraResonance: Sincronía Reactiva
Este es el hook que conecta los componentes con la "Realidad Remota".

*   **Desarrollo:** El hook debe implementar un patrón **Optimistic Update**. Si el usuario edita una `DataCard`, la UI cambia *instantáneamente*, y el hook gestiona la "Resonancia" (confirmación) con el servidor en segundo plano.
*   **Máxima Resiliencia:** Si la resonancia falla (ej. sin internet), el hook debe marcar la materia con un flag `needs_sync: true` en el `AgnosticVault` local para reintentarlo cuando vuelva la conexión.
*   **Validación Agnóstica:** Al componente le da igual si los datos vienen de una API REST o de un archivo JSON en una carpeta; solo recibe `remoteData` y `loading`.

---

### 🛡️ Matriz de Riesgos y Paradigma Agnóstico

| Punto Crítico | Error de Escalabilidad | Solución de Resiliencia | Validación Agnóstica Radical |
| :--- | :--- | :--- | :--- |
| **Identidad** | Hardcodear roles de Nomon. | **JWT Abstraído**: El Bridge recibe un token, no le importa quién lo emitió. | El sistema no "es" Nomon, es un contenedor de identidades. |
| **Persistencia** | Confiar solo en la nube. | **Dual-Stream Storage**: Guardar siempre en LocalStorage Y Nube en paralelo. | Los datos son "soberanos" del usuario, no del servidor. |
| **Esquemas** | Validar tipos de datos en el Core. | **Duck Typing / JSON Schema**: El Core solo valida que sea un objeto válido. | El sistema es un proyector de sombras; si el objeto cambia de forma, la sombra (UI) cambia. |

---
Viewed road%20map.md:110-121

La **Fase 2 (Motor Visual)** es donde la "Materia" invisible del Bridge se convierte en una experiencia de usuario premium. El riesgo aquí es la **"Gravedad Semántica"**: que los componentes empiecen a "saber" demasiado sobre lo que están renderizando (ej: que un componente sepa que está dibujando una "Factura").

Aquí tienes el detalle de la Fase 2, los antipatrones a evitar y cómo blindar la agnosticidad:

---

### 🎨 Detalle Profundo: Fase 2 - El Motor Visual (The Interpreter)

#### 1. Arquitectura de Estilos por Tokens (The Essence)
En lugar de archivos CSS por componente, usaremos un **Sistema de Tokens Semánticos**.

*   **Antipatrón a evitar:** Usar nombres descriptivos como `--green-nomon` o `--border-card`.
*   **Fuga de Agnostisicmo:** Definir estilos basados en el contenido (ej: `.factura-pendiente { color: red; }`).
*   **Solución (Agnosticismo Radical):** Usar variables de propósito: `--accent-primary`, `--surface-main`, `--status-warning`. El componente solo sabe que debe usar el color de "aviso", no sabe que es una factura impagada.
*   **Implementación:** Un archivo `theme-base.css` que define el "Alma" del layout y que puede ser sobrescrito por un `theme-client.css` sin tocar el JS.

#### 2. MateriaComposer 2.0: El Intérprete de Formas
El Composer no es una página, es un **Proyector de Bloques**.

*   **Antipatrón a evitar:** `if (slug === 'proyecto-x') { return <ProjectLayout /> }`. Esto rompe la semilla.
*   **Fuga de Agnostisicmo:** Que el Composer espere campos fijos en el JSON.
*   **Solución (Estandarización de Bloques):** Definir un catálogo de bloques atómicos:
    *   `HEADING_BLOCK`: Títulos con jerarquía.
    *   `MEDIA_BLOCK`: Imágenes/Video con lazy loading.
    *   `INTERACTION_BLOCK`: Botones y triggers de protocolo.
    *   `DATA_GRID_BLOCK`: El bloque maestro que pide una `class` de materia al Bridge.
*   **Resiliencia:** Implementar un `UNKNOWN_BLOCK`. Si el JSON trae un tipo de bloque que el Composer no reconoce, renderiza un debug prolijo en lugar de romper la app.

#### 3. DataCard: La Célula Universal
La `DataCard` debe poder representar un Cliente, una Idea o un Sensor IoT con el mismo código.

*   **Antipatrón a evitar:** Acceder a propiedades específicas como `item.cliente_name`.
*   **Fuga de Agnostisicmo:** Hardcodear iconos (ej: usar siempre un icono de "usuario" para la cabecera).
*   **Solución (Mapeo de Proyección):** La `DataCard` recibe una "Proyección". El Bridge o un Transformer intermedio convierte `{ nombre: "Juan" }` en `{ title: "Juan" }` antes de que llegue al componente.
*   **Escalabilidad:** Implementar **Skeleton Screens** nativos dentro de la carta para que la carga de materia se sienta instantánea.

#### 4. Fugas de Agnostisicmo: Cómo anticiparlas

| Fuga Detectada | Cómo sucede | Blindaje Agnóstico |
| :--- | :--- | :--- |
| **Fuga de Texto** | Hardcodear "Proyectos" en el título de un Grid. | El título del Grid viene en el payload del bloque: `{ type: 'GRID', title: 'Mis Entidades' }`. |
| **Fuga de Navegación** | Usar `/proyectos/:id` en los enlaces. | Usar rutas basadas en slugs abstractos: `/:context/:slug`. El Router no sabe qué es un contexto hasta que el Bridge le responde. |
| **Fuga de Formato** | Hardcodear el símbolo `$` para precios. | Usar el `Intl.NumberFormat` inyectado por la configuración regional del sistema. |

---

### 🛡️ Estrategia de Error y Resiliencia Visual

1.  **Materia Fantasma (Null Safety):** Todo componente visual debe tener un estado de "Cero Materia" (Empty State) elegante. Si el Bridge devuelve un array vacío, el componente muestra una ilustración agnóstica de "Búsqueda sin resultados".
2.  **Límites de Renderizado:** El `Grid` agnóstico debe tener un límite de seguridad (ej: 50 cartas). Si hay más materia, debe activar automáticamente un bloque de "Paginación" o "Scroll Infinito" para evitar fugas de memoria.
3.  **Aislamiento de Errores (Error Boundaries):** Cada bloque del Composer debe estar envuelto en un Error Boundary. Si el bloque `CHART_BLOCK` falla por un JSON mal formado, el resto de la página sigue funcionando.

---
La **Fase 3 (La Forja)** es, sin duda, la zona de mayor peligro arquitectónico. En el repositorio `NOMON WEB`, `MateriaForge.jsx` es un archivo de casi **40KB**, lo cual es un síntoma claro de un **Monolito de UI**. Si no lo fragmentamos correctamente, la semilla nacerá con una deuda técnica heredada.

Aquí tienes la auditoría y el plan de reconstrucción quirúrgica para la Forja:

---

### 🔍 Auditoría de "La Forja" (NOMON WEB)

#### 1. Riesgos de Monolito Detectados:
*   **Acoplamiento de Estado**: La Forja actual gestiona la edición de texto, la subida de imágenes, el linkeo de relaciones y la vista previa en un solo `useState` masivo. Esto causará fugas de rendimiento en proyectos grandes (ej: el ERP con 500 campos).
*   **Dependencias Críticas**: 
    *   `@uiw/react-md-editor`: Es una librería excelente pero pesada. Si el usuario de la semilla no quiere Markdown, no debería cargarla.
    *   `lucide-react`: Bien, pero hay que evitar importar el set completo.

#### 2. Fugas de Agnostisicmo en la Forja Actual:
*   La lógica de "guardado" llama directamente a procesos que esperan una estructura de carpetas de GitHub.
*   El editor de relaciones (Resonancias) asume que siempre estás vinculando "Proyectos".

---

### 🛠️ Reconstrucción: Fase 3 - La Forja Modular

Para evitar el monolito, dividiremos la Forja en **Micro-Componentes de Autoría**:

#### 1. El Orquestador: `ForgeMaster.jsx`
Será un componente ligero que solo gestiona el "Modo" (Edición/Visualización) y el guardado final vía `AgnosticBridge`.
*   **Agnosticismo Radical**: No sabe qué estás editando; solo recibe un esquema y lo pasa al `ForgeForm`.

#### 2. La Forja de Datos: `ForgeFieldFactory.jsx`
En lugar de un formulario estático, usaremos una **Fábrica de Campos**.
*   Si el campo es `type: 'text'`, renderiza un input simple.
*   Si el campo es `type: 'rich_text'`, carga el componente de Markdown bajo demanda (**Dynamic Import**). Esto evita que la semilla pese demasiado al inicio.

#### 3. El Linker de Resonancia: `ForgeResonance.jsx`
Un componente dedicado exclusivamente a buscar materia en otros contextos y vincularla. 
*   **Mejora de Estándar**: Usará el protocolo `ATOM_READ` para poblar selectores dinámicos, permitiendo vincular una "Factura" con un "Cliente" de forma totalmente abstracta.

#### 4. La Vista Previa en Tiempo Real: `ForgePreview.jsx`
Simplemente envuelve al `MateriaComposer` (de la Fase 2) en un contenedor que se actualiza mientras escribes.

---

### 🛡️ Matriz de Control de Dependencias y Errores

| Componente | Dependencia | Riesgo | Mitigación en Semilla |
| :--- | :--- | :--- | :--- |
| **Editor MD** | `react-md-editor` | Bloqueo del hilo principal. | **Carga Diferida**: Solo se importa cuando un campo lo requiere. |
| **Uploader** | `fetch/base64` | Archivos demasiado grandes. | **Middleware de Estrategia**: El Bridge decide si sube a Cloudinary, GitHub o Local. |
| **Relaciones** | `useIndraResonance` | Bucles infinitos de datos. | **Limpieza de Caché**: Al guardar, se fuerza una "Resonancia" de los contextos vinculados. |

---

### 🚀 Plan de Implementación de la Fase 3

1.  **Fragmentación**: No crearemos un `MateriaForge.jsx`. Crearemos una carpeta `ui/components/Forge/` con sus sub-módulos.
2.  **Abstracción de Guardado**: La Forja emitirá un objeto `materia_updated`. El `AgnosticBridge` decidirá si eso va a GitHub o a un servidor ERP local.
3.  **UI de Arquitecto**: La estética será tipo "HUD" (Heads-Up Display), muy técnica y limpia, para que el usuario sienta que está *diseñando* datos, no solo rellenando un formulario.
