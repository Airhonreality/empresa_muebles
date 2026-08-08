# F-02 — Tienda Web

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F7 · **Rutas:** `/colecciones`, `/colecciones/[slug]` · **Roles:** público

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `productos_tienda` | §2 | id, catalogo_id, descripcion_diseno, imagen_principal_url, categoria_tienda, visible_en_tienda, valor_tienda, inventario_disponible, calificacion_promedio | Catálogo público |
| `productos_catalogo` | §2 | id, nombre, precio_publico | Nombre y precio del producto base |
| `categorias` | §2 | id, nombre, tipo('tienda'), padre_id, activo | Filtros de categoría |
| `catalogo_acabados` | §2 | id, nombre, familia, color_hex, imagen_textura_url | Filtros por acabado |
| `catalogo_producto_acabados` | §2 | producto_catalogo_id, acabado_id | Relación producto↔acabado |
| `acabados_muestras` | §2 | acabado_id, imagen_muestra_url, disponible_web | Muestras visibles en tienda |

---

## 2. Estados que transiciona

*Sin estados transicionales — pantalla de solo lectura pública.*

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Muebles" | `categoria_tienda` | `productos_tienda` |
| "Acabados" | `categoria_tienda` | `productos_tienda` |
| "Textiles" | `categoria_tienda` | `productos_tienda` |
| "Disponible" | — | `inventario_disponible > 0` |
| "Bajo pedido" | — | `inventario_disponible = 0` |
| "Agotado" | — | — |

---

## 4. Reglas de negocio

| # | Regla | Validación |
|---|---|---|
| R1 | Solo productos con `visible_en_tienda=true` | Servidor: `WHERE visible_en_tienda = true` |
| R2 | Precio mostrado = `valor_tienda` (web fijo, independiente de `precio_publico` ERP) | Servidor |
| R3 | No se expone `id`, `costo`, `stock` interno, `proveedor_id` | Server projection |
| R4 | Filtros: categoría (sidebar tree), familia de acabado (chips), rango de precio (slider) | Cliente + server query params |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `CatalogoGrid` | Client | Productos en grid responsivo (3 col → 2 → 1) |
| `ProductoCard` | Client | `producto`: imagen lazy, nombre, precio COP, badge disponibilidad |
| `FiltroCategoria` | Client | Sidebar: árbol de `categorias` con `padre_id` |
| `FiltroAcabado` | Client | Chips de color con `color_hex` + tooltip `nombre` |
| `FiltroPrecio` | Client | Range slider con `valor_tienda` |
| `ProductoDetalle` | Server + Client | `/(publico)/colecciones/[slug]`: nombre, descripción, imágenes, acabados disponibles, precio |

**Tokens D4:** `mist` (badge dirección web), `--font-sans` (Inter), tema light

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción |
|---|---|---|---|
| 1 | Cargar catálogo | Mount | `GET /api/publico/productos?filtros` (server projection) |
| 2 | Aplicar filtro | Select categoría / acabado / precio | Re-fetch con query params |
| 3 | Ver detalle | Click producto | Navigate a `[slug]` |
| 4 | Compartir producto | Click compartir | Meta tags + URL canónica |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | Solo productos `visible_en_tienda=true` aparecen | Test: GET sin filtro → todos tienen `visible_en_tienda=true` |
| CA-3 | No se exponen campos internos en JSON | Test: response no contiene `proveedor_id`, `stock`, `costo` |
| CA-4 | Filtro por categoría funciona con jerarquía (`padre_id`) | Test: seleccionar categoría padre → incluye hijos |
| CA-5 | Producto sin stock muestra "Bajo pedido" | Playwright: badge "Bajo pedido" para `inventario_disponible=0` |
