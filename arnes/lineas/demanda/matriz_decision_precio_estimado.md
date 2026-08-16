# Matriz de Decisión — ¿Mostrar Precio Estimado en Portafolio Público?

**Fecha:** 2026-08-10 · **Estado:** propuesta (requiere resolución) · **Dueño:** Supervisor · **Tipo:** decisión de negocio con análisis de impacto

---

## Contexto del problema

En la reconstrucción V3 de Veta de Oro, una pregunta recurrente ha surgido del análisis de competencia y comportamiento de clientes:

> **¿Debería el portafolio público mostrar un "precio estimado" por cada proyecto, en forma de rango o "desde $X"?**

Este documento explora los impactos, riesgos y oportunidades de esta decisión. El objetivo: llegar a un consenso informado que alinee negocio, marketing y tecnología.

**Antecedentes normativos:**
- **Regla anti-ERP (AGENTS.md):** nada de lo que ve el cliente en front debe parecer un ERP — por lo que un "precio estimado" en tarjeta de portafolio riesga parecer una etiqueta de e-commerce, no una obra de diseño.
- **Regla de no invención (I-049):** contenido must derive de datos reales, no estimaciones adivinadas.
- **Bloque D (plan_demanda.md):** motor SEO + prueba social — el precio es un factor en decisión de compra, pero no es el factor de portafolio.

---

## Parte A — Diverger: Impactos y sesgos posibles

**Sin restricción de pensamiento, ¿cuáles son los impactos reales de mostrar precio estimado?**

### A.1 — Impactos positivos (oportunidades)

| # | Impacto | Descripción | Magnitud | Certeza |
|---|---|---|---|---|
| **O-1** | Filtro de leads no calificados | Cliente ve "desde $30M" y se autoevalúa: "mi presupuesto es $5M, no me aplica." Ahorra fricción de conversación con no-vendibles. | Media-Alta | Media (depende de exactitud del rango) |
| **O-2** | Transparencia de marca | Cliente percibe confianza: "esta empresa es honesta con precios, no oculta." Diferencia vs. competencia que dice "presupuesto bajo demanda". | Media | Media-Alta (percepción, no es dato duro) |
| **O-3** | SEO de cola larga | Búsquedas como "mueble a medida bogotá $20M" pueden indexar en meta/title si el rango está visible. Oportunidad de SEO. | Baja-Media | Baja (Google prioriza autoridad + freshness, no precio) |
| **O-4** | Reducción de inbound no calificado | Menos leads de masivo/presupuesto muy bajo → menos recursos en calificación manual. Eficiencia operativa. | Media | Media-Alta (empírico en e-commerce) |

### A.2 — Impactos negativos (riesgos)

| # | Impacto | Descripción | Magnitud | Certeza |
|---|---|---|---|---|
| **R-1** | Anclaje de expectativas (psicología de precios) | Cliente ve "desde $30M", asume cielo de precio es $50M. En asesoría, propuesta de $70M se rechaza por "fuera de presupuesto imaginario." El precio bajo anclado = margen perdido. | Media-Alta | Alta (efecto psicológico comprobado) |
| **R-2** | Fuga de información competitiva | Competencia ve rangos publicados, calcula márgenes, usa para competitive pricing. Riesgo especialmente alto en mercado pequeño (Bogotá carpintería premium). | Media | Media (depende de quién monitorea) |
| **R-3** | Percepción ERP / Comercial (visual) | Tarjeta de portafolio con precio = "esto parece tienda, no portfolio de diseño." Contradice Ley Anti-ERP (AGENTS.md). Cliente premium siente que es un catálogo, no obra de arte. | Media | Alta (auditoría visual muestra esto hoy en v2) |
| **R-4** | Rigidez de rangos | Rango publicado es $25M-$50M. Nuevo proyecto similar sale $22M (es más simple) → ¿cómo mostrar sin parecer that se viola rango publicado? Rango se desactualiza, requiere maintenance operacional. | Baja-Media | Alta (problema de sistema vivo) |
| **R-5** | Política de descuentos expuesta | Si proyecto A salió $35M (dentro del rango), cliente B negocia: "¿por qué yo pago $40M? El proyecto A pagó $35M." Precio públicamente visible = no hay privacidad de deal. | Media | Alta (imperativo comercial) |
| **R-6** | No aplica a caso "único por encargo" | Mueble a medida en Bogotá no es commodity. Cada proyecto es único: mismo cliente puede salir $15M (armario simple) o $80M (cocina + closet + integración). Rango amplio no agrega valor, solo genera confusión. | Media-Alta | Alta (característica del negocio de carpintería arquitectónica) |

---

## Parte B — Matriz de Ponderación

**Criterios de decisión:** evaluamos la opción de **MOSTRAR PRECIO ESTIMADO** (vs. "Presupuesto bajo demanda", el estado actual).

**Escala de puntuación:**
- **1-3:** Impacto bajo / No deseable / Alto riesgo
- **4-6:** Impacto medio / Neutral / Medio riesgo
- **7-9:** Impacto alto / Muy deseable / Bajo riesgo

**Pesos relativos (asignados por Supervisor como part of resolución):**

| Criterio | Peso % | Justificación |
|---|---|---|
| **Impacto en conversión** (¿los leads que llegan convierten más?) | 35% | Core business: más leads → más ingresos. Si precio estimado filtra leads no-vendibles pero ahuyenta leads sí-vendibles, es neto negativo. |
| **Riesgo competitivo** (¿expone información crítica?) | 25% | Mercado premium pequeño: Bogotá tiene ~20 talleres de carpintería arquitectónica. Transparencia de precios = arma de doble filo. |
| **Complejidad técnica & operacional** (¿cuánto esfuerzo para mantenerlo?) | 20% | Rango publicado requiere update si modelo de costos cambia. Tiempo = costo. |
| **Alineación visual con marca** (¿respeta Ley Anti-ERP?) | 15% | Veta de Oro vende **experiencia de diseño**, no commodities. Visual importa para posicionamiento. |
| **Claridad de buyer intent** (¿el cliente sabe qué espera?) | 5% | Bonus criterion: precio estimado ayuda a cliente A autoevaluarse, pero reduce misterio de compra (ver O-1 vs. R-6). |

**Total ponderación:** 35% + 25% + 20% + 15% + 5% = 100%

---

### B.1 — Scoring: MOSTRAR PRECIO ESTIMADO

| Criterio | Peso | Puntuación (1-9) | Puntuación ponderada | Justificación |
|---|---|---|---|---|
| Impacto en conversión | 35% | 4 | 1.4 | Efecto mixto: leads calificados ↑, pero anclaje psicológico (R-1) reduce margen. Empiria en e-commerce: transparencia de precio = más conversión, pero nuestro no-e-commerce. **Puntuación baja por riesgo de anclaje.** |
| Riesgo competitivo | 25% | 3 | 0.75 | Alto riesgo (R-2). Mercado pequeño, competencia monitorea precios públicos. Publicar rangos = entregar intel. **Puntuación muy baja.** |
| Complejidad técnica | 20% | 5 | 1.0 | Implementar rango es sencillo (1-2 horas código). Mantenerlo: si modelo de costos cambia cada trimestre, requiere update. **Puntuación media.** |
| Alineación visual | 15% | 3 | 0.45 | Contradice directiva Anti-ERP (AGENTS.md). Portafolio con precio = tienda. **Puntuación baja.** |
| Claridad de buyer intent | 5% | 6 | 0.3 | Sí, ayuda al cliente a autoevaluarse (O-1). Pero reduce misterio/aspiración (R-6: cada proyecto es único). **Puntuación media-baja.** |
| **TOTAL PONDERADO** | 100% | — | **4.9 / 9** | **Resultado: NEUTRAL-NEGATIVO. Inclinar a NO MOSTRAR.** |

---

### B.2 — Scoring: NO MOSTRAR PRECIO (ESTADO ACTUAL + Mejora)

*Para comparación: seguir con "Presupuesto bajo demanda", pero mejorar call-to-action.*

| Criterio | Peso | Puntuación (1-9) | Puntuación ponderada | Justificación |
|---|---|---|---|---|
| Impacto en conversión | 35% | 7 | 2.45 | Menos filtro automático de non-vendibles, pero más leads de alta intención (el que cliquea "agendar" sin ver precio está comprometido). Menos fricción = conversión atractiva. **Puntuación media-alta.** |
| Riesgo competitivo | 25% | 8 | 2.0 | Sin publicar rangos, no hay intel expuesto. Competencia no puede usar. **Puntuación alta.** |
| Complejidad técnica | 20% | 8 | 1.6 | Modelo actual simple: cada proyecto en admin solo contiene datos, sin rango calculado. No hay mantenimiento de rangos. **Puntuación alta.** |
| Alineación visual | 15% | 8 | 1.2 | Portafolio sin precio = autoridad de diseño. Respeta Anti-ERP. Cliente ve "esta es una obra, no un producto." **Puntuación alta.** |
| Claridad de buyer intent | 5% | 5 | 0.25 | Cliente sin ver precio siente misterio (¿cuánto costará?). Genera intención de contacto. Pero cliente también puede autofiltrar negativamente ("probablemente caro"). **Puntuación neutral.** |
| **TOTAL PONDERADO** | 100% | — | **7.5 / 9** | **Resultado: RECOMENDACIÓN POSITIVA. MANTENER SIN PRECIO.** |

---

## Parte C — Plantilla de Consulta Estructurada a 3 Personas

**Objetivo:** Validar los insights de la matriz contra opiniones reales de personas en el negocio. No es un sondeo casual — es consulta estructurada con preguntas concretas, grabadas/documentadas.

**Perfiles de persona a consultar:**

1. **Persona 1: Javier García (Supervisor / Dueño comercial)**
   - Rol: toma decisión final
   - Qué aporta: visión estratégica, knowhow de márgenes, comportamiento de cliente histórico
   - Preguntas clave: (ver §C.2)

2. **Persona 2: Prospecto cliente premium reciente (conversión ganada en últimos 6 meses)**
   - Rol: cliente que ya compró
   - Qué aporta: cómo percibe precio, qué factores influyeron en decisión, ¿habría cambiado si veía precio antes?
   - Preguntas clave: (ver §C.3)

3. **Persona 3: Prospecto cliente premium que NO convirtió (lead perdido vs. competencia en últimos 6 meses)**
   - Rol: cliente que no compró
   - Qué aporta: por qué se fue, rol del precio vs. otros factores, ¿habría ayudado ver precio inicial?
   - Preguntas clave: (ver §C.4)

---

### C.1 — Protocolo de consulta

**Modalidad:** Llamada de 20-30 minutos, grabada/anotada. Preguntas abiertas, sin sesgar respuesta.

**Instrucciones al facilitador (Javier o agente delegado):**
- Presentar contexto: "Estamos evaluando si mostrar un 'rango de precio' en el portafolio web."
- Formular preguntas exactas como aparecen abajo. NO parafrasear, NO cambiar orden.
- Dejar 10-15 segundos de silencio para respuesta natural (no interrumpir).
- Grabar o anotar textualmente.
- Agradecer y cerrar.

---

### C.2 — Preguntas para Persona 1 (Javier / Supervisor)

| # | Pregunta | Propósito | Anotaciones |
|---|---|---|---|
| **P1-1** | "Si publicáramos un rango de precio en cada proyecto del portafolio (ej. 'desde $25M a $50M'), ¿qué impacto crees que tendría en el número de leads que recibimos?" | Mapear percepción de filtro de leads | Buscar: ¿ve más leads o menos? ¿cambio neto positivo o negativo? |
| **P1-2** | "De los clientes que ya compraron con Veta Dorada, ¿cuántos preguntaron por precio ANTES de agendar asesoría, vs. DESPUÉS de ver el portafolio?" | Entender buyer journey real | Buscar: momento crítico de precio en decision |
| **P1-3** | "¿Hay información de precio/márgenes que, si sale pública, sentiría que daña la posición competitiva de Veta Dorada?" | Evaluar riesgo de IP leakage | Buscar: cuánto se sentiría cómodo revelando |
| **P1-4** | "¿Qué factor es más importante en la decisión de un cliente premium para contratarnos: (A) ver un precio estimado antes de contactar, o (B) la confianza de que vamos a escuchar su necesidad sin prejuzgarlo por presupuesto?" | Trade-off directo | Buscar: cuál es valor prioritario en marca |
| **P1-5** | "Si hiciéramos la consulta a 3 personas clave (cliente ganado reciente, cliente perdido reciente, y tú), ¿qué dato te sería más revelador de la respuesta que deberíamos dar?" | Meta-insight: qué información falta | Buscar: gap de datos en decisión actual |

**Documento de captura (post-llamada):**
- Nombre Javier, Fecha, Duración llamada
- Síntesis de respuestas P1-1 a P1-5
- **Recomendación de Javier (1 frase):** ¿qué elige?

---

### C.3 — Preguntas para Persona 2 (Cliente ganado reciente)

| # | Pregunta | Propósito | Anotaciones |
|---|---|---|---|
| **P2-1** | "Antes de contactar a Veta Dorada, ¿buscaste en internet referencias de precio de carpintería arquitectónica o muebles a medida en Bogotá?" | Entender buyer research | Buscar: ¿investigó precios de otros? ¿cuándo? |
| **P2-2** | "¿Qué fue lo primero que te atrae del portafolio de Veta Dorada: (A) la calidad visual de los proyectos, (B) la referencia de precios (si estuviera visible), (C) algo más?" | Entender qué elemento de portafolio influyó | Buscar: valor que da portafolio SIN precio |
| **P2-3** | "Cuando hablaste por primera vez con el equipo de Veta Dorada, ¿a cuánto estimabas que costaba tu proyecto antes de esa conversación? ¿fue sorpresa el precio final?" | Evaluar anclaje vs. precio real | Buscar: ¿habría cambiado su expectativa si veía rango publicado? |
| **P2-4** | "Si el portafolio hubiera mostrado 'desde $25M', ¿habría afectado tu decisión de contactarlos?" | Directo: contra-factual con precio visible | Buscar: habría filtrado sí/no a sí mismo |
| **P2-5** | "¿Recomendarías a un amigo a Veta Dorada? ¿Hay algo que la haría más atractiva (ej. mostrar precios, videos del proceso, testimonios de clientes)?" | Net satisfaction + mejora percibida | Buscar: qué haría más confiable/atractiva |

**Documento de captura (post-llamada):**
- Nombre cliente (anonimizar si es necesario), Fecha, Duración, Tipo proyecto (cocina/closet/otro)
- Síntesis de respuestas P2-1 a P2-5
- **Percepción de cliente:** ¿Precio visible le habría ayudado o perjudicado?

---

### C.4 — Preguntas para Persona 3 (Lead perdido reciente)

| # | Pregunta | Propósito | Anotaciones |
|---|---|---|---|
| **P3-1** | "¿Recuerdas por qué al final no contrataste con Veta Dorada? ¿fue precio, timing, otra razón?" | Entender root cause de no-conversión | Buscar: es precio un factor o es otra cosa |
| **P3-2** | "Cuando viste el portafolio de Veta Dorada, ¿sentiste que los precios eran más altos de lo que esperabas? ¿Por qué?" | Evaluar si presunción de precio influyó | Buscar: asunción sin ver número |
| **P3-3** | "Si hubieras visto un rango de precio explícito en el portafolio (ej. 'desde $20M'), ¿habría cambiado tu decisión a favor de Veta Dorada?" | Contra-factual: ¿el precio visible habría convencido? | Buscar: fue precio la barrera, o era otra cosa (ej. timing, otro proveedor ya elegido) |
| **P3-4** | "¿Quién más consultaste? ¿Qué diferencias viste entre Veta Dorada y los otros?" | Contexto competitivo: qué ganó | Buscar: ¿otros mostraban precio? ¿fue factor? |
| **P3-5** | "¿Hay algo que Veta Dorada hubiera podido hacer/mostrar para convencerte?" | Mejora percibida desde perspectiva no-vendible | Buscar: ¿fue precio, confianza, timing, otra cosa? |

**Documento de captura (post-llamada):**
- Nombre cliente (anonimizar si es necesario), Fecha, Duración, Tipo proyecto (cocina/closet/otro), Competidor ganador
- Síntesis de respuestas P3-1 a P3-5
- **Percepción de cliente:** ¿Habría precio visible convencido/disuadido?

---

## Parte D — Ejecución de la Consulta

### D.1 — Cronograma propuesto

| Fase | Actividad | Responsable | Duración | Fecha destino |
|---|---|---|---|---|
| **1. Preparación** | Agregar calendario, enviar invitación a 3 personas (Javier + 2 clientes) con propósito y duración estimada | Javier o agente delegado | 1 día | 2026-08-11 |
| **2. Ejecución** | Realizar 3 llamadas (20-30 min c/u), grabar/anotar | Javier o agente delegado | 2-3 días | 2026-08-13 a 2026-08-15 |
| **3. Síntesis** | Compilar respuestas, extraer patterns, escribir reporte de insights (§D.2) | Javier o agente delegado | 1 día | 2026-08-16 |
| **4. Decisión** | Javier revisa reporte, toma decisión final (MOSTRAR PRECIO sí/no), documenta en `matriz_decision_precio_estimado.md` §D.3 | Javier | 1 día | 2026-08-17 |

### D.2 — Plantilla de síntesis de insights (post-entrevistas)

**Aportado por [Nombre facilitador], [Fecha]**

| Pregunta | Respuesta Javier | Respuesta Cliente Ganado | Respuesta Cliente Perdido | Patrón / Insight |
|---|---|---|---|---|
| **Impacto en leads** / **Precio influyó en decisión** | [Síntesis 1 línea] | [Síntesis] | [Síntesis] | (Ver §D.2 debajo) |
| **Buyer journey real** / **Precio visible habría cambiado decisión** | [Síntesis] | [Síntesis] | [Síntesis] | (Ver §D.2 debajo) |
| **Riesgo competitivo** / **Precio visible convence/disuade** | [Síntesis] | [Síntesis] | [Síntesis] | (Ver §D.2 debajo) |
| **Valor prioritario de marca** / **Factor diferencial** | [Síntesis] | [Síntesis] | [Síntesis] | (Ver §D.2 debajo) |
| **Gaps de datos** / **Qué más falta** | [Síntesis] | [Síntesis] | [Síntesis] | (Ver §D.2 debajo) |

**Insights claves emergentes (1-3 frases por patrón observado):**
- [Patrón 1]
- [Patrón 2]
- [Patrón 3]

---

### D.3 — Decisión Final (a rellenar tras consulta)

**[Esta sección será completada por Javier tras ejecutar la consulta D.1-D.2]**

**Resolución:** [MOSTRAR PRECIO / NO MOSTRAR PRECIO / MOSTRAR RANGO CON CONDICIONES]

**Justificación (2-3 líneas):**
[Razón de decisión, respaldada en matriz + consulta]

**Implementación si MOSTRAR PRECIO:**
- Rango: $[min] a $[max] COP (por defecto, a validar por proyecto)
- Ubicación visual: [tarjeta portafolio / artículo detalle / ambas]
- Actualización: [trimestral / anual / manual]
- Responsable de maintenance: [nombre rol]

**Implementación si NO MOSTRAR PRECIO:**
- Mantener "Presupuesto bajo demanda"
- Mejora asociada: [ej. "enfatizar CTA 'Agendar Asesoría' en lugar de precio"]

**Fecha de resolución:** [ISO 8601]
**Firmado:** Javier García (Supervisor)

---

## Conclusión

Este documento proporciona un marco para resolver una pregunta de negocio que cruza marca, marketing, y experiencia del cliente. La **matriz ponderada (§B) indica un leve "no mostrar precio"** (score 4.9 vs. 7.5), pero esa recomendación es **tentativa sin la consulta real a 3 personas clave (§C)**.

**Próximo paso obligatorio:** ejecutar consulta §D.1 con 3 personas (Javier + cliente ganado + cliente perdido). Sus respuestas pueden cambiar la ponderación y la decisión final.

---

## PENDIENTE [SOLO_HUMANO]: Ejecutar consulta a 3 personas

**Estado:** Este documento está completo como PLANTILLA. Las secciones D.1 (ejecución), D.2 (síntesis) y D.3 (decisión final) **no pueden ser rellenadas por un agente** — requieren conversaciones reales con humanos (Javier, un cliente ganado verificable, un cliente perdido verificable).

**Instrucciones al Supervisor (Javier):**

1. Identifica 1 cliente ganado en últimos 6 meses (best case: conversión reciente, relación positiva).
2. Identifica 1 lead perdido en últimos 6 meses (best case: feedback disponible sobre por qué no contrató).
3. Agenda 3 llamadas de 20-30 min c/u con:
   - Tú (Javier) responder §C.2
   - Cliente ganado responder §C.3
   - Cliente perdido responder §C.4
4. Captura respuestas en formato D.2 (síntesis).
5. Toma decisión final en §D.3.
6. Documenta resultado en este archivo bajo §D.3.

**No inventes respuestas de 3 personas.** Si no es posible ejecutar la consulta en la fecha planificada, el documento marca este punto como bloqueado hasta que pueda hacerse.

---

*Fuentes: `plan_demanda.md` (Bloques C/D), `plan_diseno_web_publica.md` (§2.2, F-03 Portafolio), `AGENTS.md` (Ley Anti-ERP), `log_insights_fase2.md` (I-049).*
