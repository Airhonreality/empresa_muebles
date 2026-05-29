Cómo usar el CLI agno
Hay tres modos de invocarlo:


# One-shot (un solo comando)
npx tsx scripts/agno.ts context
npx tsx scripts/agno.ts create-schema proveedores field:nombre:text field:nit:text

# REPL interactivo (prompt agno>)
npx tsx scripts/agno.ts

# Pipe de comandos
echo -e "ls\nschema cotizaciones" | npx tsx scripts/agno.ts
Los 7 niveles de comandos
🔍 Capa 0 — Introspección (empezar aquí siempre)

context                          snapshot completo (schemas, routes, scripts, navs)
block-types                      todos los tipos de bloque disponibles
block-schema <type>              params detallados de un tipo
list-navs                        navbars registradas
📖 Capa 1 — Lectura

ls                               resumen schemas + routes + scripts
schema <name>                    campos de un schema
schema id <name>                 ver el id del schema
route <path>                     bloques de una ruta (compacto)
ui <path>                        árbol completo con visual settings
records <schema> [limit=5]       registros con preview
script <name>                    ver código de un script
validate                         verificar invariantes (contextos, camelCase, etc.)
⚡ Capa 2 — Composición de bloques (aplica inmediato, no requiere commit)

add-block <ruta> <type> [context:<s>] [visual:key=val ...]
add-child <ruta> <parentId> <type> [visual:key=val ...]
set-visual <ruta> <blockId> <key> <valor>
get-block <ruta> <blockId>
list-children <ruta> <blockId>
remove-block <ruta> <blockId>
remove-child <ruta> <parentId> <childId>
update-block <ruta> <blockId> <prop> <valor>
patch-blocks <key> <valor> [--type=frame] [--route=/inicio] [--dry]
🏗️ Capa 3 — Semánticos (también inmediato)

create-route <path> <título>
create-page <path> <título> [template:blank|landing|data-<schema>]
scaffold <schema> [route:/path]    crea ruta CRUD completa de una vez
create-nav <name> link:label:path:icon ... [brand:label:path]
create-columns <ruta> [cols=2] [gap=6]
📐 Capa 4 — Schemas (staged → requiere commit)

create-schema <name> [field:key:type:label ...]
add-field <schema> <key> <type> [label:<l>] [required] [options:a,b,c] [entity:<schema>]
remove-field <schema> <key>
delete-schema <name>
set <schema>.<field>.<prop> <valor>     prop: label | type | required | entity
📦 Capa 5 — Datos (staged → requiere commit)

create-record <schema> [key=val ...]
update-record <schema> <id> [key=val ...]
delete-record <schema> <id>
delete-route <path>
📜 Scripts

script <name>                       ver código
script write <name> --file ruta.js  importar desde archivo
script export <name> --file ruta.js exportar a archivo
La cola de cambios (Capas 4 y 5 solamente)

status          ver qué hay en cola
commit          previsualizar sin ejecutar
commit --force  ejecutar todos los staged
drop            descartar cola
Flujo típico nuevo schema + ruta

npx tsx scripts/agno.ts
agno> create-schema proveedores field:nombre:text field:nit:text field:categoria:select
agno> commit --force
agno> scaffold proveedores
agno> context
Las capas 2 y 3 (add-block, scaffold, create-route, etc.) no van a la cola — se escriben directo al storage. Solo los cambios de schema y datos van a la cola de staging.


Vectores de entropía al conceptualizar lógica custom
Hay cuatro planos donde se genera la mayoría del ruido. No son errores de código — son errores de modelo mental.

1. Diseñar desde la pantalla, no desde la entidad
Entropía: "Quiero una pantalla que muestre X, Y, Z" → se inventa un mega-schema con 25 campos para sostener esa pantalla específica.

Modelo correcto: Primero pregunta ¿qué cosas existen en este dominio? Cada sustantivo que persiste es un schema. La pantalla es consecuencia, no punto de partida.


❌ schema "pantalla_cotizador" con 25 campos
✅ schema "cotizaciones" + schema "items_cotizacion" + schema "clientes"
2. Campos que en realidad son entidades
Entropía: tipo_madera: "roble" escrito 200 veces en 200 registros. Si el nombre cambia, hay que migrar todos.

Modelo correcto: Si un valor se repite → es una entidad. Si puede cambiar su nombre o tener atributos propios → es un schema con relación.


❌ campo text "categoria" repetido en productos
✅ schema "categorias" + campo relation en productos
3. Lógica de negocio dentro de componentes visuales
Entropía: Un componente specialized/ que calcula totales, hace fetch propio, mantiene estado local de "qué cotización está activa". Cuando el schema cambia, el componente se rompe silenciosamente.

Modelo correcto: Los componentes specialized/ solo renderizan. La lógica que muta datos vive en scripts (zaps). La lógica de cálculo sin mutación puede vivir en el componente, pero solo sobre los tipos generados por agnostic:compile.


❌ fetch('/api/vault?namespace=clientes') dentro de un specialized/
✅ api.query('clientes') dentro de un script ejecutado por un action block
4. Bifurcación de vocabulario entre layers
Entropía: Schema se llama cotizaciones, la ruta tiene context: "presupuestos", el componente busca quotes. El engine renderiza nada y no hay error visible.

Modelo correcto: Un sustantivo, un nombre, en todos los layers. El invariant no es opcional:


block.context === schema.data.name === archivo_sin_extension
Elegir el nombre antes de crear el schema. Cambiarlo después rompe todas las rutas que lo referencian.

5. Estado de UI persistido en storage
Entropía: Guardar en el schema qué tab está activo, qué fila está expandida, si el modal está abierto. Contamina los datos con estado efímero.

Modelo correcto: El storage solo persiste intenciones de negocio (activo: true/false, estado: borrador/aprobado). El estado de UI vive en useState dentro del componente.

6. Scripts con responsabilidades múltiples
Entropía: Un zap procesar_cotizacion que: calcula totales, envía email, actualiza cliente, genera PDF, actualiza inventario. Cuando falla, no sabes dónde.

Modelo correcto: Un zap = una responsabilidad. Si necesitas orquestar varios pasos, son varios action blocks en secuencia o un zap que llama pasos explícitos con api.notify entre ellos para trazabilidad.

7. Relaciones circulares sin jerarquía
Entropía: Schema A tiene relación a B, B tiene relación a A. El resolver no puede determinar cuál carga primero.

Modelo correcto: Las relaciones siempre son padre → hijo (o maestro → detalle). Si dos entidades se necesitan mutuamente, una de las dos es la entidad principal y la otra carga lazily desde ella.

Regla de oro para conceptualizar
Antes de crear cualquier cosa, responde tres preguntas:

¿Qué entidad persiste? → schema
¿Qué acción la muta? → script (zap) + action block
¿Cómo se muestra? → block type (colección/form) o specialized/ si nada genérico aplica
Si no puedes responder las tres, el concepto no está maduro todavía. Diseñar en ese estado es la raíz de todos los vectores anteriores.