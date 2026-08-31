# LANE: Páginas Estáticas de Espacios (Contenido Puro)

**Estado**: 🔄 Planificación  
**Modelador**: Opus 4.5 (planificación + supervisión)  
**Ejecutores**: Haiku 4.5 (implementación operativa)  
**Inicio**: 2026-07-29

---

## 🎯 Objetivo Terminal

Implementar sistema **100% estático** para páginas de espacios:
- ✅ Imágenes organizadas en `storage/site-content/`
- ✅ Metadatos (alt text, keywords) definidos manualmente o con LLM
- ✅ **CERO conexión a BD** (no portfolio_publico, no imagenes_portfolio)
- ✅ Build-time SSG: Script lee storage/ → genera páginas
- ✅ Reutilizable: cocinas, closets, cavas, recibidores, entretenimiento, estudios

**KPI**: Páginas estáticas indexables, SEO optimizadas, conversion-focused

---

## 📂 Arquitectura de Storage

```
storage/site-content/
  espacios/
    cocinas/
      metadata.json                    ← Config de página
      cocina-integral-blanca-1.jpg
      cocina-integral-blanca-1.meta.json
      cocina-integral-blanca-2.jpg
      cocina-integral-blanca-2.meta.json
      cocina-integral-blanca-3.jpg
      cocina-integral-blanca-3.meta.json
      [... más imágenes]
    
    closets/
      metadata.json
      closet-modular-bogota-1.jpg
      closet-modular-bogota-1.meta.json
      [... más imágenes]
    
    cavas/
      metadata.json
      [... imágenes + metadatos]
    
    recibidores/
      metadata.json
      [... imágenes + metadatos]
    
    entretenimiento/
      metadata.json
      [... imágenes + metadatos]
    
    estudios/
      metadata.json
      [... imágenes + metadatos]
```

---

## 📋 Estructura de Archivos de Metadata

### `metadata.json` (por categoría)
Define la **página completa**:

```json
{
  "categoryId": "cocinas",
  "title": "Cocinas Integrales Bogotá | Diseño Premium a Medida",
  "subtitle": "Diseño personalizado, fabricación de precisión, instalación profesional",
  "description": "Diseñamos, fabricamos e instalamos cocinas integrales personalizadas...",
  "descriptionExtended": "Párrafo largo con más detalles comerciales...",
  "slug": "cocinas-integrales-bogota",
  "route": "/cocinas-integrales-bogota",
  "ogImage": "/cocinas/cocina-integral-blanca-1.jpg",
  "benefits": [
    "Diseño personalizado a tu espacio",
    "Materiales premium de importación",
    "Fabricación en taller prpio",
    "Instalación profesional garantizada"
  ],
  "socialProofStats": {
    "projectsCompleted": 500,
    "satisfiedClients": 350,
    "yearsExperience": 15
  },
  "processNote": "De la idea a la realidad en 8-12 semanas",
  "ctaConfig": {
    "whatsappLink": "https://wa.me/...",
    "calendarLink": "https://calendly.com/...",
    "emailLink": "mailto:..."
  },
  "testimonials": [
    {
      "name": "María García",
      "role": "Propietaria, Usaquén",
      "text": "La cocina quedó exactamente como la imaginaba...",
      "rating": 5
    }
  ],
  "images": [
    {
      "filename": "cocina-integral-blanca-1.jpg",
      "metaFile": "cocina-integral-blanca-1.meta.json"
    },
    {
      "filename": "cocina-integral-blanca-2.jpg",
      "metaFile": "cocina-integral-blanca-2.meta.json"
    }
  ]
}
```

### `{imagen}.meta.json` (por imagen)
Define **metadatos SEO de cada imagen**:

```json
{
  "alt_text": "Cocina integral moderna en Bogotá con gabinetes blancos, backsplash de mármol gris y encimera de granito negro pulido",
  "image_title": "Cocina Integral Blanca con Mármol - Bogotá | Veta Dorada",
  "keywords": [
    "cocina integral",
    "muebles cocina",
    "diseño bogotá",
    "backsplash mármol",
    "cocina premium",
    "gabinetes blancos",
    "encimera granito",
    "fabricación personalizada"
  ],
  "descripcion": "Cocina integral de diseño moderno con superficies continuas que optimizan cada centímetro. Fabricada en materiales premium con instalación profesional.",
  "structured_data": {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "name": "Cocina Integral Blanca con Mármol",
    "description": "Cocina de precisión con gabinetes continuos y acabados premium",
    "inLanguage": "es-CO"
  }
}
```

---

## 🔄 Flujo de Trabajo

### **Paso 1: Usuario Organiza Imágenes**
```bash
# Usuario coloca en storage/:
storage/site-content/espacios/cocinas/
  ├── cocina-integral-blanca-1.jpg
  ├── cocina-integral-blanca-2.jpg
  ├── cocina-integral-blanca-3.jpg
  └── [... más imágenes]
```

### **Paso 2: Usuario Define Metadatos (Opción A - Manual)**
Crea `{imagen}.meta.json` para cada imagen:
```json
{
  "alt_text": "...",
  "image_title": "...",
  "keywords": [...],
  "descripcion": "..."
}
```

### **Paso 2B: Generación Automática (Opción B - LLM)**
Script de build detecta imágenes sin `.meta.json`:
```bash
npm run build

→ Script detecta: cocina-integral-blanca-1.jpg (SIN .meta.json)
→ Llama generateSeoMetadata() (LLM helper)
→ Genera cocina-integral-blanca-1.meta.json automáticamente
→ Continúa build SSG
```

### **Paso 3: Define metadata.json (Página Completa)**
Una sola vez por categoría:
```json
{
  "categoryId": "cocinas",
  "title": "...",
  "slug": "cocinas-integrales-bogota",
  "images": [
    { "filename": "cocina-integral-blanca-1.jpg", "metaFile": "..." },
    { "filename": "cocina-integral-blanca-2.jpg", "metaFile": "..." }
  ],
  "testimonials": [...],
  "ctaConfig": {...}
}
```

### **Paso 4: Build SSG**
```bash
npm run build

→ Script: scripts/generate-space-pages.ts
  ├─ Lee storage/site-content/espacios/*/metadata.json
  ├─ Para cada imagen sin .meta.json: genera automáticamente (LLM)
  ├─ Carga imagenes desde storage/
  ├─ Genera datos tipados
  └─ SpaceShowcasePage renderiza con datos

→ Resultado:
  /cocinas-integrales-bogota/        ✅ Prerendered static
  /closets-vestidores-bogota/        ✅ Prerendered static
  /cavas-y-bares/                    ✅ Prerendered static
  /consolas-recibidores/             ✅ Prerendered static
  /entretenimiento/                  ✅ Prerendered static
  /estudios-home-office/             ✅ Prerendered static
```

---

## 🛠️ Implementación Requerida

### **Hito 1: Script de Build** (Haiku)
**Archivo**: `scripts/generate-space-pages.ts`

```typescript
async function generateSpacePages() {
  const categories = ['cocinas', 'closets', 'cavas', 'recibidores', 'entretenimiento', 'estudios'];
  
  for (const category of categories) {
    // 1. Lee metadata.json de storage/site-content/espacios/{category}/
    const pageMetadata = await readJson(`storage/site-content/espacios/${category}/metadata.json`);
    
    // 2. Para cada imagen en pageMetadata.images:
    for (const img of pageMetadata.images) {
      // 3. Lee {imagen}.meta.json si existe
      let imageMeta = await readJson(`storage/site-content/espacios/${category}/${img.metaFile}`);
      
      // 4. Si NO existe: Llama generateSeoMetadata() (LLM)
      if (!imageMeta) {
        const imagePath = `storage/site-content/espacios/${category}/${img.filename}`;
        imageMeta = await generateSeoMetadata({
          imageFile: imagePath,
          basicDescription: pageMetadata.title,
          category: category as SpaceCategory,
          location: 'Bogotá'
        });
        
        // 5. Guarda .meta.json generado
        await writeJson(`storage/site-content/espacios/${category}/${img.metaFile}`, imageMeta);
      }
    }
    
    // 6. Genera archivo de datos tipado
    const spaceData = {
      ...pageMetadata,
      images: pageMetadata.images.map(img => ({
        imagen_url: `/site-content/espacios/${category}/${img.filename}`,
        ...imageMeta  // alt_text, keywords, etc.
      }))
    };
    
    // 7. Escribe src/data/spaces/data-{category}.ts
    await generateDataFile(category, spaceData);
  }
}
```

### **Hito 2: Actualizar Páginas SSG** (Haiku)
**Archivos**: `src/app/{route}/page.tsx`

```typescript
// Cambiar DE:
const cocinasImages: SeoImageData[] = [
  { imagen_filename: 'cocina-1.jpg', ... }  // ❌ Hardcodeado
];

// Cambiar A:
import { images, ...pageData } from '@/data/spaces/data-cocinas';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: pageData.title,
    description: pageData.description,
    ogImage: pageData.ogImage,
    canonical: `https://vetadeoro.co${pageData.route}`
  });
}

export default function CoccinasPage() {
  return (
    <SpaceShowcasePage
      categoryId={pageData.categoryId}
      title={pageData.title}
      description={pageData.description}
      images={images}
      testimonials={pageData.testimonials}
      ctaConfig={pageData.ctaConfig}
    />
  );
}
```

### **Hito 3: Copiar Assets** (Haiku)
Script que copia imágenes a `public/`:
```bash
scripts/sync-space-assets.ts:
  storage/site-content/espacios/*/[*.jpg|*.png] 
  → public/site-content/espacios/*/
```

---

## 📊 Tabla de Tareas

| Hito | Tarea | Owner | Archivo(s) |
|------|-------|-------|-----------|
| 1 | Script generate-space-pages.ts | Haiku | scripts/generate-space-pages.ts |
| 2 | Actualizar 6 pages SSG | Haiku | src/app/{route}/page.tsx |
| 3 | Sync assets públicos | Haiku | scripts/sync-space-assets.ts |
| 4 | storage/site-content/espacios/ | Usuario | storage/site-content/ |

---

## 📋 Flujo de Usuario (Bootstrap)

```
1. Usuario prepara 6 imágenes de cocinas
   ↓
2. Coloca en: storage/site-content/espacios/cocinas/
   ├── cocina-1.jpg
   ├── cocina-2.jpg
   └── cocina-3.jpg
   ↓
3. OPCION A - Manual:
   Crea {imagen}.meta.json para cada una
   ↓
3. OPCION B - Automático:
   Corre: npm run build
   Script detecta sin metadatos → LLM genera automáticamente
   ↓
4. Crea storage/site-content/espacios/cocinas/metadata.json
   (una sola vez con título, descripción, testimonios, CTAs)
   ↓
5. npm run build
   → Generate-space-pages.ts lee storage/
   → Genera datos tipados
   → SSG renderiza /cocinas-integrales-bogota/
   ↓
6. ✅ LIVE
```

---

## 🔐 Separación Limpia: Espacios vs. Portafolio

| Aspecto | Espacios Estáticos | Portafolio Dinámico |
|--------|-------------------|-------------------|
| **Ubicación datos** | `storage/site-content/espacios/` | BD (`portfolio_publico`, `imagenes_portfolio`) |
| **Contenido** | Guías/educación sobre tipos de espacios | Casos reales de proyectos finalizados |
| **Gestión** | Archivos JSON + imágenes | PortfolioManager UI |
| **Renderización** | SSG build-time | SSR/dinámico runtime |
| **Rutas** | `/cocinas-integrales-bogota/` etc. | `/portafolio/` |
| **LLM Helper** | Opcional (build-time) | Integrado en PortfolioManager (runtime) |
| **Conexión BD** | ❌ NINGUNA | ✅ Sí |

---

## ✅ Checklist de Implementación

- [ ] Crear estructura `storage/site-content/espacios/` con 6 categorías
- [ ] Implementar `scripts/generate-space-pages.ts`
- [ ] Actualizar 6 páginas SSG para leer desde data files
- [ ] Implementar `scripts/sync-space-assets.ts`
- [ ] Test build: `npm run build` con imágenes reales
- [ ] Verificar `/cocinas-integrales-bogota/` con datos reales (no hardcodeado)
- [ ] Verificar JSON-LD en `<head>`
- [ ] Validación Opus: checkpoints HITL

---

## 🎓 Filosofía de Diseño

✅ **Contenido estático**: No toca BD  
✅ **Metadatos reutilizables**: Misma estructura para todas las categorías  
✅ **Build-time automation**: LLM genera si faltan metadatos  
✅ **Escalabilidad**: Agregar closets/cavas es solo copiar imágenes + metadata.json  
✅ **Separación clara**: Espacios ≠ Portafolio  

---

**Estado**: 🔄 Esperando aprobación para ejecución paralela (Haiku x1-2)
