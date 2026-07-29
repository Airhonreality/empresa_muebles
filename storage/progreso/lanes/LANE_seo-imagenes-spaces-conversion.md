# LANE: SEO Imágenes + Spaces Conversion-Focused

**Estado**: 🔄 Planificación → Ejecución  
**Modelador**: Opus 4.5 (planificación + supervisión)  
**Ejecutores**: Haiku 4.5 (implementación operativa)  
**Inicio**: 2026-07-29

---

## 🎯 Objetivo Terminal

Diseñar e implementar **páginas estáticas de espacios** (`/cocinas-integrales-bogota/`) con:
- Galería hero optimizada visualmente
- Metadatos SEO completamente automatizados (LLM)
- CTAs y formas conversion-focused
- JSON-LD incrustado automáticamente
- Captura de leads estratégica

**KPI**: +40% tasa de lead capture vs. portafolio dinámico

---

## 📋 Hito 1: LLM Helper para Metadatos SEO

### Especificación
**Archivo**: `src/lib/llm/seo-metadata-generator.ts`

Función que:
```typescript
async function generateSeoMetadata(input: {
  imageFile: File | string  // URL o archivo
  basicDescription: string  // Ej: "Cocina blanca con mármol"
  category: 'cocinas' | 'closets' | 'cavas' | 'recibidores'
  location?: string         // Ej: "Bogotá"
}): Promise<SeoImageData>
```

**Llamadas LLM**:
1. Vision → Analizar imagen + descripción
2. Text → Generar alt_text (125-150 chars)
3. Text → Generar keywords (8-10)
4. Text → Generar descripción comercial

**Salida**:
```typescript
{
  alt_text: "Cocina integral moderna en Bogotá...",
  image_title: "Cocina Integral Blanca con Mármol - Bogotá",
  keywords: "cocina integral, muebles cocina, ...",
  imagen_filename: "cocina-integral-bogota-1.jpg",
  descripcion: "Cocina premium con gabinetes blancos..."
  structured_data: {JSON-LD}
}
```

**Owner**: Haiku (src/lib/llm/)

---

## 📋 Hito 2: Componente SpaceShowcasePage

### Especificación
**Archivo**: `src/components/specialized/spaces/SpaceShowcasePage.tsx`

Componente reutilizable que recibe:
```typescript
interface SpaceShowcaseProps {
  categoryId: 'cocinas' | 'closets' | 'cavas' | 'recibidores'
  title: string
  description: string
  images: SeoImageData[]
  testimonials?: TestimonialItem[]
  ctaConfig?: {
    whatsappLink?: string
    calendarLink?: string
    emailLink?: string
  }
}
```

**Secciones del Componente**:

1. **Hero Section** (60% viewport)
   - Galería slider con imagen principal
   - Overlay con título + CTA primario
   - Breadcrumb SEO

2. **Social Proof** (200px)
   - Proyectos completados: "500+"
   - Clientes satisfechos: "350+"
   - Años experiencia: "15+"

3. **Galería de Imágenes** (Masonry grid)
   - 2-3 columnas responsive
   - Hover effects → zoom + caption
   - Cada imagen con alt_text + structured_data en `<img>`

4. **Descripción Comercial** (400-600px)
   - Párrafo principal
   - Lista de beneficios (bullets)
   - CTA secundario

5. **Testimonios** (3-4 rotativas)
   - Avatar + cita + cliente
   - Rating 5 estrellas

6. **CTA Section** (Sticky o flotante)
   - Botón WhatsApp (primary)
   - Botón Agendar (secondary)
   - Email link (tertiary)

7. **JSON-LD Inyectado** en `<head>`
   - schema.org/LocalBusiness (empresa)
   - schema.org/BreadcrumbList (ruta)
   - schema.org/ImageGallery (imágenes)

**Owner**: Haiku (src/components/specialized/spaces/)

---

## 📋 Hito 3: Páginas Estáticas de Espacios

### Especificación
**Archivos**:
- `src/app/cocinas-integrales-bogota/page.tsx`
- `src/app/closets-vestidores-bogota/page.tsx`
- `src/app/cavas-y-bares/page.tsx`
- `src/app/consolas-recibidores/page.tsx`

**Estructura**:
```typescript
export const dynamic = 'force-static'  // SSG

export default function CocinasPage() {
  const data = {
    categoryId: 'cocinas',
    title: "Cocinas Integrales Bogotá | Diseño Premium",
    description: "Diseñamos e instalamos cocinas personalizadas...",
    images: [/* 6 imágenes con metadatos SEO */],
    testimonials: [/* datos estáticos */],
    ctaConfig: {
      whatsappLink: "https://wa.me/...",
      calendarLink: "https://calendly.com/..."
    }
  }
  
  return (
    <SpaceShowcasePage {...data} />
  )
}
```

**Datos de Imágenes**:
- Fuente: `storage/site-content/espacios/cocinas/*.jpg`
- Metadatos: Generados por LLM en build time
- Persistencia: `imagenes_portfolio` (BD) OR `*.meta.json` (archivos)

**Owner**: Haiku (src/app/)

---

## 📋 Hito 4: Integración de Imágenes de Cocinas

### Especificación

**Flujo Manual** (for bootstrap):
1. Usuario sube 6 imágenes a PortfolioManager
2. Clic "Generar con IA" → LLM rellena metadatos
3. Guardar portfolio
4. Exportar imágenes a `storage/site-content/espacios/cocinas/`

**Automatización** (después):
- Script de build: `scripts/generate-space-pages.ts`
- Lee `storage/site-content/espacios/`
- Llama LLM para cada imagen sin metadatos
- Genera páginas SSG

**Owner**: Haiku (scripts/, storage/)

---

## 🔄 Workflow de Decisiones

### Puntos de Validación (HITL)

**Checkpoint 1 - LLM Helper** (después de Haiku completar)
- [ ] ¿Metadatos son precisos? (5-10 min lectura)
- [ ] ¿Keywords son relevantes? (chequeo visual)
- [ ] ¿Alt text cumple 125-150 chars?

**Checkpoint 2 - SpaceShowcasePage** (visual)
- [ ] ¿El diseño convierte? (CTA prominentes)
- [ ] ¿Mobile-first? (responsive)
- [ ] ¿Structured data inyectado correctamente?

**Checkpoint 3 - Integración Completa**
- [ ] ¿Imágenes cargan rápidamente?
- [ ] ¿SEO visible en head?
- [ ] ¿Leads capturados?

---

## 🗂️ Estructura de Archivos

```
src/
  lib/llm/
    seo-metadata-generator.ts          ← Haiku
  components/specialized/spaces/
    SpaceShowcasePage.tsx              ← Haiku
    SpaceShowcaseHero.tsx              ← Haiku
    SpaceGallery.tsx                   ← Haiku
  app/
    cocinas-integrales-bogota/
      page.tsx                          ← Haiku
    closets-vestidores-bogota/
      page.tsx                          ← Haiku
    [etc]

storage/
  site-content/
    espacios/
      cocinas/
        cocina-1.jpg                    ← Datos
        cocina-1.meta.json              ← LLM generado
        cocina-2.jpg
        [...]
```

---

## 📊 Tabla de Tareas (Opus Supervisa)

| Hito | Tarea | Owner | Estado | Resultado |
|------|-------|-------|--------|-----------|
| 1 | seo-metadata-generator.ts | Haiku | ⏳ | Función LLM lista |
| 2 | SpaceShowcasePage.tsx | Haiku | ⏳ | Componente conversion-focused |
| 3 | Páginas estáticas | Haiku | ⏳ | Cocinas page + 3 más |
| 4 | Integración imágenes | Haiku | ⏳ | Datos en storage/ |
| ✅ | Validación Opus | Opus | ⏳ | Checkpoints HITL completados |

---

## 🎓 Alineación Arquitectónica

**Sobre INS_Arnes agentico.md**:
- ✅ **Código como sustrato**: Todas las mutaciones de arnés en archivos versionados
- ✅ **Gobernanza**: Haiku propone, Opus valida, usuario aprueba
- ✅ **Contexto estructurado**: Metadatos en archivos `.meta.json`, no prosa libre
- ✅ **Aislamiento**: LLM llamado en build time (determinista), no en runtime
- ✅ **Reuso**: SpaceShowcasePage genérico, reutilizable por N categorías

---

## ⏱️ Timeline Estimado

| Fase | Duración | Hito |
|------|----------|------|
| Planificación | 15 min | Este documento ✓ |
| LLM Helper | 20 min | Haiku implementa seo-metadata-generator |
| UI Components | 30 min | Haiku: SpaceShowcasePage + subsecciones |
| Páginas Estáticas | 20 min | Haiku: 4 pages + data structure |
| Integración | 15 min | Haiku: Scripts + storage/ |
| **Validación Opus** | **20 min** | **Checkpoints HITL** |
| **Total** | **~2 horas** | **Conversion-focused site listo** |

---

## 🚀 Próximo: Ejecución Paralela (2 Haikus)

```
Haiku-1: src/lib/llm/ → seo-metadata-generator
Haiku-2: src/components/ → SpaceShowcasePage + páginas

Ambos en paralelo, Opus supervisa resultados
```

¿Aprobado? ✅
