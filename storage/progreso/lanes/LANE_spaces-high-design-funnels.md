# LANE: Espacios High-Design Conversion Funnels

**Estado**: 🔄 Planificación → Ejecución  
**Modelador**: Opus 4.5 (arquitectura + supervisión)  
**Diseñador**: Haiku 4.5 (componentes únicos + high design)  
**Inicio**: 2026-07-29

---

## 🎯 Objetivo Terminal

Cada página de espacio es un **embudo de conversión único** con:
- ✅ **Diseño High-Design**: Moderno, rompe estándares, memorable
- ✅ **Personalizado por categoría**: Cocinas ≠ Closets ≠ Cavas (no template genérico)
- ✅ **Conversion-focused**: CTAs estratégicos, psychology patterns, urgencia
- ✅ **Datos desde storage/**: Pero componentes únicos por categoría
- ✅ **Haiku full creative**: Libertad total en diseño visual

**KPI**: +60% tasa de lead capture. Cada página es una **experiencia única**

---

## 🎨 Filosofía de Diseño

### **NO QUEREMOS**
- ❌ Template genérico reutilizable
- ❌ Secciones estándar (Hero → Gallery → CTA)
- ❌ Diseño flat/corporativo tradicional
- ❌ "Copy-paste" entre categorías

### **QUEREMOS**
- ✅ **Cocinas**: Lujo, precisión, tecnología. Diseño aspiracional.
- ✅ **Closets**: Organización, orden, transformación. Diseño funcional-elegante.
- ✅ **Cavas**: Experiencia social, sofisticación, preservación. Diseño immersive.
- ✅ **Recibidores**: Bienvenida, primera impresión, elegancia. Diseño welcoming.
- ✅ **Entretenimiento**: Fiesta, diversión, conexión. Diseño vibrant.
- ✅ **Estudios**: Productividad, focus, comfort. Diseño zen.

Cada uno con **paleta única**, **micro-interactions únicas**, **storytelling único**.

---

## 📐 Arquitectura: Datos Estáticos + Componentes Creativos

```
storage/site-content/espacios/cocinas/
  ├── metadata.json               ← Datos: imágenes, testimonios, CTAs
  ├── cocina-1.jpg
  ├── cocina-1.meta.json
  └── [... más imágenes]

src/components/specialized/spaces/
  ├── CochinasPage.tsx            ← Diseño ÚNICO para cocinas (Haiku)
  ├── ClosetsPage.tsx             ← Diseño ÚNICO para closets (Haiku)
  ├── CavasPage.tsx               ← Diseño ÚNICO para cavas (Haiku)
  ├── RecibidoresPage.tsx         ← Diseño ÚNICO para recibidores (Haiku)
  ├── EntretenimientoPage.tsx     ← Diseño ÚNICO para entretenimiento (Haiku)
  └── EstudiosPage.tsx            ← Diseño ÚNICO para estudios (Haiku)

src/data/spaces/
  ├── data-cocinas.ts             ← Datos (imágenes, testimonios, etc.)
  ├── data-closets.ts
  ├── data-cavas.ts
  ├── data-recibidores.ts
  ├── data-entretenimiento.ts
  └── data-estudios.ts

src/app/cocinas-integrales-bogota/
  └── page.tsx                    ← Simplemente: <CochinasPage data={data} />
```

---

## 🎬 Design Briefs por Categoría (Haiku inspira en estos)

### **COCINAS: "La Precisión del Lujo"**
**Emociones**: Aspiración, precisión, sofisticación, tecnología  
**Color**: Negros + grises + dorados. Mínimalista luxury.  
**Componentes únicos**:
- Hero: Video de proceso de fabricación (fabricación artesanal)
- Slider: Imágenes full-width con zoom interactivo
- Section: "3 Niveles de Personalización" (card flip 3D)
- CTAs: "Ver en 3D" → "Agendar consulta de diseño"
- Micro-interactions: Hover → revelar detalles de materiales
- Social proof: Timeline de proyectos completados (scrollytelling)
- Cierre: "Cocina única, para ti único" (emotional)

### **CLOSETS: "Orden Que Transforma"**
**Emociones**: Organización, libertad, transformación personal  
**Color**: Tonos cálidos (beige, caramelo) + verde menta. Organized luxury.  
**Componentes únicos**:
- Hero: Before/After slider interactivo (reveal effect)
- Section: "4 Estilos de Vida" (grid con animation on scroll)
- Feature: "Organización Inteligente" (interactive configurator básico)
- CTAs: "Descubrir mi estilo" → "Medir mi closet"
- Testimonios: Video testimonials (transformación visual)
- Cierre: Calcular costo estimado (engagement tool)

### **CAVAS: "Preservar Experiencias"**
**Emociones**: Sofisticación, colección, experiencia social  
**Color**: Vino tinto + dorados + espejo/vidrio. Luxury immersive.  
**Componentes únicos**:
- Hero: Parallax efecto de botellas (immersive)
- Galería: Masonry con overlays de info de vino
- Section: "Temperatura de Perfecta" (animated infographic)
- Feature: "Arquitectura de Almacenamiento" (3D carousel conceptual)
- CTAs: "Simular mi cava" → "Reservar demostración"
- Testimonios: Historias de coleccionistas (text + foto + cita destacada)
- Cierre: "Tu colección, preservada perfectamente"

### **RECIBIDORES: "Primera Impresión Perfecta"**
**Emociones**: Bienvenida, elegancia, primer vistazo  
**Color**: Neutros sofisticados + toque de acento. Welcome aesthetic.  
**Componentes únicos**:
- Hero: Animated door opening (reveal)
- Section: "5 Momentos" (horizontal scroll story)
- Feature: "Espejo Perfecto" (mirror effect demo)
- CTAs: "Inspirarme" → "Diseño personal"
- Social proof: Fotos de clientela (subtle luxury)
- Cierre: "Tu entrada, tu firma personal"

### **ENTRETENIMIENTO: "Centro de Conexión"**
**Emociones**: Diversión, reunión, energy, modernidad  
**Color**: Vibrante + gradients. Energetic luxury.  
**Componentes únicos**:
- Hero: Animated party scene (fun, dynamic)
- Galería: Video gallery + image gallery (mixed media)
- Section: "Modulos de Entretenimiento" (animated card stack)
- Features: Sound system integration, lighting, seating (interactive)
- CTAs: "Diseñar fiesta perfecta" → "Consulta tech"
- Testimonios: Party stories (fun, energetic tone)
- Cierre: "Tu centro, tu vibe"

### **ESTUDIOS: "Productividad + Serenidad"**
**Emociones**: Focus, calma, eficiencia, comfort  
**Color**: Tonos neutrales + azul-verde. Zen productivity.  
**Componentes únicos**:
- Hero: Calm workspace scene (meditative animation)
- Section: "Ergonomía Perfecta" (interactive checklist)
- Feature: "Iluminación Natural" (adaptive lighting explanation)
- CTAs: "Test ergonomía" → "Diseño funcional"
- Testimonios: Productivity stories (before/after tales)
- Cierre: "Espacio que inspira, enfoca y calma"

---

## 🔧 Estructura Técnica (Data-Driven pero Design-Creative)

### Cada página sigue este patrón:

```typescript
// src/components/specialized/spaces/CochinasPage.tsx

interface CochinasPageProps {
  data: {
    title: string
    description: string
    images: SeoImageData[]
    testimonials: TestimonialItem[]
    ctaConfig: CTAConfig
    socialProofStats: SocialProofStats
    // ... más datos de storage/
  }
}

export default function CochinasPage({ data }: CochinasPageProps) {
  return (
    <div className="cocinas-page">
      {/* DISEÑO ÚNICO para cocinas */}
      
      <HeroWithVideoProcess images={data.images} />
      {/* Haiku custom design */}
      
      <FullWidthImageSlider images={data.images} />
      {/* Haiku custom component */}
      
      <PersonalizationLevels />
      {/* Haiku creative interaction */}
      
      <MaterialsDeepDive />
      {/* Haiku immersive section */}
      
      <ScrollytellingTimeline projects={data.socialProofStats} />
      {/* Haiku storytelling component */}
      
      <TestimonialShowcase testimonials={data.testimonials} />
      {/* Haiku emotional connection */}
      
      <CTAEmotional cta={data.ctaConfig} message="Cocina única, para ti único" />
      {/* Haiku conversion moment */}
    </div>
  )
}
```

**Key**: Cada componente es **original para esa categoría**. No hay reutilización entre páginas.

---

## 🎨 Design Patterns (Haiku puede usar estos)

### **1. Parallax + Hover Reveals**
- Imágenes que revelan detalles al hover
- Parallax speed variado por capa
- Animaciones on scroll

### **2. Before/After Sliders**
- Closets: antes vs. después organizado
- Entretenimiento: sin vs. con diseño

### **3. 3D Conceptual Carousels**
- Cavas: visualizar arquitectura interna
- Cocinas: rotación de módulos

### **4. Scrollytelling**
- Cocinas: Timeline de proyecto (scroll → reveal stages)
- Estudios: Jornada de productividad

### **5. Micro-Interactions**
- Buttons que responden al hover
- Inputs que animan al focus
- Cards que flip/expand

### **6. Immersive Videos**
- Hero con autoplay + mute
- Background video parallax
- Video testimonials

### **7. Typography as Design**
- Texto large + bold (editorial)
- Contrasts dinámicos
- Animate text on scroll

### **8. Color & Gradients**
- Gradients direccionales por energía
- Color psychology por emociones
- Dark/light modes contextuales

---

## 📋 Hitos de Ejecución

### **Hito 1: Diseño & Componentes** (Haiku)
```typescript
src/components/specialized/spaces/
  ├── CochinasPage.tsx             ← Única para cocinas
  ├── ClosetsPage.tsx              ← Única para closets
  ├── CavasPage.tsx                ← Única para cavas
  ├── RecibidoresPage.tsx          ← Única para recibidores
  ├── EntretenimientoPage.tsx      ← Única para entretenimiento
  └── EstudiosPage.tsx             ← Única para estudios

Plus shared utilities:
  ├── useScrollAnimation.ts        ← Animations on scroll
  ├── useParallax.ts               ← Parallax effect
  └── theme.ts                     ← CSS tokens (colors, gradients)
```

### **Hito 2: Script de Build** (Haiku)
```typescript
scripts/generate-space-pages.ts
  → Lee storage/site-content/espacios/*/metadata.json
  → Genera data files tipados
  → Importa componentes específicos de cada categoría
```

### **Hito 3: Páginas SSG** (Haiku)
```typescript
src/app/cocinas-integrales-bogota/page.tsx
  → import CochinasPage from '@/components/specialized/spaces/CochinasPage'
  → import data from '@/data/spaces/data-cocinas'
  → export default () => <CochinasPage data={data} />

[Similar para todas las otras categorías]
```

### **Hito 4: Validación Opus** 
- Diseño rompe estándares ✓
- Componentes únicos ✓
- Conversión-focused ✓
- SEO completo ✓
- Build exitoso ✓

---

## 📊 Tabla de Tareas

| Página | Diseño | Owner | Componentes Únicos |
|--------|--------|-------|-------------------|
| Cocinas | Luxury + Precisión | Haiku | HeroVideo, ImageSlider, Personalization3D, MaterialsDeepDive, Scrollytelling |
| Closets | Organized Transformation | Haiku | BeforeAfterSlider, LifestyleGrid, ConfiguratorBasic, VideoTestimonials |
| Cavas | Immersive Preservation | Haiku | ParallaxHero, MasonryGallery, TempInfographic, 3DCarousel |
| Recibidores | Welcoming Elegance | Haiku | DoorOpenAnimation, HorizontalStory, MirrorEffect, SocialProof |
| Entretenimiento | Energetic Connection | Haiku | AnimatedParty, MixedMediaGallery, CardStack, TechIntegration |
| Estudios | Zen Productivity | Haiku | MeditativeHero, ErgonomicChecklist, LightingDemo, ProductivityStories |

---

## 🎓 Principios de Diseño (Para Haiku)

1. **No copiar entre categorías**: Cada página es nueva
2. **Color psychology**: Paleta única por emoción/categoría
3. **Conversion moments**: CTAs aparecen en momentos psicológicos óptimos
4. **Mobile-first but ambitious**: No simplificar para mobile, adaptar creativamente
5. **Performance**: Animaciones suave (GPU-accelerated)
6. **Accesibility**: Alt text, focus states, keyboard navigation
7. **Storytelling**: Cada página cuenta una historia diferente
8. **Emotion over info**: El diseño comunica sentimientos primero

---

## ✅ Checklist Haiku

- [ ] 6 pages, 6 diseños únicos (no template)
- [ ] Cada página con 5+ componentes personalizados
- [ ] Micro-interactions fluidas (Framer Motion? CSS animations?)
- [ ] Color palettes únicos por categoría
- [ ] CTAs estratégicos en conversion moments
- [ ] Mobile responsive (sin perder diseño)
- [ ] Performant (Lighthouse 90+)
- [ ] Accesible (WCAG AA)
- [ ] JSON-LD inyectado automáticamente
- [ ] Build exitoso

---

## 🚀 Ejecución

**¿Listo para que Haiku diseñe 6 embudos únicos de conversión?** ✅

Haiku tiene libertad creativa total. Solo restricción: datos vienen de `storage/` (no hardcodeados).

**Aprobado?**
