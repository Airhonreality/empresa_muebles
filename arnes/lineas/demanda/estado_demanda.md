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

