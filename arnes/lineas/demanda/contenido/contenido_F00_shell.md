# F-00 — Shell Global (Header + Footer + WhatsApp + Modal Transversal)

**Fecha:** 2026-08-09 · **Estado:** propuesta · **Ruta:** transversal (todas las páginas públicas) · **Arquetipo:** Creador Experto

---

## 1. Eje de conversión

| Pregunta | Respuesta |
|---|---|
| ¿Qué busca el visitante aquí? | El shell no es una página: es el marco de confianza que envuelve todo el sitio. Si el header no orienta, el visitante se va. Si el footer no ancla la identidad legal, la credibilidad se diluye. Si el botón de WhatsApp no está a un clic, el lead no llega. |
| ¿Qué objeción disuelve esta página? | "¿Quiénes son? ¿Dónde están? ¿Esto es un negocio real?" — el NAP completo en footer + el WhatsApp visible en cada pantalla responden sin que el visitante tenga que buscar. |
| ¿Cuál es el siguiente paso después de leerla? | No aplica — el shell es transversal. El siguiente paso lo decide cada pantalla que lo envuelve. |

---

## 2. Estructura de secciones

| # | Bloque | Tipo de contenido | Justificación (por qué convence en esta posición) |
|---|---|---|---|
| 1 | Header / Nav | Logo + menú de navegación + CTA "Agenda tu Asesoría" | La navegación es el mapa mental del visitante. Si no entiende en 3 segundos qué ofrece el sitio, se pierde. El CTA en el header es la vía rápida al embudo desde cualquier página. |
| 2 | Contenido de la página | (cada F-XX define el suyo) | — |
| 3 | WhatsApp flotante | Botón fijo en esquina inferior derecha, visible en todas las pantallas | WhatsApp es el canal real de contacto (I-011, H8). Tiene que estar a un clic desde cualquier punto del sitio, sin que el visitante tenga que buscar un formulario. |
| 4 | Modal transversal (DC-3) | Modal de 2 pasos que se dispara desde CTAs del resto del sitio | El embudo híbrido (I-042) vive en F-12 como página independiente pero se dispara como modal desde cualquier CTA "Agenda tu Asesoría" del sitio. Esto evita sacar al visitante de su flujo. |
| 5 | Footer | NAP completo + enlaces rápidos + identidad legal | El ancla de confianza al final de cada página. El NAP real (Cra. 72a #71A 57) corrige H6. La marca legal (NIT) disuelve la duda de "¿esto es un negocio de verdad?". |

---

## 3. Copy exacto por sección

### 3.1 — Header / Nav

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| Logo — texto | Veta Dorada | Verificado | `plan_demanda.md` D2, `plan_seo_2026.md` §2 |
| Logo — directiva de imagen | Logotipo de Veta Dorada recuperado del material de marca existente (`MANUAL_MARCA_TOKENS.md`, `destilacion_docs_veta.md`). Si no existe versión digital en alta, usar wordmark tipográfico con Fraunces. | Pendiente recuperación | `destilacion_docs_veta.md` |
| Nav — Inicio | Inicio | Verificado | `plan_estructura_sitio_publico.md` §1 |
| Nav — Espacios | Espacios | Verificado | `plan_diseno_web_publica.md` §1, F-10 |
| Nav — Colecciones | Colecciones | Verificado | `plan_diseno_web_publica.md` §1, F-02 |
| Nav — Portafolio | Portafolio | Verificado | `plan_diseno_web_publica.md` §1, F-03 |
| Nav — Cómo Trabajamos | Cómo Trabajamos | Verificado | `plan_diseno_web_publica.md` §1, F-11 |
| Nav — Conócenos | Conócenos | Verificado | `plan_diseno_web_publica.md` §1, F-18 |
| Nav — Bitácora | Bitácora | Verificado | `plan_diseno_web_publica.md` §1, F-15 |
| Nav — Para Arquitectos | Para Arquitectos | Verificado | `plan_diseno_web_publica.md` §1, F-19 |
| CTA del header | Agenda tu Asesoría | Verificado | `plan_diseno_web_publica.md` §2.0, F-12 |
| Hamburguesa (mobile) | Menú | Verificado | Glosario estándar; tokens D4 ref. |

**Nota sobre jerarquía visible:** en desktop se muestran los 8 items + CTA. En mobile, el menú colapsa en hamburguesa con los mismos items en el mismo orden. "Para Arquitectos" puede aparecer desaturado o en tamaño menor si se prefiere — decisión de diseño visual, no de contenido. El orden respeta el embudo: descubrimiento (Espacios, Colecciones) → interés (Portafolio, Cómo Trabajamos, Conócenos, Bitácora) → prescripción (Para Arquitectos) → acción (Agenda tu Asesoría).

### 3.2 — WhatsApp flotante

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| Tooltip (hover) | ¿Hablamos por WhatsApp? | Verificado | `plan_demanda.md` Bloque C, I-011 |
| Estado del tooltip | Visible 3 segundos al cargar la página, luego se oculta. Reaparece al hacer hover sobre el ícono. | — | Decisión de UX (no bloquea contenido) |
| Mensaje predefinido (URL) | `Hola, vengo del sitio web de Veta Dorada y quiero más información sobre sus espacios de diseño a la medida.` | Verificado | Tono Creador Experto; arquetipo directo, sin jerga de ventas |
| URL completa | `https://wa.me/573025922101?text=Hola%2C%20vengo%20del%20sitio%20web%20de%20Veta%20Dorada%20y%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20espacios%20de%20dise%C3%B1o%20a%20la%20medida.` | Verificado | NAP I-019 |
| Icono | WhatsApp (el oficial, sin modificar). Color: el verde corporativo de WhatsApp es suficiente — no se pinta con tokens D4. | Verificado | `plan_demanda.md` H8, I-011 |

### 3.3 — Modal transversal (DC-3, embudo híbrido I-042)

**Nota:** el modal se dispara desde CTAs del sitio (header, F-01, F-09, F-11). Tiene su propia página en F-12 (`/agenda-tu-asesoria`) donde se explica el servicio completo. El modal es la vía rápida — 2 pasos, sin salir de la página actual. Ambas conviven (recomendación DC-3).

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| Título del modal | Agenda tu asesoría de diseño | Verificado | `plan_diseno_web_publica.md` §2.0 |
| Paso 1 — label | ¿Qué tipo de proyecto tienes en mente? | Verificado | Tono Creador Experto, directo |
| Paso 1 — opciones | Cocina · Closet o vestidor · Centro de entretenimiento · Estudio u home office · Piso de madera · Otro | Verificado | Categorías de F-09 + F-14 |
| Paso 1 — ubicación label | ¿En qué zona de Bogotá está tu espacio? | Verificado | D5 — sin listado de barrios artificiales (I-049). Campo de texto libre, no dropdown. |
| Paso 2 — nombre label | Tu nombre | Verificado | Microcopy estándar |
| Paso 2 — teléfono label | Tu WhatsApp | Verificado | I-011 — el canal real es WhatsApp. "Teléfono" → "Tu WhatsApp" refuerza que la respuesta va por ahí. |
| Paso 2 — nota label | Cuéntanos un poco más (opcional) | Verificado | Tono Creador Experto, sin presión |
| Botón enviar | Enviar y te contactamos hoy | Verificado | `plan_demanda.md` Bloque C — expectativa de respuesta rápida |
| Texto legal bajo el formulario | Tus datos solo se usan para contactarte sobre tu proyecto. No los compartimos. | Verificado | `plan_demanda.md` — transparencia, arquetipo Creador Experto |
| Confirmación (post-submit) | ¡Listo! Te escribimos a tu WhatsApp en las próximas horas. Mientras tanto, puedes ver cómo trabajamos. | Verificado | CTA secundario → F-11 |

### 3.4 — Footer

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| Columna 1 — Logo + eslogan | **Veta Dorada** · Diseña tu espacio. Habita el bienestar. | Verificado | Aprobado por el Supervisor 2026-08-09 (D1 resuelta, versión completa del `Tono de voz de marca.md`). |
| Columna 1 — descripción | Estudio de diseño, manufactura e instalación de espacios integrales en madera. Tres generaciones de oficio en la construcción. | Verificado | `plan_diseno_web_publica.md` §2.3 (F-18), DC-4 |
| Columna 2 — Contacto | Contáctanos | Verificado | Label estándar |
| Columna 2 — dirección | Cra. 72a #71A 57, Bogotá | Verificado | NAP I-019, `plan_seo_2026.md` §2 |
| Columna 2 — teléfono | +57 302 5922101 | Verificado | NAP I-019 |
| Columna 2 — horario | Lun–Sáb 08:00–18:00 | Verificado | NAP I-019, `plan_seo_2026.md` §2 |
| Columna 2 — email | contacto@vetadeoro.co | Pendiente verificación | `plan_seo_2026.md` — solo si el email existe y se monitorea |
| Columna 3 — Enlaces | Enlaces | Verificado | Label estándar |
| Columna 3 — items | Espacios · Colecciones · Portafolio · Cómo Trabajamos · Conócenos · Bitácora · Para Arquitectos · Agenda tu Asesoría | Verificado | `plan_diseno_web_publica.md` §1 |
| Columna 4 — legal | Veta Dorada es una marca comercial registrada. Facturación, contratos, recaudos y garantías operados por HERMANOS GARCIA GONZALEZ SAS, NIT 901421357-9. | Verificado | `plan_seo_2026.md` §2, I-039 |
| Copyright | © 2024–2026 Veta Dorada. Todos los derechos reservados. | Verificado | Fundación estudio 2019, rango de sitio 2024–2026 |

---

## 4. Respuestas Atómicas indexables

No aplica. El shell no tiene contenido indexable propio — es un marco transversal. Las Respuestas Atómicas viven en las páginas donde el visitante se hace la pregunta (F-01, F-09, F-11, F-14, F-18).

Sin embargo, el `Organization` + `HomeAndConstructionBusiness` del JSON-LD transversal (ver §7) lleva NAP completo, que el indexador puede consumir para el panel de conocimiento local.

---

## 5. Testimonios embebidos

No aplica al shell. Los testimonios viven en F-13 (página independiente) y se embeben en F-01 y F-03 (si DC-1 se resuelve a favor).

---

## 6. Directorio de imágenes

| # | Descripción de la imagen | Tipo | Origen | Alt text propuesto | Caption visible |
|---|---|---|---|---|---|
| 1 | Logotipo de Veta Dorada | Logo (header + footer) | Recuperar del material de marca existente (`MANUAL_MARCA_TOKENS.md`). Si no hay versión digital, generar wordmark con Fraunces. | Logotipo de Veta Dorada, estudio de diseño de espacios en madera en Bogotá | No aplica |
| 2 | Favicon | Ícono (16×16, 32×32, 180×180) | Derivar del logotipo o usar una marca simplificada (ej. "V" con veta de madera) | — | No aplica |
| 3 | Ícono WhatsApp | SVG del botón flotante | WhatsApp brand assets oficiales (no modificar color) | — | No aplica |
| 4 | Imagen de fondo — modal | Textura sutil de madera o tono `linen` D4 | D4 token `--color-bg-linen` como fallback; imagen real si existe en el banco de Veta Dorada | — | No aplica |

---

## 7. SEO narrativo

| Elemento | Copy | Fuente |
|---|---|---|
| `<title>` | Veta Dorada — Diseño y fabricación de espacios en madera a la medida en Bogotá | `plan_seo_2026.md` §2 — HomeAndConstructionBusiness |
| Meta description (150-160 chars) | Estudio de diseño, manufactura e instalación de cocinas, closets, centros de entretenimiento y espacios integrales en madera en Bogotá. Tres generaciones de oficio. | Tono Creador Experto, NAP embebido en JSON-LD |
| Tipo JSON-LD primario (transversal) | `HomeAndConstructionBusiness` + `Organization` | `plan_seo_2026.md` §2 |
| Tipos secundarios | `WebSite` (SearchAction), `BreadcrumbList` (por página) | `plan_seo_2026.md` §2 |
| Slug canónico | No aplica — el shell no tiene ruta propia. | — |
| `llms.txt` — descripción del sitio | Veta Dorada: estudio de diseño, manufactura e instalación de espacios integrales en madera en Bogotá. Cocinas, closets, centros de entretenimiento, estudios, pisos de madera. Servicio a la medida sin intermediarios. Fundado en 2019 sobre tres generaciones de oficio en la construcción. | `plan_diseno_web_publica.md` §1 embudo |
| `sameAs` | Solo incluir si se verifica: Perfil de Empresa en Google, Instagram (@vetadorada — pendiente verificar existencia) | `plan_seo_2026.md` §2 — nunca inventar perfiles |

**Campos del JSON-LD transversal `HomeAndConstructionBusiness` (no es código — es la narrativa de qué datos van):**

| Campo | Valor | Fuente |
|---|---|---|
| `name` | Veta Dorada | `plan_seo_2026.md` §2 |
| `description` | Estudio de diseño, manufactura e instalación de espacios integrales de experiencia premium en Bogotá. | `plan_diseno_web_publica.md` §2.3 |
| `foundingDate` | 2019 | DC-4 — fundación del estudio |
| `foundingLocation` | Bogotá, CO | DC-4 |
| `address` | Cra. 72a #71A 57, Bogotá, 111061, CO | NAP I-019 |
| `telephone` | +57 302 5922101 | NAP I-019 |
| `openingHoursSpecification` | Lu-Sá 08:00-18:00 | NAP I-019 |
| `openingDate` | 2014 | DC-4 — constitución SAS |
| `priceRange` | $$ | `plan_seo_2026.md` §2 |
| `areaServed` | `AdministrativeArea` → name: Bogotá | `plan_seo_2026.md` §2 — sin GeoCircle |
| `url` | Dominio canónico del sitio | `plan_seo_2026.md` §1 |
| `sameAs` | Solo URLs verificadas (Google Business Profile, Instagram si existe) | Nunca inventar perfiles |
| `founder` (×2) | Hugo García (Maestría en obra) · Airhon J. García (Diseñador industrial UNAL) | `plan_diseno_web_publica.md` §2.3, F-18 |
| `parentOrganization` | HERMANOS GARCIA GONZALEZ SAS, NIT 901421357-9 | `plan_seo_2026.md` §2 |

---

## 8. Verificación de integridad (pre-entrega)

- [x] Todo bloque de copy en §3 tiene `estado` y `fuente` — ninguno está vacío. Dos items marcados provisional (D1 eslogan, email pendiente verificación). Resto verificados.
- [x] Sin Respuestas Atómicas (§4) — el shell no tiene contenido indexable propio.
- [x] Sin testimonios (§5) — el shell es transversal.
- [x] Las imágenes en §6 no piden producir contenido nuevo — logo a recuperar, íconos de WhatsApp oficiales, fondo con token D4.
- [x] El SEO narrativo (§7) cita `plan_seo_2026.md` §2 para los tipos JSON-LD correctos.
- [x] El copy no contradice ninguna decisión cerrada (D2/D3/D4/D5/DC-4).
- [x] El copy no usa términos inventados — NAP verificado contra I-019, identidad legal contra I-039, fundación contra DC-4.
- [ ] **Pendiente:** verificar disponibilidad de logotipo en alta resolución. El wordmark tipográfico con Fraunces es un fallback aceptable si no existe.
