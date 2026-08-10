# Destilación del Cotizador Legacy (P-04) y Contrato Legacy (P-05)

> **Este archivo es registro histórico** (`archivo/`). El kanban comercial fue rediseñado en POC-01 (2026-08-08): +columna Negociación, +columna Archivo (agrega perdida+cancelada), −columnas Entregado/Perdida/Cancelada. El diseño vigente está en `arnes/lineas/ola7/pantallas/disenio_p01_kanban_comercial.md`. Los hallazgos están en `arnes/lineas/ola7/tecnico/registro_hallazgos_poc4.md`.

> Extraído de `C:\Users\javir\Documents\DEVs\empresa_muebles_clone\src\components\specialized\cotizador\` y kanban relacionado.
> Mapeado contra nuevo schema: `lib/db/schema.ts` (26 tablas) + `lib/db/relations.ts`.

---

## A. Inventario de Datos del Cotizador Legacy

| Namespace Legacy (Vault) | Entidad TipoScript | Qué Carga | Tablas Nuevo Schema (Mapeo) | Uso en Cotizador |
|--------------------------|-------------------|-----------|----------------------------|------------------|
| `proyectos` | `ProyectoData` / `ProyectosRecord` | Lista de cotizaciones/proyectos | `proyectos` | Lectura/escritura: header (nombre, estado, cliente_id, costos_operativos, imprevistos, descuento, ajuste, IVA, garantía, dirección obra, tipo_proyecto) |
| `clientes` | `Clientes` / `ClientesRecord` | Clientes para selector | `clientes` | Lectura: selector híbrido (buscar/crear). Escritura: creación on-the-fly |
| `contratos` | `ContratosRecord` | Contratos vinculados a proyecto | `contratos` | Lectura: mostrar hitos, estado, email generado. Escritura: `generar_contrato` zap |
| `productos_catalogo` | `ProductosCatalogo` | Catálogo completo (materiales, herrajes, servicios, mano de obra) | `productos_catalogo` | Lectura: búsqueda fuzzy, precios (precio_publico/precio_directo), SKU para tarifas SERV-DEV/ASSEMBLY/INSTALL. Escritura: crear/editar desde modal |
| `espacio_variantes` | `EspacioVariantes` | Espacios + variantes por proyecto | `espacio_variantes` | Lectura/escritura: CRUD completo (espacios, variantes, orden, activa, visible_pdf, jornadas, colores, imágenes, notas, descripción) |
| `items_variante` | `ItemsVariante` | Ítems de carpintería por variante | `items_variante` | Lectura/escritura: tabla editable (catalogo_id, cantidad, precio_unitario, total_linea, unidad_medida, imagen_url, anulado) |
| `items_obra_civil` | `ItemsObraCivil` | Ítems de obra civil por variante | *(No existe tabla directa; ver análisis C2)* | Lectura/escritura: estimado referencial (categoría: mano_obra/logistica/materiales) |
| `imagenes_espacio` | `ImagenesEspacio` | Imágenes referenciales por variante | *(Incluido en espacio_variantes.colores/imagenes JSONB)* | Lectura: galería en propuesta pública |
| `propuestas_publicas` | `PublicProposalData` | Snapshots públicos | `portfolio_publico` + `imagenes_portfolio` | Lectura/escritura: publicar/revocar/regenerar link, snapshot JSON |
| `apoyo_tecnico` | `ApoyoItem` | Visitas técnicas, fotos, requisitos | *(No mapeado en nuevo schema)* | Solo lectura/escritura en panel lateral |

**Campos clave por entidad:**

| Entidad | PK | FK Principales | Campos de Negocio Críticos |
|---------|-----|----------------|---------------------------|
| `proyectos` | id | cliente_id → clientes | nombre_proyecto, estado (enum), costos_operativos, imprevistos_instalacion, descuento_comercial, ajuste_arbitrario, aplica_iva, porcentaje_iva, garantia_anios, direccion_obra, tipo_proyecto |
| `espacio_variantes` | id | proyecto_id → proyectos | nombre_espacio, nombre_variante, activa, visible_pdf, orden, jornadas_desarrollo_tecnico, jornadas_ensamblaje_taller, jornadas_instalacion_obra, descripcion, descripcion_alternativa, colores (JSONB), imagenes (legacy string), notas_markdown |
| `items_variante` | id | variante_id → espacio_variantes, catalogo_id → productos_catalogo | cantidad, precio_unitario, total_linea, unidad_medida, imagen_url, anulado |
| `productos_catalogo` | id | proveedor_id → proveedores, proyecto_origen_id → proyectos | sku (UNIQUE), descripcion, tipo, unidad_medida, precio_directo, precio_publico, stock_actual, imagen_url, categoria_comercial, publicado_web |
| `contratos` | id | proyecto_id → proyectos | codigo_contrato (UNIQUE), fecha_contrato, contratante_domicilio, plazo_ejecucion_texto, holgura_dias, garantia_anios, objeto_items, especificaciones_*, condiciones_desmonte, valor_total, estado (borrador/firmado), email_asunto, email_cuerpo |
| `hitos_pago` | id | contrato_id → contratos | orden, tipo (percentage/fixed), monto_o_porcentaje, razon, fecha_limite |

---

## B. Flujos de Negocio del Cotizador

### 1. Carga Inicial (`loadAll` en `CotizadorPro.tsx:123-148`)
- **Paralelo (Promise.all 9 fetches):** proyectos, clientes, contratos, productos_catalogo, espacio_variantes, items_variante, items_obra_civil, imagenes_espacio, propuestas_publicas
- **Orden de dependencia:** proyectos → (espacio_variantes, items_variante, items_obra_civil) → (propuestas_publicas)
- **Estado inicial:** `activeCotId = forcedProyectoId || activeRecord?.id || null`
- **Header local:** sincronizado desde `activeCot.data` via `useEffect` (line 164-166)

### 2. Selección de Cliente/Proyecto
- **Proyecto:** Kanban comercial (estados: `activa` → `enviada` → `en_contrato` → `pre_produccion` → `produccion` → `entregado`/`perdida`/`cancelada`) + SmartSearch (fuzzy + historial localStorage)
- **Cliente:** `HybridClientSelector` (Combobox + creación on-the-fly via `vWrite('clientes')`)
- **Auto-save header:** `useAutoSave` (800ms debounce, flush on key change/unmount, race-condition safe)

### 3. Configuración de Espacios/Items
- **Espacios:** Agrupados por `nombre_espacio` (múltiples variantes por espacio). Orden: `orden_espacio` → `created_at`
- **Variantes:** Una activa por espacio (`activeVarMap[nombre_espacio] = variante_id`). CRUD: add, rename, duplicate, delete, reorder, toggle activa
- **Items:** Por variante activa. Tabla editable con `ItemRow`: búsqueda catálogo (fuzzy), MoneyInput para precio, cantidad, total calculado, imagen opcional
- **Items Obra Civil:** 3 categorías (mano_obra, logistica, materiales), referencial (no suma al total principal)

### 4. Cálculo de Precios (Grand Totals `gt` memo, lines 332-357)
```
mat = Σ(items_variante.total_linea) por variante activa visible_pdf
mo  = Σ(jornadas_desarrollo * tarifa_dev + jornadas_ensamblaje * tarifa_assembly + jornadas_instalacion * tarifa_install)
sub = mat + mo
costos = header.costos_operativos
impr   = header.imprevistos_instalacion
desc   = header.descuento_comercial
ajuste = header.ajuste_arbitrario
total  = sub + costos + impr - desc + ajuste
iva    = aplica_iva ? total * (porcentaje_iva/100) : 0
totalConIva = total + iva
```

### 5. Auto-Save (`useAutoSave.ts`)
- **Clave:** `activeCotId`
- **Datos:** `{ id, header: headerLocal }` (bundle atómico)
- **Delay:** 800ms
- **Race condition handling:** `flush()` inmediato al cambiar `key` o `unmount` (saveOnUnmount=true)
- **Persistencia:** `vWrite('proyectos', id, header)` + actualización optimista local

### 6. Búsqueda Inteligente (`useSmartSearch.ts`)
- **Fuente:** `proyectosList` mapeado a `{id, nombre_proyecto}`
- **Algoritmo:** Levenshtein distance + bonus por uso reciente (×1.1)
- **Historial:** localStorage `smart-search-history` (20 items/contexto)
- **Uso frecuente:** localStorage `smart-search-usage` (50 items, LRU eviction)
- **Resultados:** matches (score>0.4) + recentlyUsed + suggestions (historial que incluye query)

### 7. Generación de Contrato / Payload
- **Trigger:** Botón "Generar Contrato y PDF" en `ContratoModal`
- **Validación:** Cliente nombre requerido, valor_total > 0, suma hitos = valor_total (±0.01)
- **Zap:** `generar_contrato` con payload:
  - `record`: contrato (id del proyecto)
  - `cliente`: {nombre, documento, domicilio, email, telefono}
  - `contrato`: {plazo_ejecucion_texto, holgura_dias, garantia_anios, objeto_items, especificaciones_*, condiciones_desmonte, valor_total, hitos_pago}
- **Respuesta:** Eventos `materia_sync` (crea registro en `contratos`) + `notify` (success/error)
- **Post-save:** Abre `ContratoEmailModal` con email generado por engine

### 8. Envío a Zap Engine / Guardado Final
- **Engine endpoint:** `/api/engine` POST `{zap, payload}`
- **Procesamiento:** `processEvents(events, store.updateItem)` hidrata Zustand
- **PDF Export:** `exportar_propuesta_pdf` zap (flush header + sync active variants antes de llamar)
- **Producción:** `zap_activar_produccion` (transición estado → `produccion`)

---

## C. Lógica de Cálculo (Core del Cotizador)

### Precio de Ítem (Material + Proceso + Herraje)
- **Fuente:** `ItemRow.tsx` → `pickCat()` (line 68-74)
- Al seleccionar catálogo: `precio_unitario = cd.precio_publico || 0`, `total_linea = cantidad * precio_unitario`
- Usuario puede sobrescribir precio manualmente (MoneyInput)
- `unidad_medida` heredada del catálogo
- `imagen_url` opcional por ítem (override de catálogo)

### Mano de Obra (Legacy vs Nuevo)
| Aspecto | Legacy (CotizadorPro) | Nuevo Schema (Parametros) |
|---------|----------------------|---------------------------|
| **Tarifas** | 3 SKUs en catálogo: `SERV-DEV`, `SERV-ASSEMBLY`, `SERV-INSTALL` → `precio_publico` (fallback `precio_directo`) | Deben migrarse a `parametros` (claves: `tarifa_dev`, `tarifa_assembly`, `tarifa_install`) o tabla dedicada `tarifas_mano_obra` |
| **Cálculo** | `jornadas * tarifa` por espacio/variante | Mismo, pero tarifa versionada en `parametros_historial` |
| **Jornadas** | 3 campos en `espacio_variantes`: `jornadas_desarrollo_tecnico`, `jornadas_ensamblaje_taller`, `jornadas_instalacion_obra` (numeric 8,2) | Mismos campos en `espacio_variantes` |
| **Default** | 185,000 COP si SKU no existe | Definir en seed de `parametros` |

### Costos Operativos
- `costos_operativos` (proyecto): diseño 3D, gestión, overhead
- `imprevistos_instalacion` (proyecto): % contingencia obra
- `descuento_comercial` (proyecto): descuento negociado
- `ajuste_arbitrario` (proyecto): redondeo/ajuste manual
- **IVA:** `aplica_iva` (boolean) + `porcentaje_iva` (default 19%)

### Totales
- **Por espacio:** `materiales + mano_obra` (visible en CollapseStrip "Subtotal")
- **Obra Civil:** Separado, 3 categorías, **no incluido** en total contrato (badge "Referencial")
- **Gran Total:** `sub + costos + impr - desc + ajuste (+ IVA)`

---

## D. Patrones de UI/UX del Cotizador

### 1. Kanban Comercial (Estados + Transiciones)
```typescript
// ComercialKanban.tsx:25-34
const STAGES = [
  { value: 'activa',         label: 'Lead',          color: 'amber'  },
  { value: 'enviada',        label: 'Propuesta',      color: 'blue'   },
  { value: 'en_contrato',    label: 'En contrato',    color: 'violet' },
  { value: 'pre_produccion', label: 'Pre-producción', color: 'orange' },
  { value: 'produccion',     label: 'Producción',     color: 'green'  },
  { value: 'entregado',      label: 'Entregado',     color: 'green'  },
  { value: 'perdida',        label: 'Perdida',       color: 'rose'   },
  { value: 'cancelada',      label: 'Cancelada',     color: 'muted'  },
]
```
- **Validación:** `zap_validar_transicion_estado` (guarda server-side)
- **Vista:** Tabs (por estado) o Tree (KanbanCanvas)
- **SmartSearch** integrado en header

### 2. Stepper de Configuración (Implícito en EspacioCard)
1. **Header espacio** → nombre, visible_pdf, duplicar, mover, eliminar
2. **Descripción espacio** (común a variantes)
3. **Tabs de variantes** (EspacioTabs: add, duplicate, delete, rename, reorder, toggle visible_pdf)
4. **Descripción alternativa** (por variante)
5. **Tabla items** (editable, add/delete, búsqueda catálogo)
6. **Imágenes referenciales** (CollapseStrip: grid, reorder, delete, SmartImageInput)
7. **Notas** (lista reordenable, markdown simple `- item`)
8. **Colores/Acabados** (swatches + catálogo global clickeable + crear nuevo con upload)
9. **Mano de obra** (3 DayCounter: desarrollo/ensamblaje/instalación + tarifas display)
10. **Subtotal** (materiales / mano de obra / total espacio)
11. **Obra Civil** (3 categorías, tabla editable, referencial)

### 3. Tabla Items Editable (`ItemRow.tsx`)
- **Descripción:** Popover con fuzzy search catálogo + "Nuevo producto"
- **Unidad:** Input libre (heredada de catálogo)
- **Cantidad:** Number input (step 0.1), recalcula total
- **Precio:** MoneyInput (formato COP en blur, raw en focus), recalcula total
- **Total:** Display solo (COP formateado)
- **Imagen:** Thumbnail + click para ampliar / editor para subir
- **Acciones:** Editar catálogo (si tiene catalogo_id), Eliminar

### 4. Panel Resumen/Precios (Grand Totals `gt`)
- Fixed/sticky en sidebar o footer
- Desglose: Materiales, Mano de obra, Subtotal, Costos operativos, Imprevistos, Descuento, Ajuste, IVA, Total, Total+IVA
- COP formateado (`Intl.NumberFormat es-CO`)

### 5. Modal de Contrato (`ContratoModal.tsx`)
- **Sección 1:** Datos contratante (nombre*, doc, domicilio, email, tel)
- **Sección 2:** Plazos (texto semanas), Holgura (días), Garantía (años)
- **Sección 3:** Especificaciones técnicas (4 textareas: estructura, herrajes, mesones, desmonte) — **pre-llenadas dinámicamente** desde items (`compileSpecifications`)
- **Sección 4:** Objeto del contrato (lista items, 1 por línea, pre-llenada con espacios visibles)
- **Sección 5:** Valor total (MoneyInput) + **PaymentScheduleCalculator** (hitos % o fijo, validación suma exacta)
- **Acciones:** Cancelar, Guardar Borrador, Generar Contrato y PDF

### 6. Propuesta Pública (Snapshot)
- `buildPublicSnapshot()` congela: financials, spaces (variante activa), items, imágenes, colores, notas, mano de obra breakdown, obra civil
- **Refresh catálogo** antes de publicar (fetch fresco para imágenes/precios actualizados)
- `propuestas_publicas`: {proyecto_id, public_slug, snapshot_json, estado, emitida_en, revocado_en}
- URL: `/propuesta/{slug}`

---

## E. Las 4 Contradicciones en Contexto

### C1 — Tarifas Mano de Obra (SERV-DEV / SERV-ASSEMBLY / SERV-INSTALL)

**Dónde aparece en Legacy:**
- `CotizadorPro.tsx:117-120` — `missingServiceSkus` memo verifica existencia de 3 SKUs
- `CotizadorPro.tsx:237-247` — `tarifas` memo: `find(sku)` busca en `catalogo` por SKU, usa `precio_publico` || `precio_directo` || fallback 185,000
- `CotizadorPro.tsx:342-344` — Cálculo MO: `jornadas_desarrollo * tarifas.dev + jornadas_ensamblaje * tarifas.assembly + jornadas_instalacion * tarifas.install`
- `EspacioCard.tsx:208-210` — Display idéntico en subtotal por espacio
- `buildPublicSnapshot:885-892` — `labor_breakdown` incluye tasas para snapshot público

**Cómo afecta el flujo:**
1. **Dependencia oculta:** El cotizador **requiere** 3 productos catálogo con SKUs exactos. Si faltan → `missingServiceSkus` no bloquea pero usa fallback 185k (riesgo silencioso).
2. **No versionadas:** Cambio de tarifa = editar producto catálogo → afecta **todas** las cotizaciones abiertas (no hay snapshot de tarifa al momento de cotizar).
3. **Mix de conceptos:** `productos_catalogo` mezcla materiales (stock, proveedor) con servicios (tarifa hora/jornada). En nuevo schema: separar en `parametros` o tabla `tarifas_mano_obra` versionada.
4. **Precio público vs directo:** Legacy usa `precio_publico` preferentemente. ¿Es tarifa de venta al cliente o costo interno? Ambiguo.

**Decisión para nuevo schema:**
- Migrar a `parametros` (claves: `tarifa_dev`, `tarifa_assembly`, `tarifa_install`) con `parametros_historial` para auditoría
- O tabla `tarifas_mano_obra` con vigencia (desde/hasta) si hay escalones temporales
- Eliminar SKUs `SERV-*` de `productos_catalogo` (limpieza Fase 0)

---

### C2 — espacio_variantes / items_variante

**Dónde aparece en Legacy:**
- **Carga:** `loadAll` (lines 131, 135) → `fetch('/api/vault?namespace=espacio_variantes')` + `items_variante`
- **Relación:** `espacio_variantes.proyecto_id` → `proyectos.id`; `items_variante.variante_id` → `espacio_variantes.id`
- **Agrupación:** `CotizadorPro.tsx:204-220` — `espacios` memo agrupa variantes por `nombre_espacio` (Map)
- **Variante activa:** `activeVarMap[nombre_espacio] = variante_id` (sincronizado desde BD `activa` flag + local selection)
- **Items filtrados:** `items.filter(it => it.data.variante_id === activeVarId)` (line 206 EspacioCard)
- **CRUD completo:** add/rename/duplicate/delete/reorder espacios y variantes (lines 402-749)

**Cómo se relacionan con cotizador:**
- Un **proyecto** tiene N **espacios** (nombre_espacio único por proyecto)
- Un **espacio** tiene N **variantes** (una `activa` a la vez)
- Una **variante** tiene N **items_variante** (carpintería) + N **items_obra_civil** (referencial)
- **Visible en PDF:** flag `visible_pdf` en variante (no en espacio)

**Mapeo a nuevo schema:**
| Legacy | Nuevo Schema | Cambios |
|--------|-------------|---------|
| `espacio_variantes` | `espacio_variantes` | ✅ Mismo nombre. Campos: `colores` JSONB (nuevo), `descripcion_alternativa` (nuevo), `orden` (legacy `orden_espacio` + `orden` en variante) |
| `items_variante` | `items_variante` | ✅ Mismo. `anulado` boolean (nuevo), `total_linea` nullable (legacy required), `nombre_personalizado` (nuevo) |
| `items_obra_civil` | **NO EXISTE** | ⚠️ **Gap crítico**. Legacy usa namespace separado. Nuevo schema no tiene tabla. Opciones: (a) añadir `categoria` enum a `items_variante`, (b) crear tabla `items_obra_civil`, (c) usar `items_variante` con `tipo: 'obra_civil'` + categoria |

**Hallazgo:** `items_obra_civil` es **estimado referencial** (no suma a total contrato). En nuevo schema debe persistirse pero excluido de cálculos financieros contractuales.

---

### C3 — proyectos.estado

**Dónde aparece en Legacy:**
- **Enum en Kanban:** `ComercialKanban.tsx:25-34` — 8 estados: `activa` → `enviada` → `en_contrato` → `pre_produccion` → `produccion` → `entregado`/`perdida`/`cancelada`
- **Producción Kanban:** `ProductionKanban.tsx:18-24` — 5 estados orden: `pendiente` → `en_proceso` → `instalacion` → `entregada` → `garantia` (distinto dominio)
- **Validación transición:** `zap_validar_transicion_estado` (ComercialKanban line 142) — server-side guard
- **Filtro cotizador:** `CotizadorPro.tsx:381-385` — `productionReady = !!activeCotId && (!!activeContrato || estado === 'en_contrato' || estado === 'pre_produccion')`
- **Nuevo proyecto:** `createProjectDraft` → `estado: 'activa'` (default)
- **Contrato generado:** Engine actualiza estado a `en_contrato` / `pre_produccion` vía eventos

**Estados que filtra/usa el cotizador:**
| Estado | Significado | ¿Cotizador permite editar? |
|--------|-------------|---------------------------|
| `activa` | Lead inicial, cotización en borrador | ✅ Sí |
| `enviada` | Propuesta pública emitida | ✅ Sí (pero warn) |
| `en_contrato` | Contrato generado, en negociación | ⚠️ Solo lectura parcial |
| `pre_produccion` | Contrato firmado, preparando producción | ❌ Solo lectura |
| `produccion` | En taller | ❌ No accesible desde cotizador |
| `entregado` | Finalizado | ❌ Solo historial |
| `perdida`/`cancelada` | Cerrados sin éxito | ❌ Solo historial |

**Mapeo a nuevo schema:**
- `estadoProyecto` enum en `proyectos.estado` ✅ (mismos 8 valores)
- **Falta:** Transiciones válidas no están en schema (están en zap `zap_validar_transicion_estado`). Deben documentarse o moverse a `parametros` o tabla `transiciones_estado`.

---

### C4 — precio_publico / precio_directo

**Dónde aparece en Legacy:**
- **Catálogo:** `productos_catalogo` tiene ambos campos (numeric 14,2)
- **ItemRow.tsx:71** — `precio = Number(cd.precio_publico) || 0` (preferencia público)
- **CotizadorPro.tsx:240** — `find(sku)` usa `precio_publico || precio_directo` para tarifas mano de obra
- **buildPublicSnapshot:855** — `unit_price: unitPrice` (del ítem, ya resuelto), `product?.precio_publico` para display
- **HybridClientSelector:** No usa precios
- **Contrato:** `valor_total` viene de `calculatedTotal` (ya resuelto con precios finales)

**Flujo al cálculo:**
1. Usuario selecciona producto en catálogo → `precio_unitario = precio_publico` (default)
2. Usuario **puede sobrescribir** precio en tabla (MoneyInput) → `precio_unitario` editable
3. `total_linea = cantidad * precio_unitario` (siempre recalculado)
4. Grand total suma `total_linea` de items + mano de obra (tarifas de SKUs SERV-*)

**Ambigüedad de negocio:**
- `precio_publico`: Precio de venta al cliente final (con margen)
- `precio_directo`: Costo proveedor / precio interno sin margen
- **En cotizador se usa `precio_publico`** → el cotizador arma **precio de venta**, no costo
- **Pero** mano de obra usa tarifas de catálogo (¿son costo o venta?) — inconsistente

**Decisión para nuevo schema:**
- Mantener ambos en `productos_catalogo` ✅
- Añadir campo `es_servicio` boolean o `tipo` enum para distinguir materiales vs servicios
- Tarifas mano de obra **fuera** de catálogo (ver C1)
- En cálculo: `precio_unitario` default = `precio_publico` para materiales, editable por usuario

---

## F. Contrato Legacy (P-05)

### Estructura del Contrato (`ContratoModal.tsx` + `contrato-payload.ts`)

**Campos del contrato (persistidos en `contratos`):**
| Campo | Tipo | Origen |
|-------|------|--------|
| `proyecto_id` | FK | Cotización activa |
| `codigo_contrato` | String (UNIQUE) | Generado por engine |
| `fecha_contrato` | String (YYYY-MM-DD) | Hoy al generar |
| `contratante_domicilio` | String | Cliente.domicilio / proyecto.direccion_obra |
| `plazo_ejecucion_texto` | String | Input usuario (default '4 a 5') |
| `holgura_dias` | Integer | Input (default 8) |
| `garantia_anios` | Integer | Proyecto.garantia_anios (default 2) |
| `objeto_items` | Text | Lista items (1 por línea, pre-llenada con espacios visibles) |
| `especificaciones_estructura` | Text | Compilado dinámicamente desde items tipo 'Tableros / Maderas' |
| `especificaciones_herrajes` | Text | Compilado desde items tipo 'Herrajes / Accesorios' |
| `especificaciones_mesones` | Text | Compilado desde items tipo 'Piedras / Mesones' |
| `condiciones_desmonte` | Text | Compilado desde items tipo 'Servicio' |
| `valor_total` | Numeric(14,2) | CalculatedTotal (editable en modal) |
| `estado` | Enum ('borrador'/'firmado') | Default 'borrador' |
| `email_asunto` / `email_cuerpo` | Text | Generados por engine zap |
| `hitos_pago` | JSON/Array | **Tabla separada `hitos_pago`** (nuevo schema) |

**CompileSpecifications (lines 25-72 ContratoModal):**
- Filtra items de variantes activas + visible_pdf
- Agrupa por `tipo` de catálogo
- Genera 4 textos: estructura, herrajes, mesones, desmonte
- **Único por tipo** (Set de descripciones)

### PaymentScheduleEditor (`PaymentScheduleCalculator.tsx`)

**Características clave:**
- **Cero useState real** — Componente 100% controlado: `milestones` prop + `onChange` callback
- **Estándar:** 3 hitos % (50% anticipo, 25% instalación, 25% final)
- **Personalizable:** Add/remove hitos, tipo % o fijo, fecha límite, razón
- **Validación visual:** Barra de progreso + mensajes (exceso/faltante/ok)
- **Suma exacta requerida** para guardar contrato (validación en `performSave` line 226-235)
- **Persistencia:** `hitos_pago` array en `contrato` payload → engine crea registros en tabla `hitos_pago`

### Generación de Propuesta Pública
- `buildPublicSnapshot()` (CotizadorPro lines 798-898) — Congela estado completo
- **Refresh catálogo fresco** antes de publicar (line 905-913)
- `propuestas_publicas` namespace: `{proyecto_id, public_slug, snapshot_json, estado, emitida_en, revocado_en}`
- Slug: `createPublicSlug(nombre_proyecto)` + UUID si colisión
- Estados: `borrador` → `publicada` → `revocada`

### Validaciones de Negocio (ContratoModal)
1. Cliente nombre requerido
2. Valor total > 0
3. **Suma hitos = valor_total** (±0.01 tolerancia)
4. Zap `generar_contrato` valida server-side (guardias de transición, datos completos)

---

## G. Mapeo a Nuevo Schema

| Legacy Namespace / Concepto | Nueva Tabla(s) | Campos que Cambian | Campos Eliminados | Campos Nuevos |
|----------------------------|----------------|-------------------|-------------------|---------------|
| `proyectos` | `proyectos` | `estado` → enum `estadoProyecto` (8 valores), `tipo_proyecto` → enum `tipoProyecto` | — | `descripcion_semantica`, `dias_entrega_estimados`, `proyecto_origen_id` en catálogo |
| `clientes` | `clientes` | `origen` default 'manual' | — | `updatedAt`, vínculo `usuarios.cliente_id` |
| `contratos` | `contratos` + `hitos_pago` | `hitos_pago` → tabla separada (1:N), `codigo_contrato` UNIQUE, `estado` → enum `estadoContrato` (borrador/firmado) | `hitos_pago` JSON en contrato | `email_asunto`, `email_cuerpo`, `fecha_contrato` (text), FKs a movimientos/obligaciones |
| `espacio_variantes` | `espacio_variantes` | `colores` → JSONB (structured), `jornadas_*` → numeric(8,2), `orden` (unificado), `visible_pdf` boolean | `imagenes` (string legacy) → usar `imagenes_portfolio` o JSONB | `descripcion_alternativa`, `updatedAt` |
| `items_variante` | `items_variante` | `total_linea` nullable, `anulado` boolean, `nombre_personalizado` | — | `createdAt`, FK `catalogo_id` → `productos_catalogo` |
| `items_obra_civil` | **NUEVA TABLA REQUERIDA** `items_obra_civil` o extender `items_variante` con `categoria` enum | — | — | `categoria` (mano_obra/logistica/materiales), `descripcion_manual`, `notas`, `variante_id` FK |
| `productos_catalogo` | `productos_catalogo` | `precio_directo`/`precio_publico` numeric(14,2), `stock_actual` integer, `proveedor_id` FK, `categoria_comercial`, `publicado_web` boolean | — | `sku` UNIQUE, `modelo_3d_url`, `proyecto_origen_id` FK UNIQUE |
| `propuestas_publicas` | `portfolio_publico` + `imagenes_portfolio` | `snapshot_json` → no persistir (generar on-demand), `public_slug` → `slug` UNIQUE | `snapshot_json` (duplicación) | `categoria_espacio`, `barrio`, `publicado` boolean, imágenes normalizadas 1:N |
| `apoyo_tecnico` | **NO MAPEADO** | — | — | Requiere decisión: ¿migrar a `eventos`/`procedencia` o tabla dedicada? |
| `abonos_contrato` | `movimientos_financieros` + `obligaciones_pendientes` | Concepto unificado en movimientos | Namespace legacy | `tipo`, `cuenta_origen/destino`, `obligacion_id`, `contrato_id` |
| **Tarifas MO (C1)** | `parametros` (claves: `tarifa_dev`, `tarifa_assembly`, `tarifa_install`) | Fuera de catálogo | SKUs `SERV-*` en catálogo | `parametros_historial` para auditoría |
| **Transiciones estado (C3)** | `parametros` (clave: `transiciones_proyecto` JSON) o tabla `transiciones_estado` | Fuera de zap | Lógica en `zap_validar_transicion_estado` | Versionado, auditable |

---

## Hallazgos Clave para Decisiones de Arquitectura

1. **C1 (Tarifas MO):** Legacy acopla tarifas a catálogo via SKUs mágicos. **Romper acoplamiento** → `parametros` versionados. Eliminar SKUs `SERV-*` en migración datos.

2. **C2 (Obra Civil):** `items_obra_civil` no existe en nuevo schema. **Crear tabla** `items_obra_civil` (variante_id FK, categoria enum, campos legacy) o unificar en `items_variante` con discriminador `tipo_item`. Recomendado: tabla separada (semántica distinta, referencial vs contractual).

3. **C3 (Estados):** Enum replicado ✅. **Falta matriz de transiciones** (hoy en zap). Mover a `parametros` o tabla dedicada para que sea configurable sin deploy.

4. **C4 (Precios):** `precio_publico` usado como default de venta. **Clarificar semántica**: `precio_publico` = PVP, `precio_directo` = costo. En cotizador, default = PVP, editable. Tarifas MO fuera de este esquema.

5. **Contrato → Hitos:** Legacy guarda hitos en JSON + engine. Nuevo schema: **tabla `hitos_pago` 1:N** ✅. PaymentScheduleEditor ya emite array compatible.

6. **Propuesta Pública:** Legacy congela `snapshot_json` (duplicación). Nuevo: **generar on-demand** desde tablas normalizadas (`portfolio_publico` + `imagenes_portfolio` + vistas SQL). Eliminar `snapshot_json`.

7. **Auto-save + Sync:** `useAutoSave` (race-safe) + `useSyncPulse` (polling SHA) + Zustand `materia` store. **Patrón replicable** en nueva app: React Query / SWR + optimistic updates + webhooks (si Vercel lo soporta) o polling controlado.

8. **Búsqueda Inteligente:** `useSmartSearch` con Levenshtein + localStorage historial/uso. **Portable** a nuevo stack (algoritmo puro TS, sin deps).

9. **Zap Engine:** Boundary único `/api/engine` con zaps nombrados. **Mantener contrato de zaps** durante migración (compatibilidad). Luego reemplazar por Server Actions / API Routes directas.

10. **Datos Reales en Dev:** `dev` worktree usa **misma BD Neon** que producción. **Cuidado:** escrituras en dev tocan datos reales. Migración de datos (Fase 0) debe ser idempotente y reversible.

---