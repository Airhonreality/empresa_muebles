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
| `CatalogoTable` | Client | `productos: ProductoCatalogo[]` | `productos_catalogo` | DataTable Familia A (densa), `--radius-none`, `--veta-text-data` |
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
| 5 | Editar producto | Click `✎` en fila | Abre `ProductoModal` en modo editar, `PUT /api/erp/catalogo/:id` | Valida R1-R7 | — |
| 6 | Publicar en web | Toggle `Publicado en web` | `PUT /api/erp/catalogo/:id {publicado_web}` | Valida R5 | — |
| 7 | Anexar desde P-04 | Click "Anexar a catálogo" en ItemRow referencial | Abre `ProductoModal` con datos del ítem prellenados | R9 | — |
| 8 | Eliminar | Click `🗑` en fila | `anulado`/desactivación suave (según patrón M-07) | Históricos intactos (R8) | — |

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