# F-09 — Landings SEO por Categoría de Espacio

**Fecha:** 2026-08-09 · **Estado:** aprobado · **Ruta:** `/espacios/{categoria}` · **Arquetipo:** Creador Experto

---

## 1. Eje de conversión

*Las landings por categoría responden a la intención de búsqueda específica de un tipo de espacio (ej: "cocinas integrales a medida Bogotá"). Cada landing valida que Veta Dorada hace ESE espacio, con evidencia visual y técnica, y deriva al siguiente paso (agendar o contactar).*

| Pregunta | Respuesta |
|---|---|
| ¿Qué busca el visitante aquí? | Confirmar que la empresa hace el espacio que necesita (ej: cocinas integrales, closets) y ver ejemplos reales que le den confianza en la calidad y el oficio. |
| ¿Qué objeción disuelve esta página? | "¿Hacen [categoría]? ¿Tienen experiencia en este tipo de proyecto? ¿Cómo queda un [categoría] a la medida?" — la galería de imágenes reales y la descripción técnica resuelven la duda. |
| ¿Cuál es el siguiente paso después de leerla? | Agendar una asesoría gratuita (→ F-12) o escribir por WhatsApp (→ F-00). |

---

## 2. Estructura de secciones

*Estructura común para las 6 landings. Cada landing es una página independiente con el mismo patrón de bloques, adaptado a su categoría.*

| # | Bloque | Tipo de contenido | Justificación (por qué convence en esta posición) |
|---|---|---|---|
| 1 | Hero | H1 + subtítulo + párrafo descriptor + CTA dual + imagen de fondo | El visitante decide en 3 segundos si esta empresa hace el espacio que busca. El H1 confirma la categoría, el subtítulo refuerza el valor (diseño a medida), y el CTA invita a actuar. |
| 2 | Galería de proyectos | Grid de 4-6 imágenes reales de la categoría | Prueba visual inmediata: el visitante ve ejemplos reales de la categoría que busca. Sin renders, sin fotos de banco. |
| 3 | Descripción técnica | Párrafo único + lista de beneficios | Explica el proceso y los diferenciadores para esa categoría (ej: materiales, tiempos, garantía). |
| 4 | Validación Técnica | Grid de 3 cards (reutilizado de F-01) | Refuerza la confianza con las mismas 3 razones de F-01 (3D, fábrica propia, diseñador dedicado). |
| 5 | Proceso resumido | 4 pasos (reutilizado de F-01) | Reduce la fricción: el visitante entiende cómo funciona el servicio antes de contactar. |
| 6 | CTA final | CTA dual (Agenda tu Asesoría + WhatsApp) | Cierre del embudo: el visitante ya vio ejemplos y sabe cómo trabajamos. |

---

## 3. Copy exacto por sección

*Cada landing sigue la misma estructura, pero con copy específico para su categoría. Los datos de H1, intro, title y description se toman textual del legacy (backup `dev-v2-arquitectura-20260804`).*

### 3.1 — Hero (común para todas las landings)

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| CTA primario | Agenda tu asesoría gratuita | Verificado | `plan_diseno_web_publica.md` §2.0, F-12 |
| CTA secundario | Hablamos por WhatsApp | Verificado | `plan_demanda.md` Bloque C, I-011 |
| Imagen de fondo | Directiva: fotografía real de un proyecto de la categoría, con luz natural. Recuperar del sitio actual (I-016). Si no hay foto real, usar token D4 `--color-bg-linen`. | — | Tokens D4 Luz & Biofilia (I-037) |

---

### 3.2 — Cocinas Integrales

**Ruta:** `/espacios/cocinas-integrales-bogota`

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H1 | Cocinas integrales a medida | Verificado | Legacy: `app/(publico)/cocinas-integrales/page.tsx` (backup `dev-v2-arquitectura-20260804`) |
| Subtítulo | Diseño y fabricación a la medida de tu espacio y estilo | Verificado | Legacy: `app/(publico)/cocinas-integrales/page.tsx` |
| Párrafo descriptor | Cocinas integrales diseñadas para aprovechar cada centímetro de tu espacio. Materiales de primera, acabados personalizados y instalación impecable. | Verificado | Legacy: `LandingEspacio.tsx` (cocinas) |
| `<title>` | Cocinas Integrales en Bogotá \| Diseño a Medida | Verificado | Legacy + decisión 2026-08-09 (sin "Premium") |
| Meta description | Cocinas integrales a medida en Bogotá. Diseño, fabricación e instalación con materiales de primera y acabados personalizados. | Verificado | Legacy + `plan_seo_2026.md` §3 |

---

### 3.3 — Closets y Vestidores

**Ruta:** `/espacios/closets-vestidores-bogota`

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H1 | Closets y vestidores a medida | Verificado | Legacy: `app/(publico)/closets-vestidores/page.tsx` |
| Subtítulo | Soluciones de almacenamiento diseñadas para tu espacio y estilo de vida | Verificado | Legacy: `LandingEspacio.tsx` (closets) |
| Párrafo descriptor | Closets y vestidores que optimizan el espacio y reflejan tu estilo. Desde diseños minimalistas hasta soluciones con detalle en madera. | Verificado | Legacy: `LandingEspacio.tsx` (closets) |
| `<title>` | Closets y Vestidores en Bogotá \| Diseño a Medida | Verificado | Legacy + decisión 2026-08-09 (sin "Premium") |
| Meta description | Closets y vestidores a medida en Bogotá. Diseño personalizado, materiales duraderos y instalación profesional. | Verificado | Legacy + `plan_seo_2026.md` §3 |

---

### 3.4 — Cavas y Bares

**Ruta:** `/espacios/cavas-y-bares`

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H1 | Cavas y bares a medida | Verificado | Legacy: `app/(publico)/cavas-y-bares/page.tsx` |
| Subtítulo | Espacios para disfrutar, diseñados a tu medida | Verificado | Legacy: `LandingEspacio.tsx` (cavas) |
| Párrafo descriptor | Cavas y bares que combinan funcionalidad y elegancia. Diseñamos cada detalle para que tu espacio de entretenimiento sea único. | Verificado | Legacy: `LandingEspacio.tsx` (cavas) |
| `<title>` | Cavas y Bares a Medida en Bogotá | Verificado | Legacy + decisión 2026-08-09 (sin "Premium") |
| Meta description | Cavas y bares a medida en Bogotá. Diseño personalizado, materiales de calidad y acabados premium. | Verificado | Legacy + `plan_seo_2026.md` §3 |

---

### 3.5 — Consolas y Recibidores

**Ruta:** `/espacios/consolas-recibidores`

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H1 | Consolas y recibidores a medida | Verificado | Legacy: `app/(publico)/consolas-recibidores/page.tsx` |
| Subtítulo | La primera impresión de tu hogar, diseñada a tu estilo | Verificado | Legacy: `LandingEspacio.tsx` (consolas) |
| Párrafo descriptor | Consolas y recibidores que dan la bienvenida a tu hogar con estilo y funcionalidad. Cada pieza es única y diseñada para tu espacio. | Verificado | Legacy: `LandingEspacio.tsx` (consolas) |
| `<title>` | Consolas y Recibidores a Medida en Bogotá | Verificado | Legacy + decisión 2026-08-09 (sin "Premium") |
| Meta description | Consolas y recibidores a medida en Bogotá. Diseño personalizado, materiales resistentes y instalación profesional. | Verificado | Legacy + `plan_seo_2026.md` §3 |

---

### 3.6 — Centros de Entretenimiento

**Ruta:** `/espacios/centros-de-entretenimiento`

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H1 | Centros de entretenimiento a medida | Verificado | Legacy: `app/(publico)/centros-de-entretenimiento/page.tsx` |
| Subtítulo | Diseño y fabricación para tu espacio de diversión | Verificado | Legacy: `LandingEspacio.tsx` (centros de entretenimiento) |
| Párrafo descriptor | Centros de entretenimiento diseñados para integrar tecnología y estilo. Cada proyecto es único y adaptado a tus necesidades. | Verificado | Legacy: `LandingEspacio.tsx` (centros de entretenimiento) |
| `<title>` | Centros de Entretenimiento a Medida en Bogotá | Verificado | Legacy (ya correcto, sin "Premium") |
| Meta description | Centros de entretenimiento a medida en Bogotá. Integración de tecnología, diseño personalizado y materiales de calidad. | Verificado | Legacy + `plan_seo_2026.md` §3 |

---

### 3.7 — Estudios y Home Office

**Ruta:** `/espacios/estudios-home-office`

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H1 | Estudios y home office a medida | Verificado | Legacy: `app/(publico)/estudios-home-office/page.tsx` |
| Subtítulo | Espacios de trabajo diseñados para tu productividad | Verificado | Legacy: `LandingEspacio.tsx` (estudios) |
| Párrafo descriptor | Estudios y home offices que combinan funcionalidad y comodidad. Diseñamos cada detalle para que tu espacio de trabajo sea inspirador. | Verificado | Legacy: `LandingEspacio.tsx` (estudios) |
| `<title>` | Estudios y Home Office a Medida en Bogotá | Verificado | Legacy (ya correcto, sin "Premium") |
| Meta description | Estudios y home office a medida en Bogotá. Diseño ergonómico, materiales duraderos y instalación profesional. | Verificado | Legacy + `plan_seo_2026.md` §3 |

---

### 3.8 — Bloques compartidos (reutilizados de F-01)

*Las secciones de Validación Técnica, Proceso y CTA final son idénticas en todas las landings.*

#### Validación Técnica (Grid de 3 cards)
| Card | Título | Cuerpo | Estado | Fuente |
|---|---|---|---|---|
| 1 | Disminuye la incertidumbre | Visualizas tu espacio en 3D antes de cortar la primera pieza. Así ves exactamente cómo quedará y tomas decisiones con toda la información. | Verificado | `contenido_F01_home.md` §3.3 |
| 2 | Punto de Fábrica Directo | Diseñamos y fabricamos en nuestro propio taller. Sin intermediarios, sin sobrecostos, sin perder calidad en cada eslabón de la cadena. | Verificado | `contenido_F01_home.md` §3.3 |
| 3 | Asesoría con diseñadores | Tu proyecto lo acompaña un diseñador industrial de la Universidad Nacional de principio a fin. No vendemos catálogos: diseñamos contigo cada espacio para que responda a cómo vives. | Verificado | `contenido_F01_home.md` §3.3 |

#### Cómo trabajamos (4 pasos resumidos)
| Paso | Título | Cuerpo | Estado | Fuente |
|---|---|---|---|---|
| 1 | Visita y diseño | Visitamos tu espacio, lo medimos con precisión y conversamos sobre materiales, acabados y necesidades. Sin compromiso, sin costo. | Verificado | `contenido_F01_home.md` §3.6 |
| 2 | Cotización detallada | Recibes un presupuesto línea por línea con materiales, tiempos y alcance. Sin sorpresas, sin costos ocultos. | Verificado | `contenido_F01_home.md` §3.6 |
| 3 | Producción en taller | Fabricamos cada pieza en nuestro taller con los materiales y acabados que elegiste. Tú puedes corroborar acabados en físico durante la etapa de negociación. | Verificado | `contenido_F01_home.md` §3.6 |
| 4 | Entrega e instalación | Llevamos cada pieza a tu espacio, la instalamos y dejamos todo funcionando. Con garantía y acompañamiento. | Verificado | `contenido_F01_home.md` §3.6 |

#### CTA final
| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H2 | ¿Hablamos de tu espacio? | Verificado | `contenido_F01_home.md` §3.11 |
| Cuerpo | Cuéntanos qué tienes en mente. Un diseñador te escucha, visita tu espacio y te entrega una cotización detallada sin compromiso. | Verificado | `contenido_F01_home.md` §3.11 |
| CTA primario | Agenda tu asesoría gratuita | Verificado | `contenido_F01_home.md` §3.11 |
| CTA secundario | Escríbenos por WhatsApp | Verificado | `contenido_F01_home.md` §3.11 |

---

## 4. Respuestas Atómicas indexables

*Cada landing incluye 2-3 Respuestas Atómicas específicas de la categoría. Las siguientes son provisionales y deben verificarse con el negocio real antes de publicar (I-049).*

### Cocinas Integrales
| # | Pregunta (H2 visible) | Respuesta (40-60 palabras) | Fuente |
|---|---|---|---|
| RA-1 | ¿Cuánto cuesta una cocina integral a la medida en Bogotá? | El precio depende del tamaño, los materiales y los acabados. Una cocina básica en melamina parte de $X, mientras que una en madera maciza puede superar los $Y. Agenda una visita para un presupuesto exacto. | Pendiente verificación con negocio real |
| RA-2 | ¿Qué materiales usan para las cocinas integrales? | Trabajamos con melamina de alta densidad, madera maciza, MDF y acabados en laca o barniz. Cada material tiene sus ventajas en durabilidad, estética y precio. | Pendiente verificación con negocio real |

### Closets y Vestidores
| # | Pregunta (H2 visible) | Respuesta (40-60 palabras) | Fuente |
|---|---|---|---|
| RA-1 | ¿Cuánto tiempo tarda la instalación de un closet a medida? | El tiempo varía según la complejidad: un closet estándar se instala en 1-2 días, mientras que diseños con detalles personalizados pueden tardar hasta 1 semana. Siempre coordinamos con tu disponibilidad. | Pendiente verificación con negocio real |
| RA-2 | ¿Puedo personalizar el interior de mi closet? | Sí. Diseñamos cada detalle: estantes, cajones, barras para colgar y accesorios como organizadores de zapatos o joyeros. Todo adaptado a tus necesidades. | Pendiente verificación con negocio real |

### Cavas y Bares
| # | Pregunta (H2 visible) | Respuesta (40-60 palabras) | Fuente |
|---|---|---|---|
| RA-1 | ¿Qué tipos de madera usan para cavas y bares? | Usamos maderas nobles como roble, nogal o cerezo, según el estilo y presupuesto. También ofrecemos opciones en MDF con acabados de alta calidad para diseños modernos. | Pendiente verificación con negocio real |
| RA-2 | ¿Incluyen la instalación de iluminación en cavas y bares? | Sí. Integramos iluminación LED o halógena según el diseño. La instalación eléctrica la realizamos en coordinación con tu electricista de confianza. | Pendiente verificación con negocio real |

### Consolas y Recibidores
| # | Pregunta (H2 visible) | Respuesta (40-60 palabras) | Fuente |
|---|---|---|---|
| RA-1 | ¿Puedo combinar materiales en mi consola? | Sí. Combinamos madera, vidrio, metal y piedra según el estilo de tu espacio. Cada material se elige para armonizar con el resto de tu hogar. | Pendiente verificación con negocio real |
| RA-2 | ¿Hacen consolas con almacenamiento integrado? | Sí. Diseñamos consolas con cajones, estantes y espacios ocultos para mantener el orden en tu entrada. Funcionalidad y estilo en una sola pieza. | Pendiente verificación con negocio real |

### Centros de Entretenimiento
| # | Pregunta (H2 visible) | Respuesta (40-60 palabras) | Fuente |
|---|---|---|---|
| RA-1 | ¿Incluyen la instalación de equipos en los centros de entretenimiento? | No instalamos equipos electrónicos, pero diseñamos el mueble para alojar tus dispositivos (TV, sonido, etc.) con ventilación y acceso a cables. | Pendiente verificación con negocio real |
| RA-2 | ¿Puedo personalizar el diseño para mi TV de 75 pulgadas? | Sí. Adaptamos las dimensiones del mueble a tu TV y espacio. Incluimos detalles como estantes para equipos, puertas correderas o abatibles. | Pendiente verificación con negocio real |

### Estudios y Home Office
| # | Pregunta (H2 visible) | Respuesta (40-60 palabras) | Fuente |
|---|---|---|---|
| RA-1 | ¿Hacen estudios con integración de cableado? | Sí. Diseñamos estudios con canaletas integradas para cables y tomas de corriente, manteniendo el espacio ordenado y funcional. | Pendiente verificación con negocio real |
| RA-2 | ¿Puedo incluir una biblioteca en mi home office? | Sí. Diseñamos estanterías, librerías y espacios de almacenamiento integrados en el mismo estilo que tu escritorio y sillas. | Pendiente verificación con negocio real |

---

## 5. Testimonios embebidos

*No aplica para F-09. Los testimonios viven en F-13 y se embeben en F-01 y F-03.*

---

## 6. Directorio de imágenes

*Cada landing requiere imágenes reales de proyectos de su categoría. Todas son recuperables del sitio actual (I-016) o del backup `dev-v2-arquitectura-20260804`.*

| # | Descripción de la imagen | Tipo | Origen | Alt text propuesto | Caption visible |
|---|---|---|---|---|---|
| **Cocinas Integrales** | | | | | |
| 1 | Cocina integral real instalada por Veta Dorada, luz natural, diseño moderno | Hero | Recuperar del sitio actual (I-016) | Cocina integral a medida en [barrio real], Bogotá | Cocina integral en [barrio real] |
| 2-5 | 4 imágenes adicionales de cocinas integrales (diferentes estilos/barrios) | Galería | Recuperar del sitio actual | Cocina integral en madera, diseño [estilo] | Cocina integral en [barrio real] |
| **Closets y Vestidores** | | | | | |
| 6 | Closet o vestidor real, puertas abiertas, interior visible | Hero | Recuperar del sitio actual | Closet a medida con interior organizado, Bogotá | Closet en [barrio real] |
| 7-10 | 4 imágenes adicionales de closets/vestidores | Galería | Recuperar del sitio actual | Vestidor a medida, diseño [estilo] | Vestidor en [barrio real] |
| **Cavas y Bares** | | | | | |
| 11 | Cava o bar real en madera, detalle de iluminación | Hero | Recuperar del sitio actual | Cava de vino a medida, Bogotá | Cava en [barrio real] |
| 12-15 | 4 imágenes adicionales de cavas/bares | Galería | Recuperar del sitio actual | Bar a medida con iluminación integrada | Bar en [barrio real] |
| **Consolas y Recibidores** | | | | | |
| 16 | Consola de entrada real, detalle de diseño | Hero | Recuperar del sitio actual | Consola de entrada a medida, Bogotá | Consola en [barrio real] |
| 17-20 | 4 imágenes adicionales de consolas/recibidores | Galería | Recuperar del sitio actual | Recibidor con espejo y almacenamiento | Recibidor en [barrio real] |
| **Centros de Entretenimiento** | | | | | |
| 21 | Centro de entretenimiento real, TV integrada | Hero | Recuperar del sitio actual | Centro de entretenimiento a medida, Bogotá | Centro de entretenimiento en [barrio real] |
| 22-25 | 4 imágenes adicionales de centros de entretenimiento | Galería | Recuperar del sitio actual | Mueble para TV con estantes integrados | Centro de entretenimiento en [barrio real] |
| **Estudios y Home Office** | | | | | |
| 26 | Estudio o home office real, escritorio y estantería | Hero | Recuperar del sitio actual | Estudio a medida con escritorio y estantería, Bogotá | Estudio en [barrio real] |
| 27-30 | 4 imágenes adicionales de estudios/home office | Galería | Recuperar del sitio actual | Home office con almacenamiento integrado | Home office en [barrio real] |

**Total estimado: 30 imágenes.** Todas recuperables del sitio actual o del backup `dev-v2-arquitectura-20260804` (I-016).

---

## 7. SEO narrativo

*Metadatos para cada landing. El `<title>` y `meta description` ya están definidos en §3.2–3.7.*

| Elemento | Copy | Fuente |
|---|---|---|
| **Todas las landings** | | |
| Tipo JSON-LD primario | `HomeAndConstructionBusiness` + `Organization` | `plan_seo_2026.md` §2 |
| Tipos secundarios | `WebSite` (SearchAction) | `plan_seo_2026.md` §2 |
| `llms.txt` — descripción de 1 línea | Landings SEO de Veta Dorada: páginas dedicadas a cada categoría de espacio (cocinas, closets, cavas, consolas, centros de entretenimiento, estudios). Diseño a medida, fabricación propia, instalación profesional. | `plan_diseno_web_publica.md` §1 |

**SEO por landing:**
| Landing | Slug canónico | `llms.txt` específico |
|---|---|---|
| Cocinas Integrales | `/espacios/cocinas-integrales-bogota` | Cocinas integrales a medida en Bogotá: diseño, fabricación e instalación con materiales de primera y acabados personalizados. |
| Closets y Vestidores | `/espacios/closets-vestidores-bogota` | Closets y vestidores a medida en Bogotá: soluciones de almacenamiento diseñadas para tu espacio y estilo de vida. |
| Cavas y Bares | `/espacios/cavas-y-bares` | Cavas y bares a medida en Bogotá: espacios para disfrutar, diseñados con elegancia y funcionalidad. |
| Consolas y Recibidores | `/espacios/consolas-recibidores` | Consolas y recibidores a medida en Bogotá: la primera impresión de tu hogar, diseñada a tu estilo. |
| Centros de Entretenimiento | `/espacios/centros-de-entretenimiento` | Centros de entretenimiento a medida en Bogotá: integración de tecnología y diseño personalizado. |
| Estudios y Home Office | `/espacios/estudios-home-office` | Estudios y home office a medida en Bogotá: espacios de trabajo diseñados para tu productividad. |

---

## 8. Verificación de integridad (pre-entrega)

- [x] Todo bloque de copy en §3 tiene `estado` y `fuente` — ninguno está vacío.
- [x] Las Respuestas Atómicas (§4) están marcadas como provisionales (pendientes de verificación con negocio real).
- [x] No hay testimonios en §5 (no aplica para F-09).
- [x] Las imágenes en §6 no piden producir contenido nuevo — todas son recuperables del sitio actual o del backup `dev-v2-arquitectura-20260804` (I-016).
- [x] El SEO narrativo (§7) cita `plan_seo_2026.md` §2 para el tipo JSON-LD correcto.
- [x] El copy no contradice ninguna decisión cerrada (D1, DC-1, DC-3).
- [x] Los `<title>` de las 6 landings no incluyen "Premium" (decisión 2026-08-09).
- [x] El copy usa el tono Creador Experto (verbos concretos, cero adjetivos impostados).
- [ ] **Pendiente:** Verificar las Respuestas Atómicas (§4) con el negocio real antes de publicar (I-049).
