# PLANTILLA DE CONTENIDO — Copy exacto y estructura de secciones

**Aplica a pantallas públicas F-XX. Contrato vivo de la línea de demanda.** Todo archivo `contenido_FXX.md` sigue esta estructura. El objetivo: el Iniciador del bucle F-web recibe este archivo + `plan_diseno_web_publica.md` + `plan_seo_2026.md` y tiene TODO el copy cerrado para destilar `disenio_FXX.md` sin inventar una línea.

---

## F-XX — [Nombre de la pantalla en lenguaje de negocio]

**Fecha:** YYYY-MM-DD · **Estado:** [borrador / aprobado] · **Ruta:** `/...` · **Arquetipo:** Creador Experto

---

## 1. Eje de conversión

*Qué convence en esta página y por qué alguien que la lee da el siguiente paso. Una o dos frases. Siempre anclado al arquetipo Creador Experto y al tono de marca destilado (`destilacion_docs_veta.md`).*

| Pregunta | Respuesta |
|---|---|
| ¿Qué busca el visitante aquí? | |
| ¿Qué objeción disuelve esta página? | |
| ¿Cuál es el siguiente paso después de leerla? | (→ F-XX) |

---

## 2. Estructura de secciones

*Orden de los bloques que componen la página, de arriba hacia abajo. Cada bloque tiene una justificación de engagement (por qué está ahí, no solo qué contiene).*

| # | Bloque | Tipo de contenido | Justificación (por qué convence en esta posición) |
|---|---|---|---|
| 1 | Hero | H1 + subtítulo + CTA | |
| 2 | [Sección] | ... | |

---

## 3. Copy exacto por sección

*Cada bloque de texto tiene estado (provisional / verificado) y fuente. Nunca se escribe copy sin fuente rastreable.*

### 3.1 — Hero

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H1 | | | |
| Subtítulo | | | |
| CTA primario | | | |
| CTA secundario | | | |
| Imagen de fondo | Directiva (no URL): qué tipo de imagen, qué evoca | — | |

### 3.2 — [Nombre de la sección]

| Elemento | Copy | Estado | Fuente |
|---|---|---|---|
| H2 | | | |
| Cuerpo (párrafo) | | | |
| Microcopy / labels | | | |
| CTA (si aplica) | | | |

*(Repetir 3.3, 3.4... por cada sección de la estructura)*

---

## 4. Respuestas Atómicas indexables

*Preguntas de cola larga respondidas en esta página como `<h2>` visible en el DOM. 40-60 palabras por respuesta. Cada una con su fuente canónica. No se usa `FAQPage` (deprecado por Google).*

| # | Pregunta (H2 visible) | Respuesta (40-60 palabras) | Fuente |
|---|---|---|---|
| RA-1 | | | |

---

## 5. Testimonios embebidos

*Texto de testimonio si existe y está verificado. Si DC-1 está abierta, se marca como `pendiente — subordinado a DC-1`. Nunca inventar testimonios.*

| # | Cliente | Testimonio (copy exacto) | Estado | Fuente |
|---|---|---|---|---|
| | | | | |

---

## 6. Directorio de imágenes

*Qué imágenes necesita esta página. Directiva, no URL. Origen: recuperar del sitio actual (I-016) o a definir con Supervisor. Cada imagen sigue la guía de 5 niveles (`plan_seo_2026.md` §3).*

| # | Descripción de la imagen | Tipo | Origen | Alt text propuesto | Caption visible |
|---|---|---|---|---|---|
| 1 | | Hero / galería / testimonio / ícono | | | |

---

## 7. SEO narrativo

*Lo que el agente de SEO necesita para esta página. No es implementación — es el contenido de los metadatos.*

| Elemento | Copy | Fuente |
|---|---|---|
| `<title>` | | |
| Meta description (150-160 chars) | | |
| Tipo JSON-LD primario | | `plan_seo_2026.md` §2 |
| Tipos secundarios | | `plan_seo_2026.md` §2 |
| Slug canónico | | |
| `llms.txt` — descripción de 1 línea | | |

---

## 8. Verificación de integridad (pre-entrega)

Antes de marcar el contenido como "aprobado", se verifica:

- [ ] Todo bloque de copy en §3 tiene `estado` y `fuente` — ninguno está vacío.
- [ ] Todas las Respuestas Atómicas (§4) tienen 40-60 palabras y fuente rastreable.
- [ ] Ningún testimonio (§5) es inventado — cada uno está verificado o marcado como pendiente de DC-1.
- [ ] Las imágenes en §6 no piden producir contenido nuevo — todas son recuperables del sitio actual o a definir con Supervisor.
- [ ] El SEO narrativo (§7) cita `plan_seo_2026.md` §2 para el tipo JSON-LD correcto.
- [ ] El copy no contradice ninguna decisión cerrada (D2/D3/D4/D5/DC-4).
- [ ] El copy no usa términos inventados — todo label citable desde `glosario_h07.md`, `REGISTRO_DE_ENTIDADES.md` o el sistema de tono destilado.
