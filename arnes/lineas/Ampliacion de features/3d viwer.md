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

---

## Cierre de sesión — Prototipo 1 (2026-08-30)

**Decisión de arquitectura (auditoría del plan de arriba):** este plan original subestimaba que SketchUp no tiene modo headless de exportación, y que tanto el exportador como el visor requieren un humano en el loop (Regla de Oro #1 del propio `01_SYSTEM_CAPABILITIES.md` del Toolbox). Por eso el prototipo se construyó **entero fuera de este repositorio**, como skill nueva en `C:\Users\javir\Documents\DEVs\Agentic_Toolbox\sketchup_render_studio\`, separado en:

- `indexer/` (Dominio A, catalogable — headless real, probado).
- `exporter/export_batch.rb` + `run_pipeline.ps1` (Dominio A2 — plugin de auto-exportación instalado en SketchUp + orquestador que escanea `.skp` → exporta → indexa → levanta el visor, todo en un solo comando).
- `viewer/` (Dominio A2 — servidor FastAPI + visor Three.js: grid con miniaturas, outliner, selección múltiple con recuadro, iluminación tipo "clay render" con SSAO real (`EffectComposer`+`SSAOPass`) y sombras suaves, Screenshot en alta resolución que exporta color + un mapa de profundidad pensado como input futuro para ControlNet).

**A este repositorio (`empresa_muebles_clone_v3_NEW`) nunca llegó ni llegará código de esto.** Lo único que puede llegar es un PNG limpio, subido a mano por el `ImagePicker`/`uploadFileToR2` que ya existe en el ERP — cero cambios de código en este repo para que ese contrato funcione.

### Prueba real (no simulada)

Se exportó `G:\Mi unidad\Diseños\Clóset modular.skp` (copia aislada, el original nunca se tocó — confirmado mismo tamaño/fecha después) a `.glb` en **74 segundos sin intervención manual**, vía `run_pipeline.ps1` contra una instalación real de SketchUp 2026. El plugin de auto-exportación funcionó a la primera.

### Estado funcional al cierre (verificado por Javier en su propia máquina)

| Pieza | Estado |
|---|---|
| Extracción del modelo 3D desde `.skp` | ✅ Funciona (prueba real, ver arriba) |
| Listado en "colecciones" (grid del visor) | ✅ Funciona |
| Miniatura en el grid | ❌ Falla. Se intentó un fix (render cliente vía Three.js + `IntersectionObserver`, sin depender de la Fase 5 original con Playwright), pero no quedó confirmado funcionando al momento de cerrar la sesión. |
| Expansión al visor 3D | ✅ Funciona |
| Árbol de objetos: ocultar/mostrar | ✅ Funciona correctamente |
| Selector (clic para resaltar objeto en árbol↔3D) | ❌ No funciona. Se diagnosticó y arregló un bug real (un `<label>` envolviendo el checkbox reenviaba el clic del nombre hacia el toggle de visibilidad) y se reescribió a selección múltiple completa (Shift/Ctrl, recuadro de arrastre, Supr/"Quitar del árbol", "Ocultar seleccionados") — pero tampoco quedó confirmado funcionando al cierre. |

**Veredicto de Javier:** *"El prototipo sirve para su función (listar → expandir → screenshot)"* — se da por cerrado en este estado. Las dos fallas conocidas (miniatura, selector) quedan documentadas como deuda técnica del prototipo, no como bloqueantes de la función base.

### Investigación cruzada: ¿ya existe el puente hacia img2img/ControlNet?

Se auditó `Agentic_Toolbox/comfyui_multimedia_engine` (paquete `estudio_multimedia`). Ya existe un contrato conceptual (`recipes/render_espacio` + `workflows/controlnet_depth_v1`, Pydantic `RenderRequest`/`RenderInputImage`/`RenderControlNetParams`, API `POST /jobs`) que incluso anticipa este caso de uso exacto (`docs/VISION_PRODUCTO.md`, Caso B: "render base SketchUp"). Pero el `workflow.json` real es un placeholder sin `denoise`/`VAEEncode`/conexiones de nodos reales — no es un grafo ComfyUI ejecutable todavía —, solo acepta imágenes por URL pública (no archivos locales/base64), y requiere un endpoint RunPod Serverless real desplegado (nunca inferencia local). Ninguna de esas tres cosas se resolvió en esta sesión; son decisiones de infraestructura/costo que le corresponden a Javier.

### Próximo paso — registrado formalmente en `arnes/tareas/t-145.json`

La siguiente sesión **no empieza escribiendo código de prototipo 2**. Empieza leyendo de punta a punta la documentación de `C:\Users\javir\Documents\DEVs\modualdor_arbol_3d_veta_designer` (proyecto "veta_designer", ya existente), analizando su teleología base, y evaluando explícitamente — uno por uno — si esa teleología cumple estos 3 requisitos, que quedan registrados acá como la definición de éxito del visor 3D real de Veta Dorada:

1. **Ver el árbol 3D.**
2. **Asociar y heredar "etiquetas" a los grupos y objetos** (al estilo de las etiquetas/tags de SketchUp).
3. **Focalizar un solo grupo/etiqueta en el visor 3D** para tomar screenshots de calidad con buena perspectiva, visualizando el objeto o conjunto de objetos que el usuario específicamente necesita.

Esa evaluación debe cruzarse con el estado del arte ya investigado en `Agentic_Toolbox/0_Archivo_Investigaciones/invs_Modelado_3D_Agentes_Autonomos.txt`, para aportar a la visión del proyecto. El objetivo de la próxima sesión es cerrar con una **hoja de diseño de alcance y requisitos objetivos puntuales para el prototipo 2, firmada (aprobada explícitamente) por Javier** — ver criterios de aceptación completos en `t-145`.