# F-03 — Portafolio de Proyectos

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F7 · **Rutas:** `/portafolio`, `/portafolio/[slug]` · **Roles:** publico

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`).*

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `portafolio` | §10 | id, proyecto_id, titulo, descripcion_comercial, categoria_espacio, materiales_destacados, precio_referencial, publicado, destacado, orden, slug | Casos de obra publicados |
| `proyectos` | §3 | id, nombre_proyecto, direccion_obra, estado | Datos del proyecto asociado |
| `modulos_artefactos` | §8 | id, nodo_id, tipo('imagen'), fuente, url | Imagenes de obra (heredadas del catalogo o dedicadas) |
| `categorias` | §2 | id, nombre, tipo('portafolio') | Categorias de espacio (cocina, closet, estudio) |

---

## 2. Estados que transiciona

*Sin estados transicionales — solo lectura publica. El campo `portafolio.publicado` controla visibilidad.*

---

## 3. Vocabulario H07

| Label | Codigo | Entidad |
|---|---|---|
| "Portafolio" | — | — |
| "Proyectos realizados" | — | — |
| "Cocinas" | `cocina` | `portafolio.categoria_espacio` |
| "Closets" | `closet` | `portafolio.categoria_espacio` |
| "Estudios" | `estudio` | `portafolio.categoria_espacio` |
| "Precio referencia" | — | `portafolio.precio_referencial` (rango, no cifra exacta) |
| "Materiales destacados" | — | `portafolio.materiales_destacados` |

---

## 4. Reglas de negocio

| # | Regla | Validacion |
|---|---|---|
| R1 | Solo `publicado=true` | `WHERE publicado = true` |
| R2 | Sin precios exactos — solo `precio_referencial` como rango estimado | UI: "desde $8M COP" o "$8M - $15M COP", nunca cifra exacta |
| R3 | JSON-LD para SEO (schema.org `CreativeWork`) por proyecto | Server: genera dinamicamente metadata estructurada |
| R4 | Orden por `destacado` DESC, luego `orden` ASC | Server |
| R5 | Imagenes de `modulos_artefactos` con `fuente='heredado_catalogo'` o `dedicado_proyecto` | No se exponen planos de armado ni modelos 3D, solo tipo `imagen` |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `PortafolioGrid` | Server + Client | Grid masonry responsivo (3 col → 2 → 1) con tarjetas destacadas arriba |
| `PortafolioCard` | Client | `portafolio`: imagen hero, titulo, categoria, rango de precio. Efecto hover-elevate |
| `PortafolioDetalle` | Server + Client | `/(publico)/portafolio/[slug]`: galeria completa de imagenes, descripcion comercial, materiales, sin precios exactos, sin fotos de planos |
| `PortafolioSEO` | Server | JSON-LD dinamico por proyecto, meta tags, Open Graph |

**Tokens D4:** `mist`, tema light, `--font-display` (Fraunces titulos), `--font-sans` (Inter cuerpo)

---

## 6. Comportamiento

| # | Evento | Gatillo | Accion |
|---|---|---|---|
| 1 | Cargar portafolio | `/portafolio` mount | `GET /api/publico/portafolio` (server projection: solo `publicado=true`) |
| 2 | Filtrar por categoria | Click categoria | Re-fetch con query param `?categoria=cocina` |
| 3 | Ver detalle | Click tarjeta | Navigate a `[slug]` |
| 4 | Compartir proyecto | Click compartir | Meta tags + URL canonica |

---

## 7. Criterios de aceptacion (verificables mecanicamente)

| # | Criterio | Verificacion |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | Solo `publicado=true` visibles | Test: count publico = count `WHERE publicado=true` |
| CA-3 | Sin precio exacto — solo rango o "desde" | Playwright: no existe `$` seguido de cifra exacta en tarjeta |
| CA-4 | JSON-LD valido para cada proyecto | `curl {url}/portafolio/{slug} \| grep "application/ld+json"` |
| CA-5 | Sin fotos de planos de armado (tipo='plano_armado' no expuesto) | Test: response no contiene `tipo=plano_armado` en imagenes |
| CA-6 | Destacados aparecen primero | Test: primer elemento de la lista tiene `destacado=true` |

---

## 8. Galería del Proyecto — Portada Fotográfica Elegante (Detalle `[slug]`)

**Fecha adenda:** 2026-08-10 · **Metodología:** Doble Diamante completo (4 fases) · **Objetivo:** enriquecer la experiencia visual del proyecto en `[slug]` con cinta de imágenes elegante, modo inmersivo de enfoque, y preparación arquitectónica para visor 3D futuro (sin implementar 3D real hoy).

---

### 8.1 — Doble Diamante: Diverger (Descubrir)

**Contexto de necesidad (insights):**
- **I-037 (Luz & Biofilia):** fotografía es el medio principal de comunicación en el paradigma editorial de Veta Dorada — no texto, imágenes.
- **Referencia positiva:** `vetadeoro.co/portafolio/[slug]` muestra galería asimétrica + lightbox inmersivo, no "tarjetas uniformes".
- **Comportamiento de usuario observado (sesgos emocionales):**
  - Fotografía de alta calidad → confianza en oficio + percepción de valor.
  - Overlay oscuro (lightbox) → foco emocional, sin distracciones, "el espacio es el protagonista".
  - Zoom/detalle interactivo → permite descubrir texturas (madera, herrajes, acabados) sin texto.
  - Transición suave, sin jarring → tono premium.

**¿Qué busca el cliente al ver esta galería?**
- Inspiración: "¿cómo quedó el proyecto terminado?"
- Confianza en detalles: ver texturas, acabados, instalación de herrajes.
- Aspiración: "¿podría tener un espacio así?"
- Para arquitecto/prescriptor: ver cómo se construyó, qué materiales se usaron.

**¿Qué referencias fuera del software aplican?**
- Revistas editoriales de arquitectura/interiorismo (Architectural Digest, El Mueble): foto dominante + grid de detalles + cuerpo de texto en medida de lectura.
- Galerías de arte: lightbox limpio, navegación discreta, foco en la obra.
- Sitios premium de arquitectura (Norm Architects, Kinfolk): fotografía como narrativa visual, no catálogo e-commerce.

**Problemas del estado actual a resolver:**
- Las imágenes en tarjetas del portafolio grid son solo miniaturas — la página de detalle `[slug]` no especifica estructura de galería protagonista.
- Ligero riesgo de parecer "tabla de inventario" si se exponen demasiadas imágenes sin jerarquía visual.

---

### 8.2 — Doble Diamante: Converger (Definir)

**Reglas de juego (criterios de entrada y salida):**

| Criterio | Decisión | Por qué |
|---|---|---|
| **Jerarquía visual** | 1 imagen "hero" a 2 filas de alto (`aspect-ratio` 16:9 o fotogénica), luego grid asimétrico de detalles | La foto principal cuenta la historia; detalles secundarios documentan oficio |
| **Cantidad de imágenes** | Mín. 3 (hero + 2 detalles), máx. 10 (no abruma) | Suficiente para mostrar varios espacios del proyecto sin fatiga visual |
| **Modo overlay** | Lightbox oscuro (overlay translúcido, `--color-overlay-backdrop`), navegación con flechas + cierre con ESC, sin autoplay | Foco emocional, sin prisa, control total del usuario |
| **Texturas/detalles** | Zoom suave (CSS `transform: scale(1.15)` en hover o swipe), sin sacudida | Revela herrajes, barniz, precisión del trabajo |
| **Copy visual** | `figcaption` con ubicación/fecha/material (si existe); sin precios | Contexto sin comercialidad; fotos de oficio, no de catálogo |
| **Responsividad** | Grid asimétrico + hero `100vw mobile / max-w-screen desktop`; overlay fullscreen mobile | Fotografía respira en pantallas grandes |
| **Prep para 3D** | Data attribute `data-modelo-3d` en contenedor; estructura de componente lista para swappear imagen por visor 3D sin romper layout | Hoy solo foto; mañana, un modelo 3D en la misma posición |

**Qué entra, qué se descarta:**
- ✅ Entra: fotografía de obra real, fotos de detalles (herrajes, uniones, acabados).
- ✅ Entra: `figcaption` con "Cocina a medida, Bogotá 2025" + metadata.
- ❌ Descarta: foto de planos de armado (`tipo='plano_armado'`, ya protegido en §4 R5).
- ❌ Descarta: ambigüedad sobre "espacio de alta definición" — siempre fotografía real de la obra entregada, nunca render conceptual sin entrega.

---

### 8.3 — Doble Diamante: Diverger (Explorar alternativas)

**3 estructuras de galería exploradas:**

| # | Estructura | Ventaja | Desventaja | Contexto referencia |
|---|---|---|---|---|
| **Alt 1: Filmstrip horizontal (cinta)** | Hero + cinta horizontal scrolleable de thumbnails debajo (tipo Instagram Stories) | Intuitivo, compacto, fácil navegar; ideal para mobile | Requiere JS para drag/snap; menos espacio visual en mobile | Portafolios tipo Behance |
| **Alt 2: Grid asimétrico** (masonry tipo Unsplash) | Hero a 2 filas + grid de 3-4 cols de detalles; cada detalle clickeable abre overlay | Elegante, escala flexible, showcasea varios espacios | Requiere cálculo de `aspect-ratio` por imagen; menos narrativo | Sitios premium: Norm Architects, Snøhetta |
| **Alt 3: Secuencia lineal** (hero + grid uniforme) | Hero grande, debajo grid simétrico (3 cols) de detalles | Sencillo, predecible, flujo claro | Plano, menos editorial; pareceríaProduct listing de e-commerce | Alternativa descartada |

**Decisión ganadora: Alt 1 + Alt 2 (híbrido editorial).**
- Hero grande (Alt 2) posiciona la obra como protagonista.
- Cinta scrolleable bajo el hero (Alt 1) permite exploración rápida sin salir de la página.
- En desktop: cinta horizontal + animación suave; en mobile: grid vertical responsivo (Alt 2).
- Overlay abre sobre cualquier imagen, manteniendo contexto visual de la cinta.
- Resultado: narrativa fotográfica profesional, no inventario de catálogo.

---

### 8.4 — Doble Diamante: Converger (Entregar)

**Componentes UI (mapeo a `lib/data/contracts.ts` §EspacioVariante):**

| Componente | Props | Entidad | Tokens D4 usados | Notas de implementación |
|---|---|---|---|---|
| `PortafolioGalleryHero` | `imagenUrl: string, alt: string, titulo: string, metadata?: {ubicacion?, fecha?, espacio?}` | `Portafolio.galeriaPortafolioUrl[0]` (primera imagen = hero) o fallback a `Portafolio.imagenPortafolioUrl` | `aspect-ratio: 16/9` o `2/1`, `object-cover`, `--color-border-subtle` | `<img fetchpriority="high" loading="eager" />` + `<figcaption>` bajo hero con padding `--spacing-4` |
| `GalleryFilmstrip` | `imagenes: {url, alt, id}[], onSelectId: (id)=> void, selectedId: string, variant: 'horizontal'\|'vertical'` | `Portafolio.galeriaPortafolioUrl[1..n]` (detalles) | `--spacing-2` entre thumbs, hover `scale(1.05)` con `transition: transform 200ms` | Desktop: `grid-auto-flow: col, auto-cols: 120px, overflow-x: auto`; Mobile: `grid-auto-flow: row` |
| `GalleryOverlay` | `imagen: {url, alt, id}, imagenes: [...], onClose, onNext, onPrev, isOpen: boolean` | Derivado de `Portafolio.galeriaPortafolioUrl[selectedIndex]` | `--color-overlay-backdrop` (fondo), `--color-text-primary` (flechas/close) | Fullscreen modal, cierre con `<button>✕</button>` esquina top-right, flechas `← →` en lados, ESC cierra |
| `Modelo3dPlaceholder` | `data-modelo-3d?: string, imagenUrl: string, modeloUrl?: string` (fallback a foto) | Prep futura: si `Portafolio.galeriaPortafolioUrl` algún día incluye `modelo3dUrl` → visor 3D; sino → foto | Mismo `aspect-ratio` y tokens que `PortafolioGalleryHero` | Componente swap-ready: hoy `<img />`, mañana `<Viewer3D />` sin tocar layout. Usa prop `data-modelo-3d` como marker. |

**Layout visual en detalle (Portafolio `[slug]` estructura):**

```
┌──────────────────────────────────────────┐
│ Hero (PortafolioGalleryHero)              │ ← 100% ancho, aspect 16:9, fetchpriority="high"
│  [Fotografía grande del proyecto]        │   padding relativo a viewport
│  └─ figcaption: "Cocina a medida,        │   color --color-text-muted, font --font-sans
│     Bogotá 2025" · Madera roble           │
└──────────────────────────────────────────┘
    ▼
┌─ Filmstrip (GalleryFilmstrip) ──────────┐
│ [Thumb 1] [Thumb 2] [Thumb 3] [→]       │ ← Desktop: 5 thumbs visibles, scrolleable horizontal
│    [selectedId border: --color-brand]    │   Mobile: 3-4 thumbs, o stack vertical en xs
└──────────────────────────────────────────┘

[Otros bloques de la página: descripción, materiales, CTA...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERLAY (GalleryOverlay) — modal fullscreen al clickear cualquier imagen:
┌──────────────────────────────────────────┐
│  × [close, top-right, z-50]              │
│                                          │
│        [Imagen grande en overlay]        │
│        [figcaption con contexto]         │
│                                          │
│  ← [prev arrow, left side]  [next →]     │
│                                          │
│  [Imagen 3 de 8]                         │
└──────────────────────────────────────────┘
```

**Tokens CSS necesarios (ya existen en `app/globals.css`):**

| Token | Uso en galería | Valor en globals.css |
|---|---|---|
| `--color-overlay-backdrop` | Oscuridad del lightbox | `rgba(43, 43, 43, 0.4)` |
| `--color-border-subtle` | Separador entre hero y filmstrip | `#E6E1D8` |
| `--color-brand` | Borde del thumbnail seleccionado | `#8B6914` (dorado) |
| `--spacing-2` | Gap entre thumbnails | `0.5rem` |
| `--spacing-4` | Padding de figcaption | `1rem` |
| `--font-sans` | Metadata en figcaption | `Teachers` |
| `--text-sm` | Tamaño metadata | `0.875rem` |
| `--color-text-muted` | Color metadata | `#5F5D57` |
| `--color-text-primary` | Flechas/close button | `#2B2B2B` |

**Comportamiento interactivo:**

| # | Evento | Gatillo | Acción esperada | Trace/Analytics |
|---|---|---|---|---|
| 1 | Cargar detalle `[slug]` | Page mount | GET imágenes de `Portafolio.galeriaPortafolioUrl` (server render), mostrar hero; fallback a `imagenPortafolioUrl` | — |
| 2 | Click imagen hero o thumbnail | User click en `<button role="button">` | Abre `GalleryOverlay` con imagen seleccionada, overlay `opacity: 1` smooth | `event: gallery_open, imagenId: X, fromSource: hero\|thumbnail` |
| 3 | Navegación en overlay | Tecla ← o →, o click flecha | Update `selectedImageIndex`, re-render overlay con imagen siguiente | `gallery_next` o `gallery_prev` |
| 4 | Cierre overlay | Tecla ESC o click ✕ | `GalleryOverlay` cierra, `opacity: 0`, vuelve a detalle preservando scroll pos anterior | `gallery_close` |
| 5 | Hover thumbnail en filmstrip | Mouse over thumbnail | `scale(1.05)` suave 200ms, `cursor: pointer` | — (no analytics para hover) |
| 6 | Zoom suave en overlay | Opcional: click en imagen del overlay | `transform: scale(1.15)` CSS zoom (no real zoom de navegador), suave 300ms | `gallery_zoom_detail` |
| 7 | Swipe/drag en mobile (opt) | Touch swipe left/right en overlay | Navegar a imagen siguiente/anterior (iOS/Android) | `gallery_swipe_next` / `gallery_swipe_prev` |

**Preparación para visor 3D (Sin implementación hoy):**

Estructura lista para un futuro swap:

```tsx
// Hoy: foto
<PortafolioGalleryHero
  imagenUrl={fotoPrincipal}
  data-modelo-3d={null}
/>

// Mañana: swap a visor 3D sin romper layout
{modelo3dUrl ? (
  <Viewer3DPortafolio
    modelUrl={modelo3dUrl}
    aspectRatio="16:9"
    data-modelo-3d={modelo3dUrl}
  />
) : (
  <PortafolioGalleryHero imagenUrl={fotoPrincipal} />
)}
```

El atributo `data-modelo-3d` marca contenedores que podrían contener 3D futuro. Sin JS adicional requerido hoy.

**Reglas de negocio para esta galería:**

| # | Regla | Validación | Fuente |
|---|---|---|---|
| RG-1 | Solo imágenes con `tipo='imagen'` — nunca planos (`plano_armado`), nunca renders conceptuales sin entrega | Server: `WHERE tipo = 'imagen' AND anulado = false` en `modulos_artefactos` | §4 R5 (ya definido) |
| RG-2 | Hero = primera imagen del array `Portafolio.galeriaPortafolioUrl`; detalles = resto. Si `galeriaPortafolioUrl` está vacío, el hero usa `imagenPortafolioUrl` | Order by índice ascendente en el array de galería | Contrato `Portafolio` (decisión ARCH-012: desacoplar de `EspacioVariante`) |
| RG-3 | Metadata en figcaption: solo contexto (ubicación, año, espacio) — sin precio exacto | `figcaption` NO contiene símbolos de moneda (`$`, `COP`) | §3 (web editorial) |
| RG-4 | Overlay no persiste al navegar a otra ruta — state local, no URL query param | Overlay state = componente local React, `useEffect` cleanup en unmount | Privacy & UX |
| RG-5 | Accesibilidad: teclas de navegación + ARIA labels en overlay | `role="dialog"`, `aria-labelledby`, `aria-describedby`, flechas navegables | WCAG 2.1 AA |

---

### 8.5 — Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Verificación |
|---|---|---|
| CA-G1 | Hero renderiza con `fetchpriority="high"` en `<img>` | `grep "fetchpriority.*high" app/(publico)/portafolio/\[slug\]/page.tsx` ≥ 1 |
| CA-G2 | Filmstrip scrolleable horizontal en desktop (≥768px) | Playwright: viewport 1200px → `grid-auto-flow: col`, scroll sin `overflow: hidden` |
| CA-G3 | Filmstrip stacked vertical en mobile (<768px) | Playwright: viewport 375px → `grid-auto-flow: row`, sin scroll horizontal |
| CA-G4 | Overlay abre sin jarring (transición suave 300ms) | Playwright: click imagen → `GalleryOverlay` opacity 0→1 en tiempo ≤300ms |
| CA-G5 | Overlay cierra con ESC key | Playwright: overlay open → keydown('Escape') → overlay closed |
| CA-G6 | Metadata en figcaption: ubicación/año/espacio, sin precios | `grep -E '\$\|COP' app/(publico)/portafolio/\[slug\]/*.tsx` en `figcaption` = 0 |
| CA-G7 | Solo `tipo='imagen'` expuesto (no planos de armado) | Test: `GET /api/publico/portafolio/[slug]/imagenes` → todas tienen `tipo='imagen'`, ninguna `tipo='plano_armado'` |
| CA-G8 | Componente `Modelo3dPlaceholder` existe y tiene atributo `data-modelo-3d` | `grep -c "data-modelo-3d" components/veta/` ≥ 1 |
| CA-G9 | Layout no rompe en breakpoints 320px, 375px, 768px, 1024px, 1440px | Playwright multi-viewport test → no horizontal scroll overflow en ningún tamaño |
| CA-G10 | Thumbnail seleccionado tiene border o highlight visual | Playwright: click thumb → verify `class` contains `border`, `ring`, o CSS `border-color: --color-brand` |

---

### 8.6 — Verificación de integridad (pre-entrega)

- [x] Doble Diamante completo: 4 fases visibles (Diverger/Converger/Diverger/Converger).
- [x] Mapeo a `lib/data/contracts.ts`: `Portafolio.galeriaPortafolioUrl` y `Portafolio.imagenPortafolioUrl` (campos reales de la entidad `Portafolio`, no de `EspacioVariante`). **Decisión ARCH-012 (2026-08-12): el portafolio público está DESACOPLADO de `EspacioVariante`** — la galería usa exclusivamente campos de `Portafolio`. No usar `EspacioVariante.fotosEspacio` en `/portafolio` (ver RG-2 y comportamiento tabla §8.4).
- [x] Componentes especificados con props exactas y tokens D4 del `app/globals.css`.
- [x] Preparación 3D documentada explícitamente (sin implementación real hoy).
- [x] Reglas anti-ERP aplicadas: galería no expone planos, metadata no es "badge de inventario".
- [x] Criterios de aceptación son ejecutables (Playwright, grep, API test).
- [x] Comportamiento interactivo trazado en tabla de eventos.
- [x] Versión responsiva (mobile/tablet/desktop) especificada.


