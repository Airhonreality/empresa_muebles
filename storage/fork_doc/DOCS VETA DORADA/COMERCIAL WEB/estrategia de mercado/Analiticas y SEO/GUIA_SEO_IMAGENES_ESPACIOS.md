# Guía de SEO para Imágenes de Espacios - Hiperindexación

Optimización de imágenes para obtener máxima visibilidad tanto en motores de búsqueda tradicionales como en LLMs y sistemas de IA.

## Estructura de Metadatos por Categoría

Cada imagen requiere 5 niveles de metadatos:

### 1. **Filename (Nombre de archivo)**
Visible en URL, crawleable, influencia SEO directo.

**Formato**: `{espacio}-{tipo}-{ubicación}-{numero}.jpg`

**Ejemplos por categoría:**

#### Cocinas
```
cocina-integral-bogota-blanca-marmol-1.jpg
cocina-moderna-minimalista-funcional-2.jpg
cocina-clasica-madera-caoba-3.jpg
```
**Keywords**: cocina integral, muebles cocina, diseño cocina, backsplash, island, cabinets

#### Closets & Dormitorios
```
closet-bogota-puertas-espejo-3d-1.jpg
guardarropa-modular-dormitorio-2.jpg
vestidor-lujo-iluminacion-led-3.jpg
```
**Keywords**: closet bogota, guardarropa, vestidor, organización, dormitorio

#### Cavas & Bares
```
cava-temperatura-control-cristal-1.jpg
bar-home-madera-iluminacion-2.jpg
barra-granito-taburetes-cristal-3.jpg
```
**Keywords**: cava, bar en casa, mueble bar, espejo decorativo, iluminación

#### Consolas & Recibidores
```
consola-recibidor-blanca-espejos-1.jpg
entrada-hogareña-perchero-madera-2.jpg
recibidor-moderno-espejo-piso-techo-3.jpg
```
**Keywords**: consola, recibidor, espejo, entrada, perchero

---

### 2. **Alt Text (Texto Alternativo)**
Crucial para:
- **Accesibilidad**: Lectores de pantalla
- **SEO**: Alternativa cuando imagen no carga
- **LLMs**: Entienden contenido visual

**Estructura**: `{Tipo Espacio} {Estilo} en {Ubicación} - {Materiales/Características} con {Detalles notables}`

**Límite óptimo**: 125-150 caracteres

**Ejemplos:**

**Cocina:**
```
Cocina integral moderna en Bogotá con gabinetes blancos, backsplash de mármol gris y encimera de granito negro pulido
```

**Closet:**
```
Guardarropa empotrado en MDF blanco con puertas espejo, iluminación LED interna y organizadores personalizados
```

**Cava:**
```
Cava de vino con control de temperatura, puertas de cristal temperado, luces LED azules y capacidad para 200 botellas
```

**Recibidor:**
```
Consola moderna en roble con espejo piso-techo, perchero de hierro y repisa flotante en la entrada principal
```

---

### 3. **Image Title (Título de Metadatos)**
Tag `<title>` de la imagen, usado por:
- Herramientas de edición de imágenes
- Navegadores cuando haces clic derecho
- LLMs en análisis de contenido

**Formato**: `{Tipo Espacio} {Características principales} - {Ubicación}`

**Ejemplos:**
```
Cocina Integral Blanca con Mármol - Bogotá, Colombia
Closet Empotrado con Espejo - Diseño Personalizado
Cava de Vino Temperatura Controlada - Barra Cristal
Consola Recibidor Moderno - Entrada Principal
```

---

### 4. **Keywords (Palabras Clave)**
Contexto semántico para rastreadores y LLMs.

**Estructura**: Separadas por comas, 6-12 términos

**Rango: De general a específico**
```
{tipo}, {estilo}, {ubicación}, {material}, {característica}, {forma}
```

**Ejemplos con contador SEO:**

**Cocinas (8-10 keywords):**
```
cocina integral, muebles de cocina, diseño moderno, bogotá, granito, backsplash, gabinetes blancos, encimera
```

**Closets (8-10 keywords):**
```
closet, guardarropa, puertas espejo, organización, dormitorio, bogotá, diseño personalizado, iluminación led
```

**Cavas (8-10 keywords):**
```
cava, control de temperatura, vino, cristal, luces led, barra, almacenamiento, clima controlado
```

**Consolas (8-10 keywords):**
```
consola, recibidor, entrada, espejo, diseño moderno, madera, perchero, bogotá
```

---

### 5. **Descripción (Caption)**
Texto visible en la galería, complementa contenido principal.

**Función**: Narrativa comercial + contexto humano

**Límite**: 60-120 caracteres

**Estructura**: Situación + Diferenciales

**Ejemplos:**

**Cocina:**
```
Cocina integral de gama premium con isla central, backsplash de mármol travertino y electrodomésticos integrados de acero inoxidable.
```

**Closet:**
```
Guardarropa empotrado de 4 metros con acabado en MDF blanco, puertas espejo con amortiguadores y sistema de iluminación LED integrada.
```

**Cava:**
```
Cava moderna para vinos finos con control de temperatura y humedad, cristal de 8mm y luces LED RGB personalizables.
```

**Recibidor:**
```
Consola recibidor flotante en roble con espejo decorativo piso-techo y acabados en hierro forjado. Entrada principal, Bogotá.
```

---

## Structured Data (JSON-LD)

Incrustado automáticamente en cada imagen. Schema.org ImageObject:

```json
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "url": "https://empresa-muebles.com/images/cocina-integral-bogota-1.jpg",
  "name": "Cocina Integral Blanca con Mármol - Bogotá",
  "description": "Cocina integral moderna en Bogotá con gabinetes blancos...",
  "uploadDate": "2026-07-29T00:00:00Z",
  "contentUrl": "https://empresa-muebles.com/images/cocina-integral-bogota-1.jpg"
}
```

Este se genera automáticamente en el componente SeoImageUploader.

---

## Checklist por Imagen

Antes de guardar cada imagen, verifica:

- [ ] **Filename**: Contiene keywords + número secuencial (ej: `cocina-integral-bogota-1.jpg`)
- [ ] **Alt Text**: 125-150 caracteres, descriptivo, con keywords naturales
- [ ] **Title**: Legible, menciona ubicación y características
- [ ] **Keywords**: 8-10 términos separados por comas, de general a específico
- [ ] **Descripción**: 60-120 caracteres, narrativa comercial
- [ ] **Imagen optimizada**: <500KB (usar compresión sin perder calidad)

---

## Impacto SEO Esperado

### Búsqueda Tradicional (Google, Bing)
- **Cocinas**: Ranking para "cocina integral bogotá", "muebles cocina moderno"
- **Closets**: "closet bogotá", "guardarropa personalizado"
- **Cavas**: "cava temperatura controlada", "bar en casa"
- **Recibidores**: "consola recibidor", "entrada moderna"

### Búsqueda por LLM (ChatGPT, Claude, Gemini)
- Vision models analizan alt text + descripción
- JSON-LD proporciona contexto estructurado
- Filename + keywords mejoran asociación semántica
- LLMs recomiendan proyectos similares en respuestas

---

## Herramientas de Verificación

1. **Google Search Console**: Indexación de imágenes
2. **Screaming Frog**: Auditoría de metadatos
3. **SEO tools**: Ahrefs, SEMrush detectan alt text, title
4. **LLM Vision**: Alimenta ChatGPT con URLs y verifica recomendaciones

---

## Notas Técnicas

- Formato preferido: **JPEG** (87-90% calidad) o **WebP** (mejor compresión)
- Tamaño máximo: **5MB** (recomendado: <500KB)
- Dimensiones: **4000x2400px** mínimo (para retina displays)
- Aspect ratio: Mantener 16:9 o 4:3 según composición
