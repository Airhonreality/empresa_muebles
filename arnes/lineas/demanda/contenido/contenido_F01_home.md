# F-01 — Home / Landing Principal

**Fecha:** 2026-08-09 · **Estado:** propuesta · **Ruta:** `/` · **Arquetipo:** Creador Experto

---

## 1. Eje de conversión

| Pregunta | Respuesta |
|---|---|
| ¿Qué busca el visitante aquí? | Saber si esta empresa puede hacer el espacio que tiene en mente, y si vale la pena dar el siguiente paso. No busca "inspiración de Pinterest": busca evidencia de oficio real. |
| ¿Qué objeción disuelve esta página? | "¿Son confiables? ¿Fabrican de verdad o solo revenden? ¿Entienden lo que yo necesito?" — la validación técnica, el conocimiento de Bogotá y la Respuesta Atómica responden las tres. |
| ¿Cuál es el siguiente paso después de leerla? | Agendar una asesoría gratuita (→ F-12) o escribir por WhatsApp (→ F-00). |

---

## 2. Estructura de secciones

| # | Bloque | Tipo de contenido | Justificación (por qué convence en esta posición) |
|---|---|---|---|
| 1 | Hero | H1 + subtítulo + párrafo descriptor + CTA dual + Respuesta Atómica | El visitante decide en 3 segundos si se queda. El H1 dice exactamente qué hacen. La Respuesta Atómica bajo el H1 define el negocio para el indexador y el lector. |
| 2 | Validación Técnica | Grid de 3 cards con íconos | Tres razones concretas para confiar, no tres adjetivos. Cada card responde una duda latente: el 3D (¿cómo sé que va a quedar bien?), la fábrica propia (¿esto es un intermediario?), el diseñador dedicado (¿entienden lo que necesito?). |
| 3 | Conocemos Bogotá | Párrafo único + CTA | La diferenciación local real. El copy ya estaba escrito y aprobado. Justifica la visita gratuita sin disculparla — es exactamente el antídoto contra la comoditización. |
| 4 | Espacios que creamos | Grid de 7 categorías con imagen + nombre | El visitante busca una categoría concreta (cocina, closet, estudio). Verla en este grid confirma que Veta Dorada hace ESE tipo de espacio. Cada tarjeta enlaza a su landing F-09. |
| 5 | Cómo trabajamos | 4 pasos resumidos con numeración | Reduce la fricción mental: el visitante entiende el proceso en 4 pasos antes de decidir agendar. Sin jerga, sin sorpresas. |
| 6 | Proyectos realizados | Teaser de 3 proyectos con foto + ubicación | La prueba visual más fuerte: espacios reales en Bogotá, con ubicación. Sin precios, sin montajes de catálogo. |
| 7 | Conócenos (teaser) | Card con timeline 1995→2014→2019 + CTA | Tres generaciones en una frase. La historia completa vive en F-18; acá solo la semilla de confianza. |
| 8 | Respuesta Atómica secundaria | Pregunta H2 + 40-60 palabras | "¿Cuánto cuesta un mueble a la medida en Bogotá?" — la pregunta de precio que todo visitante se hace y que el sitio responde con honestidad en vez de esconder. |
| 9 | Sección de testimonios | Testimonios reales curados (3-4) con nombre, barrio y tipo de proyecto | DC-1 resuelta 2026-08-09 (testimonios ACTIVA). Jose Talero (I-050) + 3 reseñas de GBP (I-019: Glenda Danuro, Daniela Barón Esparza, Juan Spiro, Madeline Attara). Sin `aggregateRating` falso. |
| 10 | CTA final | CTA dual (Agenda tu Asesoría + WhatsApp) | El cierre del embudo. El visitante ya leyó qué hacen, cómo trabajan y qué han hecho. Ahora decide — y el botón está a un clic. |

---

## 3. Copy exacto por sección

### 3.1 — Hero

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H1 | Carpintería arquitectónica. Diseñamos, fabricamos, instalamos. | Verificado | Aprobado 2026-08-09. Reemplaza "alta precisión" (impostado) por copy en tono Creador Experto: verbos concretos, cero adjetivos. |
| Subtítulo (eslogan) | Diseña tu espacio. Habita el bienestar. | Verificado | Aprobado por el Supervisor 2026-08-09 — versión completa del `Tono de voz de marca.md` (D1 resuelta). |
| Párrafo descriptor | Diseñamos, fabricamos e instalamos espacios integrales en madera. Tres generaciones de oficio en la construcción, un estudio de diseño al frente, y la fábrica en el mismo lugar. Sin intermediarios. | Verificado | Sintetizado de `destilacion_docs_veta.md` §12.5 + DC-4 (línea de tiempo) |
| CTA primario | Agenda tu asesoría gratuita | Verificado | `plan_diseno_web_publica.md` §2.0, F-12 |
| Imagen de fondo | Directiva: fotografía de un espacio terminado por Veta Dorada — cocina o centro de entretenimiento con luz natural. Sin renders, sin fotos de banco de imágenes. Si no hay foto real disponible, usar token D4 `--color-bg-linen` como fondo. | — | Tokens D4 Luz & Biofilia (I-037): luz solar y fotografía natural, no verde literal. |

### 3.2 — Respuesta Atómica primaria (bajo el H1)

*Nota: esta Respuesta Atómica va inmediatamente debajo del párrafo descriptor del hero, como `<h2>` visible en el DOM. Es indexable y reemplaza al `FAQPage` deprecado de Google.*

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| Pregunta (H2) | ¿Qué es Veta Dorada? | Verificado | `plan_diseno_web_publica.md` §2.6 — diseño axiomático: una sola fuente canónica por pregunta |
| Respuesta (~46 palabras) | Somos un estudio de carpintería arquitectónica en Bogotá. Diseñamos, fabricamos e instalamos cocinas, closets, centros de entretenimiento y espacios integrales en madera — todo a la medida, con diseño contemporáneo y manufactura en taller propio. Tres generaciones de oficio en la construcción, desde 1995. | Verificado | `destilacion_docs_veta.md` §12.5 y §6.1 (posicionamiento "estudio de carpintería arquitectónica"); I-041; DC-4 línea de tiempo |

### 3.3 — Validación Técnica (grid de 3 cards)

*Nota de método: las tres cards vienen del plan de julio (`destilacion_docs_veta.md` §12.5). La tercera ("Asesoría con diseñadores") estaba vacía en el original — se rellena con copy del sistema de tono aprobado, no inventado.*

| Card | Título | Cuerpo | Estado | Fuente |
|---|---|---|---|---|
| 1 | Disminuye la incertidumbre | Visualizas tu espacio en 3D antes de cortar la primera pieza. Así ves exactamente cómo quedará y tomas decisiones con toda la información. | Verificado | `destilacion_docs_veta.md` §12.5; D3 (diseño 3D como parte de la asesoría con costo) |
| 2 | Punto de Fábrica Directo | Diseñamos y fabricamos en nuestro propio taller. Sin intermediarios, sin sobrecostos, sin perder calidad en cada eslabón de la cadena. | Verificado | `destilacion_docs_veta.md` §12.5; `plan_diseno_web_publica.md` §2.3 (F-18 — taller propio) |
| 3 | Asesoría con diseñadores | Tu proyecto lo acompaña un diseñador industrial de la Universidad Nacional de principio a fin. No vendemos catálogos: diseñamos contigo cada espacio para que responda a cómo vives. | Verificado | `destilacion_docs_veta.md` §12.5 (tercer card vacío en original — rellenado con copy del sistema de tono); F-18 perfil Airhon J. García (UNAL, diseñador industrial) |
| Iconografía | Íconos lineales con token D4 `gold-200`. Card 1: cubo 3D / Card 2: fábrica o engranaje / Card 3: lápiz y escuadra. Sin verde literal (I-037). | — | Tokens D4 Luz & Biofilia |

### 3.4 — Conocemos Bogotá

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H2 | Conocemos la arquitectura de Bogotá. | Verificado | `destilacion_docs_veta.md` §6.1 — copy aprobado en Tono de voz de marca. **Usar textual, sin modificar.** |
| Cuerpo | Sabemos cómo entrar a tu conjunto residencial cumpliendo todos los protocolos y entendemos que cada muro tiene desniveles únicos que exigen una medición técnica exacta en persona. | Verificado | `destilacion_docs_veta.md` §6.1 — copy aprobado textual |
| CTA | Agendar una visita a mi espacio | Verificado | → F-12. Tono: el CTA natural después de leer que "entendemos los muros de Bogotá". |

### 3.5 — Espacios que creamos (grid de 7 categorías)

| Categoría | Ruta | Imagen directiva | Estado | Fuente |
|---|---|---|---|---|
| Cocinas Integrales | `/espacios/cocinas-integrales-bogota` | Cocina real instalada por Veta Dorada, luz natural. Recuperar del sitio actual (I-016). | Verificado | F-09 landing |
| Closets y Vestidores | `/espacios/closets-vestidores-bogota` | Closet o vestidor real, puertas abiertas, interior visible. | Verificado | F-09 landing |
| Centros de Entretenimiento | `/espacios/centros-de-entretenimiento` | Mueble de TV con iluminación integrada, espacio real. | Verificado | F-09 landing |
| Estudios y Home Office | `/espacios/estudios-home-office` | Escritorio y estantería a la medida en espacio real. | Verificado | F-09 landing |
| Cavas y Bares | `/espacios/cavas-y-bares` | Cava o bar en madera, detalle de iluminación. | Verificado | F-09 landing |
| Consolas y Recibidores | `/espacios/consolas-recibidores` | Consola de entrada o recibidor en espacio real. | Verificado | F-09 landing |
| Pisos de Madera | `/espacios/pisos-de-madera` | Piso restaurado de casona bogotana, antes/después. | Verificado | F-14, `plan_diseno_web_publica.md` §2.1 |
| H2 de la sección | Espacios que creamos | Verificado | Tono Creador Experto: "crear" un espacio, no "vender" un mueble |
| CTA debajo del grid | Ver todos los espacios | Verificado | → F-10 |

### 3.6 — Cómo trabajamos (4 pasos resumidos)

| Paso | Título | Cuerpo | Estado | Fuente |
|---|---|---|---|---|
| 1 | Visita y diseño | Visitamos tu espacio, lo medimos con precisión y conversamos sobre materiales, acabados y necesidades. Sin compromiso, sin costo. | Verificado | `plan_estructura_sitio_publico.md` §2.4 (F-11) + "Conocemos Bogotá" |
| 2 | Cotización detallada | Recibes un presupuesto línea por línea con materiales, tiempos y alcance. Sin sorpresas, sin costos ocultos. | Verificado | `plan_estructura_sitio_publico.md` §2.4, F-11 |
| 3 | Producción en taller | Fabricamos cada pieza en nuestro taller con los materiales y acabados que elegiste. Tú puedes corroborar acabados en físico durante la etapa de negociación. | Verificado | `plan_estructura_sitio_publico.md` §2.4, F-11 + `plan_diseno_web_publica.md` §2.6 (nota de acabados) |
| 4 | Entrega e instalación | Llevamos cada pieza a tu espacio, la instalamos y dejamos todo funcionando. Con garantía y acompañamiento. | Verificado | `plan_estructura_sitio_publico.md` §2.4, F-11 |
| H2 de la sección | Cómo trabajamos | Verificado | `plan_estructura_sitio_publico.md` §2.4 |
| CTA debajo de los pasos | Conoce el proceso completo | Verificado | → F-11 |

### 3.7 — Proyectos realizados (teaser de 3)

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H2 de la sección | Proyectos que hablan por nosotros | Verificado | Tono Creador Experto: los proyectos hablan, no la publicidad |
| Proyecto 1 | Primer caso documentado de portafolio. Si Jose Talero (I-050) tiene documentación completa (antes/después + testimonio), va primero. Si no, el proyecto canónico de `plan_f10_migracion.md` (Cocina Márquez). | Pendiente de selección | I-050, `plan_f10_migracion.md`, F-03 |
| Proyecto 2 | Segundo proyecto documentado. | Pendiente | F-03 |
| Proyecto 3 | Tercer proyecto documentado. | Pendiente | F-03 |
| CTA debajo de los 3 proyectos | Ver portafolio completo | Verificado | → F-03 |
| Nota | Cada teaser muestra: 1 foto 16:9, nombre del espacio, ubicación (barrio real, no inventado — I-049), y tipo de proyecto. Sin precios. | — | `plan_diseno_web_publica.md` Bloques D/E; `destilacion_docs_veta.md` §12.5 (Portafolio Aspiracional 16:9) |

### 3.8 — Conócenos (teaser)

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H2 de la sección | Tres generaciones construyendo. Un estudio diseñando. | Verificado | `plan_diseno_web_publica.md` §2.3 (F-18) — copy aprobado del hero de F-18 |
| Cuerpo | Del oficio en la obra al diseño contemporáneo. Hugo García conoce cada etapa de construcción como pocos. Airhon J. García traduce esa experiencia al lenguaje del diseño. Juntos, en Veta Dorada, entregan espacios que se habitan con gusto. | Verificado | `plan_diseno_web_publica.md` §2.3 — sintetizado de los perfiles de F-18; DC-4 |
| CTA | Conoce nuestra historia | Verificado | → F-18 |

### 3.9 — Respuesta Atómica secundaria (precio)

*Segunda Respuesta Atómica en la home. Responde la pregunta que todo visitante se hace: ¿cuánto cuesta? Sin dar cifras inventadas, sin esconder la respuesta detrás de un formulario.*

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H2 | ¿Cuánto cuesta un mueble a la medida en Bogotá? | Verificado | `plan_diseno_web_publica.md` §2.6 — diseño axiomático: distribuir respuestas, no agrupar en FAQ |
| Respuesta (~50 palabras) | El precio de un espacio a la medida depende del tamaño, los materiales y la complejidad del diseño. Una cocina integral no cuesta lo mismo que un closet, y los acabados definen buena parte del presupuesto. La forma de saberlo con certeza es una visita a tu espacio: medimos, diseñamos y cotizamos sin compromiso. | Verificado | Tono Creador Experto: honestidad sin ambigüedad. Sin rangos de precio inventados (I-049). La respuesta deriva naturalmente a F-12. |
| CTA embebido en la respuesta | Agendar una visita sin costo | Verificado | → F-12 |

### 3.10 — Testimonios (sección bloqueada por DC-1)

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H2 de la sección | Lo que dicen nuestros clientes | Verificado | `plan_diseno_web_publica.md` F-13 |
| Estado real | Sección activa (DC-1 resuelta 2026-08-09). Mostrar 3-4 testimonios reales con nombre, barrio y tipo de proyecto, curados por protocolo I-013. Sin `aggregateRating` fabricado (regla anti-invención #1). Contenido en `contenido_F13_testimonios.md`. | Verificado | `REGISTRO_DE_ENTIDADES.md` §10 (testimonios ACTIVA); `plan_seo_2026.md` §1 (regla anti-invención #1) |

### 3.11 — CTA final

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H2 | ¿Hablamos de tu espacio? | Verificado | Tono Creador Experto: directo, sin presión de venta |
| Cuerpo | Cuéntanos qué tienes en mente. Un diseñador te escucha, visita tu espacio y te entrega una cotización detallada sin compromiso. | Verificado | `plan_diseno_web_publica.md` §2.0 |
| CTA primario | Agenda tu asesoría gratuita | Verificado | → F-12 |

---

## 4. Respuestas Atómicas indexables

*Dos en esta página — ver §3.2 y §3.9 para el texto completo y fuentes.*

| # | Pregunta (H2 visible) | Respuesta (resumen) | Fuente |
|---|---|---|---|
| RA-1 | ¿Qué es Veta Dorada? | Estudio de carpintería arquitectónica en Bogotá. Diseño + fabricación + instalación sin intermediarios. 46 palabras — ver §3.2. | `destilacion_docs_veta.md` §12.5, I-041 |
| RA-2 | ¿Cuánto cuesta un mueble a la medida en Bogotá? | Depende del espacio, materiales y diseño. La respuesta honesta deriva a agendar una visita sin costo. ~50 palabras — ver §3.9. | `plan_diseno_web_publica.md` §2.6 |

---

## 5. Testimonios embebidos

| # | Cliente | Testimonio (copy exacto) | Estado | Fuente |
|---|---|---|---|---|
| 1 | Jose Talero | Pendiente de recuperar texto real del testimonio y proceso (I-050, tabla Notion). Semilla prioritaria. | Verificable — D1/DC-1 resueltas | I-050 |
| 2 | Glenda Danuro | "Cumplieron muy buen trabajo." — ★★★★★ en Google | Pendiente de mapear a `proyectoId`/`clienteId` | I-019 (GBP) |
| 3 | Daniela Barón Esparza | "Muy cumplidos y dedicados. El modelo de mi cocina quedó tal cual como lo pedí. La calidad de su trabajo es excelente." — ★★★★★ en Google | Pendiente de mapear a `proyectoId`/`clienteId` | I-019 (GBP) |
| 4 | Juan Spiro | "Excelente trabajo muy recomendados" — ★★★★★ en Google | Pendiente de mapear a `proyectoId`/`clienteId` | I-019 (GBP) |
| 5 | Madeline Attara | "Agradecida con los trabajos obtenidos. Muy buen servicio pre y post venta. Super recomendado." — ★★★★★ en Google | Pendiente de mapear a `proyectoId`/`clienteId` | I-019 (GBP) |

---

## 6. Directorio de imágenes

| # | Descripción de la imagen | Tipo | Origen | Alt text propuesto | Caption visible |
|---|---|---|---|---|---|
| 1 | Cocina o centro de entretenimiento real con luz natural — espacio terminado por Veta Dorada | Hero (`fetchpriority="high"`) | Recuperar del sitio actual (I-016). Si no hay, usar token D4 `linen`. | Cocina integral en madera diseñada y fabricada por Veta Dorada en Bogotá | Cocina integral instalada en [barrio real], Bogotá |
| 2 | Modelo 3D o espacio en diseño — Card 1 Validación | Card (ícono o imagen pequeña) | Representación de diseño 3D (croquis, no render de stock) | Visualización de diseño 3D previa a fabricación — Veta Dorada | — |
| 3 | Detalle de taller — Card 2 Validación | Card | Foto real del taller de Veta Dorada (si existe) | Taller de fabricación de muebles en madera — Veta Dorada, Bogotá | — |
| 4 | Diseñador midiendo espacio — Card 3 Validación | Card | Foto real de visita a domicilio (si existe) | Diseñador industrial de Veta Dorada midiendo espacio en Bogotá | — |
| 5-11 | Una foto real por categoría de espacio (7 imágenes) | Grid de categorías | Recuperar del sitio actual — las 6 landings existentes (I-016). F-14 (Pisos de Madera) requiere par antes/después. | Ver `plan_seo_2026.md` §3 — 5 niveles de metadatos por imagen | Material + ubicación real (60-120 chars) |
| 12-14 | Un proyecto real por teaser (3 imágenes) | Portafolio teaser 16:9 | Del portafolio real. Si Jose Talero tiene documentación, una de las 3 es su proyecto. | Ver `plan_seo_2026.md` §3 | Nombre del proyecto + barrio real |

**Total estimado: 14-16 imágenes.** Todas recuperables del sitio actual o de la documentación de proyectos — ninguna se produce nueva (I-016).

---

## 7. SEO narrativo

| Elemento | Copy | Fuente |
|---|---|---|
| `<title>` | Veta Dorada — Carpintería arquitectónica en Bogotá | `plan_seo_2026.md` §2; H1 verificado |
| Meta description (150-160 chars) | Estudio de carpintería arquitectónica en Bogotá. Diseñamos, fabricamos e instalamos cocinas, closets, centros de entretenimiento y espacios integrales en madera a la medida. Tres generaciones de oficio. | `plan_seo_2026.md` §2; `destilacion_docs_veta.md` §12.5 |
| Tipo JSON-LD primario | `HomeAndConstructionBusiness` + `Organization` | `plan_seo_2026.md` §2 tabla F-01 |
| Tipos secundarios | `WebSite` (SearchAction) | `plan_seo_2026.md` §2 |
| Slug canónico | `/` | — |
| `llms.txt` — descripción de 1 línea | Página principal de Veta Dorada: estudio de carpintería arquitectónica en Bogotá. Diseño, fabricación e instalación de cocinas, closets, centros de entretenimiento y espacios en madera a la medida. Tres generaciones de oficio, taller propio, sin intermediarios. | `plan_diseno_web_publica.md` §1 embudo |
| Nota SEO | Incluir `BreadcrumbList` solo si hay jerarquía (la home es raíz — no lleva breadcrumb). El `WebSite` con `SearchAction` permite el cuadro de búsqueda en SERP. | `plan_seo_2026.md` §2 |

**Datos del JSON-LD `HomeAndConstructionBusiness` específicos de F-01 (complementan los del F-00 shell):**

| Campo | Valor | Fuente |
|---|---|---|
| `image` | URL de la imagen del hero | `plan_seo_2026.md` §2 (sin `aggregateRating`) |
| `review` (×N) | Solo si hay testimonios reales curados con `Review` (DC-1 resuelta 2026-08-09) | Nunca inventar — regla anti-invención #1 |

---

## 8. Verificación de integridad (pre-entrega)

- [x] Todo bloque de copy en §3 tiene `estado` y `fuente` — ninguno está vacío. 1 item provisional (email en F-00 footer). 3 proyectos de portafolio pendientes de selección (dependen de casos reales documentados).
- [x] Dos Respuestas Atómicas (§4) con 40-60 palabras y fuente rastreable.
- [x] Testimonios (§5) sin texto inventado — Jose Talero (I-050) + 4 reseñas reales GBP (I-019) con atribución a Google.
- [x] Las imágenes en §6 no piden producir contenido nuevo — todas son recuperables del sitio actual o de documentación de proyectos.
- [x] El SEO narrativo (§7) cita `plan_seo_2026.md` §2 para el tipo JSON-LD correcto.
- [x] El copy no contradice ninguna decisión cerrada (D2/D3/D4/D5/DC-4).
- [x] El hero usa copy aprobado ("Carpintería arquitectónica. Diseñamos, fabricamos, instalamos." — 2026-08-09, reemplaza "alta precisión").
- [x] La card "Asesoría con diseñadores" (antes vacía) se rellena con copy del sistema de tono aprobado — no inventado.
- [x] El párrafo "Conocemos la arquitectura de Bogotá" se usa textual del copy aprobado en `Tono de voz de marca.md`.
- [ ] **Pendiente:** seleccionar los 3 proyectos reales del portafolio para la sección teaser. Jose Talero (I-050) es candidato #1 si tiene documentación.
- [ ] **Pendiente:** recuperar las imágenes de las 6 landings (I-016) para el grid de espacios.
- [x] **Resuelto:** D1 eslogan cerrado por el Supervisor 2026-08-09 — "Diseña tu espacio. Habita el bienestar." (versión completa del `Tono de voz de marca.md`).
