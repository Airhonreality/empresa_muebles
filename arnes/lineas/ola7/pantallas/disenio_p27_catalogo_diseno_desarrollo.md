# P-27 — Catálogo de productos (Diseño-Desarrollo)

**Fecha:** 2026-08-09 · **Estado:** propuesta · **Fase:** F2 (adjunta a B1) · **Ruta:** `/app/erp/catalogo` · **Roles:** `admin`, `desarrollador` (diseño-desarrollo), `diseñador`

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`). No redefinas schemas aquí.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `productos_catalogo` | §2 Catálogo | id, sku, descripcion, tipo, unidad_medida, precio_directo, precio_publico, stock_actual, proveedor_id, imagen_url, modelo_3d_url, categoria_comercial, publicado_web, proyecto_origen_id, created_at, updated_at | CRUD del catálogo. Es la **CLASE** (POC-09): la ficha comercial para todo el sistema. |
| `proveedores` | §2 Catálogo | id, nombre, nit | Select para `proveedor_id` |
| `categorias` | §2 Catálogo (FLAG4) | id, nombre, padre_id | Select para `categoria_comercial` (cuando exista) |

**Principio clase ↔ instancia (POC-09 / decisión 2026-08-07):** este catálogo es la CLASE. Los ítems de cotización (`items_variante`) y los artefactos (`espacios_artefactos`) son INSTANCIAS que la referencian por FK. Esta pantalla NO define comportamientos de instancia (jornadas, medidas, colores elegidos) — eso vive en P-04 / módulo de espacio.

---

## 2. Estados que transiciona

*Cita los estados del REGISTRO DE ENTIDADES y del glosario H07.*

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| — (creación) | "Crear producto" | `borrador` (no `publicado_web`) | — | `sku` único, `descripcion` requerida, `precio_directo ≤ precio_publico` |
| `borrador` | "Publicar en web" | `publicado_web = true` | — | `publicado_web` togglable |
| `publicado_web` | "Despublicar" | `publicado_web = false` | — | — |

> No hay máquina de estados formal para `productos_catalogo` en el REGISTRO; `publicado_web` es concebida como flag booleano de publicación (no transición de estado de vida). Anotado para revisión en M-07 si el patrón exige estado formal.

---

## 3. Vocabulario H07 (labels visibles)

*Cita del `glosario_h07.md`. Todo label de UI sale de aquí.*

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Catálogo" | — | — (título de página) |
| "Producto fijo" | `producto_fijo` | — (solo área diseño-desarrollo; NO aparece en flujo comercial) |
| "SKU" | `sku` | `productos_catalogo.sku` |
| "Descripción" | `descripcion` | `productos_catalogo.descripcion` |
| "Tipo" | `tipo` | `productos_catalogo.tipo` |
| "Unidad" | `unidad_medida` | `productos_catalogo.unidad_medida` |
| "Precio directo" | `precio_directo` | `productos_catalogo.precio_directo` |
| "Precio público" | `precio_publico` | `productos_catalogo.precio_publico` |
| "Stock" | `stock_actual` | `productos_catalogo.stock_actual` |
| "Proveedor" | `proveedor_id` | `productos_catalogo.proveedor_id` → `proveedores` |
| "Imagen" | `imagen_url` | `productos_catalogo.imagen_url` |
| "Publicado en web" | `publicado_web` | `productos_catalogo.publicado_web` |
| "Nuevo producto" | — | — (botón) |
| "Crear Producto" | — | — (botón submit) |
| "Ficha técnica" | — | extensión `productos_atributos` (POC-09, mini-diámetro pendiente) |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | `sku` único en `productos_catalogo` | Server (`sku` unique) | Test: crear dos productos con mismo SKU → error "El SKU ya existe" |
| R2 | `descripcion` requerida | Client + Server | Test: POST sin `descripcion` → 400 |
| R3 | `precio_directo ≤ precio_publico` (si ambos no nulos) | Client (MoneyInput) + Server | Test: POST con precio directo > público → 400 |
| R4 | `precio_directo` y `precio_publico` ≥ 0 | Client (MoneyInput min=0) + Server | Test: POST con precio negativo → 400 |
| R5 | `publicado_web=true` requiere `precio_publico` y `imagen_url` presentes | Server | Test: publicar producto sin imagen → 400 "La imagen es obligatoria para publicar" |
| R6 | `stock_actual ≥ 0` | Client + Server | Test: POST con stock negativo → 400 |
| R7 | Solo roles `admin`, `desarrollador` (diseño-desarrollo), `diseñador` crean/editan; `comercial` es lectura | Guard en POST/PUT /api/erp/catalogo | Test: POST con rol `comercial` → 403 |
| R8 | Edición de un producto referenciado en cotizaciones no rompe totales históricos (los ítems guardan `precio_unitario` snapshot) | Server | Test: cambiar `precio_publico` de producto con items_variante existentes → totales históricos intactos |
| R9 | "Anexar a catálogo" desde P-04 (ItemRow referencial) abre ESTE modal (no crea inline) | Navegación | Test: click "Anexar a catálogo" → `/erp/catalogo` modal con datos prellenados |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `CatalogoGrid` | Client | `productos: ProductoCatalogo[], onEdit, onDelete` | `productos_catalogo` | Grid de tarjetas (3-4 col responsive), evita "tabla de ERP" (ver §5.1) |
| `ProductoCard` | Client | `producto: ProductoCatalogo, onEdit, onDelete` | `productos_catalogo` | Tarjeta con miniatura HD, descripción, precio, estado publicación |
| `ProductoModal` | Client | `producto: ProductoCatalogo \| null` (null = crear), `onSaved: (p) => void` | `productos_catalogo` | Modal (`--color-primary`, `Fraunces`), Formulario completo |
| `MoneyInput` | Client (M-06 L1) | `value, onChange, min?: number` | `productos_catalogo.precio_*` | `inputmode="decimal"`, `--focus-ring` |
| `PublicadoWebToggle` | Switch | `checked, onChange` | `productos_catalogo.publicado_web` | Switch primitiva, estados visuales |
| `ImagenUpload` | Client | `url, onUpload` | `productos_catalogo.imagen_url` | Upload (patrón E-41), aspect-ratio 16:9, `--veta-radius-md` |
| `ProveedorSelect` | Client | `proveedores, value, onChange` | `proveedores` | Select primitiva, `--radius-md` |
| `SmartSearch` | Client (M-06 L1) | `items, onSelect, placeholder` | `productos_catalogo` (para filtrar tabla) | `role="combobox"`, `aria-autocomplete="list"` |
| `FichaTecnicaSkeleton` | Display | — | `productos_atributos` (POC-09 pendiente) | Skeleton con aspect-ratio reservado |

**Patrones M-06 L1 usados:** `MoneyInput`, `useDebounce` (filtros catálogo, 300ms), SmartSearch (filtro), Suspense + loading states, primitivas `components/veta/` (Modal, Input, Select, Button, Switch, Badge)

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | `page.tsx` mount | `Promise.all([getCatalogo(), getProveedores()])` | — | — |
| 2 | Filtrar catálogo | Escribir en SmartSearch | `useDebounce` 300ms → filtro por descripción/SKU/tipo | — | — |
| 3 | Crear producto | Click `[Nuevo producto]` | Abre `ProductoModal` en modo crear | — | — |
| 4 | Guardar producto | Click `[Crear Producto]` | `POST /api/erp/catalogo` → inserta `productos_catalogo` | Valida R1-R7 | — |
| 5 | Editar producto | Click `✎` en tarjeta | Abre `ProductoModal` en modo editar, `PUT /api/erp/catalogo/:id` | Valida R1-R7 | — |
| 6 | Publicar/despublicar producto | Toggle `Publicado en web` en tarjeta | `PUT /api/erp/catalogo/:id {publicado_web}` | Valida R5 | — |
| 7 | Anexar desde P-04 | Click "Anexar a catálogo" en ItemRow referencial | Abre `ProductoModal` con datos del ítem prellenados | R9 | — |
| 8 | Eliminar | Click `✕` en tarjeta | `anulado`/desactivación suave (según patrón M-07) | Históricos intactos (R8) | — |

---

## 6.1 Doble Diamante — Presentación Visual "Vitrina de Producto" (Eliminar Estética ERP)

**Objetivo:** La pantalla del Catálogo debe DEJAR DE SENTIRSE como una tabla de inventario de ERP y aproximarse al look de una vitrina de producto / galería comercial, manteniendo 100% de la funcionalidad operativa que el equipo de diseño-desarrollo necesita (filtros, búsqueda, edición, publicación).

### 7.1 DIVERGER (Diamante 1 — Descubrir)

**Necesidad del usuario interno (diseñador/desarrollador del equipo Veta de Oro):**
- Necesito ver mi inventario de PRODUCTOS, no de "rows de datos".
- Quiero ver la imagen de cada producto de un vistazo (es lo primero que miro al catalogar).
- Necesito rápidamente identificar cuál está publicado en web y cuál no (flag visible, no en columna).
- Quiero buscar/filtrar sin escribir un WHERE statement mental — busca por palabra clave en descripción/SKU.
- Debo poder editar/publicar SIN abrir 5 modales — acciones rápidas en la tarjeta misma.

**Contexto de uso:** Mientras el comercial ve el Catálogo en P-04 (Cotizador) como referencia de búsqueda para completar cotizaciones, EL DUEÑO del Catálogo es el área de Diseño-Desarrollo, que lo administra activamente — es un TALLER, no una consulta de lectura.

**Referencias externas:** Gestores de contenido (Shopify Admin, WooCommerce, Figma Assets), portfolios de marcas de muebles (look: tarjetas grandes con fotos, 3-4 por fila, grid responsivo).

### 7.2 CONVERGER (Diamante 1 — Definir)

**Reglas de juego:**
- No más DataTable densa (`--veta-text-data`). Usamos Grid responsivo (3-4 columnas, móvil 1-2).
- Imagen ES el hero de la tarjeta (no un ícono pequeño en columna 1, sino 80% del ancho).
- Metadata en tarjeta: descripción (truncada), precio público (si existe), estado publicación (badge/switch visible).
- Botones rápidos: `[✎ Editar]` `[✕ Eliminar]` en footer de tarjeta (no en popup).
- Búsqueda & filtro arriba: un SmartSearch centralizador + filtro opcional (por categoría, si existe en §1).

### 7.3 DIVERGER (Diamante 2 — Explorar Alternativas)

**Opción A: Tarjeta Mínima (Imagen Grande + Descripción)**
```
┌─────────────────────┐
│   [IMAGEN HD]       │  ← aspect-ratio 4:3
│   (200px ancho)     │
├─────────────────────┤
│ Descripción (2 línea)│
│ SKU: ABC-001        │
│ $85.000             │
│ [Publicado en web]  │ ← badge verde
│ [✎] [✕]            │
└─────────────────────┘
```
**Ventaja:** Limpia, foco en imagen, rápida de scanear.
**Desventaja:** Falta el precio directo (interno) — el diseñador a veces necesita confirmarlo rápido. Metadata densidad media.

---

**Opción B: Tarjeta Media (Info Completa, 2 Columnas)**
```
┌──────────────────────────────────┐
│ [IMAGEN]  │ Descripción          │
│ 120×120   │ SKU: ABC-001         │
│           │ Tipo: Madera         │
│ [badge]   │ Precio directo: —    │
│           │ Precio público: $85k │
│           │ [Publicar/Despublicar]
│           │ [✎] [✕]             │
└──────────────────────────────────┘
```
**Ventaja:** Toda la metadata visible sin truncar. Buena proporción imagen-info.
**Desventaja:** Tarjeta más alarga, menos compacta en grid. Densidad media-alta.

---

**Opción C: Tarjeta Expandible (Mínima en Reposo, Completa al Hover)**
```
Reposo:
┌──────────────┐
│  [IMAGEN]    │
│              │
│ Descripción  │
│ $85.000      │
└──────────────┘

Hover → Expande:
┌──────────────┐
│  [IMAGEN]    │
│  SKU ABC-001 │
│  Tipo Madera │
│  Dir: $—     │
│  Pub: $85k   │
│  [Publicado] │
│  [✎] [✕]     │
└──────────────┘
```
**Ventaja:** Grid visualmente limpio en reposo, detalles en hover (accesible).
**Desventaja:** En móvil no hay hover — necesita fallback (tap = expandir, o directamente mostrar completo).

### 7.4 CONVERGER (Diamante 2 — Entregar Solución Híbrida)

**OPCIÓN GANADORA: A (Tarjeta Mínima) + Diseño Responsivo**

Estrategia: Mantener la tarjeta PEQUEÑA y LIMPIA. La metadata densa (precios directo/público, tipo, categoría) vive en `ProductoModal` al hacer click en [✎] — no debería estar "siempre visible" en el catálogo de lectura rápida.

**Estructura de `ProductoCard` (DEFINITIVO):**

```
┌─────────────────────────────────┐
│         [IMAGEN HD]             │ ← 100% ancho tarjeta, aspect-ratio 1:1 o 4:3
│      (si existe imagen_url)     │    si no → placeholder gris + ícono producto
│                                 │
├─────────────────────────────────┤ ← padding: 16px
│ Descripción (max 2 líneas)      │ ← Inter size-sm, truncated-2
│ SKU: ABC-001                    │ ← size-xs, color-text-muted
│                                 │
│ $85.000                         │ ← size-md, negrita, color-primary (precio público)
│ [Publicado en web] ✓            │ ← badge verde si publicadoWeb=true, roja si false
│                                 │
│ [✎ Editar] [✕ Eliminar]        │ ← buttons pequeños (size-sm), fondo transparent
└─────────────────────────────────┘
```

**Grid Layout:**
- Desktop (1200px+): 4 columnas (25% ancho cada una, 300px máximo)
- Tablet (768px+): 3 columnas (33% ancho)
- Móvil (<768px): 2 columnas (50% ancho)
- Spacing: `gap-6` entre tarjetas (24px)

**Búsqueda y Filtro (arriba de grid):**
```
┌─────────────────────────────────────┐
│ [🔍 SmartSearch] [Categoría ▼] [Publicados ◉]
└─────────────────────────────────────┘
```
- SmartSearch: busca en `descripcion`, `sku`, tipo (fuzzy, igual que Cotizador P-04)
- Categoría: dropdown si existen categorías en schema (FLAG4, provisional)
- Filtro rápido: radio buttons o chips [Todo][Solo publicados][Solo borradores]

**Tokens D4 a Reusar:**
- `--radius-lg` en las tarjetas (esquinas redondeadas, no cuadradas ERP)
- `--shadow-sm` sutil alrededor de cada tarjeta (separación visual)
- `--color-primary` para precios (color de marca, no blanco-sobre-gris)
- `--font-display` (Fraunces) para el precio (destaque, igual que en Cotizador)
- `--color-bg-alt` para placeholder de imagen faltante
- `--focus-ring` en buttons pequeños (accesibilidad)

**Regla Anti-ERP Verificada:**
- ❌ NO DataTable (`<table>`, cabecera horizontal, filas planas)
- ❌ NO columnas como "Stock", "Proveedor", "Proyecto origen" en lista (van a modal)
- ❌ NO badges de estado en cada columna
- ✅ SÍ grid de tarjetas con imagen como centro visual
- ✅ SÍ acciones rápidas integradas (editar, eliminar) sin popup extra
- ✅ SÍ búsqueda clara + filtros simples
- ✅ SÍ espaciado generoso (`gap-6`, `padding-4`) — no densidad

**Aplicación de la Herencia Visual (Tarea 3):**
- Cada tarjeta muestra `ProductoCatalogo.imagenUrl` como hero (no es link a modal — es solo foto referencial del catálogo)
- Cuando un Cotizador (`ItemVariante`) referencia este producto, el `ItemDescriptorModal` abre la misma imagen + specs en un modal aparte
- No hay colisión: el Catálogo es gestión (administración de CLASE), el Cotizador es consumo (referencia de INSTANCIA)

---

## 6.2 Universo compras/cotización vs. universo tienda (resolución 2026-08-11)

**Hallazgo de Javier:** "estado de publicación" no debería ser un campo visible en las tarjetas — el Catálogo (≥200 componentes: tableros, bisagras, correderas...) es un universo especializado de compras/cotización, distinto del universo de productos de tienda (diseños consolidados de Veta Dorada). Un ítem cotizado nunca debería convertirse en producto de tienda; un producto compuesto por muchos ítems consolidados como un diseño sí.

**Diagnóstico (verificado en código antes de proponer el fix):**
- `productos_catalogo.publicadoWeb` — el switch que esta pantalla mostraba en cada fila — **no alimenta `/colecciones`**. La tienda pública lee de `store.productosTienda.visibles()` (`ProductoTienda.visibleEnTienda`), una entidad de extensión aparte (`disenio_F02_tienda_web.md`). El switch de esta pantalla era, en la práctica, un flag muerto — cosméticamente sugería "esto está en la tienda" sin tener ningún efecto real ahí. Confirmado: cero referencias a `publicadoWeb` en `app/(publico)/colecciones/`.
- **No existe ninguna pantalla ni flujo hoy que cree una fila `ProductoTienda`** — la tabla solo tiene datos de `fixtures.ts`. El equipo de diseño-desarrollo no tiene forma de publicar un diseño nuevo a la tienda desde el ERP.
- `ProductoTienda.catalogoId` es un FK **singular** a un solo `ProductoCatalogo` — el modelo de datos de hoy solo puede representar "un componente = un producto de tienda", nunca "un diseño compuesto por N componentes = un producto de tienda". Esto es la causa raíz de que ambos universos se sintieran mezclados: el propio schema no distingue componente de diseño consolidado.

**Resuelto ahora (ejecutado en `app/erp/catalogo/page.tsx`, sin tocar schema):**
1. "Publicado en web" **eliminado de la tarjeta** — no vuelve a mostrarse como metadato en el grid de 200+ componentes (queda solo dentro del modal de edición, donde ya vivía como parte de R5, sin cambios de comportamiento).
2. Filtro nuevo **"Solo productos de tienda"** — junto al buscador, filtra el grid a los `ProductoCatalogo` que sí tienen un `ProductoTienda.catalogoId` vinculado (única señal real de "esto está en la tienda" hoy).
3. Grid ultra compacto (2-6 columnas según viewport, miniatura 40×40 + SKU/descripción/precio en una fila de ~56px) para navegar 200+ ítems sin scroll infinito de una tabla densa.
4. Modal de edición: la miniatura se muestra a **tamaño real (160×160)** junto a los parámetros clave (descripción, SKU, precio, stock) al abrir — antes solo había un picker de 96px sin vista previa destacada.
5. Se agregó "Anular producto" al pie del modal (antes vivía como ícono en cada fila de la tabla; con tarjetas clicables ultra compactas, la acción destructiva se movió dentro del modal para no competir por espacio en 200+ tarjetas).

**Ejecutado 2026-08-11 (aprobado por Javier):**

Para que "un producto compuesto por muchos ítems" sea real y no solo un FK singular, `ProductoTienda` necesita una relación N:M con `ProductoCatalogo` en vez de un `catalogoId` 1:1. Propuesta mínima, mismo patrón axiomático que `items_variante` (INSTANCIA que referencia CLASE por FK, sin duplicar catálogo):

```
ProductoTiendaComponente {
  id: string
  productoTiendaId: string   // FK → ProductoTienda (el diseño consolidado)
  catalogoId: string         // FK → ProductoCatalogo (el componente, ej. "Tablero Roble 18mm")
  cantidad: string           // cuántas unidades del componente entran en 1 unidad del diseño
}
```

Implementado de forma aditiva: `ProductoTienda.catalogoId` se conserva (componente representativo, usado por `/colecciones/[id]`) y `ProductoTiendaComponente` se agrega como la composición real. El filtro "Solo productos de tienda" del catálogo ya considera ambas fuentes. Fixture de referencia: `pt01` (Mueble TV Nogal) compuesto de 3 componentes reales (`PRODUCTOS_TIENDA_COMPONENTES` en `fixtures.ts`). Test de round-trip en `mock-store.test.ts`. Verificado: `tsc`/`eslint` 0, 73/73 tests.

---

## 6.3 Rediseño Responsive del Formulario (Creación/Edición) — Dos Columnas + Ficha de Presentación (t-139, 2026-08-15)

**Objetivo (Punto 3 del input de Javier):** reestructurar el alta/edición de producto para desktop/tablet en una maquetación a dos columnas que elimine el scroll innecesario del modal actual (`ProductoModal` de una columna) y aproveche pantallas anchas. La columna derecha (slider + cabecera de datos básicos) se diseña como **ficha de presentación reutilizable frente al cliente final**.

### 6.3.1 Entidad — galería multi-imagen

`ProductoCatalogo` hoy solo tiene `imagenUrl` (portada, single). Para el slider se agrega `galeriaImagenesUrl: string[]` (jsonb, patrón idéntico a `Portafolio.galeriaPortafolioUrl` y `EspacioVariante.fotosEspacio`):

| Campo | Tipo | Uso |
|---|---|---|
| `imagenUrl` (existente) | `text` / `string \| null` | **Portada** del producto — mantiene compat con cards del grid, cotizador, JSON-LD de `/colecciones`. |
| `galeriaImagenesUrl` (nuevo) | `jsonb default []` / `string[]` | Imágenes adicionales del slider. La galería del slider = `[imagenUrl, ...galeriaImagenesUrl]`. |

**R5 (publicar) ampliada:** `publicado_web=true` exige `precio_publico` **y** (`imagenParaPortada` = `imagenUrl` OR `galeriaImagenesUrl.length > 0`). Se actualiza en `store.catalogo.actualizar/crear` (mock) y `crearProductoCatalogoAction`/`actualizarProductoCatalogoAction` (Drizzle).

**Edición de imágenes:** el `ImagePicker` del formulario usa `multiple={true}` + `uploadToR2` + `r2Prefix="catalogo/"` (mismo patrón que F-03 portafolio). El array resultante es `imagenes: string[]`: `imagenUrl = imagenes[0] ?? null`, `galeriaImagenesUrl = imagenes.slice(1)`.

### 6.3.2 Layout — panel a pantalla completa (dos columnas)

Se reemplaza el `Modal` por un **panel de ancho completo** (`fixed inset-0 z-[...] bg-bg-paper overflow-y-auto`) dentro de `/erp/catalogo` — preserva el deep-link `?source=cotizador&proyectoId=` de R9 (sin cambiar rutas ni el auto-open desde cotizador).

```
┌──────────────────────────────────────────────────────────────┐
│ [← Volver]   Editar producto            [Anular] [Guardar]      │  ← header bar
├───────────────────────────────┬──────────────────────────────┤
│ COLUMNA 1 — FORMULARIO        │ COLUMNA 2 — FICHA (sticky)    │
│  SKU  |  Tipo                  │  ┌──────────────────────────┐ │
│  Descripción                   │  │  SLIDER (portada+galería) │ │  ← gallery-rail
│  Unidad | Stock                │  │  [ <  img  > ]  ···       │ │
│  Precio directo | Público      │  ├──────────────────────────┤ │
│  Categoría | Proveedor         │  │  Descripción (Fraunces)   │ │
│  [Publicado en web]            │  │  SKU · unidad             │ │
│  [Imágenes ▸ ImagePicker ×N]   │  │  $ precio público         │ │
│                                │  │  badge Publicado · cat    │ │
│                                │  └──────────────────────────┘ │
└───────────────────────────────┴──────────────────────────────┘
```

- **Desktop/tablet (≥`lg`):** `grid-cols-[7fr_5fr]`. Columna 2 (ficha) `sticky top-…`, no scrollea sola.
- **Móvil (<`lg`):** una columna (`grid-cols-1`); la **ficha va arriba** (orden visual: ficha primero, formulario debajo) — es la "cabecera de presentación".
- Sin scroll innecesario: el panel interno scrollea solo en la columna del formulario cuando hace falta; la ficha queda fija como referencia en vivo.

### 6.3.3 Componentes (tokens D4)

| Componente | Tipo | Props | Tokens D4 |
|---|---|---|---|
| `gallery-rail.tsx` | Client (primitiva **compartida**) | `fotos: {url,alt}[]`, `etiqueta?`, `aspectRatio?`, `onZoom?` | `--radius-lg`, `shadow-sm`, `border-brand`, focus-ring, `useId()` para a11y (sin `Math.random`) |
| `producto-ficha.tsx` | Client (presentacional **standalone**) | `data: { descripcion, sku, unidadMedida, precioPublico?, precioDirecto?, stockActual?, categoriaComercial?, tipo?, publicadoWeb, imagenUrl?, galeriaImagenesUrl? }` | `Fraunces` para descripción/precio, `--color-primary` para precio, `Badge` para estado |
| `Modal` / overlay | (reemplazado) | — | — |

**Minimalismo (diseño axiomático):** `gallery-rail` es **la única** primitiva de slider del proyecto. La propuesta pública (F-08) reemplaza su `GaleriaCarril` local por `gallery-rail`, y sus `ItemCard` pasan a mostrar `[imagenUrl, ...galeriaImagenesUrl]`. Así un solo slider sirve a ERP (ficha) y a la propuesta del cliente.

**Reutilización como ficha cliente:** `ProductoFicha` recibe datos planos (no la entidad del store), de modo que el mismo componente alimenta (a) el preview en vivo del formulario ERP (mapeando el `form`), y (b) futuros contextos cliente (PDF, propuesta, tienda) sin acoplarse al ERP. El universo tienda (`ProductoTienda`, F-02) queda **fuera** de este alcance (P-27 §6.2 mantiene ambos separados).

### 6.3.4 Comportamiento

| # | Evento | Gatillo | Acción |
|---|---|---|---|
| 1 | Editar/crear | Click tarjeta / "Nuevo" / deep-link cotizador | Abre panel full-screen dos columnas |
| 2 | Preview en vivo | Escribir en el form | `ProductoFicha` (col. 2) se actualiza en tiempo real con el estado del `form` |
| 3 | Subir imágenes | `ImagePicker` multiple (R2) | `imagenes=[]`; portada=`[0]`, galería=`[1..]` |
| 4 | Guardar | "Guardar" | `producto.catalogo.actualizar/crear` con `imagenUrl` + `galeriaImagenesUrl` |

### 6.3.5 Criterios de aceptación (t-139)

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | `eslint .` = 0 en `app/erp/catalogo/` y `components/veta/` | `eslint app/erp/catalogo components/veta` |
| CA-3 | `galeriaImagenesUrl` existe en `contracts.ts`, `schema.ts`, fixtures, mock-store y actions | grep en los 5 |
| CA-4 | R5 ampliada: publicar con galería y sin `imagenUrl` es válido; sin imagen ni galería se rechaza | test `mock-store.test.ts` (nuevo caso) |
| CA-5 | Round-trip `galeriaImagenesUrl` (crear→leer→actualizar→leer) | test `mock-store.test.ts` |
| CA-6 | Panel dos columnas en `lg`, ficha sticky; móvil ficha arriba | inspección + `next build` |
| CA-7 | F-08 usa `gallery-rail` (no `GaleriaCarril` local) | grep: `GaleriaCarril` ya no aparece en `propuesta/[proyectoId]/page.tsx` |
| CA-8 | `ProductoFicha` es standalone (props planas, sin import de store) | grep: `producto-ficha.tsx` no importa `useDataStore` |

---

## 6.4 Especificación v2 — Panel de dos columnas con ficha de presentación (t-139)

**Fecha:** 2026-08-15 · **Estado: APROBADO — checkpoint del Supervisor confirmado en vivo (2026-08-15). Mutación de schema (`galeria_imagenes_url`) verificada aplicada en la DB real (`dev-local`): columna `jsonb default '[]'`, 8/8 migraciones registradas en `drizzle.__drizzle_migrations`, sin drift.** · **Versión:** v2 (consolida y formaliza la primera pasada de §6.3 del mismo t-139; ambas conviven como historial versionado — esta sección no borra ni corrige lo ya escrito).

### 6.4.1 Alcance y trazabilidad

- **Fuente de verdad del pedido:** `arnes/lineas/ola7/tecnico/input_diseno_javier_20260815.md`, Punto 3. Proceso pedido por Javier: revisar el `disenio_p27` actual → revisar `backlog_auditoria_pantallas.md` + `checklist_progreso_pantallas.md` → recién ahí actualizar el diseño.
- **Tres decisiones ya tomadas por escrito por Javier (este documento las documenta; no las toma):**
  1. Agregar `galeriaImagenesUrl: string[]` a `productos_catalogo` (mismo patrón que `galeriaPortafolioUrl`/`fotosEspacio`, ARCH-012).
  2. La vista de dos columnas se materializa como **panel a pantalla completa dentro de `/erp/catalogo`** (sin ruta nueva), preservando el deep-link `?source=cotizador&proyectoId=` de la regla R9.
  3. La columna derecha es un componente presentacional **standalone** (`ProductoFicha`) + preview en vivo, reutilizable como ficha cliente; la propuesta pública (F-08) lo adoptará después reemplazando su `GaleriaCarril` local por la primitiva `gallery-rail` — **esa adopción queda fuera del alcance de t-139** (intención futura, no mandato de esta tarea).

### 6.4.2 Revisión previa — hallazgos de backlog/checklist relevantes a P-27

| Fuente | Hallazgo | Implicación para este diseño |
|---|---|---|
| `backlog_auditoria_pantallas.md` D-14 (P-27) | R9 ya ejecutado: "Anexar a catálogo" pasa `proyectoId` por query param, `/erp/catalogo` lo lee, prellena `proyectoOrigenId` y auto-abre el modal. Gap menor documentado: SKU/descripción/precio del ítem referencial **no** se prellenan (el cotizador no los pasaba) — no bloqueante. | El panel full-screen debe conservar el auto-open y el `proyectoOrigenId` (R9 intacta). El gap D-14 no se cierra ni se amplía en t-139: queda documentado y fuera de alcance. |
| `checklist_progreso_pantallas.md` punto 11 | Todo input de imagen usa `components/veta/image-picker.tsx` (`multiple={false}` campo único / `multiple={true}` arreglos). Nunca `<input type="text" placeholder="https://...">` nuevo. | El `ImagePicker` del formulario (`multiple={true}`, `r2Prefix="catalogo/"`) es el primitivo obligatorio del selector de imágenes. |
| `checklist_progreso_pantallas.md` punto 14 | SSR/hidratación: ningún id/key renderizado en servidor con `Math.random()`/`Date.now()`; usar `useId()`. | `gallery-rail` genera sus ids/keys con `useId()`. |
| `checklist_progreso_pantallas.md` punto 15 | Tokens Tailwind verificados contra `app/globals.css` — las clases sobre `--color-*` inexistentes se descartan en silencio. | El panel usa solo tokens reales: `bg-bg-paper`, `--radius-lg`, `--shadow-sm`, `--color-border-brand`, `--color-text-primary` (los mismos que ya usa la ficha). |
| `checklist_progreso_pantallas.md` puntos 5-7 | Round-trip test por dominio + los 4 comandos (`tsc`, `eslint`, `build`, `mock-store.test.ts`) como Definición de Hecho. | Se citan como criterios CA-16/CA-17/CA-19 nuevos. |
| `arnes/estado.md` (2026-08-15) | El working tree ya contiene una implementación en curso de este mismo t-139 (migración `0006` con `galeria_imagenes_url`, y `ProductoFicha`/`GalleryRail` ya presentes en `app/erp/catalogo/page.tsx` y `app/(publico)/propuesta/[proyectoId]/page.tsx`) — sesión concurrente. | Este diseño formaliza esa implementación (diseño retrospectivo del mismo t-139). **No sustituye el checkpoint de schema**: el checkpoint del Supervisor sigue siendo el gate previo a considerar `galeriaImagenesUrl` aprobado para migración/ejecución definitiva. |

### 6.4.3 Mutación de schema — `galeriaImagenesUrl` en `productos_catalogo` (CHECKPOINT PENDIENTE)

| Campo | Tipo | Origen | Uso |
|---|---|---|---|
| `imagenUrl` (existente, no cambia) | `text` / `string \| null` | schema actual (§1) | **Portada.** Mantiene compat con cards del grid, cotizador y JSON-LD de `/colecciones`. |
| `galeriaImagenesUrl` (**NUEVO — único campo nuevo de esta sección**) | `jsonb default []` / `string[]` | Decisión por escrito de Javier (input Punto 3, decisión (1)); patrón ARCH-012 (`Portafolio.galeriaPortafolioUrl`, `EspacioVariante.fotosEspacio`) | Imágenes adicionales del slider. La galería del slider = `[imagenUrl, ...galeriaImagenesUrl]`. |

> **ADVERTENCIA — MUTACIÓN DE SCHEMA, checkpoint explícito del Supervisor pendiente.** `galeriaImagenesUrl` agrega una columna a `productos_catalogo` (ORM `lib/db/schema.ts` + contrato `lib/data/contracts.ts`). AGENTS.md: *"No se debe modificar el schema de datos (ORM)... sin pasar por el checkpoint de Supervisor."* Javier la decidió por escrito en el input, pero **esta sección no la da por aprobada para ejecución**: el checkpoint formal es un paso separado y previo a que Código toque `lib/db/schema.ts` o `lib/data/contracts.ts`. No se inventa ninguna otra columna de `productos_catalogo` fuera de esta. §1 de este documento no se modifica: el campo aún no existe en el schema canónico (`REGISTRO_DE_ENTIDADES.md` §2) y se documenta acá únicamente como propuesta.

**R5 ampliada (especificada aquí; se ejecutará solo tras el checkpoint):** `publicado_web=true` exige `precio_publico` **y** (`imagenUrl` OR `galeriaImagenesUrl.length > 0`). Cubre "publicar con galería y sin portada" (válido) y rechaza "sin imagen ni galería".

### 6.4.4 Layout — panel a pantalla completa (dos columnas)

- Reemplaza el `Modal` por un **panel `fixed inset-0 z-[...] bg-bg-paper overflow-y-auto`** dentro de `/erp/catalogo` — sin ruta nueva; el deep-link de R9 sigue funcionando.
- Desktop/tablet (≥`lg`): `grid-cols-[7fr_5fr]`. Columna 2 (ficha) `sticky top-…`, no scrollea sola; la columna 1 scrollea internamente si lo necesita.
- Móvil (<`lg`): `grid-cols-1`; la **ficha va arriba** (cabecera de presentación) y el formulario debajo.

```
┌──────────────────────────────────────────────────────────────┐
│ [← Volver]   Editar producto            [Anular] [Guardar]      │  ← header bar
├───────────────────────────────┬──────────────────────────────┤
│ COLUMNA 1 — FORMULARIO        │ COLUMNA 2 — FICHA (sticky)    │
│  SKU  |  Tipo                  │  ┌──────────────────────────┐ │
│  Descripción                   │  │  SLIDER (portada+galería) │ │  ← gallery-rail
│  Unidad | Stock                │  │  [ <  img  > ]  ···       │ │
│  Precio directo | Público      │  ├──────────────────────────┤ │
│  Categoría | Proveedor         │  │  Descripción (Fraunces)   │ │
│  [Publicado en web]            │  │  SKU · unidad · categoría │ │
│  [Imágenes ▸ ImagePicker ×N]   │  │  $ precio público         │ │
│                                │  │  badge Publicado/Borrador │ │
│                                │  └──────────────────────────┘ │
└───────────────────────────────┴──────────────────────────────┘
```

### 6.4.5 Contrato de props — `ProductoFicha` (componente standalone)

Datos planos (interfaz `ProductoFichaData`), sin import del store — el mismo componente alimenta (a) el preview en vivo del ERP mapeando el `form`, y (b) futuros contextos cliente (PDF, propuesta, tienda) sin acoplarse al ERP.

| Campo | Tipo | Requerido |
|---|---|---|
| `descripcion` | `string` | sí |
| `sku` | `string` | sí |
| `unidadMedida` | `string` | sí |
| `precioPublico` | `string \| number \| null` | opcional |
| `precioDirecto` | `string \| number \| null` | opcional |
| `stockActual` | `number \| null` | opcional |
| `categoriaComercial` | `string \| null` | opcional |
| `tipo` | `string \| null` | opcional |
| `publicadoWeb` | `boolean` | opcional (default `false`) |
| `imagenUrl` | `string \| null` | opcional |
| `galeriaImagenesUrl` | `string[]` | opcional |

Props del componente: `{ data: ProductoFichaData; onZoom?: (imagenes: GalleryImage[], index: number) => void; className?: string }`.

Reglas de construcción:
- Galería = `[imagenUrl, ...(galeriaImagenesUrl ?? [])]` mapeada a `GalleryImage[]` (`{url, alt}`) y renderizada con `GalleryRail`.
- `Fraunces` para descripción y precio; `--color-primary` (gold de marca) para el precio; moneda es-CO, 0 decimales.
- Badge de estado: "Publicado en web" (punto verde) vs. "Borrador".
- **Standalone:** no importa `useDataStore()` ni ninguna entidad del store (criterio CA-13).
- **Preview en vivo:** la col. 2 mapea el estado del `form` a `ProductoFichaData` (función `fichaDesdeForm`) y se actualiza en cada tecla sin guardar.

### 6.4.6 Primitiva compartida — `gallery-rail`

Props `GalleryRailProps`: `fotos: GalleryImage[]` (`{url, alt}`), `etiqueta?`, `aspectRatio?` (default `4 / 3`), `onZoom?`, `className?`. Ids con `useId()` (checklist punto 14). Es **la única** primitiva de slider del proyecto — un solo slider sirve a ERP (ficha) y a la propuesta del cliente.

**Adopción futura en F-08 (fuera de alcance de t-139):** la propuesta pública reemplazará su `GaleriaCarril` local por `gallery-rail` y sus `ItemCard` pasarán a mostrar `[imagenUrl, ...galeriaImagenesUrl]`. Se anota aquí como intención de minimalismo (diseño axiomático); no es un cambio que esta tarea ejecute.

### 6.4.7 Preservación de R9 (deep-link del cotizador)

- El panel no introduce ruta nueva: `?source=cotizador&proyectoId=<id>` sigue abriendo `/erp/catalogo` con el panel auto-abierto y `proyectoOrigenId` prellenado (criterio CA-11).
- El gap documentado de D-14 (SKU/descripción/precio del ítem referencial no prellenados porque el cotizador no los pasaba) **no se cierra ni se amplía** con este diseño: queda como está, no bloqueante.

### 6.4.8 Comportamiento

| # | Evento | Gatillo | Acción |
|---|---|---|---|
| 1 | Abrir panel | Click en tarjeta / "Nuevo producto" / deep-link `?source=cotizador&proyectoId=` | Panel full-screen dos columnas; col. 2 = `ProductoFicha` con estado inicial del `form` |
| 2 | Preview en vivo | Escribir en el form | `fichaDesdeForm(form)` actualiza la col. 2 sin guardar |
| 3 | Subir imágenes | `ImagePicker` `multiple={true}` + `uploadToR2` + `r2Prefix="catalogo/"` | `imagenes: string[]`; portada = `[0]`, galería = `[1..]` |
| 4 | Guardar | "Guardar" | `store.catalogo.crear/actualizar` con `imagenUrl` + `galeriaImagenesUrl` (valida R1-R7 y R5 ampliada) |
| 5 | Anular | "Anular" (pie del panel) | Anulación suave (patrón M-07); históricos intactos (R8) |

### 6.4.9 Referencias

`input_diseno_javier_20260815.md` (Punto 3) · §6.3 (primera pasada t-139) · `backlog_auditoria_pantallas.md` D-14 · `checklist_progreso_pantallas.md` puntos 5-7, 11, 14, 15 · `REGISTRO_DE_ENTIDADES.md` §2 · ARCH-012 (`Portafolio.galeriaPortafolioUrl`, `EspacioVariante.fotosEspacio`).

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en archivos de esta pantalla | `eslint app/erp/catalogo/` |
| CA-3 | El catálogo usa campos exactos de `productos_catalogo` (schema §2) | `grep "precioPublico\|precioDirecto\|sku\|publicadoWeb" app/erp/catalogo/` ≥ 5 |
| CA-4 | No hay labels sueltos: todo usa H07 | `grep -r "'[A-Z]" app/erp/catalogo/` = 0 resultados |
| CA-5 | Rol `comercial` no puede escribir catálogo | Test: `POST /api/erp/catalogo` con rol comercial → 403 |
| CA-6 | SKU duplicado rechazado | Test: crear con SKU existente → 400 "El SKU ya existe" |
| CA-7 | Los ítems del mock del B1 (tablero roble, bisagra blum, etc.) se listan | Test: `getCatalogo()` retorna ≥ 8 productos |
| CA-8 | P-04 abierto desde inline → navega a P-27, no crea inline | `grep "onCreateNew" app/erp/cotizador/[proyectoId]/page.tsx` → redirige a `/erp/catalogo` |
| CA-9 | `galeriaImagenesUrl` declarada en §6.4 como mutación de schema con checkpoint pendiente (no dada por aprobada para ejecución) | `grep "MUTACIÓN DE SCHEMA" disenio_p27_catalogo_diseno_desarrollo.md` ≥ 1 |
| CA-10 | Panel dos columnas sin ruta nueva, dentro de `/erp/catalogo`: grid `7fr_5fr` en `lg`, ficha arriba en móvil | `grep "grid-cols-\\[7fr_5fr\\]" app/erp/catalogo/page.tsx` ≥ 1; `grep "grid-cols-1" app/erp/catalogo/page.tsx` ≥ 1; `next build` sin errores |
| CA-11 | R9 preservada: deep-link `?source=cotizador&proyectoId=` auto-abre el panel y prellena `proyectoOrigenId` (sin ruta nueva) | Inspección en vivo + `grep "source=cotizador\\|proyectoOrigenId" app/erp/catalogo/page.tsx` ≥ 2 |
| CA-12 | R5 ampliada: publicar con galería y sin `imagenUrl` es válido; sin imagen ni galería se rechaza | Test `mock-store.test.ts` (caso t-139) → PASS |
| CA-13 | `ProductoFicha` es standalone: props planas, sin import del store | `grep "useDataStore" components/veta/producto-ficha.tsx` = 0 resultados |
| CA-14 | `gallery-rail` genera sus ids con `useId()` (regla de hidratación del checklist punto 14) | `grep "useId" components/veta/gallery-rail.tsx` ≥ 1; `grep "Math.random\\|Date.now" components/veta/gallery-rail.tsx` = 0 |
| CA-15 | Imágenes del formulario vía primitiva `ImagePicker` con `multiple` (nunca input text URL) | `grep "ImagePicker" app/erp/catalogo/page.tsx` ≥ 1; `grep 'type="text".*placeholder.*https' app/erp/catalogo/page.tsx` = 0 |
| CA-16 | Round-trip `galeriaImagenesUrl` (crear→leer→actualizar→leer) | `DATABASE_URL='postgres://test:test@localhost:5432/no_connect_placeholder' npx tsx lib/data/mock-store.test.ts` → PASS (checklist punto 5) |
| CA-17 | `galeriaImagenesUrl` presente en los 5 artefactos (contracts, schema, fixtures, mock-store, actions) | grep en los 5 ≥ 1 (checklist punto 6) |
| CA-18 | La adopción de `gallery-rail` en F-08 queda FUERA del alcance de t-139 (intención futura, no mandato) | `app/(publico)/propuesta/[proyectoId]/page.tsx` NO figura en los archivos afectados del plan de código de t-139 |
| CA-19 | Definición de Hecho (checklist punto 6): los 4 comandos limpios en los archivos tocados | `npx tsc --noEmit` · `npx eslint .` · `DATA_IMPL=mock npx next build` · `npx tsx lib/data/mock-store.test.ts` |

---

## 8. Verificación de integridad (pre-entrega)

Antes de marcar el diseño como "aprobado", el Iniciador verifica:

- [ ] Toda entidad en §1 existe en el `REGISTRO_DE_ENTIDADES.md`
- [ ] Todo estado en §2 existe en el `REGISTRO_DE_ENTIDADES.md` y en `glosario_h07.md`
- [ ] Todo label en §3 existe en `glosario_h07.md`
- [ ] Toda regla en §4 tiene verificación mecánica (no "se ve bien")
- [ ] Todo componente en §5 usa tokens D4 y patrones M-06 L1
- [ ] Todo comportamiento en §6 traza a un evento E-XX del `diamante2_define_eventos.md`
- [ ] Los criterios de aceptación en §7 son ejecutables (no opinables)