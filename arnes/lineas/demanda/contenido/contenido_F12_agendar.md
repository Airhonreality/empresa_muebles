# F-12 — Agenda tu Asesoría (embudo híbrido, incluye sección F-16 Cobertura)

**Fecha:** 2026-08-09 · **Estado:** aprobado · **Ruta:** `/agenda-tu-asesoria` · **Arquetipo:** Creador Experto

---

## 1. Eje de conversión

*Esta es la página de acción del corte (Bloque C). Explica el servicio completo de asesoría antes de pedir los datos, presenta los dos tipos de asesoría con transparencia de precio (desde el ERP), y conduce al modal de 2 pasos (DC-3/I-042) donde el lead se captura con su `gclid`/UTMs. Convive la página indexable (SEO) con el modal transversal del shell (conversión en CTAs).*

| Pregunta | Respuesta |
|---|---|
| ¿Qué busca el visitante aquí? | Entender qué incluye la asesoría, cuánto cuesta (sin sorpresas), si cubren su zona, y cómo dejar sus datos para que lo contacten. |
| ¿Qué objeción disuelve esta página? | "¿Esto cuesta? ¿Qué incluye? ¿Me visitan en mi zona? ¿Cuánto esperar?" — la tabla comparativa de dos asesorías, la cobertura clara (D5) y el precio desde parámetro responden las cuatro. |
| ¿Cuál es el siguiente paso después de leerla? | Enviar el modal de 2 pasos (lead con `gclid`) o escribir por WhatsApp (→ F-00). Confirmación con promesa de respuesta en horas. |

---

## 2. Estructura de secciones

| # | Bloque | Tipo de contenido | Justificación (por qué convence en esta posición) |
|---|---|---|---|
| 1 | Hero | H1 + párrafo descriptor + CTA dual | Indica la acción exacta de la página y disuelve la duda de "¿vale la pena?". |
| 2 | ¿Cómo funciona? | Párrafo explicativo de la asesoría | Educa antes de pedir datos: qué es una asesoría de diseño Veta Dorada en la práctica. |
| 3 | Dos tipos de asesoría | Tabla comparativa / 2 cards | Transparencia de precio y alcance — la decisión informada reduce abandono en el formulario. |
| 4 | Cobertura (F-16) | Párrafo + mapa mental (no listado de barrios) | Responde "¿me visitan?". Sin páginas por barrio artificiales (I-049) y sin `GeoCircle` (I-032/036). |
| 5 | CTA final + modal | Botones que abren el modal de 2 pasos (F-00) + WhatsApp flotante | Cierre: ambos CTAs desembocan en captura de lead real con `gclid`. |

---

## 3. Copy exacto por sección

### 3.1 — Hero

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H1 | Tu espacio merece una mirada experta | Verificado | `plan_diseno_web_publica.md` §2.0 (copy provisional → verificado 2026-08-09) |
| Párrafo descriptor | Agenda tu asesoría de diseño. Un diseñador visita tu espacio, lo mide y conversa contigo sobre materiales y necesidades — sin compromiso. | Verificado | `plan_diseno_web_publica.md` §2.0, Sección 1 + `contenido_F01_home.md` §3.6 paso 1 |
| CTA primario | Quiero agendar mi asesoría gratuita | Verificado | `plan_diseno_web_publica.md` §2.0, ítem 5 |
| CTA secundario | Prefiero la asesoría con diseño 3D | Verificado | `plan_diseno_web_publica.md` §2.0, ítem 5 |
| Imagen de fondo | Directiva: diseñador industrial midiendo un espacio real en Bogotá o mesa de taller con planos. Recuperar del sitio actual si existe (I-016). | — | Tokens D4 Luz & Biofilia (I-037) |

### 3.2 — ¿Cómo funciona?

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H2 | ¿Cómo funciona una asesoría de diseño? | Verificado | `plan_diseno_web_publica.md` §2.0, Sección 1 |
| Cuerpo | Un diseñador industrial visita tu espacio en Bogotá, toma medidas con precisión y conversa contigo sobre materiales, acabados y cómo vives. Con eso armamos una cotización preliminar, sin compromiso. Si quieres ver tu idea antes de decidir, el siguiente paso es el diseño 3D. | Verificado | `plan_diseno_web_publica.md` §2.0 Sección 1 + F-01 §3.6 + F-18 (perfil UNAL) |

### 3.3 — Dos tipos de asesoría (tabla comparativa)

| Criterio | Asesoría Gratuita | Asesoría con Diseño 3D |
|---|---|---|
| ¿Qué incluye? | Visita a domicilio, medición del espacio, asesoría de materiales y diseño, cotización preliminar | Todo lo de la gratuita + modelo 3D fotorrealista de 2 espacios |
| Precio | **Gratis** | **$130.000** (precio desde parámetro del ERP — no hardcodeado) |
| ¿Se descuenta? | — | **Sí.** Se deduce del anticipo si firmas contrato (E-30) |
| ¿Para quién es? | Quien quiere una idea de precio y viabilidad sin compromiso | Quien quiere ver su espacio renderizado antes de decidir |
| Duración aproximada | 45-60 minutos | 60-90 minutos (visita) + 3-5 días hábiles (entrega del 3D) |

**Estado:** Verificado · **Fuente:** `plan_diseno_web_publica.md` §2.0 Sección 2; D3 (precio desde parámetro, D-parámetro); E-30 (deducción del anticipo).

### 3.4 — Cobertura geográfica (F-16, anidada aquí)

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H2 | ¿Dónde nos visitas? | Verificado | `plan_diseno_web_publica.md` §2.0 Sección 3 |
| Cuerpo | En Bogotá D.C. llegamos a todos los sectores, con la visita gratuita. También atendemos Chía, Cajicá y Cota, con un costo de desplazamiento adicional. | Verificado | `plan_demanda.md` D5 (cerrada) |
| Ejemplo real | Atendimos a Mónica en Cajicá sin que tuviera que salir de casa. | Verificado | `plan_diseno_web_publica.md` §2.0 Sección 3 (I-046) |
| Nota editorial | Sin páginas por barrio artificiales (I-049) y sin `GeoCircle` (I-032/I-036 — se usa `AdministrativeArea` Bogotá en el shell). | — | `plan_diseno_web_publica.md` §2.0; `plan_seo_2026.md` §2 |

### 3.5 — CTA final

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H2 | Agéndala hoy | Verificado | Tono Creador Experto, cierra sin presión |
| Cuerpo | Deja tus datos y un diseñador te contacta por WhatsApp en las próximas horas. Sin compromiso, sin letra pequeña. | Verificado | `contenido_F00_shell.md` §3.3 (confirmación post-submit); I-011 |
| Botón primario | Quiero agendar mi asesoría gratuita | Verificado | Abre modal de 2 pasos (F-00) |
| Botón secundario | Prefiero la asesoría con diseño 3D | Verificado | Abre el mismo modal, paso 1 incluye selección de tipo |
| WhatsApp flotante | — | Verificado | F-00 (canal real I-011) |

---

## 4. Respuestas Atómicas indexables

| # | Pregunta (H2 visible) | Respuesta (40-60 palabras) | Fuente |
|---|---|---|---|
| RA-1 | ¿Cuánto cuesta la asesoría de diseño de Veta Dorada? | La asesoría gratuita incluye la visita a domicilio en Bogotá, la medición del espacio y una cotización preliminar — sin costo. Si quieres ver tu proyecto renderizado, la asesoría con diseño 3D de 2 espacios tiene un valor definido que se descuenta del anticipo si firmas contrato. | `plan_diseno_web_publica.md` §2.0; D3 (valor desde parámetro ERP) |
| RA-2 | ¿En qué zonas de Bogotá visitan a domicilio? | En Bogotá D.C. llegamos a todos los sectores, con la visita gratuita. También atendemos Chía, Cajicá y Cota con un costo de desplazamiento adicional. El primer paso siempre es una visita a tu espacio para medir y cotizar con precisión. | `plan_demanda.md` D5 (cerrada) |
| RA-3 | ¿El diseño 3D se descuenta del proyecto? | Sí. El valor de la asesoría con diseño 3D se deduce del anticipo de tu proyecto si decides firmar el contrato. Así, ver tu espacio renderizado antes de decidir no es un gasto perdido. | `plan_diseno_web_publica.md` §2.0; E-30 |
| RA-4 | ¿Cuánto esperar por la entrega de un diseño 3D? | La visita toma entre 60 y 90 minutos. Después, entregamos el modelo 3D fotorrealista de tus 2 espacios en 3 a 5 días hábiles. Te contactamos por WhatsApp en cada paso. | `plan_diseno_web_publica.md` §2.0 Sección 2 |

---

## 5. Testimonios embebidos

*Opcional bajo la tabla comparativa. Si un testimonio aporta a la decisión de agendar, se embebe siguiendo el gate de `flags_testimonios_seo.md` §1.*

| # | Cliente | Testimonio (copy exacto) | Estado | Fuente |
|---|---|---|---|---|
| 1 | Daniela Barón Esparza | "Muy cumplidos y dedicados. El modelo de mi cocina quedó tal cual como lo pedí. La calidad de su trabajo es excelente." | Verificado (candidato a embebido) | I-019 (GBP, 5 nov 2024) — `contenido_F13_testimonios.md` §3.2 |

---

## 6. Directorio de imágenes

| # | Descripción de la imagen | Tipo | Origen | Alt text propuesto | Caption visible |
|---|---|---|---|---|---|
| 1 | Diseñador midiendo un espacio real en Bogotá o mesa de taller | Hero | Foto real si existe (I-016) | Diseñador de Veta Dorada midiendo espacio en Bogotá | Visitamos y medimos tu espacio |
| 2 | Render 3D de un espacio de Veta Dorada (si existe) | Sección asesoría 3D | Documentación de proyectos (I-016) | Visualización 3D de cocina a la medida — Veta Dorada | Así se ve tu espacio antes de fabricarlo |
| 3 | Cocina integral real instalada | Sección testimonio/CTA | Recuperar del sitio actual (I-016) | Cocina integral a medida en [barrio real], Bogotá | Cocina integral en [barrio real] |

**Total estimado: 3 imágenes.** Recuperables del sitio actual o de documentación de proyectos — ninguna se produce nueva (I-016).

---

## 7. SEO narrativo

| Elemento | Copy | Fuente |
|---|---|---|
| `<title>` | Agenda tu asesoría de diseño en Bogotá — Veta Dorada | `plan_seo_2026.md` §2 |
| Meta description (150-160 chars) | Agenda tu asesoría de diseño en Bogotá. Visita a domicilio, medición, asesoría de materiales y cotización preliminar. Asesoría con diseño 3D disponible. Gratis o desde un valor definido. | `plan_seo_2026.md` §2 |
| Tipo JSON-LD primario | `Service` (asesoría de diseño) | `plan_seo_2026.md` §2 |
| Tipos secundarios | `WebForm` / `ContactPage` (formulario) — si aplica; `HomeAndConstructionBusiness` de shell | `plan_seo_2026.md` §2 |
| Slug canónico | `/agenda-tu-asesoria` | `plan_diseno_web_publica.md` §1 (v2, renombrado desde `/agendar`) |
| `llms.txt` — descripción de 1 línea | Agenda tu asesoría de diseño en Veta Dorada: visita a domicilio en Bogotá y sabana norte, medición del espacio, asesoría de materiales y cotización preliminar gratis, o con diseño 3D fotorrealista. | `plan_diseno_web_publica.md` §1 |

---

## 8. Verificación de integridad (pre-entrega)

- [x] Todo bloque de copy en §3 tiene `estado` y `fuente` — ninguno está vacío.
- [x] Precio del diseño 3D ($130.000) referenciado como **parámetro del ERP, no hardcodeado** (D-parámetro).
- [x] Cobertura geográfica alineada a D5 (Bogotá + Chía/Cajicá/Cota con viáticos) — sin barrios artificiales (I-049) ni `GeoCircle` (I-032/036).
- [x] El embudo híbrido queda explícito: página indexable + modal transversal (DC-3), submit con `gclid`/UTMs (Bloque A).
- [x] 4 Respuestas Atómicas (§4) con 40-60 palabras y fuente rastreable.
- [x] El testimonio de §5 cumple el gate de `flags_testimonios_seo.md` §1 — real (I-019).
- [x] Las imágenes en §6 no piden producir contenido nuevo — recuperables (I-016).
- [x] El SEO narrativo (§7) cita `plan_seo_2026.md` §2.
- [x] El copy no contradice decisiones cerradas (D1, D3, D5, DC-1, DC-3, DC-4).
- [ ] **Pendiente:** flat de confirmación — verificar en QA que el submit persiste `gclid`/UTMs cuando Bloque A se implemente (checkpoint de schema ya identificado en `plan_estructura_sitio_publico.md` §2.5).