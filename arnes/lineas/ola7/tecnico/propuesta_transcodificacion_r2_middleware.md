# Propuesta — Transcodificación de imágenes como middleware en subida a R2

**Fecha:** 2026-08-19
**Autor:** Agente (a petición del Supervisor)
**Línea:** Técnica · Subsistema de almacenamiento de imágenes
**Estado:** ⚠️ PROPUESTA ABIERTA — requiere checkpoint del Supervisor

---

## 1. Problematización (el estado hoy es frágil)

El negocio sube imágenes (diseño, portafolio, catálogo, renders) y **asume** que el
sistema las deja en el formato web eficiente (WebP/AVIF). Eso **no es cierto en la
ruta del ERP**, y en la ruta manual **es cierto pero con defectos de calidad**.

### 1.1 Lo que SÍ existe (transcodificación offline, manual)
Vive en `scripts/` como scripts Node.js de un solo uso, no en el flujo productivo:

| Script | Qué hace | Falla |
|---|---|---|
| `scripts/transcode-home-images.js` | JPG/PNG locales → WebP `quality:85` en `public/images/home/` | No redimensiona → pesos de 0.5–1.16 MB |
| `scripts/process-portfolio.js` | TXT con rutas → WebP `quality:85` + genera `portafolio-images.ts` | No redimensiona |
| `scripts/ultimate-fix.ts` | WebP → R2 (`PutObjectCommand`, `ContentType: image/webp`) | No redimensiona, re-subida manual |
| `scripts/fix-orientation-r2.ts` | WebP+`.rotate()` → R2 | No redimensiona |
| `scripts/rotate-home.js` | `.rotate(90)` a 2 WebP del home | Parche puntual |

**Evidencia de peso real** (`public/images/home/`, medido 2026-08-19):
- `taller-fabricacion-muebles-madera-bogota-1.webp` → **1.16 MB** (hero)
- `disenador-industrial-midiendo-espacio-bogota-1.webp` → **842 KB**
- `cavas-bares-madera-iluminacion-bogota-1.webp` → **687 KB**
- `plan_seo_2026.md:80` exige **<500 KB por imagen**. 8 de 11 home incumplen.

### 1.2 Lo que NO existe (la ruta productiva del ERP)
`lib/r2/upload.ts` (`uploadFileToR2`, línea 22) sube el binario **tal cual**:
- `ContentType: file.type` (hereda el MIME original: `image/jpeg`, `image/png`…)
- No pasa por `sharp`, no convierte a WebP, no redimensiona.
- `components/veta/image-picker.tsx` llama a esto con `uploadToR2=true`.

**Consecuencia:** cualquier imagen que el usuario suba desde el ERP a R2 queda en su
formato original y tamaño original. No hay transcodificación automática en runtime.

### 1.3 El "web assistant" que Javier intuye
No es un asistente externo: es el conjunto de scripts `scripts/*.js|ts` corriendo
**sharp localmente** en la máquina de Javier, de forma **manual y dispar** (cada script
tiene su propia lógica, su propio `quality:85`, su propio destino). Eso explica por qué
algunas imágenes "ya están en WebP": pasaron por esos scripts. Y explica la pérdida de
calidad: `quality:85` sobre fotos de madera/texturas detalladas es agresivo, y al no
redimensionar, el WebP sigue pesando lo que la foto original.

### 1.4 Riesgos de la situación actual
- **R1 (calidad):** WebP `q85` sin resize destruye detalle en fotos de mobiliario.
- **R2 (peso/SEO):** incumplimiento de `<500KB` → penalti LCP en `plan_seo_2026.md`.
- **R3 (inconsistencia):** lo subido por script queda en WebP; lo subido por ERP queda
  en JPG/PNG. Dos realidades de formato para el mismo bucket.
- **R4 (mantenibilidad):** la lógica de optimización está "afuera" del repo productivo
  (en `scripts/`, en la carpeta `Pictures` de Javier, con rutas hardcodeadas de disco).
- **R5 (corrupción de caché):** `ultimate-fix.ts` renombra archivos con `-definitivo`
  para invalidar el edge cache de Cloudflare — parche, no solución.

---

## 2. Propuesta — Middleware de transcodificación en la subida a R2

Hacer que **toda** subida a R2 pase por un paso de optimización, sea manual o desde el
ERP. Centralizar la lógica en `lib/r2/upload.ts` (o un módulo `lib/r2/optimize.ts` que
`upload.ts` consuma).

### 2.1 Opción A — Transcodificación en el servidor (recomendada como base)
Instalar `sharp` en el runtime de Vercel (ya es dependencia de dev por los scripts;
subirla a `dependencies`). En `uploadFileToR2`:

```ts
import sharp from "sharp";

async function optimizeImage(buffer: Buffer, mime: string): Promise<{ data: Buffer; contentType: string }> {
  // Solo imágenes raster; SVG/PNG-logotipo se dejan pasar si se quiere.
  if (!mime.startsWith("image/") || mime === "image/svg+xml") {
    return { data: buffer, contentType: mime };
  }
  const image = sharp(buffer, { failOn: "none" })
    .rotate()                                   // respeta EXIF (fix-orientation ya no es script aparte)
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true }); // techo de dimensiones
  // AVIF para navegadores modernos con fallback WebP; elegir por Accept o fijar WebP.
  const webp = await image.webp({ quality: 82, effort: 4 }).toBuffer();
  return { data: webp, contentType: "image/webp" };
}
```

Luego `uploadFileToR2` usa `optimizeImage` antes del `PutObjectCommand`, y escribe
`ContentType: "image/webp"` (o `image/avif`). Esto **elimina** la necesidad de
`scripts/transcode-*.js`, `ultimate-fix.ts`, `fix-orientation-r2.ts`.

**Ventajas:** una sola fuente de verdad; el ERP optimiza automáticamente; respeta EXIF;
tamaño controlado por `resize`.
**Desventajas:** `sharp` en Vercel functions tiene límite de payload (~4.5 MB body en
hobby); fotos de 10+ MB requieren subida en streaming o pre-proceso client-side.

### 2.2 Opción B — Cloudflare Image Resizing (on-the-fly, sin tocar el binario)
R2 ya está en Cloudflare. Se puede servir con transformación en la URL:
`https://<zona>/cdn-cgi/image/width=1600,format=webp,quality=82/<r2-key>`.
No requiere reprocesar nada: la optimización ocurre al solicitar la imagen.
**Ventajas:** zero código en el servidor, ideal para el home hero ya pesado.
**Desventajas:** requiere zona pagada de Cloudflare (Image Resizing no es free-tier), y
las URLs cambian (hay que versionar el patrón de servido en `next.config.ts` /
`next/image`).

### 2.3 Recomendación
- **Corto plazo:** Opción B para el home/portafolio ya publicados (arregla el peso del
  hero sin reprocesar).
- **Medio plazo:** Opción A como middleware en `lib/r2/upload.ts`, con `resize` + WebP
  `quality` configurable (parámetro en tabla `parametros`, decisión ARCH-012 de
  alojador).
- Dejar de depender de `scripts/*.js|ts` para producción (quedan como utilidad de seed).

---

## 3. Parámetros propuestos (para que no se dañe la calidad)

| Parámetro | Valor propuesto | Nota |
|---|---|---|
| `imagen_formato` | `webp` (AVIF opcional) | Formato de salida |
| `imagen_calidad` | `82` (no 85) | Equilibrio; 90 para hero crítico |
| `imagen_dim_max` | `1600` px (lado mayor) | `withoutEnlargement` para que no agrande |
| `imagen_hero_dim_max` | `1920` px | El home hero merece más resolución |
| `imagen_auto_rotate` | `true` | Siempre respetar EXIF |

Estos podrían vivir en `parametros` (tabla ya existente, editable en ERP) para que el
Supervisor ajuste calidad sin tocar código.

---

## 4. Tarea propuesta (para registrar en ledger, no ejecutar sin aprobación)

- **t-nueva · Transcodificación middleware en `lib/r2/upload.ts`**
  - Intención: centralizar optimización de imágenes en la subida a R2.
  - Alcance: instalar `sharp` en deps; `optimizeImage()` en `lib/r2/optimize.ts`;
    consumirla desde `uploadFileToR2`; parámetros de calidad/dimensión en `parametros`.
  - Fuera de alcance: migrar las imágenes ya en R2 (se hace con Opción B o script único).
  - Verificación: `tsc --noEmit` 0; test que suba un JPG y confirme que el objeto en R2
    es `image/webp` y pesa < dim_max.
  - Riesgo: **alto** (toca `lib/r2/`, afecta todas las subidas) → checkpoint Supervisor.

---

## 5. Trazabilidad (ingeniería inversa confirmada)

- `lib/r2/upload.ts:22-46` — sube binario sin procesar.
- `components/veta/image-picker.tsx:49-68` — `agregarArchivo` llama `uploadFileToR2`.
- `scripts/transcode-home-images.js:69-72` — sharp `.webp({quality:85})`, sin resize.
- `scripts/process-portfolio.js:64-66` — igual.
- `scripts/ultimate-fix.ts:67-69` — sharp a WebP en R2, sin resize.
- `scripts/fix-orientation-r2.ts:59-61` — sharp `.rotate().webp({quality:85})`.
- `next.config.ts:4-10` — `remotePatterns` solo permite el host R2 (no zona CDN).
- `plan_seo_2026.md:78-110` — requisitos de imagen (<500KB, next/image, lazy).

**Conclusión:** el sistema NO transcodifica automáticamente en la ruta del ERP. Lo que
Javier veía como "web assistant" eran scripts `sharp` locales manuales, con calidad
subóptima por falta de redimensionamiento. La solución es un middleware en
`lib/r2/upload.ts` (Opción A) complementado con Cloudflare Image Resizing (Opción B)
para lo ya publicado.
