Diagnóstico comparativo: Agnostic Seed vs. el modelo del asesor senior
El modelo del asesor en una frase
Un generador de interfaces donde el documento es un árbol JSON puro, absolutamente agnóstico de React, con cuatro capas limpias (Modelo → Engine → Renderer → Shell), auto-layout exclusivo, bindings declarativos de datos, undo/redo nativo, y un renderer headless capaz de existir sin el editor.

Donde el modelo del asesor supera al sistema actual
1. Undo/Redo — el asesor tiene razón, ustedes no lo tienen
El asesor pone esto en el día cero: toda mutación es una transformación pura documento → documento, y la pila de inversas da undo gratis.

El sistema actual no tiene undo en ninguna capa. Editar el label de un nodo → debounce 600ms → POST /api/vault. No hay forma de deshacer. Esto es un gap real, no cosmético. En un editor visual donde alguien puede borrar un nodo por accidente, la ausencia de undo es un problema de usabilidad crítico.

2. Bindings de campo — concepto que el sistema actual no tiene
El asesor describe un sistema donde cualquier propiedad de cualquier nodo puede pasar de valor literal a valor referenciado (como las variables de Figma, pero para cualquier dato). "el color de este frame está bound al campo 'estado' de este registro".

El sistema actual conecta nodos a schemas via contexts: string[], pero no tiene binding a nivel de propiedad. Un AtomNodeV3 tiene field: string que nombra el campo a mostrar, pero eso es display, no binding de propiedad. No puedes decir "el background de este frame cambia según el valor de este campo" sin escribir código custom. El asesor tiene un concepto más poderoso aquí.

3. Renderer headless separado del editor
El asesor plantea que publicar es otro renderer: toma el árbol JSON y emite HTML+CSS plano, idealmente estático. El editor y el sitio publicado comparten el modelo de documento pero no el runtime.

El sistema actual es siempre una app Next.js completa. El sitio publicado carga Zustand, React, el designer, las stores, todo. No existe la distinción editor/published-renderer. El asesor tiene razón: el usuario final de la interfaz generada no necesita el motor de mutaciones.

4. Separación de stores: documento vs. sesión de editor
El asesor advierte explícitamente: qué nodo está seleccionado, zoom del viewport, paneles abiertos — eso NO es el documento. Si lo mezclas con el store persistente, el undo deshace selecciones.

En el sistema actual, el store de sistema (useSystemStore) mezcla cosas de sesión (overlay activo, currentPath, activeContext, activeRecord) con datos que se persisten. Es la contaminación que el asesor describe. No es grave hoy, pero si se añade undo, esto explotará.

5. Panel schema-driven (concepto, no implementación)
El asesor dice: cada tipo de nodo declara qué propiedades expone y con qué control; el panel se construye solo. El código no tiene lógica por tipo escrita a mano.

El sistema actual tiene secciones fijas en NodeConfig (IdentitySection, LayoutSection, ContextSection, RenderSection, VisualSection). Funciona porque todos los nodes tienen la misma forma. Pero si los tipos de nodo divergen (como ya pasa con SlotNodeV3 que tiene source, filter, limit, sort que FrameNodeV3 no tiene), el panel tendrá que crecer con lógica condicional. El schema-driven resuelve esto de raíz.

6. Versionado del schema del documento
El asesor lo llama vector de entropía número 3: el documento que el usuario guardó en la versión 3 debe abrir en la versión 20, con una cadena de funciones de migración.

El sistema actual tiene migrateBlockToNode en runtime, pero no hay número de versión en el documento, y la migración es solo de bloque→node, no una cadena versionada. Cuando el modelo cambie de nuevo (NodeV2 → NodeV3 → ¿NodeV4?), la deuda se acumula.

Donde el sistema actual supera al modelo del asesor
1. Multi-tenancy — el asesor ni lo menciona
El asesor diseña para un solo proyecto. El sistema actual tiene una arquitectura completa de multi-tenancia: manifest.json por tenant, tres estrategias de storage (local/supabase/hybrid), resolución de tenant activo vía activeProject.ts, GitHub como fuente de DNA en la estrategia hybrid.

Esto no es decoración. Es el núcleo del valor de negocio: el mismo engine sirve proyectos completamente distintos (cotizaciones, prefabricados, lo que sea) sin tocar src/. El asesor construye un editor. Ustedes construyen una plataforma.

2. SSR con React Server Components
El asesor ignora completamente el servidor. Su modelo es una SPA: el árbol se hidrata en el cliente, los datos llegan vía fetch. Esto falla para SEO, falla para tiempo de carga inicial, falla para páginas que son públicas.

El sistema actual usa Next.js 15 RSC, React.cache() para deduplicar cargas en SSR, y el AgnosticShell hidrata Zustand exactamente una vez. El patrón layout.tsx → getVaultData → page.tsx → resolver → AgnosticShell es sofisticado y correcto. El asesor nunca lo consideró.

3. El sistema Zap es mejor que las acciones declarativas del asesor
El asesor dice: no guardes JavaScript en el documento; guarda acciones declarativas ({ trigger: "onClick", action: "setState" }). Su argumento es correcto en teoría, pero su solución es demasiado restrictiva para lógica de negocio real: calcular un total de cotización, generar un PDF, actualizar varios schemas relacionados. Eso no cabe en acciones declarativas.

El sistema actual resuelve esto correctamente: los scripts son DataItems en scripts.json (son datos, no código en el árbol), referenciados solo por nombre (node.zap), ejecutados en sandbox de Node.js (vm.runInNewContext, timeout de 5s) en el servidor. El árbol del documento no contiene código. Los scripts son portables y editables sin tocar src/. Esto respeta el axioma del asesor (el árbol es JSON puro) y además escala a lógica compleja.

4. NodeV3 — taxonomía más rica que el modelo del asesor
El asesor propone: Frame, Text, Image como primitivos. Todo lo demás es composición guardada como subárbol.

El sistema tiene AnyNodeV3: frame, slot, atom, preset, text, instance. Son categorías semánticas, no solo formas diferentes del mismo átomo. slot (fuente de datos con filtro/limit/sort), atom (display de un campo), preset (variante UI: sheet/dialog/table/form), instance (componente reutilizable con overrides por nodo). Esto es más expresivo y más cercano a lo que un diseñador realmente necesita.

El sistema ya resolvió el problema de explosión de tipos que el asesor advierte: preset con variant: PresetVariant es exactamente el patrón correcto (no creas 40 tipos, creas un tipo con variantes).

5. MCP Bridge — el asesor no lo contempla
21 herramientas semánticas de CRUD para AI-assisted development. Para el modelo del asesor esto no existe porque está pensando en un editor para humanos. El sistema actual tiene una capa de interoperabilidad con agentes de AI que modifica schemas, rutas y scripts via protocolo estándar. Esto es un diferenciador que no se puede obtener del modelo del asesor.

6. Contextos heredados (InheritedContexts) — solución elegante al problema del DynamicBlock
El asesor plantea el DynamicBlock (un nodo cuyos hijos se repiten sobre una colección) pero no resuelve cómo los nodos hijos saben qué dato usar. El sistema actual resuelve esto con InheritedContexts: un canvas con contexts: ['productos'] lo propaga a todos sus descendientes vía React context. Los hijos no lo redeclaran. Es limpio y funciona.

7. El invariante del engine es más honesto que el axioma de agnosticidad del asesor
El asesor dice: el documento no debe importar React. Verdad en teoría. Pero indra.ts exporta interfaces TypeScript, no componentes React — satisface el axioma sin costo. Lo que el asesor no nota es que el invariante real del sistema (block.context === schema.data.name === data_file_name) es más pragmático y más verificable que "el árbol no conoce React", que es una propiedad abstracta difícil de auditar.