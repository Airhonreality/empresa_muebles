Entendido. Esto cambia radicalmente la arquitectura — y de hecho la simplifica enormemente. No estás construyendo Figma. Estás construyendo algo más cercano a **Webflow / Builder.io / Plasmic**: un editor de interfaces *reales* donde el "canvas" es el DOM mismo. Déjame profundizar en la arquitectura correcta para esto.

## El cambio de paradigma fundamental

En Figma diseñas una *representación pictórica* de una interfaz que luego alguien reconstruye en código. En lo que tú describes, **no hay representación intermedia**: el documento que editas *es* la interfaz. Esto elimina de un golpe el subsistema más caro —el motor de canvas gráfico, hit-testing geométrico, transformaciones de matriz— y lo reemplaza por algo que el navegador ya hace gratis: **layout de DOM con flexbox**.

Esto es el primer axioma, y es liberador: **no se renderiza un dibujo de la UI; se renderiza la UI**. El "modo diseño" y el "modo uso" no son dos motores distintos — son el **mismo árbol renderizado**, con una capa de interacción de edición encima o no.

## El axioma de agnosticidad radical: el documento es solo datos

El corazón de todo es un único árbol serializable, puro JSON, sin una sola referencia a React, al DOM, ni a ninguna tecnología de render. Un nodo se ve así conceptualmente:

```
Node {
  id
  type            // "Frame" | "Text" | "Image" | "DynamicBlock" ...
  props           // estilos, contenido — todo data
  layout          // contrato de autolayout (ver abajo)
  children[]
  bindings        // qué props se conectan a qué datos
}
```

La agnosticidad radical significa que este árbol no sabe que existe React. Un *renderer* lo traduce a React/DOM hoy; mañana otro renderer podría traducirlo a React Native, a HTML estático, a Vue. El documento sobrevive a la tecnología de render. **Si tu árbol importa algo de React, rompiste el axioma.**

De ahí se deriva la separación en capas, y cada capa solo puede depender de la de abajo:

```
┌─────────────────────────────────────────┐
│  EDITOR SHELL  (paneles, shadcn/ui)      │  ← desechable
├─────────────────────────────────────────┤
│  RENDERER  (árbol → React/DOM)           │  ← intercambiable
├─────────────────────────────────────────┤
│  ENGINE  (mutaciones, historia, binding) │  ← estable
├─────────────────────────────────────────┤
│  DOCUMENT MODEL  (árbol JSON puro)       │  ← el axioma, eterno
└─────────────────────────────────────────┘
```

La capa de abajo no sabe que existe la de arriba. El documento no conoce el engine; el engine no conoce los paneles. Esto es lo que hace el sistema mantenible: puedes tirar y reescribir el shell entero sin tocar el modelo.

## Autolayout como sistema de layout único

Decidiste —y es la decisión correcta— que **todo es autolayout desde el contenedor padre**. Esto es un axioma de simplicidad brutal: eliminas posicionamiento absoluto, coordenadas X/Y, todo el problema geométrico. Cada nodo solo necesita declarar un contrato de layout pequeño y cerrado:

- **dirección** del flujo (row / column)
- **gap** entre hijos
- **padding** propio
- **alineación** de los hijos en ambos ejes
- **dimensionamiento**: por cada eje, uno de tres valores — `fixed`, `hug` (se ajusta al contenido), `fill` (ocupa el espacio del padre)

Esos tres valores de dimensionamiento son exactamente el modelo mental de Figma, y mapean **directamente a flexbox** sin traducción artificiosa: `fill` → `flex: 1`, `hug` → `width: fit-content`, `fixed` → ancho explícito. El navegador hace el cálculo. Tú no implementas ningún motor de layout — y eso es enorme.

Como el render es DOM real con flexbox real, el **modo responsivo es gratis**: cambias el ancho del contenedor raíz (un viewport simulado) y el layout se recalcula solo, porque *es* CSS de verdad. No simulas responsividad: la observas.

## Las tres vistas del mismo árbol

Esto enlaza con la "triangulación de feedback" que detectaste en Figma. Aquí tienes tres paneles, y los tres son **proyecciones del mismo documento**, nunca copias:

**Panel gráfico (propiedades).** Schema-driven. Cada `type` de nodo declara qué propiedades expone y con qué control se editan. El panel no tiene lógica por tipo escrita a mano — lee el schema del tipo seleccionado y se construye solo. Esto te regala el comportamiento contextual de Figma ("el panel cambia según el objeto", "las propiedades vacías se colapsan") como consecuencia automática del diseño, no como código a mantener.

**Panel de schemas de datos.** Aquí defines fuentes de datos —colecciones, formas de objeto, endpoints— como esquemas. Un `DynamicBlock` es un nodo cuyo árbol de hijos se *repite* sobre una colección de datos. La conexión entre un nodo y un dato es un **binding**: una propiedad del nodo deja de tener valor literal y pasa a tener una referencia a un campo del schema. (Nota que esto es exactamente lo mismo que viste con los "tokens/variables CSS" en Figma — una propiedad pasa de valor crudo a valor referenciado. Mismo patrón, generalizado a cualquier dato.)

**Panel de scripts/actions.** Las automatizaciones. Aquí el principio de agnosticidad pide cuidado: **no guardes funciones JavaScript en el documento**. Guarda acciones como datos declarativos — `{ trigger: "onClick", action: "setState", target: "...", value: "..." }`. Un intérprete de acciones en el engine las ejecuta. Si metes código ejecutable en el árbol, pierdes la serializabilidad y la agnosticidad. Las acciones son datos; el engine las interpreta.

## El motor de estado y la unificación diseño/uso

El engine expone un único tipo de operación sobre el documento: la **mutación** (una transformación pura `documento → documento`). Mover un nodo, cambiar una prop, conectar un binding — todo es una mutación. De ahí derivan, sin esfuerzo extra:

- **Undo/redo**: una pila de mutaciones inversas. Diséñalo el primer día, no después.
- **Colaboración en tiempo real**: si las mutaciones pasan por un CRDT (Yjs), varias personas editan a la vez. Adóptalo desde el inicio o no lo adoptes nunca; reintegrarlo tarde es reescribir.
- **El "tiempo real"** que pides: como el render es reactivo sobre el árbol, cualquier mutación se ve instantáneamente. No hay paso de compilación entre editar y ver.

Y la idea más elegante de tu planteamiento: **diseñar y usar son el mismo motor**. El "modo edición" es el árbol renderizado *más* una capa de overlay que intercepta clics para selección en vez de dejarlos pasar a la UI. El "modo uso" es el mismo árbol renderizado *sin* esa capa, con las actions activas. Cambiar de modo es activar/desactivar un overlay — no recargar nada. Esto es posible *precisamente* porque rechazaste el canvas gráfico: tu documento de diseño ya es una aplicación funcional.

## Stack concreto recomendado

- **React + TypeScript** — shell y renderer.
- **shadcn/ui + Radix** — paneles. Aquí brillan: son cascarón puro, desechable, en la capa de arriba.
- **Zustand o Valtio** — store del documento. Valtio (proxy reactivo) encaja muy bien con un árbol mutable que muchas vistas observan.
- **Zod** — para definir los schemas de tipos de nodo *y* los schemas de datos del usuario. Una sola tecnología de esquemas para ambos: un nodo del editor y un dato del usuario se describen con el mismo lenguaje. Bonito y agnóstico.
- **Yjs** — solo si quieres colaboración; decídelo ya.
- **Flexbox nativo** — tu motor de layout. No instales nada para esto.
- **Sin librería de canvas. Sin tldraw. Sin SVG.** Lo eliminaste correctamente.

## El orden de construcción

Primero el modelo de documento y sus tipos en Zod. Luego el renderer (árbol → DOM con flexbox) — en cuanto exista, ya "usas" la interfaz. Luego el engine de mutaciones con undo. Luego el panel de propiedades schema-driven. Luego schemas de datos y bindings. Luego el panel de actions. El pulido visual del shell, al final — es lo más barato de cambiar.

El test de que respetas tus propios axiomas: en cualquier momento del desarrollo, deberías poder serializar el documento a JSON, borrar todo el código del editor, escribir un renderer nuevo de 50 líneas, y volver a ver la interfaz funcionando. Si puedes hacer eso, la agnosticidad es real.

¿Quieres que profundice en el diseño del schema de nodos con Zod, o en cómo modelar concretamente los bindings de datos y el `DynamicBlock`?

Excelente pregunta — y la más importante que has hecho, porque los vectores de entropía son exactamente lo que mata este tipo de proyecto entre el mes 3 y el mes 9. Voy a ser concreto y técnico.

## Vectores de entropía: dónde el sistema se degrada con el tiempo

**1. La fuga de abstracción del renderer hacia el modelo.** Es la entropía número uno y la más insidiosa. Empieza inocente: necesitas un valor calculado —digamos el ancho real renderizado de un nodo— y lo escribes de vuelta en el documento "solo por conveniencia". Acabas de contaminar la fuente de verdad con datos derivados del DOM. Tres meses después tu documento no es serializable de forma pura, el undo restaura medidas obsoletas, y la colaboración hace diff sobre campos que no debería. La regla dura: **datos derivados nunca viven en el documento**. Si necesitas medidas del DOM, viven en una capa efímera separada, recalculable, jamás persistida.

**2. La explosión de tipos de nodo.** Empiezas con Frame, Text, Image. Llega la necesidad de un botón, luego un input, luego un acordeón, y cada uno entra como un `type` nuevo con su rama en el renderer, su entrada en el panel schema-driven, su lógica de serialización. A los 40 tipos el sistema es ingobernable. El antídoto axiomático: **distingue tipos primitivos de composiciones**. Solo debería haber un puñado de primitivos irreducibles (contenedor, texto, imagen, quizá input). Todo lo demás —botón, card, acordeón— es una *composición* de primitivos guardada como subárbol reutilizable. Un botón no es un tipo; es un Frame con un Text dentro y unas props. Si cada widget nuevo es un tipo nuevo, rompiste el modelo.

**3. La deriva del schema del documento.** Vas a cambiar la forma de los nodos decenas de veces. El documento que un usuario guardó en la versión 3 debe abrir en la versión 20. Si no diseñas **versionado y migraciones desde el día uno** —cada documento lleva un número de versión, y existe una cadena de funciones de migración `v(n) → v(n+1)`— acumulas documentos huérfanos que solo abren con código viejo. Esto es entropía pura: estado pasado que el presente ya no entiende.

**4. Acoplamiento de las actions al runtime.** Mencioné guardar acciones como datos declarativos. La entropía aparece cuando, bajo presión, alguien permite una "escotilla de escape": un campo donde el usuario pega JavaScript crudo. En ese momento el documento deja de ser datos puros, deja de ser analizable, deja de ser seguro, y deja de ser portable a otro renderer. La presión para hacer esto será enorme. Resistir es mantener el axioma.

**5. La entropía del binding.** Los bindings de datos crean un grafo de dependencias paralelo al árbol. Un nodo se enlaza a un campo de un schema; el schema cambia; el binding queda colgando. Sin **integridad referencial** —bindings que se validan contra los schemas existentes y se marcan como rotos visiblemente— acumulas referencias muertas que fallan en silencio en producción.

**6. Identidad inestable.** Si los IDs de nodo no son verdaderamente estables y únicos —si en algún momento usas el índice del array o regeneras IDs al duplicar— el undo apunta a nodos equivocados, el CRDT hace merge de cosas distintas como si fueran la misma, y los bindings se cruzan. Los IDs deben generarse una vez, ser opacos, y no cambiar jamás durante la vida del nodo.

## Cargas lentas: por qué este tipo de app se vuelve pesada

Esta arquitectura tiene un perfil de rendimiento particular y dos públicos distintos: **el editor** (lo usa quien diseña) y **el sitio publicado** (lo usan los visitantes finales). Son problemas separados.

**El editor — dónde se degrada el tiempo real:**

El enemigo es el **re-render en cascada**. Si tu store es un único árbol y los componentes se suscriben al árbol entero, cambiar una prop de un nodo re-renderiza los 2.000 nodos. A 60fps tienes 16ms por frame; lo revientas con facilidad. La defensa es **suscripción granular**: cada nodo renderizado se suscribe *solo a su propia porción* del store (Valtio con `useSnapshot` por subárbol, o selectores estrechos en Zustand). Cambiar un nodo re-renderiza un nodo.

El segundo enemigo es **el panel arrastrando el canvas**. Mover un slider de padding dispara una mutación por cada píxel del arrastre — 100 mutaciones, 100 entradas en el historial, 100 renders. Necesitas **mutaciones efímeras durante el arrastre** (estado local, sin tocar el documento ni el historial) y *una sola* mutación commiteada al soltar.

El tercero: **layout thrashing**. Como tu layout es flexbox real del navegador, cada cambio de prop fuerza al navegador a recalcular layout. Si además lees medidas del DOM (`offsetWidth`) en el mismo ciclo, alternas escritura/lectura y serializas reflows. Agrupa lecturas y escrituras, y mide con `ResizeObserver` en vez de sondear.

**El sitio publicado — el verdadero problema de carga:**

Aquí está la trampa donde cae casi todo el mundo. El error es **publicar el editor**. El visitante final de un sitio hecho con tu herramienta no necesita el panel de propiedades, ni el motor de mutaciones, ni la pila de undo, ni shadcn, ni Yjs. Si tu sitio publicado embebe todo eso, mandas 2MB de JavaScript para mostrar una landing estática.

La solución arquitectónica —y aquí tu axioma de agnosticidad rinde fruto— es que **publicar es solo otro renderer**. Tienes el árbol JSON puro. El sitio publicado se sirve con un renderer mínimo: idealmente **renderizado estático en build-time**, donde el árbol se convierte a HTML+CSS plano. Para una landing sin interactividad, eso es cero JavaScript. Para partes interactivas (un DynamicBlock, una action), hidratas *solo esos nodos* — hidratación parcial / islas. El JSON del documento es pequeño; el HTML resultante es pequeño; el JS es proporcional a la interactividad real, no al tamaño del editor.

Concretamente para que cargue rápido: prerenderizar a HTML estático, generar el CSS crítico inline y diferir el resto, las imágenes con tamaños explícitos y formatos modernos servidos por CDN, las fuentes con `font-display` y subsetting, code-splitting por ruta, y el runtime de actions cargado solo si la página tiene actions. La métrica que vigilas no es el peso total sino **cuánto JS bloquea el primer render**: idealmente, nada.

## Errores que cometería incluso un senior

**Construir el editor antes que el renderer headless.** El senior, por instinto de producto, quiere ver paneles bonitos pronto. Termina con la lógica de render entrelazada con la lógica de edición, y cuando llega "publicar el sitio" descubre que no puede renderizar el árbol sin arrastrar medio editor. El renderer debe poder correr **sin el editor** desde el primer día — es la prueba de que las capas están limpias.

**Tratar la colaboración como una feature posterior.** Un CRDT no es una capa que se añade encima; cambia *cómo se modela cada mutación*. Mover un nodo entre padres, en un CRDT, no es "borrar aquí, insertar allá" — eso produce duplicados o pérdidas en un merge concurrente. Es una operación de movimiento atómica que el CRDT debe entender. Decidir esto en el mes 6 es reescribir el engine entero. Se decide el día uno: o entra, o no entra.

**Sobre-modelar el árbol con clases y métodos.** El senior con formación OOP hará nodos que son instancias de clase con métodos (`node.render()`, `node.move()`). Eso destruye la serializabilidad —una clase no es JSON—, complica el CRDT y acopla datos a comportamiento. El nodo es **data inerte**; el comportamiento vive en funciones puras fuera del nodo. Es contraintuitivo para un senior OOP y por eso es un error de seniors.

**Confundir el estado del documento con el estado de la UI del editor.** Qué nodo está seleccionado, qué paneles están abiertos, el nivel de zoom del viewport simulado — eso **no es el documento**. Si lo metes en el mismo store que persiste y sincroniza, el undo deshace selecciones, la colaboración sincroniza el zoom de tu compañero, y el documento guardado lleva basura de sesión. Dos stores estrictamente separados: documento (persistente, versionado, colaborativo) y sesión de editor (efímera, local).

**Resolver bindings en tiempo de render.** Tentación: cada nodo, al renderizarse, resuelve sus propios bindings leyendo del store de datos. Con un DynamicBlock de 500 filas tienes 500 resoluciones por frame. Los bindings se resuelven una vez por cambio de datos, en una capa de proyección memoizada, no en el render de cada nodo.

**Hacer del `id` algo significativo.** El senior querrá IDs legibles o derivados del contenido. En cuanto el contenido cambia, o duplicas un nodo, la "lógica" del ID miente. IDs opacos, aleatorios, inmutables. Punto.

**Ignorar la accesibilidad porque "lo genera el usuario".** Como tu output es DOM real —no un canvas pintado, gran ventaja— la accesibilidad es alcanzable casi gratis. Pero solo si el renderer emite HTML semántico (un botón es `<button>`, los encabezados son `<h*>`, hay roles y labels). El error es renderizar todo como `<div>` y descubrir tarde que cada sitio publicado es inaccesible e invisible para SEO. Esto se diseña en el renderer desde el inicio: el schema de cada primitivo declara su semántica HTML.

El hilo común de todos estos errores: **ceder en un axioma bajo presión de plazo**. Cada uno es barato de respetar el día uno y carísimo de reparar el mes seis. La disciplina arquitectónica aquí no es purismo — es la única forma de que "publicar rápido" y "editar en tiempo real" sigan siendo verdad cuando el proyecto crezca.

¿Quieres que profundice en el diseño del renderer headless dual —editor vs. publicado— o en cómo modelar las mutaciones para que sean compatibles con CRDT desde el principio?