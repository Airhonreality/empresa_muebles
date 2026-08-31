# 04 — Plan de Reconstrucción: Home Luz & Biofilia

Precondición: `03_CONTRATO_SCHEMAS_ZAPS.md` ya ejecutado (`testimonios` existe, `configuracion_comercial` tiene NAP real).

Archivos a modificar: `storage/styles/tokens.css`, `src/components/specialized/VetaHeader.tsx`, `src/components/specialized/VetaFooter.tsx`, `src/components/specialized/VetaHome.tsx`, `src/components/specialized/VetaAgendar.tsx`. Archivo nuevo: `src/components/specialized/VetaTestimonials.tsx` (compuesto dentro de `VetaHome.tsx`, no necesita registro en `agnostic.config.ts` salvo que se decida usarlo también como bloque independiente en otra ruta).

## 1. Tokens — extender, no reescribir `storage/styles/tokens.css`

El archivo ya define `--veta-bg-light: 38 33% 97%` (Champaña Cálido) sin usar en ningún componente. Reutilizarlo como base del tema claro en vez de inventar un valor nuevo. Agregar junto a los tokens `--veta-*` existentes (mismo archivo, no tocar los tokens `--sat-*` genéricos del engine):

```css
/* ☀️ LUZ & BIOFILIA — tema claro, sugerido por luz natural, no por verde literal */
--veta-bg-warm-paper: 40 30% 98%;      /* #FCFBF9 — fondo principal, luz solar */
--veta-bg-linen: 38 26% 93%;           /* #F3EFE9 — fondo alterno, lino natural */
--veta-text-carbon: 0 0% 17%;          /* #2B2B2B — texto principal sobre claro */
--veta-text-stone: 43 4% 46%;          /* #7A7873 — texto secundario sobre claro */
--veta-glass-light-bg: rgba(255, 255, 255, 0.55);
--veta-glass-light-border: rgba(43, 43, 43, 0.08);
```

`--veta-gold-muted` / `--veta-gold-hover` (acento de marca) **no cambian de valor** — siguen siendo la variable de acento agnóstica; lo único que cambia es el fondo/texto sobre el que se aplican. Esto es literalmente lo que pidió el dueño del proyecto: "los colores de marca se mantienen agnósticos" — no crear un token de verde, no renombrar el acento dorado.

Nuevas utilidades glass claras (agregar debajo de `.veta-glass-card` existente, no reemplazar — el tema oscuro puede quedar como fallback de otras rutas internas si se decide más adelante, pero el Home público deja de usarlo):

```css
.veta-glass-navbar-light {
  background: rgba(252, 251, 249, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--veta-glass-light-border);
}

.veta-glass-card-light {
  background: var(--veta-glass-light-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--veta-glass-light-border);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.veta-glass-card-light:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.75);
  border-color: rgba(212, 197, 161, 0.4);
}
```

`.veta-btn-gold` no cambia — ya funciona sobre fondo claro u oscuro porque su propio `background-color` es el token dorado.

## 2. Reglas de maquetación (de `Practicas de codivo UX y responisve.md`)

Aplicar en los componentes nuevos/editados:

- Tipografía fluida con `clamp()` para H1 (`clamp(2rem, calc(1.5rem + 1.8vw), 3.5rem)`), no tamaños fijos por breakpoint.
- Ninguna imagen del portafolio/hero sin `aspect-ratio` explícito (evita CLS). El hero usa `aspect-ratio` + `fetchpriority="high"` en la imagen principal, formato WebP/AVIF.
- Grid de la sección de Validación Técnica: usar `.veta-grid-auto` (`grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr))`), no columnas fijas de Tailwind (`md:grid-cols-3`) para que reflowee sin media queries.
- Botones y CTAs interactivos: mínimo `48px` de alto, `8px` de separación mínima entre botones contiguos, ubicados en la zona cómoda del pulgar en mobile (parte inferior/central), no en la esquina superior.
- Efectos `:hover` encapsulados en `@media not all and (hover: none)` para no interferir con touch.

## 3. `VetaHome.tsx` — mapeo de secciones desde `diseno_detalle_modulo_home.md`

Reemplazar el contenido actual (arquitectura genérica "La ilusión del espacio perfecto") por la estructura documentada:

1. **Hero** — mensaje central: *"Carpintería arquitectónica de alta precisión."* Subtítulo: *"Diseñamos, fabricamos e instalamos espacios integrales pensados para tu bienestar. Tecnología 3D, materiales premium y calidad de fábrica, sin intermediarios."* Imagen fotorrealista muy iluminada (luz solar, ventanales, toques biofílicos reales en la foto — plantas, no en el CSS). CTA principal → `/agendar` (abre el embudo, ver `05_PLAN_EMBUDO_ARQUITECTURA.md`).
   - Respuesta atómica (46 palabras, de `Practicas de codivo UX y responisve.md` §3.B) visible como párrafo bajo el H1, no oculto: *"Veta Dorada es un estudio de carpintería arquitectónica ubicado en Bogotá. Especializados en el diseño, modelado 3D y fabricación directa de cocinas integrales, vestidores y mobiliario residencial de alta gama, garantizan precisión milimétrica y herrajes de estándar global para optimizar el bienestar y valor de su hogar."*
2. **Validación Técnica (Por qué Veta Dorada)** — grid de 3 columnas (`.veta-grid-auto`), Layer-Cake pattern (subtítulos jerarquizados, negrita suave en términos técnicos, iconos discretos):
   - *Disminuye la incertidumbre* → copy de `diseno_detalle_modulo_home.md` §Sección 2.
   - *Punto de Fábrica Directo* → mismo doc.
   - *Asesoría con diseñadores de interiores* → el doc deja este punto vacío (`" "`); usar el copy equivalente de `Tono de voz de marca.md` §4 ("Para justificar la visita gratuita...") en su lugar — no inventar contenido nuevo, reusar el copy ya aprobado.
3. **Portafolio Aspiracional / Acceso a `/espacios-a-medida`** — render/foto `aspect-ratio: 16/9`, hover `scale-103` en 0.8s, botón secundario hacia `/espacios-a-medida` (ruta ya existe en `page_routes.json`, no crear ruta nueva).
4. **Sección de Testimonios reales** (nueva, no está en `diseno_detalle_modulo_home.md` explícitamente pero es requisito de `Tono de voz de marca.md` §5 y del research de `AggregateRating`) — insertar entre Validación Técnica y Portafolio, o justo antes del CTA final. Ver `VetaTestimonials.tsx` abajo.
5. **CTA Final** — mantener el patrón actual (ya alineado con el tono de marca), solo migrar paleta.

No mantener el bloque `Espacios Destacados Pitch` actual (Cocinas/Cavas con Unsplash) tal cual: sustituir las imágenes de stock por el patrón "Portafolio Aspiracional" del punto 3, o dejarlo como sub-sección del portafolio si el ejecutor decide que aporta valor — pero las imágenes deben ser reales del proyecto, no placeholders de Unsplash, antes de ir a producción (dejar comentario `TODO: reemplazar por asset real` si no hay fotos disponibles todavía, no bloquear el resto de la reconstrucción por esto).

## 4. `VetaTestimonials.tsx` (nuevo)

```tsx
'use client'
import { useAppState } from '@/context/AppContext'
import { Star } from 'lucide-react'

export default function VetaTestimonials() {
  const { data } = useAppState()
  const testimonios = (data['testimonios'] || [])
    .filter((t: any) => t.data?.destacado)
    .slice(0, 6)

  if (testimonios.length === 0) return null // nunca inventar reseñas de relleno

  return (
    <section className="py-24 veta-bg-linen">
      {/* grid .veta-grid-auto, cada card .veta-glass-card-light con nombre_cliente, barrio, texto_resena, calificacion en estrellas (lucide Star) */}
    </section>
  )
}
```

Regla dura: si `testimonios` está vacío, la sección **no se renderiza** — nunca placeholder tipo "Próximamente reseñas" ni datos de ejemplo hardcodeados (viola la regla de `plan_json_ld_dinamico.md` §D sobre no falsificar `Review`).

## 5. `VetaHeader.tsx` / `VetaFooter.tsx`

- Cambiar `veta-glass-navbar` → `veta-glass-navbar-light` en el header; ajustar clases de texto de `text-[#F5F5F5]`/`text-[#8E8A80]` (hardcoded) a los nuevos tokens vía utilidades Tailwind arbitrarias `text-[hsl(var(--veta-text-carbon))]` o clases CSS dedicadas — mantener la lectura de `configuracion_comercial` vía `getConfigVal` intacta (ya es el patrón correcto, no tocar esa lógica).
- **Footer, corregir NAP** (línea ~118): reemplazar `<span>Medellín, Colombia</span>` hardcodeado por lectura dinámica de `configuracion_comercial`:
  ```tsx
  const direccionTaller = getConfigVal('direccion_taller', 'Bogotá D.C., Colombia')
  ...
  <span>{direccionTaller}</span>
  ```
  Esto asegura que el footer, el header (si aplica) y el JSON-LD (`06_PLAN_SEO_TECNICO.md`) lean siempre el mismo dato desde `configuracion_comercial`, nunca un hardcode paralelo.

## 6. `VetaAgendar.tsx`

Migrar paleta al tema claro siguiendo el mismo patrón de tokens. El resto de la reestructuración funcional (paso 2 del embudo, GCLID, WhatsApp) se especifica en `05_PLAN_EMBUDO_ARQUITECTURA.md` — no duplicar esa lógica aquí, solo la capa visual.
