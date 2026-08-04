> # ⛔ REGISTRO HISTÓRICO — REEMPLAZADO
>
> **Este documento ya no decide nada.** Fue reemplazado el 2026-08-03 por [`arnes/planes/plan_demanda.md`](../planes/plan_demanda.md), que fusiona sus 6 ramas con el mapa de 11 fases de `Fase paralela de mercados` en una sola fuente de verdad.
>
> **Se conserva** porque contiene los hallazgos H1-H8 verificados en código y el registro de las dos correcciones de alcance del Supervisor. **Se lee para entender cómo se llegó acá; no para decidir qué hacer.**

---

# Demanda: captación, conversión y sistema de marca — marco de trabajo

**Objetivo:** *más leads cualificados reales → más ventas → el departamento de diseño comercial visitando clientes en forma.*

**Estado: propuesta, sin aprobar.** Alcance por ramas en §3.

---

## 0. Historial de alcance — dos correcciones del Supervisor, ambas registradas

**Corrección 1 (recorte).** La v1 de este archivo proponía un programa de investigación de mercados de 4 fases (JTBD, ZMET, sondas culturales, rejilla de repertorio, semiótica, diseño especulativo). El Supervisor lo cortó: *"es trabajo no requerido; el focus real es tomar lo que ya hay, organizarlo y darle mejora y estabilidad pro, no iniciar una nueva línea de investigación de mercados cuando los ads están produciendo leads."*
→ Correcto. §2.D obliga al abanico ancho de consultor, pero **no exime de la pregunta previa: ¿el problema es de desconocimiento o de ejecución?** Acá es de ejecución.

**Corrección 2 (sobrecorrección del asesor).** La v2 se fue al otro extremo: reduje todo a embudo y cualificación de leads. El Supervisor lo señaló: *"siento que están centrándose solo en el aspecto de una métrica y cualificación, los empaquetaría todos en una rama del lead, pero me falta el plan de diagnóstico real sobre el sitio web, contenido, flow comercial, flow captación, organización del sistema de marca, tono, etc. Ni veo la puerta para analizar la carpeta que tengo con contexto previo."*
→ También correcto, y el error es mío por leer mal la corrección 1. **"No investigación de mercados" no significa "solo métricas de embudo".** Diagnosticar tu propio sitio, tu propio contenido, tu propio flujo comercial y tu propio sistema de marca **es exactamente "tomar lo que ya hay y organizarlo"** — es diagnóstico de activos existentes, no investigación de mercado. Cabía desde el principio.

**Esta v3 reorganiza el trabajo en 6 ramas paralelas + la carpeta como entrada transversal.** Lo de la v2 es la rama R3, una de seis.

---

## 1. Hallazgos ya verificados en el código (evidencia, no hipótesis)

Salieron de revisar schema, sitio público y SEO del sistema nuevo. **Ninguno requiere investigación de mercado; los ocho sirven al objetivo declarado.**

> **⚠️ Actualización tras la destilación de `DOCS VETA DORADA`** (ver [destilacion_docs_veta.md](arnes/diagnostico/destilacion_docs_veta.md)). Tres de estos hallazgos cambian de lectura, y uno cambia de gravedad:
> - **H1 y H2 no son olvidos: son diseño perdido.** El embudo híbrido con captura de `gclid` y la importación de conversiones offline con **score 1-10** estaban documentados en detalle e implementados en el legacy (`VetaAgendar.tsx`). **`score_conversion` tiene propósito definido**: es ese score de calidad. Lo que faltó no fue el criterio, fue la implementación en la migración.
> - **H8 sube a bloqueador de corte a producción.** La acción de conversión de Google Ads es un **clic al botón de WhatsApp** en `vetadeoro.co`. El sitio nuevo no tiene ninguno. Mergear `dev`→`main` como está **destruye el evento sobre el que está entrenada la puja automática.**
> - **La restricción #2 del negocio se reencuadra:** la cuenta de Ads invierte del orden de **USD $36/mes** y está apagada el 38% de los días. No los está ganando la competencia — casi no están apareciendo.

### Medición — está rota en los dos extremos

**H1 — `score_conversion` existe y está muerto.** [schema.ts:279](lib/db/schema.ts#L279), `default(0)`, **cero lecturas y cero escrituras** en todo el repo. El campo para cualificar leads existe hace tiempo y el criterio nunca se definió — es literalmente la pregunta que [logica_de_negocio.md:329](arnes/diagnostico/logica_de_negocio.md#L329) dejó abierta a propósito.

**H2 — `gclid` se perdió en la migración.** El legacy lo tenía ([inventario_legacy.md:52](arnes/diagnostico/inventario_legacy.md#L52)); el schema nuevo captura `utm_source/medium/campaign` y no `gclid`. Sin él no hay importación de conversiones offline, así que Google optimiza para **formularios enviados** en vez de **ventas cerradas**. Ver §2: es la precondición del ad manager agentivo, no un campo suelto.

**H3 — el embudo no es medible.** `leads` no tiene etapa, ni fecha de primer contacto, ni FK a `proyectos` (conversión manual, ya anotado en el inventario legacy). Hoy es imposible responder *"de 100 leads, cuántos llegaron a visita"*.

**H5 — no hay ningún tag de analítica instalado. Cero.** Búsqueda de `gtag` / `googletagmanager` / `dataLayer` / GA4 en `app`, `lib` y `components`: **sin resultados**. El sitio no puede medir comportamiento on-page, no puede disparar eventos de conversión a Ads, no genera audiencias de remarketing y no tiene embudo en GA4. **Junto con H2, la medición está rota en la entrada y en la salida** — se está pagando pauta a ciegas en ambos extremos.

### Sitio y conversión

**H6 — el NAP está incompleto a propósito y eso bloquea el SEO local.** [jsonld.ts:4-8](lib/seo/jsonld.ts#L4-L8) documenta con honestidad que no inventa dirección ni teléfono, esperando confirmación del Supervisor. El `LocalBusinessJsonLd` sale con `addressLocality: 'Bogotá'` y nada más. Para un negocio local de alto ticket, el SEO local (Perfil de Empresa en Google + NAP consistente + JSON-LD completo) es una fuente de leads cualificados **gratis y recurrente**. Está bloqueado esperando un dato que solo vos podés dar, y es de cinco minutos.

**H7 — la prueba social se perdió.** El legacy tenía tabla `testimonios` (nombre, reseña, calificación, destacado — [inventario_legacy.md:53](arnes/diagnostico/inventario_legacy.md#L53)). No existe en el schema nuevo ni en el sitio. En una compra de alto ticket y alta consideración la prueba social es palanca de conversión de primer orden, **y el dato ya lo tenías**.

**H8 — hay un desfase entre el canal de conversión real y el que ofrece el sitio.** Todos los CTA del sitio público convergen en `/agendar` (5 enlaces) y **no hay un solo enlace a WhatsApp**. Pero el mapeo dice que el flujo real es *lead llega → se atiende por WhatsApp*. Un formulario tiene mucha más fricción que un clic a WhatsApp para este público y este ticket. **Es probable que el sitio esté perdiendo leads que sí habrían escrito.** Hipótesis fuerte, verificable en cuanto exista H5.

**H4 — la visita comercial ya ocurre y no deja un dato estructurado.** Trabajo de campo real, con el cliente, en su casa, ya pagado. "Visitar en forma" empieza por instrumentar lo que ya pasa.

> **Lectura de conjunto:** el sitio nuevo tiene buena base técnica (`robots.ts`, `sitemap.ts`, JSON-LD por tipo, 16 páginas públicas, 6 landings SEO con contenido real). Lo que le falta no es construcción, es **medición, prueba social y una vía de contacto de baja fricción**. Eso es organizar y estabilizar lo que ya hay, exactamente el encargo.

## 2. Lo que pediste con `gclid` es más grande que un campo (tu punto 1)

Lo tratás bien: no es una columna, es **el ciclo cerrado de un ad manager operado por CLI** — configuración de campaña ajustada por análisis real de conversiones, tendencias de búsqueda y patrones web, con monitoreo de ventas reales, no de formularios.

Eso es la **rama R6**, y tiene una dependencia dura que conviene decir de una: **R6 no puede existir sin H1, H2, H3 y H5.** Sin verdad de terreno (qué lead se volvió venta y por cuánto) un agente optimizando campañas amplifica el error más rápido que un humano. El orden no es negociable:

```
H2+H3 (atribución y etapas)  ─┐
H5 (tag y eventos)           ─┼→  verdad de terreno  →  R6 (ad manager agentivo)
H1 (criterio de cualificación)┘        (loop cerrado)
```

R6 arranca en solo lectura y análisis. **Ninguna escritura a la cuenta de Ads —pujas, presupuestos, pausar campañas— sin checkpoint explícito tuyo:** es plata real saliendo, mismo criterio que se aplicó a t-015.

## 3. Las seis ramas (tu punto 3)

Cada rama es diagnóstico de algo que **ya existe**, con entregable propio. Corren en paralelo salvo las dependencias marcadas.

### R1 — Captación (cómo entra la gente)
Auditoría de canales reales: Google Ads (términos, costo, calidad de lead por término), orgánico/SEO (Search Console: qué se busca, qué posición, qué se clickea), IG/TikTok, referidos y directo. Puntos de entrada a categoría (Romaniuk ✅) mapeados contra los términos reales, no contra un taller.
→ *Entregable: mapa de canales con costo y calidad por fuente, y los huecos de cobertura.*
→ **Entrada de la carpeta: la investigación de SEO va acá, de primera.**

### R2 — Sitio web y contenido
Auditoría de las 16 páginas públicas: arquitectura de información, ruta de conversión página por página, SEO técnico (`robots`/`sitemap`/JSON-LD/metadatos — parcialmente sano, ver H6), contenido real de las 6 landings, jerarquía de CTA (H8), prueba social ausente (H7), velocidad y experiencia móvil. Kano (1984 ✅) sobre qué elementos son higiene y cuáles diferencian.
→ *Entregable: plan de mejora del sitio priorizado por impacto en conversión, con hallazgos anclados a archivo y línea.*

### R3 — Lead y cualificación *(lo que era toda la v2 — una rama de seis)*
H1-H3. Definir "lead cualificado" mirando qué tenían en común los que **sí** cerraron (análisis del corpus, no opinión) y poblar `score_conversion` con un criterio defendible. Reconstruir el embudo con números en cada salto.
→ *Entregable: el embudo con números + criterio de cualificación operativo.*

### R4 — Flujo comercial (del lead al contrato)
Diagnóstico del proceso que ya está mapeado en `logica_de_negocio.md` pero nunca medido: tiempo de primera respuesta, tasa de agendamiento, tasa de visita→cotización, seguimiento de los que no responden, y el reproceso ya documentado del diseño 3D que a veces no se descuenta del anticipo. Incluye H4: protocolo e instrumentación de la visita.
→ *Entregable: protocolo comercial + protocolo de visita + los puntos de fuga con números.*

### R5 — Sistema de marca, tono y contenido
**Organizar lo que ya existe, que es más de lo que parece:** hay copy real en 6 landings, hay portafolio con casos reales, hay identidad implícita en el sitio. Lo que no hay es **sistema** — reglas de uso, ejes de tono declarados, activos distintivos definidos. Ejes de tono calibrados y verificables (modelo de 4 dimensiones ⚠️) en vez de adjetivos; activos distintivos (Romaniuk ✅) como kit ejecutable; consistencia auditada contra las pantallas reales.
→ *Entregable: sistema de marca y tono utilizable — incluido por una herramienta como RoundPod sin destruir la marca.*
→ **Entrada de la carpeta: la documentación de marca va acá.**

### R6 — Ad management agentivo *(tu punto 1)*
**Depende de H1+H2+H3+H5.** Ver §2.

**Transversal — la carpeta de contexto previo.** Ver §4.

## 4. La puerta de la carpeta (tu punto 3, segunda parte)

Tenías razón: no había puerta. La v1 la selló para no sesgar una investigación abierta; la v2 mantuvo el sello por inercia. **Con el alcance actual el sello ya no tiene sentido: la carpeta no es material que pueda sesgar preguntas, es un activo existente que hay que diagnosticar y organizar — que es el encargo.**

**Entra ya, como primer paso, con ruteo por rama:**

| Contenido | Va a | Uso |
|---|---|---|
| Investigación de SEO | **R1** (y R2) | Términos, volúmenes e intención — demanda revelada. Insumo directo, de los mejores que hay. |
| Documentación de marca | **R5** | Punto de partida del sistema, no borrador a desechar. |
| Documentación de negocio | contraste | Se cruza contra `logica_de_negocio.md` y `cierre_diamante.md`: qué confirma, qué contradice, qué agrega. |

**Protocolo mínimo, el mismo para la carpeta y para tu informe de sector** (§5) — sin esto no hay diagnóstico, hay acumulación:

1. Cada pieza se clasifica en **evidencia** (dato observado con método rastreable) / **afirmación** (sin método → pasa al registro de hipótesis) / **decisión ya tomada** (restricción del terreno) / **huérfano** (evidencia sin pregunta que la reclame → se archiva).
2. **Regla dura:** cuando el material previo contradiga al comportamiento medido, **gana el comportamiento**.
3. Lo que sobreviva se integra al documento de su rama; nada queda "en la carpeta" como fuente paralela de verdad.

**Necesito la ruta de la carpeta para empezar.**

## 5. Tu informe de sector

Sin acceso a clientes nuevos ahora, el corpus existente (búsquedas, `leads`, WhatsApp) reemplaza a las entrevistas para casi todo. Tu informe entra como conocimiento de practicante — estatus epistemológico propio (Schön, *The Reflective Practitioner*, 1983 ✅; como método formal, autoetnografía, Ellis & Bochner ✅).

**El riesgo, sin diplomacia:** sos informante, analista y decisor a la vez — la configuración con más riesgo de confirmación que existe. **La regla que lo vuelve utilizable:** todo lo de tu informe entra al **registro de hipótesis**, no al de hallazgos, y cada afirmación se escribe con **su falsador declarado de antemano** (qué dato del corpus la refutaría). Se corre contra el corpus; las que caen quedan registradas como caídas.

**Guion:** (1) frustraciones — tuyas como operador, las del cliente, las del sector, separadas; (2) aspiraciones no atendidas hoy en Bogotá; (3) objeciones repetidas, **literales**, con las palabras del cliente; (4) por qué se caen los que se caen; (5) qué hace la competencia local que funciona y qué no. Crudo, sin editar — la interpretación es mi trabajo y si viene interpretado pierdo la señal.

## 6. Sostenibilidad = viabilidad comercial en el tiempo

**Capacidades dinámicas** (Teece, Pisano & Shuen, 1997 ✅): sensar / capturar / reconfigurar. Es tu formulación exacta — la sostenibilidad de mercado no es tener el mejor producto hoy, es tener el mecanismo para dejar de tenerlo a tiempo.

**Y no es teoría suelta: el sistema que se está construyendo ES el órgano de sensado.** H1-H5 no son deuda técnica; son la condición material de la adaptabilidad. Tu pregunta estratégica se responde construyendo lo operativo, no abriendo un programa aparte.

**Capa ecológica, con las pinzas que pediste** — rama diferida con condición de activación **falsable**: se activa si y solo si un atributo material (durabilidad, reparabilidad, origen de la madera, mantenimiento, recompra) aparece en el lenguaje real del cliente como razón de compra u objeción. Si aparece, entra por la puerta comercial con su evidencia; si no, nadie la defiende por convicción. Literatura parqueada: McDonough & Braungart (2002 ✅), Tukker (2004 ⚠️), Escobar (2018 ✅) para la lectura multiespecie.

## 7. Retroalimentación al diseño de código (tu punto 2)

Todo hallazgo de estas ramas que toque el mapa, el schema o las herramientas externas **se destila como insight al log de Fase 2** ([log_insights_fase2.md](arnes/diagnostico/log_insights_fase2.md)), con su formato ya acordado (tipo / módulo / destino / estado). No se crea un log paralelo: fragmentar la memoria del proyecto es exactamente contra lo que advierte la regla de oro del `INDEX.md`.

H1-H8 ya entraron como I-005 a I-009. **Consecuencia inmediata: el módulo de Comercial/Captación de la Fase 2 tiene ahora requisitos derivados de evidencia**, no de suposición.

## 8. Alcance propuesto

| Opción | Ramas | Cuándo tiene sentido |
|---|---|---|
| **Base** | R1 + R2 + R3 + carpeta | Diagnóstico completo de captación, sitio y lead. Deja el flujo comercial y la marca para después. |
| **Recomendada** | R1-R5 + carpeta, **R6 después** | El encargo completo. R6 queda condicionada a que H1/H2/H3/H5 estén cerradas — sin verdad de terreno, un agente optimizando campañas amplifica el error. |
| **Completa** | R1-R6 en la misma tanda | Solo si aceptás cerrar H1-H5 primero como bloqueo duro de R6. |

**Recomiendo la Recomendada.** No por cautela: R6 es la que más valor tiene y por eso mismo es la que peor sale si se construye sobre datos rotos.

## 9. Lo que necesito para arrancar

1. **Aprobación de alcance** (§8).
2. **La ruta de la carpeta** de contexto previo — entra de primera, ya no está sellada.
3. **Credenciales de solo lectura**: Google Ads (token de desarrollador + OAuth), GA4, Search Console, Meta/IG. `[SOLO_HUMANO]`, nunca en archivo versionado.
4. **Datos NAP reales** (dirección, teléfono, horario, Perfil de Empresa en Google si existe) — desbloquea H6, cinco minutos, impacto real y gratis.
5. **Tu informe de sector**, con el guion de §5. Crudo.
6. **Confirmación de que H1-H8 entran a Fase 2 como tareas de código.** Ojo: H1-H3 y H7 tocan el schema, que `AGENTS.md` prohíbe modificar sin checkpoint explícito.

---

*Método: `ARNES_AGENTICO.md` §2.C + §2.D, con la corrección de §0: el abanico ancho es obligatorio, pero primero hay que preguntar si el problema es de conocimiento o de ejecución — y no confundir "no es investigación de mercado" con "es solo métrica".*
*Confianza de cita: ✅ atribución sostenida · ⚠️ verificar antes de citar fuera de este repo.*
*Estado: v3, sin aprobar. v1 y v2 quedan en el historial de git.*
