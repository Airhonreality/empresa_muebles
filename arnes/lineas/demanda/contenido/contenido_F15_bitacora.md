# F-15 — Bitácora de Diseño (Blog / Sistema de Proyectos)

**Fecha:** 2026-08-09 · **Estado:** aprobado · **Ruta:** `/bitacora`, `/bitacora/[slug]` · **Arquetipo:** Creador Experto

---

## 1. Eje de conversión

*La Bitácora de Diseño es el diario de trabajo del taller: casos de estudio reales, materiales y técnica, diseño y mantenimiento. Convierte al demostrar autoridad de oficio con contenido ligado a proyectos reales entregados (disciplina I-049: "se gana Chicó habiendo hecho una cocina en Chicó"). Atrae por SEO orgánico, reduce la fricción de compra y alimenta a los prescriptores (B2B).*

| Pregunta | Respuesta |
|---|---|
| ¿Qué busca el visitante aquí? | Inspiración con sustancia o referencia técnica: ver proyectos reales con su proceso, materiales y decisiones de diseño — no un blog genérico de muebles. |
| ¿Qué objeción disuelve esta página? | "¿Esta empresa produce de verdad o solo vende ideales?" — los casos de estudio con fotos de obra, materiales usados y testimonio del cliente prueban el oficio. |
| ¿Cuál es el siguiente paso después de leerla? | Leer un caso → agendar asesoría (→ F-12) o escribir por WhatsApp (→ F-00). |

---

## 2. Estructura de secciones (Portada `/bitacora`)

| # | Bloque | Tipo de contenido | Justificación (por qué convence en esta posición) |
|---|---|---|---|
| 1 | Hero | H1 + párrafo descriptor + CTA dual | Declara qué es la bitácora: el cuaderno de obra de Veta Dorada, no un blog de catálogo. |
| 2 | Grid de artículos | Tarjetas con fecha, categoría, extracto, imagen | Descubrimiento indexable sin paginación infinita. Cada tarjeta enlaza al artículo completo. |
| 3 | Categorías | Filtro visual/lists (Casos de Estudio · Materiales y Técnica · Diseño y Arquitectura · Mantenimiento) | Organiza la autoridad por tema — el visitante entra por lo que le toca (un caso, un material, una duda de mantenimiento). |
| 4 | CTA final | "¿Quiere un proyecto así?" + WhatsApp | El preguntar-aspiracional: el visitante conecta la historia con su propio espacio. |

### Estructura de secciones (Artículo `/bitacora/[slug]`)

| # | Bloque | Tipo de contenido |
|---|---|---|
| 1 | Artículo | H1 + Respuesta Atómica (`<h2>` visible) + cuerpo con imágenes intercaladas + `figcaption` (fecha + categoría) |
| 2 | Testimonio embebido | Solo si el caso tiene testimonio real (Jose Talero) — gate `flags_testimonios_seo.md` §1 |
| 3 | CTA final | "¿Quiere un proyecto así? Agende su asesoría de diseño" + WhatsApp |

---

## 3. Copy exacto por sección

### 3.1 — Hero (Portada)

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H1 | Bitácora de Diseño | Verificado | `plan_diseno_web_publica.md` §2.2 (v2, renombrado desde "Noticiario") |
| Párrafo descriptor | El cuaderno de obra de Veta Dorada: proyectos reales, materiales y decisiones de diseño. Historias de espacios que se fabricaron, no imágenes de catálogo. | Verificado | `plan_diseno_web_publica.md` §2.2 (engagement) |
| CTA primario | Agendar asesoría de diseño | Verificado | → F-12 |
| Imagen de fondo | Directiva: detalle de taller o de una obra en proceso. Recuperar del sitio actual si existe (I-016). | — | Tokens D4 Luz & Biofilia (I-037) |

### 3.2 — Categorías

| Categoría | Qué cubre | Estado | Fuente |
|---|---|---|---|
| Casos de Estudio | Proyectos reales de principio a fin: problema, materiales, proceso, resultado, testimonio | Verificado | `plan_diseno_web_publica.md` §2.2 ítem 1 |
| Materiales y Técnica | Maderas, barnices, acabados, herrajes — la técnica del oficio explicada | Verificado | `plan_diseno_web_publica.md` §2.2 ítem 1 |
| Diseño y Arquitectura | Temas de composición, luz, distribución de espacios | Verificado | `plan_diseno_web_publica.md` §2.2 ítem 1 |
| Mantenimiento | Cómo cuidar muebles y pisos de madera en Bogotá | Verificado | `plan_diseno_web_publica.md` §2.2 ítem 1 |

### 3.3 — Entradas previstas (plan de contenido)

| Entrada | Slug | Categoría | Estado | Fuente |
|---|---|---|---|---|
| Caso de estudio Jose Talero | `/bitacora/[slug]` | Casos de Estudio | Semilla — pendiente recuperar testimonio/proceso (t-113) | I-050 |
| Tipos de materiales para muebles a la medida en Bogotá | `/bitacora/tipos-de-materiales` | Materiales y Técnica | Permanente de referencia — formato largo 1200+ palabras | `plan_diseno_web_publica.md` §2.2 (v3) |
| Primer proyecto real del Bloque D | `/bitacora/[slug]` | Casos de Estudio | Pendiente — primer caso real documentado post-corte | `plan_demanda.md` Bloque D |
| (opcional) 12 preguntas frecuentes sobre muebles a la medida | `/bitacora/[slug]` | Diseño y Arquitectura | Agrupa Respuestas Atómicas sin duplicar (enlaza fuentes canónicas) | `plan_diseno_web_publica.md` §2.6 |

### 3.4 — CTA final (Artículo)

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H2 | ¿Quiere un proyecto así? | Verificado | `plan_diseno_web_publica.md` §2.2 (aproximación de detalle) |
| Cuerpo | Agende su asesoría de diseño: un diseñador visita su espacio, lo mide y le presenta una cotización sin compromiso. | Verificado | `contenido_F12_agendar.md` §3.1 |
| CTA primario | Agendar asesoría de diseño | Verificado | → F-12 |

---

## 4. Respuestas Atómicas indexables

*La portada no lleva Respuestas Atómicas propias (es un índice). Cada artículo lleva su Respuesta Atómica canónica como `<h2>` visible. Ejemplo con la entrada programada de materiales:*

| # | Pregunta (H2 visible, en artículo) | Respuesta (40-60 palabras) | Fuente |
|---|---|---|---|
| RA-1 | ¿Qué madera es mejor para un mueble a la medida en Bogotá? | Depende del uso: roble y cedro para piezas de alto tráfico y acabados nobles, melamina RH para cocinas y closets por su durabilidad a la humedad. El acabado (barniz al agua o laca) protege la madera y define el resultado final. En la asesoría te guiamos según tu espacio. | `plan_diseno_web_publica.md` §2.2 v3 (artículo "Tipos de materiales") |

---

## 5. Testimonios embebidos

*En artículos de Casos de Estudio, si el proyecto tiene testimonio real (Jose Talero), se embebe bajo el gate de `flags_testimonios_seo.md` §1.*

| # | Cliente | Testimonio (copy exacto) | Estado | Fuente |
|---|---|---|---|---|
| 1 | Jose Talero | Pendiente de recuperar texto real del testimonio y proceso (I-050) | Bloqueado — pendiente t-113 | I-050; `contenido_F13_testimonios.md` §3.2 |

---

## 6. Directorio de imágenes

| # | Descripción de la imagen | Tipo | Origen | Alt text propuesto | Caption visible |
|---|---|---|---|---|---|
| 1-3 | Detalles de taller del proyecto Jose Talero (si existen) | Artículo | Documentación I-050/t-113 | Proceso de fabricación de [espacio] — Veta Dorada | Taller de Veta Dorada |
| 4-8 | 10 fotos del caso de estudio (según Sistema de Proyectos: 1 proyecto → 10 fotos) | Artículo | Documentación de proyectos | [Espacio] a la medida en [barrio real], Bogotá | [Espacio] en [barrio real] |
| 9-13 | Muestras de materiales (maderas, barnices, acabados) | Artículo "Tipos de materiales" | Taller/fábrica si existen (I-016) | Muestras de madera y acabados — Veta Dorada | Materiales disponibles |
| 14+ | Una imagen por tarjeta del grid de portada | Portada | Imágenes de los artículos | — | — |

**Total estimado: variable (≥10 por caso de estudio).** Recuperables de la documentación de proyectos — ninguna se produce nueva (I-016).

---

## 7. SEO narrativo

| Elemento | Copy | Fuente |
|---|---|---|
| `<title>` (portada) | Bitácora de Diseño — Veta Dorada | `plan_seo_2026.md` §2 |
| Meta description (portada) (150-160 chars) | Casos de estudio reales, materiales y técnica de carpintería arquitectónica a la medida en Bogotá. El cuaderno de obra de Veta Dorada. | `plan_seo_2026.md` §2 |
| Tipo JSON-LD primario (portada) | `Blog` | `plan_seo_2026.md` §2 |
| Tipo JSON-LD primario (artículo) | `Article` o `BlogPosting` | `plan_seo_2026.md` §2 |
| Tipos secundarios (artículo) | `ImageObject` (por imagen), `author` → `Organization` | `plan_seo_2026.md` §2 |
| Campos requeridos (artículo) | `datePublished`, `dateModified`, `image` — sin `aggregateRating` falso | `plan_seo_2026.md` §2 |
| Slug canónico | `/bitacora` · `/bitacora/[slug]` | `plan_diseno_web_publica.md` §2.2 |
| Breadcrumb | `Inicio > Bitácora > [Artículo]` en artículos | `plan_seo_2026.md` §2, ítem 9 |
| `llms.txt` — descripción de 1 línea | Bitácora de Diseño de Veta Dorada: casos de estudio reales, materiales y técnica, diseño y mantenimiento de muebles a la medida en Bogotá. Contenido orgánico indexable. | `plan_diseno_web_publica.md` §1 |

---

## 8. Verificación de integridad (pre-entrega)

- [x] Todo bloque de copy en §3 tiene `estado` y `fuente` — ninguno está vacío.
- [x] Regla dura: cada artículo deriva de un proyecto real entregado (I-049) — el plan de entradas lo respeta.
- [x] Sin testimonio inventado (§5) — Jose Talero marcado como pendiente de dato real (I-050/t-113).
- [x] Las imágenes en §6 no piden producir contenido nuevo — recuperables de documentación (I-016).
- [x] El SEO narrativo (§7) cita `plan_seo_2026.md` §2: `Blog` / `Article` / `BlogPosting`, breadcrumb, sin `aggregateRating` falso.
- [x] El copy no contradice decisiones cerradas: D1, DC-1, DC-3, DC-4.
- [x] Portada sin paginación infinita (indexable) — `repeat(auto-fill, minmax(min(100%, 320px), 1fr))`.
- [x] CTA en artículos apunta a agenda/WhatsApp (F-12/F-00).
- [ ] **Pendiente:** recuperar material real de Jose Talero (t-113) y proyecto Bloque D para las semillas.

---

## 9. Contenido de Entradas Semilla (Aprobado)

### 9.1 — Artículo 1: Guía de Materiales
* **Slug:** `guia-materiales-carpinteria-bogota`
* **Respuesta Atómica (H2):** ¿Qué material es ideal para un mueble a la medida en Bogotá? Depende del uso. Para cocinas y closets, los tableros melamínicos RH de 15mm o 18mm son el estándar. Para mobiliario de autor, maderas naturales como Flor Morado o Zapan brindan resistencia insuperable. El acabado final (poro abierto o lleno) determinará la textura.

**1. Tableros Melamínicos (La base contemporánea)**
* **Mates vs. Alto Brillo:** Acabados mates antihuella para elegancia sobria; alto brillo (PET) para reflejar luz.
* **Calibre 15mm vs 18mm:** 15mm para estructuras ligeras; **18mm** (el estándar Veta Dorada) para puertas, frentes y máxima resistencia estructural.

**2. Maderas Naturales (El alma del oficio)**
* **Flor Morado:** Estándar intermedio. Vetas marcadas, excelente comportamiento frente a la humedad.
* **Zapan:** Alta densidad para tráfico extremo (escalones).
* **Teca:** Resistencia natural e indeclinable para exteriores.

**3. Tipos de Acabados (El tacto final)**
* **Poro Abierto:** Sella la madera pero respeta su relieve natural al tacto. Orgánico y contemporáneo.
* **Poro Lleno:** Sellado total con laca de poliuretano. Superficie lisa y uniforme.

### 9.2 — Artículo 2: Guía de Medición
* **Slug:** `como-tomar-medidas-espacio-muebles`
* **Respuesta Atómica (H2):** ¿Cómo se toman las medidas para cotizar carpintería a la medida? Utiliza la nomenclatura X, Y, Z (Ancho, Profundo, Alto). Mide muros de piso a techo. Para cocinas, mide los *metros lineales* de mueble. Para closets, mide el nicho considerando parámetros de modulación.

**1. El lenguaje universal: X, Y, Z**
X (Ancho: Izquierda a derecha), Y (Profundo: Pared a frente), Z (Alto: Piso a techo).

**2. Cocinas: El concepto de "Metro Lineal"**
En carpintería no usamos metros cuadrados para cocinas. Mides el ancho de la pared (X) para definir tus **metros lineales** de mueble inferior y superior.

**3. Closets y Vestidores: Modulación básica**
Se mide el nicho total. La modulación básica incluye: Maletero superior, área de colgar larga y corta, y cajoneras/zapateras (donde se concentra la inversión en herrajes).

### 9.3 — Artículo 3: El "Mini-Artículo" Puente
* **Slug:** `3-senales-restauracion-pisos-madera`
* **Propósito:** Educar orgánicamente y enviar tráfico a la Landing de venta (F-14).

**El valor de lo auténtico**
Un piso original en una casona bogotana es patrimonio arquitectónico. No se reemplaza por piso laminado; se le devuelve la vida a la madera maciza.

**Las 3 alertas:**
1. **Pérdida del sellador:** El piso luce opaco y el agua penetra manchando la madera.
2. **Rayones que cruzan la veta:** Daños por mascotas o muebles arrastrados.
3. **Tablillas sueltas (Dilataciones):** Ranuras que acumulan cera o tablillas que suenan.

> **CTA Puente:** Un piso de madera antigua no se reemplaza, se restaura con el trato de un maestro carpintero. **👉 [Conozca nuestro servicio especializado de Restauración de Pisos y agende un diagnóstico técnico aquí](/espacios/pisos-de-madera)**.