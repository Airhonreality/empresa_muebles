# Estado — Línea de Demanda

Progreso de la línea de demanda (captación, conversión, marca). Ver `plan_demanda.md` para el plan vigente (Bloques A-F) y `plan_estructura_sitio_publico.md` para el entregable de pantallas.

---

## Línea de demanda: captación, conversión y sistema de marca (2026-08-03) — t-034, `esperando_humano`

Se abrió la línea que atacaba la restricción #2 del negocio (demanda, ratio 4:1), documentada desde el mapeo y sin dueño: las 33 tareas del ledger eran todas técnicas. **Objetivo del Supervisor:** *más leads cualificados reales → más ventas → el departamento de diseño comercial visitando clientes en forma.*

**El marco pasó por dos correcciones del Supervisor antes de estabilizarse. Las dos valen como lección de método:**

1. **Recorte.** La v1 proponía un programa de investigación de mercados de 4 fases (JTBD, ZMET, sondas culturales, rejilla de repertorio, semiótica, diseño especulativo). El Supervisor lo cortó: *"es trabajo no requerido; el focus real es tomar lo que ya hay, organizarlo y darle mejora y estabilidad pro, no iniciar una nueva línea de investigación de mercados cuando los ads están produciendo leads."* → **§2.D obliga al abanico ancho de consultor, pero no exime de la pregunta previa: ¿el problema es de desconocimiento o de ejecución?** Este negocio ya sabe quién es su cliente. Su problema es de instrumentación.
2. **Sobrecorrección del asesor.** La v2 se fue al otro extremo y redujo todo a embudo y cualificación. El Supervisor lo señaló: *"se están centrando solo en el aspecto de una métrica y cualificación... me falta el plan de diagnóstico real sobre el sitio web, contenido, flow comercial, flow captación, organización del sistema de marca, tono."* → **"No es investigación de mercado" NO significa "solo métricas de embudo".** Diagnosticar el sitio, el contenido, el flujo comercial y la marca **propios** es exactamente "tomar lo que ya hay y organizarlo". Cabía desde el principio.

**Estructura final (v3): seis ramas paralelas, no fases.** R1 captación · R2 sitio y contenido · R3 lead y cualificación · R4 flujo comercial · R5 sistema de marca y tono · R6 ad management agentivo. **R6 está bloqueada por H1/H2/H3/H5**: sin verdad de terreno (qué lead se volvió venta y por cuánto), un agente optimizando campañas amplifica el error más rápido que un humano.

**Ocho hallazgos verificados en el código (evidencia, no hipótesis). Ninguno requiere investigación de mercado; los ocho sirven al objetivo. Destilados al `log_insights_fase2.md` como I-005 a I-010.**

*Medición — rota en los dos extremos:*
- **H1** — `score_conversion` existe en [schema.ts:279](lib/db/schema.ts#L279) con `default(0)` y **cero lecturas/escrituras** en todo el repo. El campo para cualificar leads existe hace tiempo y el criterio nunca se definió — es la pregunta que `logica_de_negocio.md:329` dejó abierta a propósito.
- **H2** — **`gclid` se perdió en la migración**: el legacy lo tenía (`inventario_legacy.md:52`), el schema nuevo no. Sin él no hay conversiones offline, así que **Google optimiza para formularios enviados, no para ventas cerradas**. Alternativa a verificar: conversiones mejoradas con email/teléfono hasheado, que sí se capturan hoy.
- **H3** — `leads` sin etapa, sin fecha de primer contacto, sin FK a `proyectos`. **Hoy es imposible responder "de 100 leads, cuántos llegaron a visita".**
- **H5** — **no hay ningún tag de analítica instalado. Cero** `gtag`/`googletagmanager`/`dataLayer`/GA4 en `app`, `lib`, `components`. Sin medición on-page, sin eventos de conversión hacia Ads, sin audiencias, sin embudo. **Junto con H2: se paga pauta a ciegas en la entrada y en la salida.**

*Sitio y conversión:*
- **H6** — NAP incompleto **a propósito** ([jsonld.ts:4-8](lib/seo/jsonld.ts#L4-L8) lo documenta con honestidad, esperando confirmación del Supervisor). Bloquea el SEO local, que para un negocio local de alto ticket es fuente de leads cualificados gratis y recurrente. Es un dato `[SOLO_HUMANO]` de cinco minutos.
- **H7** — **la prueba social se perdió**: el legacy tenía tabla `testimonios` (`inventario_legacy.md:53`), no existe en el schema nuevo ni en el sitio. En compra de alto ticket y alta consideración es palanca de conversión de primer orden, y el dato ya existía.
- **H8** — **desfase entre el canal real y el que ofrece el sitio**: todos los CTA públicos van a `/agendar` (5 enlaces) y **no hay un solo enlace a WhatsApp**, aunque el mapa dice que el flujo real es *lead llega → se atiende por WhatsApp*. Hipótesis fuerte, verificable en cuanto exista H5.
- **H4** — la visita comercial ya ocurre, ya está pagada y no deja un solo dato estructurado.

> **Lectura de conjunto:** el sitio nuevo tiene buena base técnica (`robots.ts`, `sitemap.ts`, JSON-LD por tipo, 16 páginas públicas, 6 landings SEO con contenido real). Lo que le falta no es construcción, es **medición, prueba social y una vía de contacto de baja fricción**.

**La carpeta de contexto previo del Supervisor ya no está sellada.** Las v1/v2 la sellaron para no sesgar una investigación abierta; con el alcance actual no es material que pueda sesgar preguntas, es **un activo existente que hay que diagnosticar y organizar**. Entra de primera, ruteada por rama (SEO→R1/R2, marca→R5, negocio→contraste contra el mapa), con protocolo de clasificación (evidencia / afirmación / decisión tomada / huérfano). Regla permanente: **cuando el material previo contradiga al comportamiento medido, gana el comportamiento.**

**Programa recortado (3 fases + 1 archivada):** A instrumentar y ver (embudo con números) → B definir cualificación y protocolo de visita → C mover la aguja en pauta y contenido. La Fase D (todo el bloque estratégico/especulativo) queda **archivada con condición de reapertura explícita**: solo si C demuestra que el embudo está sano y aun así no hay volumen, el problema sí era de mercado.

**Decisiones tomadas en esta línea:**
- **Sostenibilidad = viabilidad comercial en el tiempo** (Capacidades Dinámicas, Teece 1997). H1-H4 no son deuda técnica: son el órgano de sensado del mercado, o sea la condición material de la adaptabilidad. La capa ecológica queda parqueada **con condición de activación falsable**, no descartada.
- **Sin acceso a clientes nuevos ahora.** Se reemplaza por minería del corpus que ya existe (búsquedas, `leads`, WhatsApp) + un informe autoetnográfico del Supervisor. Ese informe entra con **protocolo antisesgo escrito antes de recibirlo**: cada afirmación va al registro de hipótesis con su falsador declarado, nunca al de hallazgos.
- **La carpeta previa del Supervisor deja de estar sellada hasta el final**: con el alcance recortado, las preguntas las decide el embudo y no el material, así que el riesgo de sesgo cae. Se abre en Fase C, y la parte de SEO probablemente se adelante a Fase A. Se mantiene: cuando el material previo contradiga al comportamiento medido, **gana el comportamiento**.
- **Ninguna escritura a la cuenta de Google Ads** (pujas, pausar campañas) sin checkpoint explícito — es plata real, mismo criterio que t-015.

**Esta línea corre en paralelo a la Fase 2 técnica, no la reemplaza ni la bloquea.**

---

## Actualización 2026-08-08 — D2-D5 cerradas, pendientes acotados

Las decisiones D2 (Audiencia — híbrida, arquetipo El Creador Experto), D3 (Precio diseño 3D — $130.000 + DIAN por 2 espacios), D4 (Capacidad real — parámetro 1.25–2.5, no bloqueante) y D5 (Geografía — Bogotá + Chía/Cajicá/Cota con viáticos) quedan cerradas en `plan_demanda.md` §1.

**Pendientes vigentes del Supervisor (2026-08-08):**
- **D1 (Eslogan)** — única decisión de marca abierta. Ver t-112 para metodología.
- **Alcance** — aprobación del marco v3 (Base / Recomendada / Completa).
- **Credenciales de solo lectura Ads/GA4/Search Console** — ver t-110 [SOLO_HUMANO].
- **Checkpoint del schema para Bloque A (`leads`)** — ver t-111 (gclid, etapa, FK a proyectos).
- **Informe de sector** con el guion de `plan_demanda.md` §5.

Las tareas del ledger que trazan estos pendientes: t-110, t-111, t-112 (creadas 2026-08-08).

---

## Sub-línea: diseño de web pública (2026-08-08)

**Objetivo:** estructura, determinantes, requisitos y aproximación de detalle de TODO el sitio público — para que el Supervisor destile manualmente hacia `lineas/ola7/pantallas/` (diseños `disenio_FXX.md`).

**Artefactos creados (v3 — pantallas de confianza y conversión 2026-08-08):**
- `plan_diseno_web_publica.md` — universo completo F-00..F-19. Continúa/amplía `plan_estructura_sitio_publico.md` (regla de sucesión C3). 
  - **v2:** jerarquía corregida (F-14 anidado bajo F-10, F-16 anidado bajo F-12), rutas SEO-friendly (`/como-trabajamos`, `/agenda-tu-asesoria`, `/bitacora`), F-15 renombrada "Bitácora de Diseño" (engagement de nicho), F-12 expandida con dos tipos de asesoría.
  - **v3:** F-17 "Cotiza tu Espacio" (requerimiento bloqueado por parámetros ERP), F-18 "Conócenos" (historia + perfiles Hugo García / Airhon J. García, 3 tiempos 1995→2014→2019), F-19 "Para Arquitectos y Diseñadores" (segmento B2B). DC-4 (línea de tiempo) cerrada. FAQ descartado como página independiente (diseño axiomático Nam P. Suh). Matriz de ponderación exigida para copy de F-18.
- `plan_seo_2026.md` — subsistema SEO transversal actualizado con F-17..F-19 y línea de tiempo canónica.

**Decisiones aplicadas:** eslogan **"Diseña tu espacio. Habita el bienestar."** (D1 **cerrada 2026-08-09**), D2/D3/D4/D5 cerradas, tokens D4 (Luz & Biofilia). DC-1 **cerrada 2026-08-09** (testimonios ACTIVA), DC-3 **cerrada 2026-08-09** (embudo híbrido: modal + página). DC-4 cerrada: línea de tiempo 1995→2014→2019, `openingDate` = 2014. Precio asesoría 3D ($130.000) debe venir de parámetro ERP (D-parámetro). Copy de F-18 requiere matriz de ponderación (**D-matriz RESUELTA 2026-08-19**, ver `contenido_F18_conocenos.md` §9). Condiciones B2B para prescriptores pendientes (D-B2B).

**Bloqueado por:** ~~DC-1 (adelantar `testimonios` de DIFERIDO — bloquea F-13 y secciones de prueba social en F-01/F-03/F-14/F-15).~~ F-17 bloqueado por parámetros de costos en ERP (D-parámetro).

**Próxima acción:** el Supervisor evalúa y aprueba los dos planes. Tras aprobación, se destilan manualmente a `lineas/ola7/pantallas/` como determinantes para los `disenio_F00.md`..`disenio_F19.md` (12 pantallas por diseñar + 1 requerimiento bloqueado F-17).

---

## Sub-línea: contenido de web pública (contenido/) — 2026-08-09

**Objetivo:** escribir el copy exacto, la estructura de secciones y la narrativa SEO por pantalla como insumo cerrado para la destilación del bucle F-web de la línea técnica. No es `disenio_FXX.md` — es la fuente de copy y contenido que el Iniciador de la línea técnica toma para completar las secciones §3 (Vocabulario), §5 (Componentes) y §7 (Criterios) de la PLANTILLA_PANTALLA, sin tener que inventar copy ni tono.

**Formato:** un archivo `contenido_FXX.md` por pantalla pública en `arnes/lineas/demanda/contenido/`, en espejo 1:1 con los futuros `disenio_FXX.md` de `ola7/pantallas/`. Cada archivo sigue `PLANTILLA_CONTENIDO.md` (7 bloques: eje de conversión · estructura de secciones · copy exacto · respuestas atómicas · testimonios · imágenes · SEO narrativo).

**Protocolo de destilación (input para el agente de la F-web):** cuando la línea técnica (ola7) abra las pantallas públicas de frontstage, el Iniciador consume este conjunto para cada `disenio_FXX.md`:
1. `contenido/contenido_FXX.md` — copy exacto y estructura de secciones de ESA pantalla
2. `plan_diseno_web_publica.md` — determinantes y aproximación de detalle
3. `plan_seo_2026.md` — JSON-LD, imágenes 5 niveles, checklist
4. `PLANTILLA_PANTALLA.md` (en `ola7/pantallas/`) — 7 secciones obligatorias

**Reglas duras:**
- Cada bloque de copy lleva `estado` (provisional / verificado) + `fuente` (Tono de voz de marca / inventario legacy / I-XXX / matriz F-18).
- Nunca inventar copy sin traza. Nunca escribir componentes ni tokens D4 — eso es territorio de la línea técnica.
- No se escribe `contenido_F17.md` (bloqueado por parámetros ERP).
- Testimonios: solo texto real (gate de publicación en `archivo/flags_testimonios_seo.md` §1) — D1 (eslogan) y DC-1 (testimonios ACTIVA) resueltas 2026-08-09.
- Copy de F-18 opera bajo la matriz de ponderación (**D-matriz RESUELTA 2026-08-19** — copy final en `contenido_F18_conocenos.md` §9; única salvedad: la interpretación del perfil de Airhon centrada en "buen vivir" es asumida y está pendiente de confirmación de Javier).

**Orden de producción (WIP=1):** F-00 → F-01 → F-09 → F-10 → F-11 → F-12(+F-16) → F-13 → F-14 → F-15 → F-18 → F-19. Una pantalla se escribe completa, se verifica el checkpoint y se continúa con la siguiente.

**Artefactos creados (2026-08-09):**
- `PLANTILLA_CONTENIDO.md` — template de 7 bloques para contenido_FXX.md.
- `contenido_F00_shell.md` — piloto: header, nav, footer, WhatsApp flotante, modal transversal (DC-3), JSON-LD transversal. ✅ **Aprobado por Supervisor.**
- `contenido_F01_home.md` — completo. Hero (H1 aprobado: "Carpintería arquitectónica. Diseñamos, fabricamos, instalamos." + eslogan D1 "Diseña tu espacio. Habita el bienestar." — 2026-08-09), Validación Técnica (3 cards, tercera rellenada con copy del sistema de tono), Conocemos Bogotá (copy textual aprobado), 7 categorías de espacios, 4 pasos del proceso, teaser 3 proyectos, Conócenos teaser, 2 Respuestas Atómicas indexables, CTA dual final. ✅ **Aprobado por Supervisor.** Testimonios desbloqueados (DC-1).
- `contenido_F09_landings.md` — 6 landings SEO con `<title>` corregidos (sin "Premium"), copy textual del legacy, bloques compartidos de F-01, Respuestas Atómicas provisionales. ✅ **Aprobado por Supervisor.**
- `contenido_F10_espacios.md` — índice de espacios `/espacios`: grid editorial de 7 categorías (6 F-09 + F-14 pisos), sin precios, `ItemList` + breadcrumb. ✅ **Aprobado por Supervisor.**
- `contenido_F11_proceso.md` — "Cómo Trabajamos" `/como-trabajamos`: 4 pasos del proceso real, nota de acabados en físico (v3), garantía, 3 Respuestas Atómicas, JSON-LD `Service` + `HowTo`. ✅ **Aprobado por Supervisor.**
- `contenido_F12_agendar.md` — "Agenda tu Asesoría" `/agenda-tu-asesoria`: dos types de asesoría (tabla comparativa, $130K desde parámetro ERP), cobertura geográfica F-16 anidada (D5), embudo híbrido modal+página (DC-3), 4 Respuestas Atómicas. ✅ **Aprobado por Supervisor.**
- `contenido_F14_pisos.md` — "Pisos de Madera" `/espacios/pisos-de-madera`: restauración (diagnóstico → pulido → reparación → sellado), materiales bajo VOC, galería antes/después, CTA "Solicitar diagnóstico gratuito", 2 Respuestas Atómicas. ✅ **Aprobado por Supervisor.**
- `contenido_F15_bitacora.md` — "Bitácora de Diseño" `/bitacora`, `/bitacora/[slug]`: portada con grid indexable + 4 categorías, entradas (caso Jose Talero, "Tipos de materiales", primer caso Bloque D), JSON-LD `Blog`/`Article`. ✅ **Aprobado por Supervisor.**
- `contenido_F18_conocenos.md` — "Conócenos" `/conocenos`: historia 3 generaciones (1995→2014→2019), perfiles Hugo/Airhon, identidad legal (I-039). **D-matriz RESUELTA 2026-08-19** — copy final aplicado (§9 Addendum: sin año 1971, sin "liderados por Víctor", abuelo fabricaba ladrillos, Hugo gestión de obras + infraestructura/plomería/electricidad/gas/acabados, Airhon "buen vivir" con salvedad pendiente de confirmación). ✅ **Aprobado por Supervisor (2026-08-19).**
- `contenido_F19_arquitectos.md` — "Para Arquitectos y Diseñadores" `/para-arquitectos`: canal de prescripción (I-021), flujo planos → cotización 3-5 días hábiles, formulario con adjunto, JSON-LD `ProfessionalService`. Condiciones comerciales marcadas **por definir** (D-B2B, sin inventar). ✅ **Aprobado por Supervisor (pendiente D-B2B).**
- **Serie completa de contenido** `contenido_F00..F-19` (11 archivos) — única excepción documentada: F-17 (bloqueado por parámetros ERP). ✅
- `contenido_F13_testimonios.md` — semilla de testimonios reales: Jose Talero (pendiente texto) + 4 reseñas reales de GBP (Daniela Barón Esparza, Glenda Danuro, Juan Spiro, Madeline Attara). ✅ **Aprobado por Supervisor.**
- `archivo/flags_testimonios_seo.md` — flags de código: gate de publicación, `aggregateRating` solo real, `Review` por testimonio, contexto barrial (protocolo I-013), seed de datos disponibles.
- `arnes/tareas/t-113.json` — mini-flow de Jose Talero (video → audio → transcripción), postergado hasta el checklist de tareas pendientes del Supervisor.
- Pendientes: [ninguno — serie completa].

**Decisiones tomadas en contenido (2026-08-09):**
- **H1 F-01:** "Carpintería arquitectónica. Diseñamos, fabricamos, instalamos." — elegido entre 3 alternativas Creador Experto. Reemplaza el "alta precisión" del plan de julio por copy sin adjetivos impostados ni palabras IA. Eco natural del "sin intermediarios" del descriptor.
- **D1 (eslogan):** "Diseña tu espacio. Habita el bienestar." — versión completa del `Tono de voz de marca.md`. Aplicado en F-01 (hero) y F-00 (footer).
- **DC-1 (testimonios):** ACTIVA en `REGISTRO_DE_ENTIDADES.md` §10 — sin tocar schema (aprobación Supervisor 2026-08-09).
- **DC-3 (embudo híbrido):** modal transversal (F-00) + página `/agenda-tu-asesoria` (SEO). Confirmado.
- **`<title>` de F-09:** se elimina "Premium" de las 6 landings — adjetivo impostado sin valor de búsqueda (I-019, I-023, I-031).

**✅ CÓDIGO COMPLETADO (PLAN B3) — 2026-08-19**
- Todo el contenido de las pantallas F-11, F-12, F-13, F-18 y F-19 ha sido codificado, desplegado en la rama `dev`, e integrado al circuito cerrado de navegación del Home.
- `testimonios.proyectoId` fue resuelto como nullable y las reseñas GBP ya operan sin problemas.
- F-13 (Testimonios) ya renderiza nombres reales y usa degradación graciosa para manejar clientes sin fotos de proyecto (R3).
- **Pendientes remanentes (Recursos Humanos/Materiales, NO técnicos):**
  - Recuperar el texto/transcripción de Jose Talero para semilla de testimonios (t-113, postergado por el Supervisor).
  - Subir las imágenes reales de alta resolución (I-016) al directorio público para reemplazar los placeholders restantes en el Portafolio y Landings.
  - D-B2B (Condiciones comerciales para arquitectos) se resolvió con un CTA directo a WhatsApp con SLA de 1 día hábil, en vez de un formulario estático.

**Próxima acción:** Aprobar alcance de captación (`plan_demanda.md` §5) o continuar con el Bloque B4 (FAQs y Contacto) en la línea técnica.

