# F-08 — Propuesta Pública (`/propuesta/{slug}`)

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F7 · **Ruta:** `/propuesta/{slug}` · **Roles:** público (cliente con link)
**Fuente:** `destilacion_f3_publico.md` (destilado 2026-08-05) + legacy `PublicProposal.tsx` (454 líneas)

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `proyectos` | §3 | id, nombre_proyecto, estado, direccion_obra | Datos del proyecto |
| `espacio_variantes` | §3 | id, proyecto_id, nombre_espacio, nombre_variante, activa, colores | Navegación de espacios |
| `items_variante` | §3 | id, variante_id, catalogo_id, nombre_personalizado, cantidad, precio_unitario, total_linea, es_referencial, fuente_referencial, grupo_referencial | Ítems de cotización |
| `productos_catalogo` | §2 | id, nombre, precio_publico, precio_directo | Datos del ítem |
| `productos_tienda` | §2 | id, catalogo_id, imagen_principal_url, descripcion_diseno | Imágenes del producto |
| `contratos` | §4 | id, proyecto_id, valor_total, plazo_ejecucion_texto, garantia_anios | Si hay contrato firmado |
| `hitos_pago` | §4 | id, contrato_id, tipo, monto_o_porcentaje, razon, fecha_limite | Plan de pagos (visible si contrato existe) |
| `parametros` | §1 | clave, valor_numeric | Tarifas MO (C1: 5 params físicos → 3 tarifas calculadas) |

---

## 2. Estados que transiciona

*Sin estados transicionales — pantalla de solo lectura pública vía snapshot del proyecto.*

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Propuesta" | — | — |
| "Ambientes" | — | `espacio_variantes` |
| "Ítems incluidos" | — | `items_variante` |
| "Estimado referencial" | — | `items_variante.es_referencial=true` |
| "Mano de obra" | — | Tarifas MO calculadas |
| "Inversión total" | — | `valor_total` |
| "Guardar como PDF" | — | Acción cliente |

---

## 4. Reglas de negocio

| # | Regla | Validación |
|---|---|---|
| R1 | Propuesta = snapshot inmutable del proyecto (lectura-only) | Servidor: GET sin mutación |
| R2 | Snapshot proyecta solo campos públicos: sin `id` interno, `costo`, `margen`, `proveedor_id` | Server projection |
| R3 | MO: tarifas calculadas en runtime desde `parametros` (C1). No se almacenan en snapshot | Servidor |
| R4 | Civil estimate: agrupado por `grupo_referencial`, badge "Referencial", no suma al total contractual | Servidor + UI |
| R5 | **Sin botones de pago en la propuesta.** La propuesta es informativa, no transaccional | — |
| R6 | Viewer 3D: diseñado pero comentado en código. Se descomenta cuando exista integración SketchUp → CVC | `{/* <Viewer3DModal proyectoId={id} /> */}` |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `PropuestaPublica` | Server + Client | `proyecto`: layout de storytelling, tema light |
| `HeaderPropuesta` | Client | Sticky: título del proyecto, fecha, botón "Guardar PDF" |
| `NavegacionAmbientes` | Client | Tabs/pills: un ambiente = una pestaña |
| `GaleriaImagenes` | Client | Carrusel/foco con imágenes del espacio |
| `SelectorVariantes` | Client | Si hay variantes múltiples, toggle entre ellas |
| `SelectorColores` | Client | Chips de color con `color_hex` de `espacio_variantes.colores` |
| `ListaItems` | Client | Ítems del espacio: nombre, cantidad, imagen, precio unitario, total |
| `ItemsReferenciales` | Client | Agrupados por `grupo_referencial`, badge "Referencial" (amber), fuera del total |
| `DesgloseMO` | Client | 3 filas: Desarrollo (jornadas × tarifa_dev), Ensamblaje (× tarifa_assembly), Instalación (× tarifa_install) |
| `ResumenFinanciero` | Client | Sticky sidebar: subtotal materiales + MO + costos + IVA = total |
| `PlanPagos` | Client | Si hay contrato: tabla de `hitos_pago` con monto, razón, fecha |
| `Viewer3DPlaceholder` | Client | Comentado: `{/* Descomentar con integración SketchUp → CVC */}` |
| `BotonPDF` | Client | Genera PDF con `window.print()` o server-side |

**Tokens D4:** `mist`, tema light, `--font-display` (Fraunces para títulos), `--font-sans` (Inter)

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Trace |
|---|---|---|---|---|
| 1 | Cargar propuesta | `/propuesta/{slug}` | `GET /api/publico/propuesta/:slug` (server projection, snapshot inmutable) | — |
| 2 | Navegar ambientes | Click tab | Cambiar espacio activo | — |
| 3 | Cambiar variante | Toggle | Mostrar variante seleccionada | — |
| 4 | Guardar PDF | Click | `window.print()` o server-side PDF generation | — |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | Snapshot no expone `id`, `costo`, `margen`, `proveedor_id` | Test: response JSON no contiene campos internos |
| CA-3 | MO calculada desde `parametros` (no hardcodeada en snapshot) | Test: cambiar parámetro → siguiente GET refleja nueva tarifa |
| CA-4 | Civil estimate agrupado por `grupo_referencial`, no suma al total | Test: total = Σ items no referenciales |
| CA-5 | Sin botones de pago en la UI | Playwright: no existe elemento de pago/pasarela |
| CA-6 | Viewer 3D comentado en código (no renderiza) | `grep -c "Viewer3D" → 1` (solo comentario) |
| CA-7 | Si `contratos` existe → muestra plan de pagos | Playwright: proyecto con contrato → tabla de hitos visible |
| CA-8 | Si no hay contrato → sin plan de pagos | Playwright: proyecto sin contrato → sin tabla de hitos |

---

## 8. Nota sobre Viewer 3D

El componente `Viewer3DModal` se diseña como placeholder comentado:

```tsx
{/* Viewer 3D — DIFERIDO hasta integración SketchUp/OpenCutList → CVC */}
{/* <Viewer3DModal proyectoId={proyecto.id} /> */}
```

Al descomentar (F8), el componente recibe `proyectoId` y carga el modelo 3D desde R2/Drive. La integración real es bloqueante de F8, no de F7.

---

## 9. Doble Diamante — Layout Editorial "Revista de Diseño" (Fase Exploración)

**Metodología:** Paradigma visual + narrativa editorial. La propuesta pública NO es un resumen técnico sino un viaje a través del proyecto como historia de diseño. Cada espacio es un capítulo; cada foto de diseño/referencia es una narrativa del concepto.

### 9.1 DIVERGER (Diamante 1 — Descubrir)

**Contexto sin sesgo — qué siente/necesita el cliente al revisar su propuesta:**
- El cliente compró una solución personalizada (no un mueble de catálogo) — quiere SENTIR que el diseño fue pensado específicamente para él.
- Necesita entender el antes/después: cómo se veía el espacio vs. cómo quedará (narrativa de transformación).
- Espera ver "eso que el comercial me mostró" de manera hermosa, no como una tabla de sumas.
- Presupuesto es importante pero NO es lo primero que ve — primero ve el sueño, luego la realidad económica.

**Referencias externas:** Editorial de diseño de interiores (Architectural Digest, Casa y Decoración), catálogos de lujo (muebles nórdicos tipo Muuto/String, cocinas alemanas), portfolios de arquitectos que narran proyectos con imágenes grandes + copy corto.

### 9.2 CONVERGER (Diamante 1 — Definir)

**Reglas de juego:**
- Prioridad 1: Imágenes grandes, respiro, blanco/espacio. Anti-densidad.
- Prioridad 2: Narrativa visual = "espacio actual" → "detalles elegidos" → "espacio final propuesto".
- Prioridad 3: Especificaciones técnicas (precios, jornadas, garantía) son SECUNDARIAS, van abajo o en un anexo/accordion.
- Regla: Cada espacio merece su propio "spread" (2-3 pantallas de scroll).
- Regla: Las dos "carriles" (fotos de diseño vs. fotos de referencia) cuentan una sola historia juntas, no son dos cosas.
- Regla: El desglose financiero es interactivo pero NO es el hero — es detalle secundario al lado.

### 9.3 DIVERGER (Diamante 2 — Explorar Alternativas)

**Opción A: Editorial Directo (Portada Inmersiva + Spread por Espacio)**
```
┌────────────────────────────────────────────┐
│ [HERO: Portada proyecto — imagen principal]│
│ Título grande: "Cocina | Transformación"   │
│ Subtítulo: "Espacios diseñados para vivir" │
│ [Scroll]                                    │
├────────────────────────────────────────────┤
│ SPREAD 1 - COCINA (scroll down):           │
│ [75% ancho: foto de referencia grande]     │
│ [25% ancho: copy "Concepto", especificaciones] │
│ [Scroll]                                    │
│ [Foto de diseño grande]                    │
│ ["Materiales", lista de ítems + precios]   │
│ [Scroll] → SPREAD 2 - COMEDOR...           │
└────────────────────────────────────────────┘
```
**Ventaja:** Cinematográfico, muy editorial. Requiere muchas fotos reales.
**Desventaja:** Requiere fotografía profesional del proyecto propuesto (aún no existe en prototipo). Carga cognitiva: cliente necesita hacer mucho scroll para ver todos los espacios.

---

**Opción B: Galería Inmersiva (Carrusel Horizontal + Toggle Diseño↔Referencia)**
```
┌──────────────────────────────────────────────┐
│ NAVEGACIÓN TOP: Tabs de espacios [Cocina][Comedor][Estudio] │
│ ┌──────────────────────────────────────────┐ │
│ │ [← Galería horizontal: 5 fotos →]        │ │
│ │  [Foto 1: Diseño actual]                 │ │
│ │  [Foto 2: Foto referencia]               │ │
│ │  [Foto 3: Detalle material]              │ │
│ │  [Miniatura abajo: ●●●●○]                │ │
│ └──────────────────────────────────────────┘ │
│ ┌─ CARRIL DE DISEÑO (toggle):────────────────┐ │
│ │ Toggle: [Diseño Propuesto] [Foto Referencia] │
│ │ ┌────────────────────────────────────────┐  │
│ │ │ [HD grande del carril seleccionado]    │  │
│ │ └────────────────────────────────────────┘  │
│ │ Descripción: "Concepto + Materiales"       │
│ └────────────────────────────────────────────┘ │
│ ┌─ DESGLOSE INTERACTIVO (accordion):─────────┐ │
│ │ ▼ Materiales (+$2.1M) │ ▼ MO (+$800k)     │ │
│ │   [item 1] [item 2]   │   [jornadas]      │ │
│ └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```
**Ventaja:** Compacta, interactiva, contrasta bien las 2 narrativas (diseño vs. referencia), fácil de explorar todos los espacios sin scroll infinito.
**Desventaja:** Menos cinematográfico que A. El toggle diseño↔referencia requiere UI adicional.

---

**Opción C: Modo Presentación (Focus-Over + Transiciones Suaves)**
```
┌──────────────────────────────────────────────┐
│ HEADER STICKY: Proyecto | [Ambientes ◀ ▶]  │
│ ┌──────────────────────────────────────────┐ │
│ │                                          │ │
│ │          [FOCUS: Foto grande]            │ │
│ │        (75vh, blur lateral)               │ │
│ │                                          │ │
│ │   Metadata flotante (top-right):         │ │
│ │   • Ambiente: Cocina                     │ │
│ │   • Variante: V1 Moderna                 │
│ │   • Materiales: Roble + Herrajes alemanes│
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
│ [Scroll suave a siguiente espacio]           │
│ └──────────────────────────────────────────────┘
│ [BELOW fold: Desglose expandible]            │
└──────────────────────────────────────────────┘
```
**Ventaja:** Premium, transiciones fluidas. Prepara la experiencia para futuro visor 3D (R6). Narrativa "una foto a la vez, cuéntame tu historia".
**Desventaja:** Requiere JS de transición suave. Alto consumo de ancho de banda (fotos grandes a 75vh). Comparación foto diseño↔referencia es menos directa.

### 9.4 CONVERGER (Diamante 2 — Entregar Solución Híbrida)

**OPCIÓN GANADORA: B + Elementos de A**

La solución combina lo mejor de Galería Inmersiva (B) con narrativa de Spread (A):

**Estructura:**
1. **Header Sticky:** Título proyecto + navegación ambiental (tabs: [Cocina][Comedor][Estudio])
2. **Hero Section (opcional, si hay foto principal del proyecto):** Una foto representativa de la propuesta global (si no existe, omitir).
3. **Por cada Espacio (loop sobre `EspacioVariante`):**
   - **Sección Narrativa:** Un "spread" compacto:
     - Título espacio (h2)
     - Descripción conceptual (1-2 líneas)
     - Dos "carriles" VISUALES separados:
       - **Carril Izq (60% ancho):** Galería de `EspacioVariante.fotosDisenio` (imagen principal + miniaturas seleccionables)
       - **Carril Der (40% ancho):** Galería de `EspacioVariante.fotosReferencia` (imagen principal + miniaturas seleccionables)
     - Cada carril tiene su propio estado de imagen seleccionada (no interfieren).
     - Ambos carriles narran el mismo "concepto" pero desde ópticas distintas: "esto es lo que diseñamos" vs. "esto es de donde sacamos la inspiración".

4. **Desglose Financiero (Accordion por Espacio):**
   - Cerrado por defecto.
   - Al expandir: tabla de materiales (`items_variante` de ese espacio) + jornadas MO + subtotal.
   - NO interfiere con el flujo narrativo del cliente.

   > **Refinamiento 2026-08-11 (implementado):** conversando con el Supervisor sobre paridad
   > visual con la propuesta pública de referencia (`empresa_muebles_clone`, producción legada),
   > se identificó que el accordion cerrado por defecto sobre TODO el desglose (materiales
   > incluidos) es la causa principal del efecto "ERP plano" — el cliente no ve nada hasta
   > hacer clic. Se separa el desglose en dos capas:
   > - **"Qué incluye" (`ListaItems`): siempre visible**, grid de tarjetas con miniatura
   >   (`ProductoCatalogo.imagenUrl` vía `catalogoId`), cantidad, precio unitario y total.
   >   Esto SÍ es la narrativa — es la prioridad 1 de la exploración Diamante 2 ("imágenes
   >   grandes, anti-densidad"), no un detalle secundario.
   > - **Accordion (`DetalleTecnico`), cerrado por defecto:** se conserva solo para mano de
   >   obra (jornadas × tarifa) y referenciales (`ItemsReferenciales`/obra civil) — la
   >   aritmética que sí es secundaria al flujo narrativo.
   > No cambia R1-R8 ni el mapeo de campos de abajo; es un refinamiento de jerarquía visual
   > dentro del mismo componente `AcordeonDesglose` original (ahora dividido en `ListaItems`
   > siempre-visible + `DetalleTecnico` accordion).

5. **Resumen Financiero Global (Sticky Sidebar Der, 320px):**
   - Pequeño resumen flotante: Subtotal Espacios | MO | Costos | IVA | TOTAL.
   - Visible todo el scroll (inspirado en el ResumenPanel del Cotizador).

6. **Plan de Pagos (si `contratos` existe):**
   - Sección final, después de todos los espacios.
   - Tabla de hitos (fecha, monto, concepto).

**Tokens D4 a reusar:**
- `--color-primary` para títulos (Fraunces, size-lg).
- `--color-text-muted` para descripciones (Inter, size-sm).
- `--radius-lg` para esquinas de fotos.
- `--shadow-sm` para separación visual entre carriles.
- Spacing: `gap-6` entre espacios (respiro).

**Regla de Mapa de Campos — Ningún Campo Nuevo Inventado:**
- `fotosDisenio` y `fotosReferencia` ya existen en `EspacioVariante` (contracts.ts líneas 65-66) → úsalos directamente.
- `items_variante` de un espacio heredan `imagenUrl` desde `ProductoCatalogo` → miniatura en modal (tarea 3).
- No crear `fotosProyectoGlobal` ni `fotosHero` — esos son instancias de fotografía profesional que se agregan como `EspacioVariante.fotosEspacio` (línea 64) cuando existan.

> **Nota de descruce con F-03 (portafolio público, 2026-08-12):** La pantalla de **portafolio** (`/portafolio`, F-03) usa `Portafolio.galeriaPortafolioUrl` / `imagenPortafolioUrl` — **NO** `EspacioVariante.fotosEspacio` (decisión ARCH-012: desacoplamiento de la capa de cotización). Esta pantalla **F-08 (propuesta pública)** SÍ es legítima consumir `EspacioVariante.fotosEspacio`/`fotosDisenio`/`fotosReferencia` porque muestra los espacios cotizados del proyecto. No unificar ambas fuentes de imágenes.
