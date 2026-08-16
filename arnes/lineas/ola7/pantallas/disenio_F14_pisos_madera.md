# F-14 — Pisos de Madera (Landing de Restauración)

**Fecha:** 2026-08-15 · **Estado:** propuesta · **Fase:** F7 (Web Pública) · **Ruta:** `/espacios/pisos-de-madera` · **Roles:** público

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`). Esta pantalla es una Landing de conversión estática (marketing), no consume un modelo de base de datos propio, pero inyecta leads.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `leads` | §1 Captación | utmSource, utmMedium, utmCampaign | Si el usuario viene de un ad de pisos, el formulario F-12 embebido persistirá el UTM. |

---

## 2. Estados que transiciona

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| `publico` | Click "Solicitar diagnóstico" | `leads.nuevo` | E-00 (Lead In) | Validación de campos de formulario (F-12 embebido) |

---

## 3. Vocabulario H07 (labels visibles)

*Los botones de acción deben respetar el estándar de la marca.*

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Agendar Asesoría" | `agendar_asesoria` | CTA Primario |
| "Hablamos por WhatsApp" | `whatsapp_cta` | CTA Secundario flotante |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Imágenes reales (anti-invención I-049) | Code review | Las imágenes apuntan a assets reales, no a placeholders IA. |
| R2 | Link directo a F-10 | Breadcrumb válido | Test de renderizado del componente Breadcrumb |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `HeroLanding` | Client | `title, subtitle, backgroundUrl, ctaPrimary` | Estático | `--color-primary`, `Fraunces`, `aspect-ratio` |
| `FeatureGrid` | Server | `features: {title, desc, icon}[]` | Estático | 4 columnas responsivas, iconos D4 |
| `BeforeAfterSlider`| Client | `imageBefore, imageAfter, altText` | Estático | Custom slider handle |
| `TestimonialBlock` | Server | `quote, author` | Estático | Blockquote, `--color-bg-linen` |
| `LeadCaptureModal` | Client | `source="landing_pisos"` | `leads` | Importa lógica de F-12 |

**Patrones M-06 L1 usados:** `Suspense` (para persistencia UTM), diseño responsivo nativo con Tailwind.

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | `page.tsx` mount | Render estático | `pageview` en analítica | — |
| 2 | Click en CTA Diagnóstico | Click botón | Abre modal F-12 de captura | — | — |
| 3 | Submit Modal | Post de formulario | `POST /api/leads` | Persistencia en DB (`leads`) | E-00 |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores | `eslint app/(publico)/espacios/pisos-de-madera/` |
| CA-3 | Renderiza sin errores 500 (Ruta independiente) | `npm run build` asegura prerender |
| CA-4 | Título H1 es exactamente "El piso de madera de su casona merece volver a vivir" | Revisión visual / DOM |

---

## 8. Verificación de integridad (pre-entrega)

Antes de marcar el diseño como "aprobado", el Iniciador verifica:

- [x] Toda entidad en §1 existe en el `REGISTRO_DE_ENTIDADES.md`
- [x] Todo estado en §2 existe en el `REGISTRO_DE_ENTIDADES.md` y en `glosario_h07.md`
- [x] Todo label en §3 existe en `glosario_h07.md`
- [x] Toda regla en §4 tiene verificación mecánica
- [x] Todo componente en §5 usa tokens D4
- [x] Los criterios de aceptación en §7 son ejecutables
