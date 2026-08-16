# F-02 — Tienda

**Fecha:** 2026-08-12 · **Estado:** propuesta (Cycle 2 pendiente de validación) · **Fase:** F7 / bucle F-web · **Rutas:** `/colecciones` (`app/(publico)/colecciones/page.tsx`), `/colecciones/[id]` (`app/(publico)/colecciones/[id]/page.tsx`) · **Roles:** público · **Arquetipo:** Creador Experto (D2)

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`).*

| Entidad | § del REGISTRO | Método / campo usado | Uso en esta pantalla |
|---|---|---|---|
| `categorias` | §2 Comercial | `store.categorias.porTipo('tienda')` → `Categoria[]` (`contracts.ts:1137`) | Filtrado de la lista `/colecciones` por tipo tienda |
| `productos_tienda` | §2 Comercial | `store.productosTienda.visibles()` → `ProductoTienda[]` (`contracts.ts:1143`); `store.productosTienda.obtenerPorId(id)` (`contracts.ts:1144`) | Lista de productos en `/colecciones`; detalle en `/colecciones/[id]` |
| `productos_catalogo` | §2 Comercial | `store.catalogo.obtenerPorId(catalogoId)` (`contracts.ts:873`) | Proyección segura R2: solo `sku`, `descripcion`, `imagenUrl`, `categoriaComercial` (sin `precioDirecto`, `stockActual`, `proveedorId`) |
| `catalogo_acabados` | §2 Comercial | `store.catalogoAcabados.listar()` (`contracts.ts:1155`); `store.catalogoProductoAcabados.porProducto(id)` (`contracts.ts:1158`) | Muestras de acabados disponibles en detalle |
| `acabados_muestras` | §2 Comercial | `store.acabadosMuestras.porAcabado(id)` filtrado por `disponibleWeb` (`contracts.ts:1163`) | Galería de muestras visuales en detalle |

**Nota:** El modelo de datos de la tienda (F-02) extiende al catálogo (P-27), no lo reemplaza. La Tienda es un modelo de extensión: `ProductoTienda` referencia `ProductoCatalogo` vía `catalogoId` — un producto de catálogo puede tener múltiples filas de tienda, o ninguna.

---

## 2. Estados que transiciona

*La Tienda es modo **solo-lectura pública** — no transiciona estados. No hay mutaciones desde la web pública.*

| Estado | Uso |
|---|---|
| `productosTienda.visibleEnTienda = true` | Filtrado en la lista (`/colecciones`). Productos con `false` retornan 404 en detalle. |
| `inventarioDisponible > 0` | Badge "En stock" vs "Bajo pedido" en ambas pantallas. |

---

## 3. Vocabulario H07 (labels visibles)

| Label natural | Código interno | Fuente |
|---|---|---|
| "Colecciones" | H1 de lista | `page.tsx:78` |
| "Muebles de carpintería arquitectónica..." | Subtítulo lista | `page.tsx:81-84` |
| "Bajo pedido" | Badge en detalle | `page.tsx:85-88`, `[id]/page.tsx:84-88` |
| "Consultar disponibilidad" | CTA botón (solo lectura) | `[id]/page.tsx:187-194` |
| "En stock" / "Bajo pedido" | Badge disponibilidad | `[id]/page.tsx:140-143` |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | `visibles()` filtra `visibleEnTienda=true` | Lista y detalle usan el mismo store | `grep -n "visibleEnTienda" lib/data/contracts.ts` |
| R2 | Detalle proyecta solo campos públicos de `ProductoCatalogo` (sin `precioDirecto`, `stockActual`, `proveedorId`) | `[id]/page.tsx:38-50` | `grep -A5 "ProductoCatalogoPublico" [id]/page.tsx` |
| R3 | `valorTienda` es el precio web fijo, independiente de `productos_catalogo.precioPublico` | `[id]/page.tsx:133-134` | `grep "valorTienda" contracts.ts` |
| R4 | `inventarioDisponible > 0` = "En stock", si no "Bajo pedido" | Detalle `[id]/page.tsx:61, 140-143` | Leer lógica |
| R5 | Acabados/muestras filtrados por `disponibleWeb=true` | `[id]/page.tsx:56-59` | `grep "disponibleWeb" [id]/page.tsx` |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `ColeccionesPage` | Client | — | `productosTienda`, `categorias` | `page.tsx:57-104` |
| `ProductoCard` | Client helper | `producto: ProductoTienda, categoriaNombre: string` | `contracts.ts:707` | `page.tsx:16-55` |
| `ProductoDetallePage` | Client | — | `productosTienda`, `catalogo`, `acabados` | `[id]/page.tsx:18-203` |
| `LinkButton` | Shared primitive | `href, variant, className` | — | `components/veta/button.tsx` |

**Patrones M-06 L1 usados:** `useDataStore()`, `Link` de `next/link`, `formatCOP()` con `Intl.NumberFormat('es-CO')`.

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace |
|---|---|---|---|---|---|
| 1 | Cargar `/colecciones` | mount | `store.productosTienda.visibles()` + `store.categorias.porTipo('tienda')` | Render cuadrícula de cards | — |
| 2 | Click card producto | Click | Navigate a `/colecciones/{id}` | — | — |
| 3 | Click "Consultar disponibilidad" | Click | `alert('Funcionalidad de carrito no implementada')` | Placeholder — solo lectura | — |
| 4 | Verificar acabados | mount detalle | `store.catalogoProductoAcabados.porProducto()` + `store.acabadosMuestras.porAcabado()` | Filtra `disponibleWeb` | — |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 errores | `tsc --noEmit` |
| CA-2 | `eslint .` = 0 en la pantalla | `npx eslint "app/(publico)/colecciones/**/*.tsx"` |
| CA-3 | Productos `!visibleEnTienda` retornan 404 / mensaje no encontrado | `grep -n "visibleEnTienda" [id]/page.tsx:26` |
| CA-4 | Detalle no expone `precioDirecto`, `stockActual`, `proveedorId` del catálogo | `grep -c "precioDirecto\|stockActual\|proveedorId" [id]/page.tsx` = 0 (fuera de `ProductoCatalogoPublico` interface) |
| CA-5 | Botón "Consultar disponibilidad" es placeholder sin carrito | `grep -n "carrito" [id]/page.tsx` |
| CA-6 | Acabados/muestras filtrados por `disponibleWeb` | `grep "disponibleWeb" [id]/page.tsxx` |
| CA-7 | Precio usa `valorTienda`, no `precioPublico` del catálogo | `grep -n "valorTienda" [id]/page.tsx:134` y `contracts.ts:721` |

---

## 8. Arquitectura de secciones por ruta

### `/colecciones` (lista)
| Bloque | `page.tsx` | Contenido |
|---|---|---|
| Header | `76-85` | Subtitle + H1 + descriptor |
| Grid de productos | `92-101` | Cards con imagen, categoría, nombre, precio, badge "Bajo pedido" |

### `/colecciones/[id]` (detalle)
| Bloque | `[id]/page.tsx` | Contenido |
|---|---|---|
| Backlink | `66-70` | ← Volver a colecciones |
| Imagen principal | `74-89` | 4/3, badge "Bajo pedido" si `!disponible` |
| Muestras acabados | `91-111` | Muestras disponibles filtradas por `disponibleWeb` |
| Información producto | `115-200` | Categoría, nombre, SKU, precio, disponibilidad, descripción, acabados, CTA |

### Taxonomía de categorías

*Estado: pendiente decisión única del Supervisor (ver `backlog_auditoria_pantallas.md` §3 DP-00).*

| Campo | Tipo | Uso | Comentario |
|---|---|---|---|
| `id` | string | Clave primaria | UUID |
| `nombre` | string | Label visible en category chips y breadcrumb | Ej: "Cocinas", "Closets" |
| `tipo` | string | Filtrado en store: `porTipo('tienda')` | Pendiente decisión: consolidar a enum `'tienda' | 'portafolio'` |
| `padreId` | string \| null | Jerarquía (categorías → subcategorías) | `null` = raíz |
| `activo` | boolean | Filtrado implícito en UI | Productos con categoría inactiva no aparecen |

**Protocolo I-049 (anti-invención):** ningún nombre de categoría se inventa. Debe provenir del catálogo comercial real o de la decisión de taxonomía única. Hoy son 3 categorías hardcodeadas en fixtures (`catalogoAcabados` con 0 elementos).

---

## 9. Respuestas Atómicas indexables

*No hay RA en esta pantalla — el detalle de producto muestra información del producto, no responde a FAQs narrativas.*

---

## 10. Testimonios embebidos

*No aplica — pantalla transaccional de catálogo.*

---

## 11. Directorio de imágenes

| # | Descripción | Tipo | Origen | Estado |
|---|---|---|---|---|
| 1 | Imagen principal del producto (`ProductoTiendaComponente`) | Hero detalle | `imagenPrincipalUrl` del catálogo | `contracts.ts:714` — pendiente I-016 |
| 2-N | Muestras de acabados | Gallery grid | `acabadosMuestras.imagenMuestraUrl` | `contracts.ts:764` — disponible si `disponibleWeb=true` |

---

## 12. SEO narrativo

| Elemento | Valor / Directiva | Fuente |
|---|---|---|
| `<title>` lista | "Colecciones — Veta Dorada" | Derivado de H1 |
| `<title>` detalle | "Producto — {descripcionDiseno \| categoria.nombre} \| Veta Dorada" | Derivado de contenido |
| Meta description | Dinámica, derivada de `descripcionDiseno` del producto | `app/layout.tsx` |
| JSON-LD | `Product` schema con `offers`, `image`, `name`, `description` | Pendiente de implementación (I-016) |
| `llms.txt` | No aplica — página indexada de catálogo | — |

**Nota de método:** El JSON-LD para productos individuales no está implementado todavía (`page.tsx` no incluye `<script type="application/ld+json">`). Esto es una **desviación detectada** — el checklist del producto exige marcado semántico para SEO. Se documenta como tarea pendiente hasta I-016 (recuperar imágenes reales).

---

## 13. Desviaciones detectadas y acciones (contrato inverso)

| # | Sección | Diseño pide | Código hace hoy | Acción requerida | Bloqueador | Estado |
|---|---|---|---|---|---|---|
| D-02-1 | Taxonomía categorías | Enum único `'tienda' \| 'portafolio'` + definición de árbol | `tipo: string` (libre) — 3 categorías hardcodeadas en fixtures | Consolidar a enum; definir árbol de categorías real | decisión taxonomía (Supervisor) | ⏳ Pendiente |
| D-02-2 | JSON-LD producto | Schema `Product` con `offers`/`image`/`name`/`description` | Sin `<script type="application/ld+json">` en `[id]/page.tsx` | Implementar JSON-LD en detalle de producto | I-016 (imágenes reales) | ⏳ Pendiente |
| D-02-3 | CTA "Consultar disponibilidad" | Botón funcional (formulario/contacto) | `alert('Funcionalidad de carrito no implementada')` | Reemplazar con CTA real (WhatsApp) o formulario de contacto | F-02 backlog — decisión UX | ⏳ Pendiente |
| D-02-4 | Stock real | Badge "En stock" solo si `inventarioDisponible > 0` | Lógica presente (`[id]/page.tsx:61,140-143`) | Verificar contra stock real del ERP | datos reales | ✅ Implementado |
| D-02-5 | Precio web independiente | `valorTienda` distinto de `precioPublico` del catálogo | Implementado (`contracts.ts:721`) | Documentar diferencia clara | — | ✅ Resuelto |

---

## 14. Verificación de integridad (pre-entrega)

- [x] Entidades en §1 existen en REGISTRO (`categorias`, `productos_tienda`, `catalogo_acabados`).
- [x] R2 cumplida — detalle no expone `precioDirecto`, `stockActual`, `proveedorId`.
- [x] R3 cumplida — precio usa `valorTienda`, no `precioPublico`.
- [x] R4 cumplida — badge "Bajo pedido" funcional.
- [x] `tsc --noEmit` = 0 errores (verificado 2026-08-12).
- [x] `eslint` = 0 en la pantalla (verificado 2026-08-12).
- [ ] **Pendiente:** taxonomía de categorías consolidada a enum (D-02-1).
- [ ] **Pendiente:** JSON-LD `Product` implementado (D-02-2).
- [ ] **Pendiente:** CTA funcional en detalle (D-02-3).

---

## 15. Doble Diamante — Metodología de diseño

**Nota:** La Tienda (F-02) se construyó como parte del modelo de datos `datos` (F0), aprobado 2026-08-05. El presente documento formaliza la destilación del código existente (`app/colecciones/`) en un artefacto de diseño para validación del Supervisor y para guiar el ciclo de alineación.

**Decisiones cerradas:**

| Decisión | Valor | Fuente |
|---|---|---|
| `valorTienda` independiente | Precio web fijo, distinto de `precioPublico` del catálogo | `plan_de_continuar_con_ethereal_kernighan.md` §1.1 |
| `visibleEnTienda` flag | Filtrado de visibilidad: `false` = 404 o no-listado | `contracts.ts:1143` |
| R2 proyección segura | Detalle expone solo 4 campos del catálogo (sin precios/costos/stock/proveedor) | Decisiones del backlog D-14 (2026-08-10) |

---

## 16. Entrega a Agente Código

**Estado: ya implementada (D-14 lote B2).** Este documento formaliza el diseño **ya ejecutado** para validación y cierre de Cycle 2.

1. Verificar siempre: CA-1..CA-7 antes de marcha.
2. Al consolidarse la taxonomía de categorías (D-02-1): actualizar `Categoria.tipo` a enum y migrar fixtures.
3. Al existir imágenes reales (I-016): implementar JSON-LD `Product` (D-02-2).
4. Al resolver la UX de CTA detalle (D-02-3): reemplazar el `alert()` por CTA real.

**Blockers conocidos:** decisión taxonomía (Supervisor), I-016 (imágenes), decisión UX para CTA detalle.

**Archivo finalizado.** Cycle 2 listo para validación. Avance clasificado como `FINALIZADO_CICLO_2`.