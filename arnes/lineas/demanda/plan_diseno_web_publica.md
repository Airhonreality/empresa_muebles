# Diseño de Web Pública — Universo completo de pantallas + determinantes

**Fecha:** 2026-08-08 · **Estado:** propuesta (v3 — pantallas de confianza, conversión y segmento B2B) · **Tipo:** síntesis (no schema, no código) · **Riesgo:** bajo (documento; las decisiones que contiene son de riesgo alto)

**Regla de sucesión (C3, `diagnostico_de_proceso.md` §6):** este documento **continúa y amplía** `plan_estructura_sitio_publico.md` (2026-08-08). No lo reemplaza — su §1 (F-00..F-13) sigue vigente como base de determinantes de las pantallas ya inventariadas. Este plan extiende el mapa y cruza cada pantalla con los determinantes de `plan_demanda.md` (Bloques A-F, decisiones D1-D5), los 54 insights del `log_insights_fase2.md`, y los tokens D4 (`app/globals.css`). Las pantallas F-02/F-03/F-07/F-08 ya diseñadas (`disenio_F0X.md` en `ola7/pantallas/`) **no se rediseñan aquí**; solo se registra qué les falta desde la óptica de demanda.

**Historial de versiones:**
- **v1 (2026-08-08):** inventario inicial F-00..F-16, determinantes, aproximación de detalle.
- **v2 (2026-08-08):** reprocesado con engagement robusto — rutas SEO-friendly, jerarquía corregida (F-14 anidado bajo F-10, F-16 bajo F-12), F-15 renombrada "Bitácora de Diseño", F-12 expandida con dos tiers de asesoría.
- **v3 (2026-08-08):** análisis de gaps vs. competencia documentada en `destilacion_docs_veta.md`. Incorpora F-17 "Cotiza tu Espacio" (requerimiento bloqueado), F-18 "Conócenos" (historia + perfiles Hugo García y Airhon J. García), F-19 "Para Arquitectos y Diseñadores" (segmento B2B). Línea de tiempo corregida: 1995 (tradición familiar) → 2014 (constitución SAS) → 2019 (fundación estudio Veta Dorada). FAQ descartado como página independiente por diseño axiomático (Nam P. Suh).

**Eslogan provisional:** "Habita en el bienestar" (D1 abierta en t-112; este valor desbloquea el copy del hero pero NO decide el eslogan definitivo).

**Línea de tiempo canónica (DC-4 cerrada 2026-08-08):**
- **1995:** tradición familiar en la construcción — el abuelo fabricando ladrillos; Hugo García y hermanos en obra y remodelación.
- **2014:** constitución legal HERMANOS GARCIA GONZALEZ S.A.S. (NIT 901421357-9). `openingDate` en ficha de Google = 2014.
- **2019:** fundación de Veta Dorada como estudio de diseño, manufactura e instalación de espacios integrales de experiencia premium.

---

## 0. Auditoría de partida — qué deja la base y qué falta

**C4 (ritual de reingreso):** `plan_estructura_sitio_publico.md` (2026-08-08) es el último plan del dominio. Se evalúa antes de continuar.

| Qué cubre la base | Estado | Qué falta para este plan |
|---|---|---|
| F-00 Shell global | Determinantes y requisitos definidos; footer con NAP, WhatsApp flotante, header D4 | Confirmar que el botón WhatsApp use el número real (`57 302 5922101`). Cross-reference con F-12 (embudo híbrido). |
| F-01 Home / Landing | Determinantes definidos (Bloque C, tokens Luz & Biofilia, CTA dual, prueba social, Respuesta Atómica). Bloqueada por D1 (eslogan) | Desbloqueo temporal con "Habita en el bienestar". Falta copy del hero y Respuesta Atómica (transcrita de I-041). |
| F-02 Tienda · F-03 Portafolio · F-07 Portal · F-08 Propuesta | Diseñadas (`disenio_F0X.md` aprobados) | Solo adendas de demanda (WhatsApp en F-02, testimonio embebido en F-03 dependiente de DC-1). |
| F-09 Landings SEO (×6) | Determinantes definidos. Imágenes rotas (I-016) — recuperar, no producir. D5 cierra geografía | Detalle de contenido por categoría (copy real del sistema de marca). Requisito de imágenes reales. |
| F-10 Índice de Espacios | Determinantes definidos. **v2:** incluye acceso a F-14 (pisos) como categoría adicional en el grid. | Agregar tarjeta "Pisos de Madera" → `/espacios/pisos-de-madera`. |
| F-11 Cómo Trabajamos | Determinantes definidos (4 pasos, tres tiempos 1995→2014→2019, arquetipo Creador Experto). **v2:** ruta renombrada `/proceso` → `/como-trabajamos`. **v3:** nota de acabados — para leads cualificados en negociación se corrobora el acabado en físico. | Agregar nota sobre corroboración de acabados en etapa de negociación. |
| F-12 Agenda tu Asesoría (embudo híbrido) | Determinantes definidos (I-011 WhatsApp, I-042 modal 2 pasos, `gclid`). Bloquea corte. **v2:** ruta renombrada `/agendar` → `/agenda-tu-asesoria`. Alcance expandido: incluye detalle de los dos tipos de asesoría + anida F-16. | Dos tiers de servicio explicados. Sección de cobertura geográfica integrada. DC-3. |
| F-13 Testimonios | Determinantes definidos, **bloqueada por DC-1** (adelantar `testimonios` del estado DIFERIDO en el REGISTRO). | Igual que la base — no se resuelve aquí. Jose Talero como primer caso (I-050). |
| F-14 Pisos de Madera | **v2: anidado bajo F-10.** I-014 — restauración no mapeada. Sin entrada propia en menú principal. | Ruta: `/espacios/pisos-de-madera`. |
| F-15 Bitácora de Diseño | **v2: renombrado desde "Noticiario".** Blog/casos de estudio. **v3:** entrada programada "Tipos de materiales" (categoría Materiales y Técnica). | Agregar entrada canónica de la bitácora sobre tipos de materiales (madera, barnices, acabados). No es pantalla — es artículo SEO. |
| F-16 Áreas de Servicio | **v2: anidado bajo F-12.** Sin página independiente. | Sección dentro de F-12. |
| **F-17** Cotiza tu Espacio | **Nuevo (v3). Requerimiento de web final, bloqueado.** Cotizador público orientativo con rangos. Incluye garantía (2 años), hitos de pago, diseño 3D deducible. | **POSTPUESTO POST-LANZAMIENTO (decisión 2026-08-19).** Gate de publicación: parámetros de costos definidos en ERP (F0). Ver §2.5 y `TAREAS_DIFERIDAS.md` §7. |
| **F-18** Conócenos | **Nuevo (v3).** Historia del taller + perfiles de Hugo García y Airhon J. García. Fundación 2019. **D-matriz RESUELTA 2026-08-19** (copy final en `contenido_F18_conocenos.md` §9). | Ruta: `/conocenos`. Ver §2.3. |
| **F-19** Para Arquitectos y Diseñadores | **Nuevo (v3).** Segmento B2B para prescriptores (D2, I-021). Canales de cotización técnica, planos, condiciones comerciales. | Ruta: `/para-arquitectos`. Ver §2.4. |

**Conclusión:** la base F-00..F-13 está sólida. Este plan refina jerarquía, mejora rutas SEO, y agrega las pantallas de confianza y conversión que el análisis competitivo (`destilacion_docs_veta.md`, competidores con showroom/calculadoras/tarifas) señala como ausentes. El subsistema SEO es entregable separado: `plan_seo_2026.md`.

---

## 1. Universo completo de pantallas públicas

Namespace F-XX (frontstage). F-02/03/07/08 se conservan tal cual.

| # | Pantalla | Ruta | Estado | Determinante (demanda) | Artefacto técnico |
|---|---|---|---|---|---|
| **F-00** | Shell global | transversal | Por diseñar | H6 NAP, H8 WhatsApp (Bloque C, I-011/I-019/I-039/I-042) | Ninguno aún |
| **F-01** | Home / Landing | `/` | Por diseñar | Bloque C (embudo híbrido, tokens D4, "Habita en el bienestar" provisional) | Ninguno aún |
| **F-02** | Tienda Web | `/colecciones`, `[slug]` | Diseñado (propuesta) | Adenda: WhatsApp en `ProductoDetalle` | `disenio_F02_tienda_web.md` |
| **F-03** | Portafolio | `/portafolio`, `[slug]` | Diseñado (propuesta) | Bloque D (motor SEO/prueba social); adenda: testimonio embebido (DC-1) | `disenio_F03_portafolio_proyectos.md` |
| F-04/05/06 | Checkout tienda | — | Diferido | Fuera de alcance | — |
| **F-07** | Portal Cliente | `/cuenta/proyectos...` | Diseñado (propuesta) | Post-venta | `disenio_F07_portal_cliente.md` |
| **F-08** | Propuesta Pública | `/propuesta/{slug}` | Diseñado (propuesta), pausado | Post-lead | `disenio_F08_propuesta_publica.md` |
| **F-09** | Landings SEO (×6) | `/espacios/[categoria]` | Por diseñar | Bloque C (recuperar imágenes, no producir; D5 geografía cierra) | Ninguno aún |
| **F-10** | Índice de Espacios | `/espacios` | Por diseñar | Bloque C. Incluye tarjeta "Pisos de Madera" → F-14. | Ninguno aún |
| **F-11** | Cómo Trabajamos | `/como-trabajamos` | Por diseñar | Bloque C (confianza, Creador Experto). Nota: acabados en físico para leads cualificados. | Ninguno aún |
| **F-12** | Agenda tu Asesoría | `/agenda-tu-asesoria` | Por diseñar | Bloque A+C (I-011 bloqueante, I-042 hook, DC-3). Dos tiers + cobertura F-16. | Ninguno aún |
| **F-13** | Testimonios | transversal + `/testimonios` | Por diseñar, bloqueado por DC-1 | Bloque C (H7, Jose Talero I-050) | Ninguno aún |
| **F-14** | Pisos de Madera | `/espacios/pisos-de-madera` | Anidado bajo F-10 | I-014. Restauración: pulido, reparación, sellado. | §2.1 |
| **F-15** | Bitácora de Diseño | `/bitacora`, `/bitacora/[slug]` | Por diseñar | Bloque E + Bloque D. Contenido orgánico. Entrada: "Tipos de materiales". | §2.2 |
| **F-16** | Áreas de Servicio | (sección dentro de F-12) | Anidado bajo F-12 | D5 (Bogotá + Chía/Cajicá/Cota). Sin página independiente. | §2.0 |
| **F-17** | Cotiza tu Espacio | `/cotiza-tu-espacio` | **POSTPUESTO POST-LANZAMIENTO (2026-08-19)** | Rangos orientativos + garantía (2 años) + hitos de pago + 3D deducible. **Bloqueado** hasta parámetros de costos en ERP. Fuera del alcance del lanzamiento actual. | §2.5 |
| **F-18** | Conócenos | `/conocenos` | **Nuevo (v3)** | Historia (1995→2014→2019), perfiles Hugo García + Airhon J. García, oficio, confianza artesanal. Copy con matriz de ponderación. | §2.3 |
| **F-19** | Para Arquitectos | `/para-arquitectos` | **Nuevo (v3)** | Segmento prescriptor B2B (D2, I-021). Canales, planos, condiciones comerciales. | §2.4 |

**Embudo sobre este mapa:** F-09/F-10 (descubrimiento SEO, incluye F-14) → F-01/F-11/F-15/F-18 (interés y confianza) → F-03/F-13/F-17 (decisión: portafolio, prueba social, precio orientativo) → F-12 (acción: agenda tu asesoría, incluye cobertura F-16) → F-08 (propuesta) → F-07 (post-venta). F-19 es transversal para prescriptores.

**Total: 12 pantallas nuevas por diseñar** (F-00, F-01, F-09×6 landings, F-10, F-11, F-12, F-13, F-14, F-15, F-18, F-19) + 1 requerimiento bloqueado (F-17). F-14 se diseña como parte del sistema de espacios. F-16 es sección de F-12.

---

## 2. Pantallas nuevas — determinantes, requisitos y aproximación de detalle

### 2.0 — F-12 Agenda tu Asesoría de Diseño (incluye F-16 Áreas de Servicio)

**Engagement:** el nombre "Agenda tu Asesoría" le dice al indexador y al visitante exactamente qué hace esta página. No es un formulario genérico de "agendar": es la página donde el cliente entiende el servicio completo antes de decidirse. La cobertura geográfica (F-16) se integra como sección natural — _"¿Dónde nos visitas?"_ — en vez de ser una página separada que nadie buscaría por sí sola.

| Determinantes | Origen |
|---|---|
| **I-011 (🚨 bloqueante del corte):** WhatsApp conectado antes del merge. | `plan_demanda.md` Bloque C |
| **I-042:** portar el embudo híbrido (modal de 2 pasos + redirección). | `plan_demanda.md` Bloque C |
| Bloque A: captura de `gclid`/`utm_*` en el submit. | `plan_demanda.md` Bloque A |
| **D3 cerrada:** diseño 3D = $130.000 + DIAN por 2 espacios, deducible del anticipo (E-30). | `plan_demanda.md` D3 |
| **D5 cerrada:** Bogotá + municipios sabana norte (Chía, Cajicá, Cota) con viáticos. | `plan_demanda.md` D5 |
| **DC-3:** ¿modal transversal (F-00) o página independiente? Este plan recomienda: **ambas**. Página independiente para SEO/indexación + modal transversal desde CTAs del resto del sitio. | `plan_estructura_sitio_publico.md` DC-3 |
| NAP real: Cra. 72a #71A 57, Bogotá. Tel: 302 5922101. Lun-Sáb 08:00-18:00. | I-019 |

**Requisitos de contenido — la página explica el servicio completo:**

1. **Hero:** _"Tu espacio merece una mirada experta. Agenda tu asesoría de diseño."_ (copy provisional, arquetipo Creador Experto).
2. **Sección 1 — ¿Cómo funciona?:** explicación breve de qué es una asesoría de diseño Veta Dorada (visita a domicilio, medición del espacio, conversación sobre materiales y necesidades, cotización preliminar).
3. **Sección 2 — Dos tipos de asesoría (tabla comparativa o cards):**

   | | Asesoría Gratuita | Asesoría con Diseño 3D |
   |---|---|---|
   | ¿Qué incluye? | Visita a domicilio, medición del espacio, asesoría de materiales y diseño, cotización preliminar | Todo lo de la gratuita + modelo 3D fotorrealista de 2 espacios |
   | Precio | **Gratis** | **$130.000** (precio desde el ERP, parámetro configurable) |
   | ¿El diseño 3D se descuenta? | — | **Sí.** Se deduce del anticipo si firmas contrato (E-30) |
   | ¿Para quién es? | Quien quiere una idea de precio y viabilidad sin compromiso | Quien quiere ver su espacio renderizado antes de decidir |
   | Duración aproximada | 45-60 minutos | 60-90 minutos (visita) + 3-5 días hábiles (entrega del 3D) |

4. **Sección 3 — Cobertura (F-16 anidada aquí):** _"¿Dónde nos visitas?"_
   - Bogotá D.C.: todos los sectores. Visita gratuita.
   - Chía, Cajicá, Cota: con costo de desplazamiento adicional.
   - Ejemplo: _"Atendimos a Mónica en Cajicá sin que tuviera que salir de casa"_ (I-046).
   - Sin páginas por barrio artificiales (disciplina I-049).
   - Sin `GeoCircle` (I-032/I-036 — `AdministrativeArea`, solo Bogotá).
5. **CTA dual al final de la página:** botón principal _"Quiero agendar mi asesoría gratuita"_ (abre modal de 2 pasos) + botón secundario _"Prefiero la asesoría con diseño 3D"_ (mismo modal, paso 1 incluye selección de tipo) + WhatsApp flotante (F-00).
6. **Modal de 2 pasos (I-042):** Paso 1 — tipo de asesoría (gratuita / con 3D) + tipo de proyecto + ubicación. Paso 2 — nombre, teléfono, nota. El submit persiste `gclid`/UTMs en `leads`.

**Aproximación de detalle:**
- Sección comparativa con 2 columnas responsivas, badges D4 (`mist` para "Gratis", `gold-200` para "Recomendado").
- Sección de cobertura compacta (1-2 párrafos, sin listado de 13 ejes).
- Modal: `Suspense` alrededor de `useSearchParams` (CLS). `useGclidCapture` (hook puro, `sessionStorage`).
- JSON-LD: `Service` con `offers` para ambos tipos (gratuito y pago). `areaServed`: `AdministrativeArea` (Bogotá) + `City` (Chía, Cajicá, Cota).

**Criterio de hecho (C2):** un lead real entra con su `gclid` guardado, eligiendo tipo de asesoría, y la página `/agenda-tu-asesoria` responde 200 con la tabla de dos tiers y la sección de cobertura correcta (sin páginas locales artificiales).

---

### 2.1 — F-14 Pisos de Madera (anidado bajo F-10 Índice de Espacios)

**Jerarquía corregida (v3 - Actualización 2026-08-15):** F-14 se incluye dentro del menú desplegable transversal (mega-menú) bajo "Espacios", al igual que las 6 landings SEO (F-09). Esta actualización reemplaza la directiva anterior de "evitar saturar la navegación", priorizando en su lugar la transferencia de PageRank (SEO) desde el Header hacia las páginas transaccionales y reduciendo la fricción (UX) a un solo click. La ruta se mantiene como `/espacios/pisos-de-madera`.

| Determinantes | Origen |
|---|---|
| I-014: servicio real de restauración de pisos (pulido, reparación, sellado) no mapeado en `logica_de_negocio.md`. Perfil de cliente distinto: casonas en Teusaquillo y Chapinero. | `destilacion_docs_veta.md` §6.2, `log_insights_fase2.md` I-014 |
| Tono: arquetipo Creador Experto. Piso de madera como patrimonio arquitectónico, no como superficie. | `Tono de voz de marca.md`, `plan_demanda.md` §1 |
| D5: Bogotá (se desplaza a domicilio) + Chía/Cajicá/Cota con viáticos. | `plan_demanda.md` §1 |
| Este servicio **no está en el schema actual ni en las landings**. | `logica_de_negocio.md` (ausente) |

**Requisitos de contenido:**
1. Hero: _"El piso de madera de su casona merece volver a vivir."_ (copy provisional, arquetipo Creador Experto).
2. Secciones: Proceso de restauración (diagnóstico → pulido → reparación de piezas sueltas → sellado con acabado natural) · Materiales (barnices al agua, poliuretano bajo VOC) · Galería antes/después (3-4 pares de fotos reales) · CTA: _"Solicitar diagnóstico gratuito"_.
3. Respuesta Atómica visible bajo el H1: _"¿Cada cuánto se debe pulir un piso de madera en Bogotá?"_ + 40-60 palabras sobre humedad bogotana y frecuencia 5-7 años.
4. Testimonio embebido si existe (dependiente de DC-1).
5. Breadcrumb: `Inicio > Espacios > Pisos de Madera` (refuerza la jerarquía para el indexador).
6. En F-10: tarjeta "Pisos de Madera" en el grid de categorías, junto a las 6 existentes.

**Aproximación de detalle (wire):**
- Hero con `fetchpriority="high"`, imagen de piso restaurado en casona bogotana, `aspect-ratio` explícito.
- Grid de 4 pasos con iconos D4 (sin verde literal — biofilia por fotografía).
- Galería antes/después con `figcaption` visible (material + ubicación).
- CTA dual: _"Solicitar diagnóstico gratuito"_ (→ /agenda-tu-asesoria) + _"Hablar por WhatsApp"_ (F-00).
- Tokens: `--font-display Fraunces` para H1, `--color-bg-linen` para sección alterna.

**Criterio de hecho:** la página `/espacios/pisos-de-madera` responde 200 con al menos 1 par de fotos antes/después reales. No aparece en el menú principal. F-10 la enlaza como categoría adicional.

---

### 2.2 — F-15 Bitácora de Diseño (blog / Sistema de Proyectos)

**Engagement robusto (reprocesado v2):** "Noticiario" era un nombre genérico, sin ancla en el nicho, sin estilo. **"Bitácora de Diseño"** evoca tres cosas a la vez: (1) el cuaderno de obra del artesano — oficio, registro, autenticidad; (2) la bitácora del arquitecto — proyecto, proceso, decisión; (3) el blog contemporáneo de diseño — aspiracional sin ser pretencioso. El nombre solo ya posiciona: esto no es un blog genérico de muebles, es el diario de trabajo de un taller de carpintería arquitectónica.

**v3:** se programa una **entrada canónica** bajo la categoría *Materiales y Técnica*:
- **"Tipos de materiales para muebles a la medida en Bogotá"** (`/bitacora/tipos-de-materiales`). Contenido: maderas (roble, cedro, melamina RH), barnices (poliuretano al agua, lacas), acabados (mate, satinado, texturado), herrajes. Formato largo (1200+ palabras), Respuesta Atómica, galería de muestras, CTA a agenda. Es artículo SEO de cola larga — no es pantalla nueva.

| Determinantes | Origen |
|---|---|
| Destilación §6.5: el sitio actual no tiene canal de contenido orgánico. | `destilacion_docs_veta.md` §6.5 |
| Bloques D/E del plan de demanda: Sistema de Proyectos (1 proyecto → 1 página SEO → 10 fotos → 1 caso de estudio) + Máquina de Contenidos (16 piezas de Notion mapeadas a embudo). | `plan_demanda.md` Bloques D/E |
| I-049: _"Se gana Chicó habiendo hecho una cocina en Chicó, no escribiendo una página sobre Chicó"_. Contenido real, no inventado. | `log_insights_fase2.md` I-049 |
| I-050: material real — Jose Talero con testimonio y proceso documentados. | I-050 |
| Arquetipo Creador Experto: contenido que demuestra autoridad técnica sin jerga pretenciosa. | `plan_demanda.md` §1 |

**Estrategia de engagement por tipo de lector:**

| Lector | Qué busca | Qué le da la Bitácora |
|---|---|---|
| Arquitecto / diseñador (prescriptor) | Referencias técnicas, materiales, procesos reales | Casos de estudio con fichas técnicas, materiales usados, decisiones de diseño |
| Familia / pareja (comprador final) | Inspiración, ver que "sí se puede", confianza | Antes/después, historias de clientes reales, fotos de obra terminada |
| Google (indexador) | Contenido original, bien estructurado, con entidades | H1 + H2 semánticos, Respuesta Atómica, JSON-LD `Article`, imágenes con alt real |

**Requisitos de contenido:**
1. **Portada (`/bitacora`):** grid de artículos con fecha, categoría, extracto, imagen. Sin paginación infinita (indexable). Categorías: Casos de Estudio · Materiales y Técnica · Diseño y Arquitectura · Mantenimiento.
2. **Artículo / Caso de Estudio (`/bitacora/[slug]`):** página SEO completa con Respuesta Atómica, galería con `figcaption`, CTA de agendar + WhatsApp, testimonio del cliente si existe. JSON-LD `Article` o `BlogPosting`.
3. **Semilla:** primer caso de estudio = Jose Talero (testimonio + proceso documentados, I-050). Segundo caso = el primer proyecto real del Bloque D. Entrada "Tipos de materiales" como artículo de referencia permanente.
4. **Regla dura:** cada artículo deriva de un proyecto real entregado. Nada de contenido genérico de IA (disciplina I-049).
5. La máquina de contenidos (16 piezas, Bloque E) produce formatos cortos (Instagram/Pinterest) derivados del mismo caso de estudio.

**Aproximación de detalle:**
- Portada: `repeat(auto-fill, minmax(min(100%, 320px), 1fr))`, tarjetas con `aspect-ratio`, `figcaption` con fecha + categoría.
- Artículo: H1 + Respuesta Atómica (<h2> visible) + cuerpo con imágenes intercaladas (`ImageObject` JSON-LD por imagen, 5 niveles de metadatos del `plan_seo_2026.md`).
- CTA final: _"¿Quiere un proyecto así? Agende su asesoría de diseño"_ (→ /agenda-tu-asesoria) + WhatsApp.
- `robots.txt` permitiendo indexación; `canonical` en cada artículo; `sitemap` incluye `/bitacora/*`.

**Criterio de hecho:** al menos 1 artículo/caso de estudio real publicado (Jose Talero) con 200, imágenes reales, y JSON-LD `Article` válido. La portada indexa todos los artículos.

---

### 2.3 — F-18 Conócenos (historia, oficio, personas)

**Engagement:** la competencia documentada en `destilacion_docs_veta.md` compite con showroom físico en el norte de Bogotá. Veta Dorada no tiene showroom — compite con **historia real y oficio demostrable**. Esta pantalla responde a la pregunta que todo cliente de alto valor se hace antes de contratar carpintería arquitectónica: _"¿Quiénes son y por qué debería confiarles mi espacio?"_

La página cuenta tres generaciones de oficio en la construcción — del abuelo ladrillero a la fundación del estudio — y presenta a las dos personas detrás de cada proyecto. El tono es sobrio, sin hipérbole: no se vende "lujo", se muestra **maestría**.

**Perfiles (copy refinado, pendiente de matriz de verificación):**

**Hugo García — Maestría en obra.**
El oficio se hereda y se cultiva. Hugo creció entre ladrillos, mezclas y planos, en una familia dedicada a la construcción y la remodelación desde 1995. De esas décadas en obra salen la sensibilidad para distribuir un espacio —que una cocina respire y un closet funcione— y el conocimiento técnico que pocos talleres tienen: pinturas, estructuras, acabados, instalaciones de gas y electricidad. Hugo conoce la obra completa: gestiona proyectos de principio a fin, entrega acabados de calidad, y domina cada etapa porque la ha vivido. Esa maestría en obra —formada con años, errores y aciertos— es la mirada con la que cada proyecto entra a Veta Dorada y se convierte en un espacio que se habita con gusto.

**Airhon J. García — Diseñador.**
Diseñador industrial de la Universidad Nacional de Colombia. Su recorrido cruza el prototipado digital y análogo: impresión 3D, postformado, termoformado. Ha diseñado mobiliario, piezas de decoración interior y sistemas de almacenamiento. Lo mueve una convicción: la bioinspiración —integrar la naturaleza al diseño para que cada espacio dialogue con quien lo vive. Airhon traduce la experiencia técnica de la obra al lenguaje del diseño contemporáneo: espacios con intención.

**Historia:** 1971. El padre de Hugo García fabricaba ladrillos. 1995. Hugo y sus hermanos, liderados por Víctor García, se dedicaron a la construcción y la remodelación. En 2014 se constituye formalmente la sociedad (HERMANOS GARCIA GONZALEZ S.A.S.). En **2019** nace **Veta Dorada**: un estudio que integra diseño, manufactura e instalación en un solo servicio, para entregar espacios integrales de experiencia premium — sin intermediarios, sin showroom genérico, con la obra y el diseño en la misma mesa.

**Matriz de ponderación requerida (no ejecutada aquí):**
Cada afirmación del copy debe verificarse contra estos criterios antes de publicarse:

| Afirmación | Veracidad | Tono (Creador Experto) | No-invención | Decisión |
|---|---|---|---|---|---|
| Tres generaciones en la construcción | Verificar con los protagonistas | ✅ | Sin exagerar antigüedad | Pendiente |
| Padre de Hugo: ladrillos desde 1971 | ¿Relato verificable? ¿Se publica? | Sobrio | No inventar detalles | Pendiente |
| Hugo y hermanos: construcción desde 1995 | Verificar año real de inicio | ✅ | Solo lo comprobable | Pendiente |
| Víctor García lideraba la empresa familiar | Verificar nombre y rol | ✅ | Sin inflar | Pendiente |
| Hugo: experiencia en gas/electricidad, gestión de proyectos | Verificar alcance real | ✅ | Solo lo comprobable | Pendiente |
| Airhon: prototipado 3D, bioinspiración, UNAL | Verificar portafolio y título | ✅ | Sin inflar | Pendiente |
| Fundación estudio Veta Dorada 2019 | ✅ Confirmado (DC-4) | ✅ | 2019, no antes | Cerrado |
| "Espacios integrales de experiencia premium" | ✅ Alineado con D2/D3 | ✅ | Sin falsificar | Cerrado |

**Aproximación de detalle:**
- Hero: _"Tres generaciones construyendo. Un estudio diseñando."_ (copy provisional, tono Creador Experto).
- Sección 1: narrativa de la historia en 3 párrafos (abuelo → Hugo en obra → fundación estudio 2019).
- Sección 2: dos cards con foto + texto de cada perfil. Layout side-by-side en desktop, stacked en mobile.
- Sección 3: CTA _"Conozca nuestro trabajo"_ → F-03 Portafolio + _"Agende su asesoría"_ → F-12.
- Tokens D4: `--font-display Fraunces` para nombres, `--color-bg-linen` para sección de historia, `--color-charcoal-900` para cuerpo de texto.

**Criterio de hecho:** la página `/conocenos` responde 200 con los dos perfiles (Hugo García, Airhon J. García), la línea de tiempo 1995→2014→2019, y cada afirmación pública pasó la matriz de ponderación.

---

### 2.4 — F-19 Para Arquitectos y Diseñadores (segmento B2B)

| Determinantes | Origen |
|---|---|
| D2: arquetipo El Creador Experto incluye prescriptores como audiencia (arquitectos, diseñadores de interiores, constructores). | `plan_demanda.md` D2 |
| I-021: segmento B2B no modelado ni visible. Los competidores captan por prescripción — este canal no está habilitado. | `log_insights_fase2.md` I-021 |
| Competidores como Homarq, Amaderarte y otros operan con canales B2B implícitos (cotización por volumen, descuento por gremio). | `destilacion_docs_veta.md` §5, tabla de tarifas |

**Requisitos de contenido:**
1. **Hero:** _"Diseñe con quien fabrica. Sin intermediarios."_ (copy provisional).
2. **Sección 1 — ¿Por qué trabajar con Veta Dorada?:** diseño + manufactura + instalación integrados. Sin sobrecostos de tercerización. Comunicación directa con el taller.
3. **Sección 2 — Canales de cotización para prescriptores:**
   - Recibimos planos (PDF, DWG, SketchUp) y devolvemos cotización detallada en 3-5 días hábiles.
   - Modelado BIM bajo acuerdo (no se ofrece como estándar — verificar viabilidad técnica).
   - Condiciones comerciales para volumen recurrente (descuento por gremio — por definir con Supervisor).
4. **Sección 3 — Proyectos para terceros:** _"Si usted diseña y nosotros fabricamos, su cliente recibe un solo servicio con su firma y nuestra manufactura."_ — modelo white-label o co-branded (decisión pendiente del Supervisor).
5. CTA: _"Envíe su proyecto para cotizar"_ (formulario con adjunto de planos) + WhatsApp directo.

**Aproximación de detalle:**
- Página compacta, 2-3 secciones, sin catálogo (el portafolio B2B es F-03).
- Formulario con upload de archivos (PDF/DWG, máx. 10 MB).
- JSON-LD: `ProfessionalService`.

**Criterio de hecho:** la página `/para-arquitectos` responde 200, el formulario acepta adjuntos, y el lead B2B llega con canal = `prescriptor`.

---

### 2.5 — F-17 Cotiza tu Espacio (requerimiento de web final — POSTPUESTO POST-LANZAMIENTO)

**Estado: requerimiento bloqueado y diferido post-lanzamiento (decisión 2026-08-19).** Esta pantalla no se diseña ni se implementa en la fase actual ni en la 2ª actualización de la web post-corte. Se anota como requisito para una iteración futura. No es bloqueante del lanzamiento.

**Gate de publicación (cuando se active):** el ERP debe tener definidos —vía parámetros— los costos base, rangos de precio por tipo de espacio y las reglas de cálculo que alimentan el cotizador. Sin esos datos, cualquier cifra mostrada sería inventada (viola regla anti-invención I-049).

**Alcance previsto (para cuando se active):**
- Ruta: `/cotiza-tu-espacio`.
- Contenido: rangos orientativos por tipo de espacio (cocina desde $X, closet desde $Y — nunca cifra exacta). Sección de garantía (2 años, 8-12 días hábiles). Sección de cómo se paga (anticipo, hitos, diseño 3D deducible). CTA dual: _"Quiero una cotización exacta"_ (→ /agenda-tu-asesoria) + WhatsApp.
- No reemplaza F-12 (Agenda tu Asesoría) — la complementa para el segmento que investiga precios antes de contactar.

---

### 2.6 — Otras adendas de la v3

**F-11 Cómo Trabajamos — nota de acabados:**
Para leads cualificados en etapa de negociación, el proceso incluye corroboración de acabados en físico: _"Antes de aprobar su proyecto, siempre puede corroborar los acabados en físico"_ — no se envían muestras a domicilio como oferta pública; es un servicio que ocurre durante la negociación con leads calificados.

**FAQ / Respuestas Atómicas — decisión de diseño axiomático (Nam P. Suh):**
- **No se crea página de FAQ independiente.** Aplicando los dos axiomas: (1) **Independencia** — cada respuesta a una objeción es un requisito funcional distinto que debe tener una sola fuente canónica, sin acoplarse a otras; una página FAQ duplicaría contenido ya presente en F-01, F-09, F-12 y F-15 (defecto #1 del legacy: contenido repetido). (2) **Información** — el diseño con menor contenido de información es distribuir cada Respuesta Atómica como componente reutilizable (`RespuestaAtomica`) en la página donde es contextualmente relevante, con una sola fuente de verdad por pregunta.
- **Estrategia de cola larga:** las Respuestas Atómicas son indexables por Google (H2 visible). Opcionalmente, un artículo largo en la Bitácora ("12 preguntas frecuentes sobre muebles a la medida en Bogotá", categoría Diseño y Arquitectura) puede agruparlas sin duplicar — cada referencia enlaza a la fuente canónica.

---

## 3. Adendas a pantallas ya diseñadas (F-02, F-03)

| Pantalla | Qué le falta desde la óptica de demanda |
|---|---|
| **F-02 Tienda Web** | Botón WhatsApp/consulta en `ProductoDetalle` (hoy solo tiene "compartir"). No se edita `disenio_F02_tienda_web.md` sin checkpoint — se registra aquí como adenda pendiente. |
| **F-03 Portafolio** | Es el motor del Bloque D. Cita `precio_referencial` (ya cubierto). Falta testimonio embebido por proyecto (dependiente de DC-1). Adenda registrada, no ejecutada sin checkpoint. |

---

## 4. Decisiones abiertas que bloquean pantallas

| ID | Decisión | Bloquea | Origen |
|---|---|---|---|
| D1 | Eslogan definitivo (t-112) | ~~F-01 (hero definitivo). Desbloqueo temporal: _"Habita en el bienestar"_~~ **RESUELTA 2026-08-09.** "Diseña tu espacio. Habita el bienestar." (versión completa del `Tono de voz de marca.md`). | `plan_demanda.md` D1 (cerrada) |
| **DC-1** | `testimonios` está DIFERIDO en REGISTRO (E-55). ~~Bloque C pide antes del corte.~~ **RESUELTA 2026-08-09.** Adelantar tabla (cambio de estado en el canon). F-13, sección de F-01/F-03, F-14/F-15 desbloqueadas. | F-13, sección de F-01/F-03, F-14/F-15 | `plan_estructura_sitio_publico.md` DC-1 (resuelta) |
| **DC-3** | Embudo híbrido: ¿modal transversal (F-00) o solo página independiente? ~~Este plan recomienda: **ambas.**~~ **RESUELTA 2026-08-09.** Página `/agenda-tu-asesoria` para SEO + modal transversal para CTAs. | F-00, F-12 | `plan_estructura_sitio_publico.md` DC-3 (resuelta) |
| **DC-4** | Línea de tiempo canónica — **CERRADA** (2026-08-08). 1995 tradición familiar → 2014 constitución SAS → 2019 fundación estudio Veta Dorada. `openingDate` en ficha de Google = 2014. El 1995 vive en el relato de marca, no en el dato estructurado. | — (cerrada) | Supervisor |
| **D-parámetro** | El precio de la asesoría con diseño 3D ($130.000) debe venir de un parámetro del ERP, no hardcodeado. Lo mismo para los rangos de F-17 cuando se active. | F-12 (tiers), F-17 (cotizador) | `plan_demanda.md` D3 |
| **D-B2B** | Condiciones comerciales para prescriptores (descuento por gremio, modelo white-label vs. co-branded). | F-19 | Supervisor |
| **D-matriz** | Matriz de ponderación para el copy de F-18 (6 afirmaciones por verificar — ver §2.3). **RESUELTA 2026-08-19** por el Supervisor — copy final aplicado en `contenido_F18_conocenos.md` §9 (sin 1971, sin "liderados por Víctor", abuelo fabricaba ladrillos, Hugo gestión de obras + infraestructura/plomería/electricidad/gas/acabados, Airhon "buen vivir" con salvedad de confirmación). | F-18 (copy definitivo) | Este documento + `contenido_F18_conocenos.md` §9 |

---

## 5. Orden de construcción recomendado

Siguiendo `plan_demanda.md` §3 (WIP=1, C1) y mapeado a pantallas:

1. **Bloque A** (medición) — sin pantalla propia, condiciona el submit de F-12.
2. **Bloque B** (Google Business Profile) — sin pantallas del sitio.
3. **Bloque C** (el corte): F-00 → F-12 (incluye sección F-16) → F-01 → F-18 → F-09 (6 landings, recuperar imágenes) → F-10 (incluye tarjeta a F-14) → F-14 → F-11 → F-15 → F-19. F-13 si DC-1 se resuelve a favor.
4. **Bloque D** (Sistema de Proyectos) — F-03 con contenido real + F-15 primer caso de estudio.
5. **Bloque E** (Máquina de contenidos) — deriva de D, alimenta F-15 (incluye entrada "Tipos de materiales").
6. **F-17** — se activa solo cuando los parámetros de costos existan en ERP.

---

## 6. Qué NO hace este documento

- No decide D1, DC-1, DC-3, D-B2B ni D-matriz — eso es del Supervisor.
- No ejecuta la matriz de ponderación del copy de F-18 — la exige como requisito previo a publicar.
- No diseña F-17 — es un requerimiento anotado, bloqueado hasta que el ERP tenga parámetros de costos.
- No crea página de FAQ independiente — la arquitectura de Respuestas Atómicas distribuidas es la decisión de diseño (axiomática, Nam P. Suh).
- No es el `disenio_FXX.md` que el agente Código necesita. Las pantallas F-00/F-01/F-09..F-15/F-18/F-19 siguen necesitando su `disenio_FXX.md` completo (PLANTILLA_PANTALLA, 7 secciones) en `ola7/pantallas/`. Este documento entrega determinantes y aproximación de detalle para que el Iniciador de la línea técnica los complete.
- No reemplaza `plan_estructura_sitio_publico.md` — lo cita como base y refina jerarquía, rutas, engagement y pantallas de confianza.
- No toca `nucleo/` ni schema. La tabla `testimonios` (DC-1), la línea de servicio de pisos (I-014) y el segmento B2B (I-021) se proponen pero no se ejecutan aquí.
- No incluye el subsistema SEO detallado — ese es entregable aparte: `plan_seo_2026.md`.
- **Criterio de "hecho" (C2):** cada fila de la tabla §1 tenga su `disenio_FXX.md` propio en `ola7/pantallas/` y, más abajo en la cadena, la pantalla renderizando en `dev-local`. Hasta entonces, este documento es un mapa, no un cierre.

---

*Fuentes: `plan_demanda.md` (Bloques A-F, D1-D5), `plan_estructura_sitio_publico.md` (F-00..F-13 base), `destilacion_docs_veta.md` (6 pases, competidores, tarifas), `log_insights_fase2.md` (I-001..I-054), `app/globals.css` (tokens D4), `diagnostico_de_proceso.md` (C1-C5).*
