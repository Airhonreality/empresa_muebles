# Nota de Migración Inteligente — Campo Viejo → Campo Nuevo (Convergencia E1/E2)

**Fecha:** 2026-08-06
**Principio adoptado (validación axiomática):** se adopta el **mejor diseño de schema** = FLAG-4 (especialización relacional 1:1) como destino de Ola 7. El `schema.ts` real de V3 (contrato dev-local actual) es el origen. **No se descartan datos**: cada campo viejo se mapea a su nuevo hogar. Esto es una **migración inteligente**, no un port.

---

## 1. Catálogo (E1-1, E1-2, E1-7) — modelo plano → especialización FLAG-4

### Origen (schema.ts real / contrato dev-local)
`productos_catalogo` (plano): `sku`, `descripcion`, `tipo`, `unidad_medida`, `precio_directo`, `precio_publico`, `stock_actual`, `proveedor_id`, `imagen_url`, `modelo_3d_url`, `categoria_comercial`, `publicado_web`, `proyecto_origen_id`.

### Destino (FLAG-4, axiomático)
- `productos_catalogo` **base**: `id`, `nombre`, `descripcion_breve`, `valor_unitario`, `unidad_medida`, `proveedor_id`, `activo`, `tipo_catalogo`, timestamps. (+`CHECK tipo_catalogo IN (3)`)
- `productos_tienda` **extensión 1:1**: `id`, `catalogo_id` FK+CHECK, `descripcion_diseño`, `imagen_principal_url`, `categoria_tienda`, `visible_en_tienda`, `inventario_disponible`, `punto_reorden_unidades`, `tiempo_reposicion_dias`, `materiales_insumos_json`, `procesos_produccion_json`, `margen_ganancia_pct`, `valor_tienda`.
- `materiales_insumos`, `herramientas_maquinaria` (extensiones gemelas).

### Match inteligente de campos (viejo → nuevo)

| Campo viejo (schema.ts real) | Campo nuevo (FLAG-4) | Regla de migración |
|---|---|---|
| `productos_catalogo.precio_directo` | `productos_catalogo.valor_unitario` | Costo de adquisición → base. Conserva valor. |
| `productos_catalogo.precio_publico` | `productos_tienda.valor_tienda` | Solo si `tipo='producto_tienda'`; si material/insumo no aplica. Valor congelado. |
| `productos_catalogo.stock_actual` | `productos_tienda.inventario_disponible` | Solo tipo tienda. `>=0`. |
| `productos_catalogo.categoria_comercial` | `productos_tienda.categoria_tienda` | **VARCHAR (FLAG-4 decide)** — se descarta lookup `categorias_producto` del eslabón. Mapping categorías legacy → catálogo tienda. |
| `productos_catalogo.publicado_web` | `productos_tienda.visible_en_tienda` | Booleano directo. |
| `productos_catalogo.imagen_url` | `productos_tienda.imagen_principal_url` | Solo tienda. |
| `productos_catalogo.modelo_3d_url` | `productos_tienda` (futuro viewer 3D F7) | Se conserva en tienda para F7. |
| `productos_catalogo.tipo` | `productos_catalogo.tipo_catalogo` | Enum: `producto_tienda` / `material_insumo` / `herramienta_maquinaria`. Regla: legacy no tenía discriminante → **default `material_insumo`** salvo evidencia de tienda. |
| `productos_catalogo.sku` | `productos_catalogo.sku` (conservado) | Se mantiene; `materiales_insumos.codigo_interno` si es insumo. |
| `productos_catalogo.descripcion` | `productos_catalogo.descripcion_breve` | Renombra + `productos_tienda.descripcion_diseño` para narrativa de venta. |
| `productos_catalogo.unidad_medida` | `productos_catalogo.unidad_medida` | Se mantiene en base. |
| `productos_catalogo.proveedor_id` | `productos_catalogo.proveedor_id` | Se mantiene. |
| `productos_catalogo.proyecto_origen_id` | `productos_tienda.proyecto_origen_id` (o base) | Mapear a tienda; origen del catálogo. |

**Nota de decisión:** FLAG-4 `valor_tienda` se congela al crear (recalcula solo con `margen_ganancia_pct` para NUEVOS productos). `disponibilidad` (enum del eslabón) se deriva en runtime de `inventario_disponible` + `visible_en_tienda` — **no es campo físico**.

---

## 2. Portafolio (E1-5) — alineación de naming al arnés

| Campo del eslabón (destilación) | Tabla/campo real del arnés (schema.ts) | Veredicto |
|---|---|---|
| `portafolio_proyectos` | `portfolio_publico` (ya existe) | ✅ ACOGER arnés (no crear tabla nueva) |
| `portafolio_imagenes` | `imagenes_portfolio` (ya existe) | ✅ ACOGER arnés |
| `portfolio_publico.categoria_espacio` | existe | ✅ |
| `portfolio_publico.barrio` | existe | ✅ (E1-4: geografía por barrio, no fija Bogotá) |
| `precio_referencial` (eslabón F-03) | **NO existe en arnés** — regla t-007: portafolio SIN precios | ❌ **DESCARTAR** — el arnés prohíbe precios en portafolio (regla de negocio, t-007 verificado) |
| `materiales_destacados`, `destacado`, `orden` | no existen | 🟡 Añadir si la UI los requiere; SI no, derivar de `orden` en `imagenes_portfolio`. |

---

## 3. Cronograma (E2-1, E2-3, E2-5) — adopción de mejor schema

| Decisión eslabón | Schema destino (d3_schema + decisiones) | Match |
|---|---|---|
| E2-1 `base_semanas=7` | **`base_semanas=4`** (schema consolidado + lógica negocio:531) | ✅ ACOGER 4 (mejor schema) |
| E2-2 `cronograma_etapas` doble línea | `cronograma_etapas.linea ∈ {contractual, interna}` | ✅ coincide |
| E2-3 +4 campos en `items_variante` | se mantiene `items_variante` + 4 campos (C2/C4) | ✅ se registra |
| E2-5 **`espacios_artefactos`** | **AGREGAR tabla nueva** (no existe en schema real) | ✅ ACOGER (Supervisor) |

### Nueva tabla: `espacios_artefactos` (schema a agregar)
```
espacios_artefactos(
  id, espacio_variante_id FK→espacio_variantes,
  categoria, dimensiones_mm, tipo_specifique,
  ubicacion, foto_url, requiere_verificacion,
  validado_por FK→usuarios?/personas, validado_en,
  created_at, updated_at
)
```
**Origen del match:** campos que el eslabón P-07 pedía (checklist definición de proyecto) — sin fuente previa en el schema real; es **tabla nueva neta**.

---

## 4. Proyectos ampliada (E2-4) — match directo

| Campo eslabón | Schema destino | Match |
|---|---|---|
| `proyectos.estado` enum 8 | existe/ampliado | ✅ |
| `proyectos.verificador_id` | `d3_schema:56` + | ✅ |
| `proyectos.fecha_entrada_desarrollo` | `d3_schema:56` | ✅ |
| `proyectos.comercial_vendedor_id` | `d3_schema:56` | ✅ |

---

## 5. Resumen de migración adoptada

| Área | Acción |
|---|---|
| Catálogo | Adoptar FLAG-4 (base + 3 extensiones 1:1) como destino Ola 7. Migrar `precio_directo→valor_unitario`, `precio_publico→valor_tienda`, `stock_actual→inventario_disponible`, `publicado_web→visible_en_tienda`, `categoria_comercial→categoria_tienda`. `disponibilidad` = derivado. |
| Portafolio | Conservar `portfolio_publico`/`imagenes_portfolio`. SIN precios. Barrio, no zona fija. |
| Cronograma | `base_semanas=4`. `cronograma_etapas` doble línea. **Agregar `espacios_artefactos`**. |
| items_variante | +4 campos C2/C4. |
| proyectos | ampliada E2-4. |

**Flag pendiente al Supervisor:** FLAG-4 `categoria_tienda` VARCHAR vs lookup — se adopta **VARCHAR** (decisión FLAG-4 ya aprobada); si el negocio necesita catálogo fijo de categorías, se añade en Ola 7 como parametrización, no como tabla forzada hoy.