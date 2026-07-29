# Audit SEO Imágenes - Implementación Completada

**Fecha**: 2026-07-29  
**Estado**: ✅ Completado  
**Objetivo**: Verificar y extender captura de metadatos SEO en portafolio de espacios

---

## Hallazgos del Audit

### Sistema Anterior (SmartImageInput)
El componente básico capturaba:
- ✅ `imagen_url` — URL de la imagen
- ✅ `descripcion` — Descripción libre
- ✅ `orden` — Posición en galería

**Faltas críticas para hyperindexación:**
- ❌ `alt_text` — Descripción para lectores de pantalla y rastreadores
- ❌ `image_title` — Metadatos de título de imagen
- ❌ `keywords` — Palabras clave del espacio/imagen
- ❌ `image_filename` — Nombre optimizado para SEO
- ❌ `structured_data` — JSON-LD schema.org/ImageObject

### Rutas de API
El endpoint `/api/upload` era agnóstico:
- Capturaba solo el archivo o URL
- No procesaba contexto SEO (espacio, categoría)
- Generaba filenames genéricos con timestamp

---

## Cambios Implementados

### 1. **Extensión de Esquema (ImagenPortfolioRecord)**
**Archivo**: `src/components/specialized/portfolio/PortfolioManager.tsx`

```typescript
type ImagenPortfolioRecord = {
  id?: string;
  portfolio_id?: string;
  imagen_url?: string;
  descripcion?: string;
  // NUEVOS CAMPOS SEO ↓
  alt_text?: string;
  image_title?: string;
  keywords?: string;
  imagen_filename?: string;
  orden?: number;
  structured_data?: Record<string, unknown>;
};
```

**Impacto**: La base de datos ahora almacena 7 campos SEO por imagen vs. 2 anteriormente.

---

### 2. **Componente SeoImageUploader**
**Archivo**: `src/components/ui/SeoImageUploader.tsx` (NUEVO)

Reemplaza `SmartImageInput` para portafolios con:

#### Generación Automática de Metadatos
```typescript
// Basado en categoría + espacio
generateFilenameSlug(spaceName, index)    // cocina-integral-1
generateAltText(spaceName, category, idx) // Descripción técnica 125-150 chars
generateStructuredData(url, title, alt)   // JSON-LD schema.org/ImageObject
```

#### UI de Edición Granular
- **Título de imagen**: Para metadatos y navegador
- **Filename SEO**: Slug optimizado para rastreadores
- **Alt Text**: Área de 125-150 caracteres con contador
- **Descripción (Caption)**: Visible en galería
- **Keywords**: Con sugerencias por categoría (ej: "cocina integral", "diseño moderno")

#### Sugerencias Contextuales
```javascript
const CATEGORY_KEYWORDS = {
  cocinas: ['cocina integral', 'muebles cocina', 'diseño cocina', ...],
  cavas_bares: ['cava', 'bar en casa', 'espejo decorativo', ...],
  dormitorios_closets: ['closet', 'guardarropa', 'diseño dormitorio', ...],
  consolas_recibidores: ['consola', 'recibidor', 'espejo de pared', ...],
}
```

Permite agregar keywords sugeridas con un clic.

#### Validación y Tips
- Contador de caracteres para alt text (ideal 125-150)
- Consejos en tiempo real sobre prácticas SEO
- Vista previa de imagen + metadatos capturados

---

### 3. **Mejora del Endpoint `/api/upload`**
**Archivo**: `src/app/api/upload/route.ts`

#### Parámetros Nuevos Aceptados
```typescript
// Formulario multipart o JSON
space_name: string  // Ej: "Cocina Integral Bogotá"
category: string    // Ej: "cocinas"
```

#### Optimización de Filename
**Antes:**
```
1722300445-cocina-blanca.jpg  // timestamp + nombre limpio
```

**Después (con contexto SEO):**
```
cocina-integral-1722300445.jpg  // espacio-categoria-timestamp
```

Mejora: Filenames ahora contienen keywords naturales, SEO-amigables.

#### Función Auxiliar
```typescript
function normalizeForFilename(text: string): string {
  // Remover acentos, espacios, caracteres especiales
  // Devuelve: "cocina-integral-bogota"
}
```

---

### 4. **Integración en PortfolioManager**
**Cambios**:
- Reemplazó `SmartImageInput` con `SeoImageUploader`
- Pasa `spaceCategoryId` y `spaceName` al componente
- Guarda 7 campos SEO en lugar de 2
- Persiste `structured_data` como JSON-LD

**Código simplificado**:
```typescript
<SeoImageUploader
  value={imagenesList}
  onChange={setImagenesList}
  spaceCategoryId={form.categoria_espacio}
  spaceName={form.titulo || 'Espacio'}
/>
```

---

### 5. **Documentación SEO**
**Archivo**: `storage/fork_doc/GUIA_SEO_IMAGENES_ESPACIOS.md` (NUEVO)

Guía completa con:
- Estructura de metadatos por categoría (cocinas, closets, cavas, recibidores)
- Ejemplos de filenames optimizados
- Alt text de 125-150 caracteres con casos de uso
- Palabras clave sugeridas (8-10 por categoría)
- Descriptions comerciales con narrativa
- JSON-LD automático (schema.org/ImageObject)
- Checklist previo a guardar
- Impacto esperado en SEO tradicional + LLMs

---

## Flujo de Uso Completo

### Para Agregar Imágenes de Cocina

1. **Crear Portfolio**
   - Título: "Cocina Integral Blanca con Mármol"
   - Categoría: "cocinas"
   - Descripción comercial: Contexto del proyecto

2. **Subir Imágenes**
   - SeoImageUploader genera automáticamente:
     - Filename: `cocina-integral-blanca-marmol-1.jpg`
     - Alt text: "Cocina integral moderna en Bogotá con gabinetes blancos, backsplash de mármol gris y encimera de granito negro pulido"
     - Title: "Cocina Integral Blanca con Mármol"
     - Keywords sugeridos: "cocina integral, muebles cocina, diseño moderno, bogotá, granito, backsplash..."

3. **Editar Metadatos** (opcional)
   - Clic en "Editar metadatos"
   - Ajustar alt text, keywords, descripción según necesidad
   - Agregar keywords con botones de sugerencia

4. **Guardar Portfolio**
   - Se persisten todos los campos SEO en base de datos
   - JSON-LD incrustado automáticamente

---

## Impacto en Hyperindexación

### Motores de Búsqueda Tradicionales
- **Filename**: Crawleable, contiene keywords naturales
- **Alt Text**: Fallback cuando imagen no carga, influencia directa SEO
- **Keywords**: Contexto semántico para Googlebot
- **JSON-LD**: Structured data para Rich Snippets

### LLMs y AI
- **Alt Text**: Vision models leen descripción técnica
- **Structured Data**: JSON-LD proporciona metadatos legibles
- **Keywords**: Ayuda a LLMs asociar proyectos similares
- **Filename**: Contribuye a asociación semántica

**Ejemplo**: ChatGPT lee imagen + metadatos → puede recomendarte "cocinas similares" con mayor precisión

---

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/components/ui/SeoImageUploader.tsx` | ✨ NUEVO - Componente de upload con SEO |
| `src/app/api/upload/route.ts` | 🔧 Aceptar space_name/category, optimizar filename |
| `src/components/specialized/portfolio/PortfolioManager.tsx` | 🔧 Extender ImagenPortfolioRecord, integrar SeoImageUploader |
| `storage/fork_doc/GUIA_SEO_IMAGENES_ESPACIOS.md` | ✨ NUEVO - Guía de prácticas SEO |
| `storage/fork_doc/AUDIT_SEO_IMAGENES_IMPLEMENTACION.md` | ✨ NUEVO - Este documento |

---

## Próximos Pasos

1. **Prueba con Imágenes de Cocinas**
   - Sube las 6 imágenes de cocinas proporcionadas
   - Verifica que metadatos se generen automáticamente
   - Ajusta alt text / keywords según necesidad

2. **Integración en Páginas Estáticas**
   - Las imágenes deben renderizarse en `/app/cocinas-integrales-bogota/`
   - Estructura de datos permite inyectar JSON-LD en `<head>`

3. **Validación SEO**
   - Google Search Console: Verificar indexación de imágenes
   - Ahrefs/SEMrush: Auditar alt text, filenames, structured data
   - Claude Vision: Enviar URL a LLM, verificar que lo recomienda

4. **Expansión a Otras Categorías**
   - Closets & Dormitorios
   - Cavas & Bares
   - Consolas & Recibidores
   - "Otros"

---

## Checklist Final

- [x] Extender schema ImagenPortfolioRecord con 7 campos SEO
- [x] Crear SeoImageUploader con generación automática
- [x] Mejorar /api/upload para aceptar contexto SEO
- [x] Integrar en PortfolioManager
- [x] Documentar guía de prácticas SEO por categoría
- [x] Generar ejemplos de filenames, alt text, keywords
- [ ] Prueba con imágenes reales (próximo paso: cocinas)
- [ ] Validación en motores de búsqueda
- [ ] Monitoreo de rankings
