# ⛔ REGLA ABSOLUTA — NUNCA editar JSON manualmente

Los archivos `storage/**/*.json` **nunca se editan a mano** — ni por humanos, ni por agentes de IA.

**Por qué:** agno garantiza que los schemas no queden malformados, que los contextos sean consistentes y que las relaciones entre entidades no se rompan. Un JSON editado a mano puede romper el sistema silenciosamente (el engine no renderiza nada, sin error visible).

**Si un agente de IA intenta editar un `.json` directamente, está mal.** Debe usar los comandos agno.

---

# Cómo usar el CLI agno

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

add-block <ruta> <type> [context:<s>] [visual:key=val ...] [config:key=val ...]
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

---

## API del sandbox Zap — lo que vive dentro de un script

Todo script ejecutado por `/api/engine` recibe estas variables en su contexto:

```javascript
// ─── CONSULTA ────────────────────────────────────────────────────────────────
const records = await api.query('nombre_namespace')
// Devuelve: [{ id, ...data }] — cada registro con sus campos aplanados

// ─── ESCRITURA ────────────────────────────────────────────────────────────────
const saved = await api.saveItem('nombre_namespace', {
  id: 'existente-para-update',  // omitir para crear nuevo
  data: { campo: 'valor' }
})
// Encola automáticamente un evento materia_sync — el UI se actualiza sin reload

// ─── NOTIFICACIONES ───────────────────────────────────────────────────────────
api.notify.success('Operación completada')
api.notify.error('Algo falló')

// ─── EVENTOS AL CLIENTE (ver §9 de Interfaces Custom.md) ─────────────────────
api.dispatchEvent('print_pdf',    { html: htmlString })
api.dispatchEvent('download_pdf', { template, inputs, filename })
api.dispatchEvent('download_file',{ content, filename, mimeType })
api.dispatchEvent('redirect',     { path: '/ruta' })
api.dispatchEvent('open_url',     { url, target })
api.dispatchEvent('clipboard',    { text })

// ─── CONTEXTO DE ENTRADA ──────────────────────────────────────────────────────
payload.record    // el DataItem que activó el botón (activeRecord del bloque)
payload.context   // nombre del namespace
payload.schema    // array de SchemaField[]
state             // objeto mutable vacío — para pasar datos entre secciones del script
console.log(...)  // visible en los logs del servidor
```

**Límites del sandbox:** timeout 5 segundos · no hay acceso a `fetch`, `fs`, `process` ni binarios nativos. Para lógica que necesite esos recursos (generar gráficas, llamar APIs externas) crea una ruta dedicada en `src/app/api/` y llámala desde el componente especializado, no desde el Zap.

### Flujo típico de un Zap complejo

```javascript
// script: generar_reporte_mensual
const [cotizaciones, clientes, config] = await Promise.all([
  api.query('cotizaciones'),
  api.query('clientes'),
  api.query('config')
]);

// Procesar datos
const resumen = clientes.map(c => ({
  nombre: c.nombre,
  total: cotizaciones
    .filter(cot => cot.cliente_id === c.id)
    .reduce((s, cot) => s + (cot.total_neto || 0), 0)
}));

// Guardar snapshot
await api.saveItem('reportes', {
  data: {
    nombre: `Reporte ${new Date().toLocaleDateString('es-CO')}`,
    datos_json: JSON.stringify(resumen),
    fecha: new Date().toISOString()
  }
});

api.notify.success(`Reporte generado — ${resumen.length} clientes procesados`);

// Descargar CSV directamente
const csv = ['nombre,total_compras']
  .concat(resumen.map(r => `${r.nombre},${r.total}`))
  .join('\n');

api.dispatchEvent('download_file', {
  content: csv,
  filename: 'reporte_mensual.csv',
  mimeType: 'text/csv'
});
```

### Gestión de scripts desde CLI

```
agno> script mi_zap                          ver código actual
agno> script write mi_zap --file ruta.js    sobreescribir desde archivo
agno> script export mi_zap --file ruta.js   exportar para editar en IDE
agno> create-record scripts name=mi_zap     crear entrada vacía (luego escribe el código)
```

Escrituras en Capas 4 y 5

Todas las escrituras son inmediatas — no hay cola de staging activa.

## 🚀 Despliegue Universal de Datos a Producción

En la arquitectura *Code-As-Data*, **no se usa Git** para migrar la lógica de negocio ni las plantillas a la nube. Todo el despliegue es un evento de Datos.

**Flujo Canónico de Despliegue:**
1. Tú (o tu IA) programa el Zap o diseña la Plantilla localmente y pruebas que funciona bien.
2. Usas la utilidad `push-data` conectándote directamente al API Gateway (Vault) de producción, enviando el Namespace y el Nombre.

```bash
# Para subir un Zap (Lógica):
npm run push-data scripts mi_zap_nombre

# Para subir una Plantilla (HTML PDF/Email):
npm run push-data templates mi_plantilla_nombre
```

**Variables de entorno (Opcional):**
Asegúrate de tener configuradas `PRODUCTION_URL` y `API_SECRET_KEY` en tu archivo `.env` para que la CLI tenga los permisos de inyección automática.
Los comandos `status`, `commit` y `drop` son alias heredados sin efecto.
Flujo típico nuevo schema + ruta

npx tsx scripts/agno.ts
agno> create-schema proveedores field:nombre:text field:nit:text field:categoria:select
agno> scaffold proveedores
agno> context
Todas las capas (add-block, scaffold, create-schema, etc.) se escriben directo al storage.

---

## Bloques especializados (agnostic.config.ts)

Los bloques creados en `src/components/specialized/` y registrados en `agnostic.config.ts` se añaden con `add-block` exactamente igual que los del engine. agno los reconocerá con aviso `[CUSTOM]` — eso es normal, no es un error.

```
# Sintaxis para bloque especializado:
agno> add-block /cotizador cotizador_pro context:cotizaciones config:tarifa_jornada=185000

# Respuesta esperada:
[CUSTOM] tipo "cotizador_pro" no está en el catálogo del engine.
  → Se asume bloque especializado de agnostic.config.ts. Añadiendo...
[OK] block:eb66d8dc type:cotizador_pro (custom) en /cotizador  config:{tarifa_jornada:185000}
```

`config:key=val` pasa parámetros al bloque (equivale al campo `config` en el JSON de la ruta). Usa tantos como necesites: `config:tarifa=185000 config:moneda=COP`.

**Si validate muestra `[AVISO]` para tipos custom — es normal.** Solo son errores los problemas de camelCase, contextos rotos o relaciones inválidas.

---

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
✅ api.query('clientes') dentro de un script Zap (server-side — no disponible en componentes React)
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

---

## Campos calculados (derivaciones)

Los campos derivados se computan **read-time** en el formulario — nunca se almacenan como valor fijo. Cuando el usuario cambia cualquier campo fuente, el campo derivado se recalcula en el momento.

El campo es automáticamente **read-only** y muestra un ícono ✦ en el label.

### Definición en el schema

Agrega `config.derivation` a cualquier campo numérico o de texto:

```json
{
  "key": "precio_publico",
  "label": "Precio Público",
  "type": "number",
  "config": {
    "derivation": {
      "op": "MULTIPLY",
      "args": ["precio_directo"],
      "constants": [1.3]
    }
  }
}
```

### Operadores disponibles

| Operador | Descripción | Ejemplo |
|----------|-------------|---------|
| `MULTIPLY` | `args[0] × args[1] × … × constants[0] × …` | `precio * margen` |
| `SUM` | `args[0] + args[1] + … + constants[0] + …` | `subtotal + iva` |
| `SUBTRACT` | `args[0] − (args[1] + … + constants[0] + …)` | `bruto - descuento` |
| `DIVIDE` | `args[0] ÷ (args[1] × … × constants[0] × …)` | `total / unidades` |
| `PERCENTAGE` | `(args[0] × args[1]) / 100` | `base × porcentaje` |
| `AGGREGATE` | Suma de un campo en registros hijos | Ver abajo |
| `LOOKUP` | Copia un campo de un registro relacionado | Ver abajo |
| `SLUGIFY` | Convierte `args[0]` a snake_case | `nombre → slug` |

**`args`** — claves de campos del mismo registro.  
**`constants`** — literales numéricos (e.g. `[1.3]` para multiplicar por 1.3).

#### AGGREGATE — sumar hijos

```json
{
  "op": "AGGREGATE",
  "args": ["precio_unitario"],
  "context": "items_orden",
  "foreignKey": "orden_id"
}
```
Suma `precio_unitario` de todos los registros en `items_orden` cuyo `orden_id` coincida con el `id` del registro actual.

#### LOOKUP — copiar campo de relación

```json
{
  "op": "LOOKUP",
  "args": ["categoria_id", "margen_defecto"],
  "context": "categorias"
}
```
Lee el campo `margen_defecto` del registro de `categorias` cuyo `id` coincide con `categoria_id`.

### Agregar derivación desde el CLI

```
agno> set productos_catalogo.precio_publico.config {"derivation":{"op":"MULTIPLY","args":["precio_directo"],"constants":[1.3]}}
agno> commit --force
agno> npm run agnostic:compile
```

### Backfill de registros existentes (Zap de migración)

Cuando agregas una derivación a un schema que ya tiene datos, los registros históricos no tienen el campo calculado. Ejecútalo una sola vez con un Zap:

```javascript
// nombre del script: backfill_precio_publico
const productos = await api.query('productos_catalogo');
let actualizados = 0;
for (const p of productos) {
  if (p.precio_directo) {
    await api.saveItem('productos_catalogo', {
      id: p.id,
      data: { precio_publico: p.precio_directo * 1.3 }
    });
    actualizados++;
  }
}
api.notify.success(`${actualizados} productos actualizados`);
```

Crea el script con agno y ponlo en un action block de administración:

```
agno> script write backfill_precio_publico --file scripts/backfill_precio_publico.js
agno> add-block /admin action context:productos_catalogo config:zap=backfill_precio_publico
```

Una vez ejecutado y verificado, puedes borrar ese action block — el Zap queda en el storage como registro histórico.

### Cuándo usar derivación vs. Zap

| Caso | Usar |
|------|------|
| Campo que se calcula de otros campos del mismo registro | `config.derivation` |
| Campo que suma hijos o busca en relaciones | `config.derivation` con AGGREGATE/LOOKUP |
| Lógica que muta datos en otros schemas | Zap |
| Lógica condicional compleja (`if`, loops, fetch) | Zap |
| Cálculo que necesita persistirse para consultas externas | Zap que guarda el resultado |