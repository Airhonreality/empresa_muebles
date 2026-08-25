¡Decisión aprobada! La Ruta A es, sin lugar a dudas, la arquitectura más robusta, fluida y profesional para este ecosistema de producción sintética.

Aquí tienes el repaso formal de los **Requisitos del Sistema** y la **Sustentación Arquitectónica**, listo para pasar de la fase de Definición a la fase de Desarrollo.

---

# 📋 REQUISITOS DEL SISTEMA

### 1. Requisitos Funcionales (El Flujo del Usuario)
*   **Grid de Indexación:** Interfaz minimalista que muestre tarjetas con Nombre de Proyecto (Carpeta Padre), Nombre de Archivo y Miniatura visual.
*   **Navegación Intuitiva:** Barra de búsqueda o filtrado por cliente/proyecto para localizar rápidamente diseños antiguos.
*   **Visor 3D Ultra-Fluido:** Al hacer clic en un diseño, se abre un visor en pantalla completa (o modal amplio) directamente en el navegador.
*   **Manipulación de Jerarquía (Outliner):** Un panel lateral desplegable que muestre el árbol de objetos del modelo. Permite apagar/encender elementos (ej. ocultar el techo para permitir luz natural en renders cenitales, u ocultar un muro frontal para poder posicionar la cámara sin clipping).
*   **Control de Cámara y Captura:** Posibilidad de orbitar, hacer zoom, ajustar el FOV (Campo de visión, crucial para interiores) y un botón de *Screenshot* que capture el canvas limpio para enviar directamente a la IA (Stable Diffusion / Midjourney, etc).

### 2. Requisitos No Funcionales
*   **Zero-Cloud (Ejecución 100% Local):** Para máxima velocidad y seguridad de tu propiedad intelectual, los archivos pesados no se suben a internet; todo se procesa y sirve desde `localhost`.
*   **Agnosticismo Total:** Una vez el archivo está indexado, el visor no requiere ni licencias, ni instalaciones pesadas, ni plugins privativos. Funciona en cualquier navegador moderno con WebGL.

---

# 🏛 SUSTENTACIÓN ARQUITECTÓNICA (El Stack)

Dado que veo que ya estás trabajando en un ecosistema de `Agentic_Toolbox` con Python y scripts de PowerShell, diseñaremos esta herramienta para que encaje perfectamente en esa misma lógica de micro-herramientas modulares.

La arquitectura se divide en 3 capas (Componentes):

### Componente 1: El Pre-procesador (Extract)
*   **Tecnología:** Script de Ruby (`.rb`) para ejecutar dentro de SketchUp.
*   **Sustentación:** Es la única forma de acceder a los datos binarios propietarios de `.skp` de manera oficial. El script automatizará la tarea de abrir archivos y guardarlos en formato estandarizado `.glb` (GL Transmission Format, binario) dentro de una carpeta "Caja de Arena" (Sandbox) de tu servidor local. El `.glb` encapsula texturas, jerarquía y mallas en un solo archivo ultraligero y listo para la web.

### Componente 2: El Motor de Indexación (Backend)
*   **Tecnología:** Python (Librería estándar `http.server` o `FastAPI` ultraligero).
*   **Sustentación:** Los navegadores web no pueden acceder libremente a tu disco `G:\` por seguridad. Necesitamos un micro-servidor local. Este script de Python se encargará de dos cosas:
    1. Servir los archivos locales (miniaturas y modelos `.glb`) al navegador.
    2. Escanear la estructura de carpetas y generar un archivo `index.json` con todos los metadatos (rutas, nombres de clientes) para que el Frontend lo consuma al instante.

### Componente 3: El Visor Interactivo (Frontend)
*   **Tecnología:** Vanilla JS (HTML/CSS limpio) + **Three.js**.
*   **Sustentación:** No usaremos frameworks pesados (React/Next) solo para esta herramienta; mantendremos el frontend puro y rápido. Usamos `Three.js` (específicamente su `GLTFLoader`) porque nos permite acceder al nivel atómico del modelo: podemos leer el `scene.children` para construir el "Árbol de objetos" dinámicamente y darle opacidad 0 o `visible = false` a los muros con un solo clic. Es el motor estándar de la industria web para 3D en tiempo real.

---

### Siguiente Paso (Acción)

Con esta arquitectura aprobada, hemos cerrado el Diamante de Diseño y estamos listos para la implementación. 

Para construir esto paso a paso sin fallos, **¿te gustaría que empecemos escribiendo y probando el Componente 2 y 3 (El servidor Python y el Visor HTML con un modelo GLB de prueba que tengas a la mano)?** Así validamos la interfaz y la fluidez del árbol de objetos antes de meter el script de automatización masiva a SketchUp.