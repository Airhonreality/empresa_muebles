# Destilación de `DOCS VETA DORADA` — contexto de sesiones previas

**Fuente:** `C:\Users\javir\Documents\DEVs\empresa_muebles_clone\storage\fork_doc\DOCS VETA DORADA` (worktree principal del humano, solo lectura — nunca se escribe ahí).
**Destino:** el arnés actual (`arnes/`) y la línea de demanda (t-034, `marco_estrategia_mercado.md`).
**Estado:** en curso. Pases 0 y 1 cerrados.

---

## 0. Metodología de destilación controlada

El pedido del Supervisor fue explícito: *"el contexto de otras sesiones de trabajo es bastante grande, así que debemos aplicar una metodología controlada de destilación."* No se vuelca la carpeta al arnés; se destila por pases, y **cada pieza queda clasificada y ruteada o descartada con razón escrita.**

**Clasificación de cada pieza** (protocolo ya declarado en `marco_estrategia_mercado.md` §4):

| Clase | Qué es | Qué se hace |
|---|---|---|
| **Evidencia** | Dato observado, con método rastreable | Se destila al arnés y se cita |
| **Afirmación** | Sostenida sin método rastreable | Va al **registro de hipótesis** con su falsador, nunca como hallazgo |
| **Decisión ya tomada** | Restricción del terreno | Se respeta y se marca |
| **Huérfano** | Evidencia sin pregunta que la reclame | Se archiva con su razón |
| **Obsoleto** | Referido al motor Agnostic o a un estado del mundo superado | Se descarta, con nota de qué se rescató antes |

**Reglas duras del proceso:**
1. **Cuando el material previo contradiga al comportamiento medido, gana el comportamiento.**
2. Nada queda "en la carpeta" como fuente paralela de verdad: lo que sobrevive se integra al documento de su rama; lo que no, queda descartado por escrito acá.
3. Los pases van **de dato duro a prosa**, nunca al revés — para que la interpretación previa no coloree la lectura de los números.

**Orden de pases:**

| Pase | Contenido | Estado |
|---|---|---|
| 0 | Inventario, deduplicación, detección de obsoletos | ✅ cerrado |
| 1 | Datos duros: exportes reales de Google Ads | ✅ cerrado |
| 2 | Auditorías del sitio y de la cuenta (interpretación propia previa) | pendiente |
| 3 | Marca, tono y tokens de diseño | pendiente |
| 4 | Estrategia de mercado e investigaciones de sector | pendiente |
| 5 | `SESION_2026-07-02` (planes atados al motor Agnostic — el más contaminado) | pendiente |

---

## 1. Pase 0 — Inventario

**36 archivos, ~2.700 líneas de markdown, 5,3 MB (casi todo son imágenes de marca).** Es un volumen destilable, no un archivo histórico inmanejable.

```
DOCS VETA DORADA/
├── Branding Veta Dorada 2026/          logos SVG+PNG (positivo/negativo), card, vetas, .cdr fuente
├── COMERCIAL WEB/                      embudo, tono de voz, auditoría del sitio real, UX, módulo home
│   └── estrategia de mercado/
│       └── Analiticas y SEO/           estrategia (267 líneas), INVS sectores/SEO/tendencias, manual de marca
│           └── Google ADS/             ★ exportes REALES abr-jun 2026 + auditoría
└── SESION_2026-07-02_HOME_SEO_EMBUDO/  7 docs: auditoría de schemas/zaps + planes home/embudo/SEO
```

**Hallazgos del inventario (antes de leer una sola línea de contenido):**

- **D1 — Dos pares de duplicados exactos** (verificado por `md5sum`): `GUIA_SEO_IMAGENES_ESPACIOS.md` y `MANUAL_MARCA_TOKENS.md` existen en la raíz y en `Analiticas y SEO/`, byte por byte idénticos. Se destila una sola copia.
- **D2 — Dos `.md` que son CSV renombrados**: `Informe de terminos de busqeuda.md` y `INforme de grupos de anuncios.md` tienen exactamente el mismo peso que sus `.csv` hermanos. No son documentos, son datos duplicados. Se usa el `.csv`.
- **D3 — `INVS_tendencias web carpinteria y diseño.md`: 22 KB en una sola línea, sin saltos.** Es salida de un LLM pegada en crudo. Contenido real (análisis prospectivo del sector de carpintería arquitectónica en Bogotá), formato inutilizable. Se procesa en el pase 4 y se marca como **afirmación** hasta verificar sus fuentes.
- **D4 — `SESION_2026-07-02_HOME_SEO_EMBUDO/` está atada al motor Agnostic** (`01_AUDITORIA_SCHEMAS`, `02_AUDITORIA_ZAPS`, `03_CONTRATO_SCHEMAS_ZAPS`). Ese motor es exactamente lo que esta migración decidió abandonar. **Presunción de obsoleto para la capa de mecanismo, con rescate probable en la capa de contenido** (los planes 04-06: home, embudo, SEO técnico). Pase 5, con pinzas.
- **D5 — Aparece un dominio real: `vetadeoro.co`** (`auditoria_web_Actual_vetadeoro.co.md`). El repo apunta hoy a `empresa-muebles-vl37.vercel.app` como producción. **Hay un dominio propio que el sistema nuevo no conoce** — relevante para H6 (SEO local) y para el corte a producción.

---

## 2. Pase 1 — Datos duros de Google Ads (1 abr – 17 jun 2026)

**Clase: EVIDENCIA.** Exportes directos de la cuenta, con método rastreable. Es el material de mayor calidad de toda la carpeta y por eso se procesó primero.

### 2.1 Los números reales de la cuenta

Fuente autoritativa: `Informe de grupo de anuncios.csv` (el informe de términos solo ve una parte, ver §2.4).

| Métrica | Valor (78 días) | Equivalente mensual |
|---|---|---|
| Coste total | **$381.181 COP** | ~$146.600 COP/mes |
| Clics | 336 | ~129/mes |
| Impresiones | 2.820 | ~1.085/mes |
| Conversiones | **47,05** | ~18,1/mes |
| CPA real | **$8.102 COP** | — |
| CPA objetivo configurado | $8.125 COP | — |
| CTR | 11,91% | — |
| CPC medio | $1.134 COP | — |

### 2.2 El hallazgo principal: la cuenta no está mal optimizada, está **hambrienta**

**$381.181 COP en 78 días son ~$4.887 COP/día** — del orden de **USD $1,20 diarios** (a una tasa aproximada de $4.000 COP/USD; verificar la tasa del periodo antes de citar el número en dólares). Para el mercado de cocinas integrales en Bogotá, 2.820 impresiones en dos meses y medio es presencia prácticamente nula.

**Esto reencuadra la restricción #2 del negocio.** El mapa (`logica_de_negocio.md`, A11) concluyó que el cuello de botella es la demanda y no la fábrica, con ratio 4:1. Correcto — pero la causa que se venía asumiendo era de mercado o de captación. **Los datos dicen algo mucho más prosaico: la inversión publicitaria es del orden de USD $36 al mes.** No los está ganando la competencia; casi no están apareciendo.

> **Presupuesto y CPA objetivo trabajando en contra.** La campaña es de CPA objetivo ($8.125) y lo está cumpliendo ($8.102). Una campaña de tCPA con objetivo bajo y presupuesto mínimo **estrangula el volumen por diseño**: cumple el costo por conversión a cambio de no comprar casi nada. Es el mecanismo exacto detrás de "faltan leads".

**Aritmética de la oportunidad, dicha con su límite:** si una conversión cuesta ~$8.100 COP y un proyecto de cocina vale millones, el margen para pagar mucho más por lead es enorme. **Pero no se puede cerrar el cálculo, y ese es el punto:** nadie sabe qué proporción de esas 47 conversiones se volvió venta, porque `leads` no tiene etapa ni FK a `proyectos` (H3), `score_conversion` está muerto (H1) y no hay conversiones offline (H2). **La decisión de subir presupuesto es correcta en dirección y todavía no cuantificable — H1/H2/H3 son exactamente lo que la vuelve cuantificable.**

### 2.3 La cuenta está apagada el 38% de los días

**30 de 78 días sin un solo clic**, con rachas consecutivas:

| Racha | Periodo |
|---|---|
| 7 días | sáb 25 abr → vie 1 may |
| 5 días | jue 14 may → lun 18 may |
| 4 días | vie 17 abr → lun 20 abr |
| 4 días | sáb 30 may → mar 2 jun |
| 3 días | vie 12 jun → dom 14 jun |

**Las rachas arrancan en días distintos de la semana (vie, sáb, jue), así que no es programación horaria: es presupuesto agotado o campaña pausada.** Hay que confirmarlo en el historial de cambios de la cuenta — es una pregunta para vos, no una conclusión.

**Además, el fin de semana está casi muerto:** sáb+dom = 29 de 336 clics (**8,6% del tráfico pagado**), con domingo en 3 clics totales en 11 domingos y **cero conversiones**. Para una compra de hogar de alta consideración, el fin de semana es cuando la pareja se sienta a mirar cocinas. **Hipótesis a verificar, no conclusión:** puede ser programación deliberada, presupuesto ya consumido el viernes, o baja demanda real. Los tres tienen acciones distintas.

*Dato de contraste:* el jueves concentra 90 clics y **17 de las 47 conversiones (36%)** con solo 11 jueves en el periodo.

### 2.4 La mitad de la cuenta es invisible por diseño

Reconciliando los dos informes del mismo periodo:

| | Coste | Conv. | Clics | Impr. |
|---|---|---|---|---|
| Informe de **grupos** (real) | $381.181 | 47,05 | 336 | 2.820 |
| Informe de **términos** (visible) | $177.583 | 24,05 | 172 | 1.522 |
| **Diferencia** | **53% oculto** | **49% oculto** | 49% | 46% |

**El 53% del gasto ocurre en términos de búsqueda que Google no revela** (umbrales de privacidad). Es comportamiento normal de la plataforma, no un error de nadie, **pero es una restricción dura para R6**: un ad manager agentivo no puede optimizar a nivel de término lo que no puede ver. Tiene que trabajar en grupo/campaña, negativos y señales de conversión — no en microgestión de términos.

### 2.5 Qué convierte y qué no (con su advertencia estadística)

**Advertencia primero, porque cambia cómo se lee la tabla:** con 172 clics visibles repartidos en 297 términos, la mayoría tiene 1-4 clics. **A ese volumen no se puede concluir que un término "no funciona": es ruido, no señal.** El "48,8% del gasto sin conversión" es un dato real y una conclusión inválida si se lee como desperdicio. Se reporta para que nadie lo use como excusa para cortar términos con buena intención comercial.

**Lo que sí convirtió** (24,05 conv visibles):

| Conv. | Coste | CPA | Término |
|---|---|---|---|
| 9,00 | $37.561 | $4.173 | cocinas integrales |
| 2,00 | $760 | **$380** | cocinas en poliuretano precio |
| 1,05 | $14.798 | $14.093 | cocinas integrales bogota |
| 1,00 | $1.254 | $1.254 | fabricantes de cocinas integrales en bogota |
| 1,00 | $994 | $994 | cocinas integrales cerca de mi |
| 1,00 | $1.046 | $1.046 | las mejores cocinas integrales en bogota |
| 1,00 | $492 | $492 | cocinas metalicas integrales |
| 1,00 | $1.552 | $1.552 | closet a la medida bogotá |

**Señal fuerte a nivel de grupo** (acá el n sí alcanza):

| Grupo | Coste | Conv. | CPA | CTR |
|---|---|---|---|---|
| Cocinas integrales | $186.723 | 25,05 | **$7.455** | 9,97% |
| Anuncios de Amoblamiento Integral | $194.459 | 22,00 | $8.839 | 15,66% |

Gastan casi lo mismo; **Cocinas convierte más barato (~16% mejor CPA)**. Amoblamiento tiene mejor CTR pero peor CPA — la gente hace clic más y convierte menos, lo que apunta a un desajuste entre anuncio y página de destino, no a mal targeting.

**`cocinas en poliuretano precio` a $380 de CPA es el dato más interesante de la tabla:** material específico + intención de precio, a **1/20 del CPA promedio**. Un solo caso, no es prueba — pero es la hipótesis más barata de testear que hay en todo este análisis.

### 2.6 Demanda vista y no capturada — 214 términos con impresiones y cero clics

387 impresiones que nadie clickeó. El patrón es nítido y **conecta con dos hallazgos técnicos ya abiertos**:

- **Búsquedas por barrio de Bogotá**: `carpinteria fontibon` (11), `carpinteria suba` (8), `carpinteria cedritos` (5), `cocinas integrales fontibon` (4), `cocinas integrales suba` (4). → **Esto es exactamente lo que desbloquea H6** (NAP incompleto, SEO local). La gente busca por barrio y no está haciendo clic.
- **Marcas de competidores**: `cociarte bogota` (11), `sanicoc cocinas` (5). Señal competitiva real y verificable, no una impresión de mercado.
- **Intención de fábrica/taller**: `fabrica cocinas integrales bogota`, `fabrica de closet bogota`, `taller muebles a medida`. Coincide con la identidad real del negocio (taller propio), y ese atributo **no aparece en el sitio como diferenciador**.

---

## 3. Ruteo de lo destilado hasta acá

| Hallazgo | Clase | Rama | Consecuencia |
|---|---|---|---|
| Cuenta hambrienta (~USD $36/mes) | evidencia | **R1** | Reencuadra la restricción #2 del negocio. Decisión de presupuesto, bloqueada por H1-H3 para cuantificarla |
| tCPA estrangulando volumen | evidencia | **R1/R6** | Palanca directa sobre "más leads" |
| 38% de días apagados, rachas de 4-7 | evidencia | **R1** | Pregunta abierta al Supervisor: ¿presupuesto o pausas? |
| Fin de semana al 8,6%, domingo en cero | evidencia + hipótesis | **R1** | Tres causas posibles, tres acciones distintas |
| 53% del gasto invisible a nivel término | evidencia | **R6** | **Restricción de diseño de R6**: optimizar por grupo/negativos, no por término |
| Cocinas > Amoblamiento en CPA | evidencia | **R1** | Reasignación, con n suficiente |
| Amoblamiento: CTR alto + CPA malo | evidencia | **R2** | Desajuste anuncio↔página de destino |
| `cocinas en poliuretano precio` CPA $380 | señal, n=1 | **R1** | Hipótesis barata de testear |
| Búsquedas por barrio sin clic | evidencia | **R1/R2** | Desbloquea y prioriza **H6** (SEO local + NAP) |
| Competidores buscados por nombre | evidencia | **R5** | Insumo real de análisis competitivo |
| Intención "fábrica/taller" no explotada | evidencia | **R2/R5** | El taller propio no se comunica como diferenciador |
| Dominio `vetadeoro.co` (D5) | decisión tomada | **R2** | El sistema nuevo no lo conoce; afecta corte a producción |

## 4. Preguntas que este pase abre para el Supervisor

1. **¿Las rachas de días sin clics son presupuesto agotado o campañas pausadas a mano?** Se ve en el historial de cambios de la cuenta.
2. **¿El fin de semana está apagado por programación deliberada?** Si no lo está, el domingo en cero es demanda real y es otro dato.
3. **¿Qué está contando la cuenta como "conversión"?** Envío de formulario, clic a teléfono, otra cosa. Sin esto, los 47 no significan nada preciso.
4. **`vetadeoro.co`: ¿está vivo, apunta al sitio legacy, y qué pasa con él en el corte a producción?**
5. **¿Existe Perfil de Empresa en Google?** Las búsquedas por barrio no se ganan con pauta, se ganan con presencia local.

---

## 5. Pase 2 — Auditorías previas (`Auditoria_Google_Ads.md`, `auditoria_web_Actual_vetadeoro.co.md`)

**Son documentos buenos.** Números correctos, hallazgos concretos, y en dos puntos llegaron antes que este análisis. También tienen dos contradicciones reales que hay que resolver, no suavizar.

### 5.1 ★ El hallazgo más importante de toda la destilación: el corte a producción rompe la conversión

Cruzando tres fuentes:

- `Auditoria_Google_Ads.md`: *"una **conversión** no es una venta cerrada; es una acción de valor en la web (usualmente **un clic al botón de WhatsApp** o el envío de un formulario)."*
- `auditoria_web_Actual_vetadeoro.co.md`: *"Todos los CTAs (`COTIZAR POR CHAT`, `AGENDAR AHORA`, `Cotizar ahora`) **redirigen al mismo enlace de WhatsApp** (`https://wa.link/rmgga6`)."*
- **El sitio nuevo (`dev`) no tiene un solo enlace a WhatsApp** (H8, verificado: 5 enlaces a `/agendar`, cero a WhatsApp).

> **Consecuencia:** las 47 conversiones que la campaña de CPA objetivo usa para aprender **son clics a WhatsApp en `vetadeoro.co`**. Si `dev` → `main` sale como está, **desaparece el evento de conversión sobre el que está entrenada la puja automática.** No es una fricción de UX: es un bloqueador de corte a producción. La campaña se degradaría sin que nadie entienda por qué.
>
> **H8 sube de categoría: de "desajuste de canal" a "riesgo de migración de primer orden".** Debe resolverse *antes* del merge, no después.

### 5.2 ★ `gclid` y `score_conversion` estaban diseñados, no olvidados

`Embudo y experiencia.md` documenta un **embudo híbrido de calificación** ya diseñado en detalle:

- **Paso 1:** modal de micro-filtro (tipo de espacio + estado del proyecto + nombre) antes de abrir WhatsApp.
- **Paso 2:** *"Captura de forma invisible el identificador de clic de Google (`GCLID`), junto con el Nombre y Teléfono... El código técnico nunca viaja por WhatsApp."*
- **Paso 3:** importación de conversiones offline con **puntuación de calidad 1-10** en vez de revenue — *"Venta de repisa = 1 punto; Venta de Cocina Premium = 10 puntos"* — explícitamente para **no revelarle las finanzas reales a Google**.

Y `Modulos Auxiliares web.md` confirma que existía el componente: `VetaAgendar.tsx`, *"captura la metadata del clic, guarda en db de leads, y redirige a whatsapp"*.

> **Esto reescribe dos hallazgos del marco:**
> - **H1 ya no es "el criterio nunca se definió".** `score_conversion` **tiene propósito documentado**: es el score 1-10 de calidad de conversión para la importación offline. El criterio estaba definido; lo que nunca ocurrió fue la implementación.
> - **H2 no es un descuido de migración.** Es la pérdida de una decisión de diseño explícita y sofisticada. El diseño previo era **mejor** que la recomendación de la propia auditoría de Ads (que solo pedía UTMs — los UTM dicen de qué campaña vino, pero no le enseñan nada al algoritmo de puja).

### 5.3 Contradicción interna de `Auditoria_Google_Ads.md` — no se sostiene el diagnóstico de "leads basura"

El documento afirma dos cosas incompatibles:

- **Error 1:** *"con 4 clics al día... necesitas acumular entre 20 y 25 leads para cerrar 1 contrato... **Tu campaña no está fallando; está operando al ritmo que le permite tu presupuesto.**"*
- **Error 2:** *"Tienes una tasa de conversión muy alta (14%), pero pocas ventas cerradas. Esto significa que estás recibiendo muchos mensajes de personas que solo están curioseando."*

Con **47 conversiones y ~1-2 cierres en el periodo**, el negocio está exactamente en el rango que el Error 1 declara normal (1 cierre cada 20-25 leads). **El Error 2 diagnostica un problema de cualificación sin evidencia que lo distinga del comportamiento normal que el Error 1 acaba de describir.**

**Clasificación: AFIRMACIÓN, no evidencia.** Puede ser cierta —es plausible que WhatsApp abierto atraiga curiosos— pero **nadie midió la calidad de esos 47 contactos**. Va al registro de hipótesis con su falsador: *si al instrumentar el embudo (H1/H3) resulta que la tasa lead→visita es normal para el sector, la hipótesis de "leads basura" cae y el problema es solo de volumen.*

### 5.4 Contradicción entre los dos documentos — gana el dato medido

| Fuente | Afirmación |
|---|---|
| `auditoria_web_Actual_vetadeoro.co.md` | *"La tasa de conversión web promedio de las carpinterías oscila entre 0.80% y 1.10%... la web actual actúa como un colador... **perdiendo el 99% de las visitas interesadas**."* |
| `Auditoria_Google_Ads.md` (medido) | **Tasa de conversión: 14,00%** |

**Regla #1 del protocolo: gana el comportamiento medido.** El sitio legacy convierte el 14% del tráfico pagado — no el 1%. La frase del "colador que pierde el 99%" **queda refutada por los datos de la propia carpeta**.

*Matiz honesto:* son universos distintos (tráfico pagado de alta intención vs. tráfico total), así que el sitio puede seguir teniendo defectos de conversión reales — los seis que el documento enumera son concretos y verificables. **Lo que no se sostiene es la magnitud ni la conclusión de "colador".** Los benchmarks citados (0,80-1,10%, 5-10% alta gama, CPC $0,19 USD) no traen fuente → **afirmación**.

### 5.5 Contradicción estratégica entre documentos: ¿fábrica o autor?

| Fuente | Posición |
|---|---|
| `auditoria_web_Actual_vetadeoro.co.md` | *"'Somos punto de fábrica' y 'Sin intermediarios ni sobre costos' es el mismo argumento que usan los talleres informales del 12 de Octubre o el Restrepo... **compite por precio bajo**"* |
| `Tono de voz de marca.md` | *"Diseño de autor **a precio de fabricante**. Paga por calidad, **no por intermediación**"* |

Es la tensión de posicionamiento en su versión local, y **hay evidencia para arbitrarla, no hace falta opinar**: en los términos de búsqueda, `fabrica cocinas integrales bogota`, `fabrica de closet bogota` y `fábrica de cocinas integrales` **generan impresiones y cero clics**, mientras que `fábrica de cocinas integrales en bogotá` fue el **mayor quemador de plata sin convertir** ($3.812). Señal débil por volumen, pero direccional y en contra del ángulo "fábrica". **Se resuelve en R5 con más datos, no con gusto.**

### 5.6 Lo demás del pase 2

- **Los 6 defectos del sitio legacy** son concretos y en su mayoría verificables: contenido repetido, propuesta de valor comoditizada, bloques huérfanos, **ausencia total de prueba social**, embudo sin calificar, y **confusión de identidad** (`Veta Dorada` / `HG González S.A.S` / `Hermanos García González S.A.S` mezcladas en el footer). El último afecta directo a **H6**: el NAP local exige un nombre consistente.
- **Recomendación correcta y ya obsoleta:** "NO desactives Amoblamiento General". Ya está resuelto con datos — Cocinas tiene mejor CPA ($7.455 vs $8.839) pero Amoblamiento aporta 22 de 47 conversiones. La recomendación se sostiene.
- **Diseño Axiomático (Nam P. Suh)** ⚠️: metodología real, aplicada acá de forma más decorativa que operativa. Sus conclusiones (desacoplar catálogo, cotizador y mensajería) **ya están implementadas en la arquitectura nueva** por otras razones. No aporta una decisión nueva; se deja anotado sin adoptarlo.
- **Terminología a corregir:** el documento llama "CAC del 6,3%" a lo que es *inversión publicitaria como % de ingreso*. No es CAC. Importa cuando se use para decidir presupuesto.

---

## 6. Pase 3 — Marca, tono y tokens

### 6.1 R5 estaba mucho más avanzada de lo que el marco asumía

`Tono de voz de marca.md` **no es un borrador: es un sistema de marca casi completo**, y contradice mi propia lectura de que "hay copy pero no hay sistema".

| Pieza | Estado |
|---|---|
| **Arquetipo** | **El Creador Experto** (honesto, meticuloso, con autoridad) — ya elegido |
| **Tono** | Directo, elegante, sin jerga pretenciosa. Confianza técnica + transparencia financiera |
| **Anti-posicionamiento** (lo más útil) | *"Lo que NO somos: un Estudio de Arquitectura esnob que cobra comisiones ocultas. No fabricamos muebles baratos o desechables. No usamos CNC industrializado masivo; usamos un proceso **Híbrido Artesanal**"* |
| **Eslogan** | *"Diseña tu espacio. Habita el bienestar."* |
| **Señales de confianza** | Desde 1995, +2 décadas, garantía estructural con acompañamiento post-venta |
| **Copys aprobados** | 5, listos para usar |

**El mejor activo de todo el documento**, y no está en ninguna parte del sitio nuevo:

> *"Conocemos la arquitectura de Bogotá. Sabemos cómo entrar a tu conjunto residencial cumpliendo todos los protocolos y entendemos que cada muro tiene desniveles únicos que exigen una medición técnica exacta en persona."*

Eso **sí** es diferenciación local defendible, imposible de copiar por un catálogo importado, y justifica la visita gratuita en vez de disculparla. Es exactamente el antídoto contra la comoditización que la auditoría web denunciaba — **y ya estaba escrito**.

**Protocolo de reseñas curadas:** decisión explícita de **no** usar el widget de Google Maps *"para evitar vandalismo de reputación"*, y en su lugar un componente `VetaTestimonials` con reseñas de 5 estrellas enriquecidas con contexto barrial (*"instalación de cocina en el barrio Rosales"*). → **Esto explica H7**: la tabla `testimonios` del legacy existía para esto. La prueba social no se olvidó, se diseñó y no se implementó.

### 6.2 Servicio real que no está en ningún mapa

**Restauración de pisos de madera natural** — pulido, reparación y sellado de pisos antiguos, orientado a casonas en Teusaquillo y Chapinero. **No aparece en `logica_de_negocio.md`, ni en el schema, ni en el sitio nuevo.** Es una línea de servicio de alto valor arquitectónico, con un perfil de cliente y un barrio distintos a los del core. → **Va al mapa como hallazgo de negocio, no solo de marketing.**

### 6.3 Discrepancia de precio del diseño 3D

| Fuente | Precio |
|---|---|
| `Embudo y experiencia.md` | *"$100 mil por cada 2 espacios, **reembolsable** de la cotización general"* |
| `logica_de_negocio.md` | *"$130k y se factura en DIAN"* |

Probablemente el precio subió (y por eso se factura). **Pregunta para el Supervisor: ¿cuál rige hoy, y por cuántos espacios?** Nota relevante: que el diseño sea **reembolsable/deducible por diseño** es justamente el reproceso ya documentado (*"a veces no se descuenta del anticipo final"*) — no es un olvido operativo suelto, es una regla de negocio explícita que el sistema no hace cumplir.

### 6.4 `MANUAL_MARCA_TOKENS.md` — taxonomía reutilizable, inventario obsoleto

**Todo su inventario apunta a rutas que no existen en la arquitectura nueva** (`src/app/globals.css`, `src/styles/layout_tokens.css`, `storage/styles/tokens.css`, `src/components/specialized/Veta*.tsx`). Como auditoría, está muerto.

**Como método, es bueno y se rescata entero:**
- Jerarquía **primitivos → semánticos → componente**.
- Regla de override: qué puede vivir local (geometría derivada de datos, adaptadores de terceros) y qué debe subir a token (cualquier color literal, cualquier `!important` — *"eso es señal de que falta un token canónico"*).
- Criterio de escalamiento: si un valor **se repite, expresa marca, o se necesita en otra lane**, deja de ser local.

**Y los valores de marca son recuperables** de sus tablas de literales: `#8b6f3c`, `#a68c59`, `rgba(212,197,161,0.85)`, `#0A0A0A`, `0x8b6914` (madera 3D), más el namespace `--veta-*` con superficies glass/stone/matte/sheen.

> **Contexto que lo vuelve urgente:** el repo nuevo **no tiene sistema de diseño**. Las 6 landings SEO se hicieron con "estilo simple" precisamente porque el Tailwind/`VetaHeader` del legacy no existe acá (registrado en `estado.md`, t-030). Este manual es la receta para cerrar ese hueco sin inventar la marca de nuevo.

### 6.5 Mapa de sitio diseñado vs. construido

| Diseñado (`Embudo y experiencia.md`) | Construido en `dev` |
|---|---|
| Espacios a Medida | `/espacios` + `/portafolio` + 6 landings |
| Colecciones | `/colecciones` ✅ |
| Agendar (modal de filtrado) | `/agendar` — **página, no modal; sin filtro, sin WhatsApp, sin gclid** |
| **Noticiario de diseño** (artículos de diseño, arte, cultura) | **no existe** |

El "Noticiario de diseño" es el canal de contenido orgánico — justo lo que atacaría la dependencia total de pauta que el pase 1 dejó en evidencia.

---

## 7. Reencuadre: qué es realmente esta carpeta

Después de tres pases, la lectura honesta cambia respecto a lo que el marco asumía:

> **No falta estrategia. La estrategia está hecha, es de buena calidad, y la migración al repo nuevo dejó afuera su implementación.**

El embudo híbrido, la captura de `gclid`, el score 1-10 de conversión offline, las reseñas curadas con contexto barrial, el arquetipo, el tono, los copys aprobados, el sistema de tokens: **todo estaba diseñado y nada de eso existe hoy en `dev`.**

Eso confirma con evidencia la instrucción del Supervisor —*"tomar lo que ya hay, organizarlo y darle mejora y estabilidad pro"*— y **degrada aún más la idea de abrir investigación nueva**: el trabajo pendiente es de implementación y de disciplina, no de descubrimiento.

---

## 8. Respuestas del Supervisor y decisiones (2026-08-03)

### 8.1 Los datos de Ads son una línea base, no un diagnóstico — y contienen un experimento natural

> *"Hay que hacer un nuevo diagnóstico de ads porque esos datos son de una auditoría vieja. Después de esa auditoría **se duplicó el presupuesto y se duplicaron los leads**."*

**Eso no es una corrección menor: es el dato más valioso de toda la conversación.** Duplicar el presupuesto y obtener el doble de leads significa **respuesta lineal** — la cuenta estaba operando muy lejos de su punto de saturación. Es un experimento controlado que el Supervisor ya corrió, y **confirma con evidencia propia la lectura del §2.2**: la restricción no era el mercado ni la calidad de la campaña, era el presupuesto.

**Consecuencia metodológica:** el periodo abr-jun 2026 pasa de "diagnóstico" a **línea base pre-tratamiento**. Vale más así — ahora hay un par antes/después real, que es mucho mejor evidencia que una foto suelta.

**La pregunta que debe responder el diagnóstico nuevo, y es una sola:**

> Al duplicar el presupuesto, **¿el CPA se mantuvo o subió?**
> - **Se mantuvo** → sigue sin saturarse → volver a duplicar y repetir la medición. El techo todavía no apareció.
> - **Subió** → empieza la saturación → ahí sí se optimiza estructura, no presupuesto.

Sin `gclid` ni conversiones offline (H2), esto se mide en *conversiones*, no en *ventas*. Sirve para decidir presupuesto; no sirve todavía para calcular retorno real.

**Lo que hace falta:** los mismos tres exportes del periodo nuevo (términos de búsqueda, grupos de anuncios, serie temporal), o acceso por API.

### 8.2 Respuestas cerradas a las preguntas del pase 1

| # | Pregunta | Respuesta del Supervisor | Consecuencia |
|---|---|---|---|
| 1 | ¿Rachas sin clics = presupuesto o pausas? | **Falta de presupuesto** | Confirma §2.2 (cuenta hambrienta). El 38% de días apagados es el techo del presupuesto, no una decisión |
| 2 | ¿Fin de semana apagado a propósito? | **Sí, domingos apagados** | Explica el domingo en 3 clics. Revisable, pero **después** del presupuesto: mientras el presupuesto sea la restricción activa, mover el calendario solo redistribuye escasez |
| 3 | ¿Qué cuenta como conversión? | **El botón de WhatsApp** | ✅ **Confirma I-011 como bloqueador real de corte a producción**, ya no como inferencia |
| 4 | ¿Qué pasa con `vetadeoro.co`? | **Se cambia el DNS al nuevo destino en Vercel** | Ver §8.4 |
| 5 | ¿Existe Perfil de Empresa en Google? | **Sí, y es bueno** | Ver §8.3 — desbloquea parcialmente H6 |

### 8.3 El Perfil de Empresa existe, y su nombre es un hallazgo

El enlace compartido no permite extracción automática (Google bloquea el scraping), pero **sí reveló el nombre del perfil: `Cocinas integrales Veta de oro`.**

Eso agrava el problema de identidad ya detectado. Hoy conviven **cuatro nombres**:

| Dónde | Nombre |
|---|---|
| Perfil de Empresa en Google | `Cocinas integrales Veta de oro` |
| Repo nuevo (mitad de las páginas) | `Veta de Oro` |
| Repo nuevo (la otra mitad) | `Veta Dorada` |
| Footer del sitio legacy | `Veta Dorada` / `HG González S.A.S` / `Hermanos García González S.A.S` |

**El NAP local exige un nombre consistente en todas las superficies.** Hoy no lo hay en ninguna.

> **⚠️ Advertencia sobre renombrar el Perfil de Empresa.** Cambiar el nombre de un Perfil de Empresa verificado puede disparar re-verificación y afectar el posicionamiento local. Además, el nombre actual **contiene la palabra clave `Cocinas integrales`**, que es justamente la categoría con mejor CPA de la cuenta y la que aparece en las búsquedas por barrio del §2.6. Renombrarlo a `Veta Dorada` a secas **puede costar visibilidad local**. No es una razón para no hacerlo — es una razón para hacerlo con criterio, medir antes y después, y no el mismo día del corte a producción.

**Sigue faltando el NAP literal** (dirección exacta, teléfono, horario) para completar `lib/seo/jsonld.ts`. Es lo único que bloquea H6 y se copia del propio perfil en cinco minutos.

### 8.4 Dominio y cambio de marca

> *"`vetadeoro.co` será el destino de la migración al nuevo sitio, pero **la marca cambia a Veta Dorada**. Inicia con dominio antiguo, no es bloqueante; luego se crea nuevo dominio y se hace proceso de redirect cuidadoso."*

**Decisión aceptada y correcta en su prioridad** (no bloquear el corte por un dominio). Se registra con dos observaciones honestas:

1. **Dos migraciones de dominio son dos eventos de riesgo SEO, no uno.** Cada cambio exige 301 uno-a-uno, actualizar el Perfil de Empresa, Search Console y los enlaces de los anuncios. Si el dominio nuevo ya está decidido, hacerlo una sola vez es más barato que hacerlo dos. Es tu decisión; queda dicho el costo.
2. **La marca ya está inconsistente dentro del repo nuevo**, antes de cualquier cambio: `Veta Dorada` en `/proceso`, `/espacios`, `/estudios-home-office`, `/centros-de-entretenimiento`; `Veta de Oro` en `app/layout.tsx`, `lib/seo/jsonld.ts`, `/portafolio`, `/colecciones`, la home, login, registro, agendar y el cotizador. **La decisión de marca convierte esto de "inconsistencia" en "tarea de unificación con destino claro".**

### 8.5 Bug encontrado al verificar el dominio: las 6 landings SEO tienen la imagen rota

Verificando la dependencia de imágenes contra `vetadeoro.co` apareció un defecto real y no relacionado con la destilación:

- `components/specialized/LandingEspacio.tsx:15` declara en su comentario *"imagen remota de vetadeoro.co"*, pero el `src` que recibe es **una ruta relativa a la raíz** (`/vetadeoro/estudios-moderno-1.jpg`), no una URL absoluta.
- **El directorio `public/` no existe en el repo.**

→ **Las 6 landings SEO sirven hoy una imagen que devuelve 404.** Y no se arregla solo con el cambio de DNS: si `vetadeoro.co` apunta al sitio nuevo, la ruta sigue resolviendo contra un origen que no tiene esos archivos. Son las páginas construidas específicamente para captar búsquedas por categoría — o sea, exactamente las que el §2.6 muestra recibiendo impresiones sin clic.

## 9. Decisión técnica: secuenciar la migración de plataforma y la de dominio

> El Supervisor propuso: **primero** republicar el sitio nuevo sobre `vetadeoro.co` (absorbiendo el historial), **después** mudar a dominio nuevo con redirects. Y pidió que si el criterio técnico dice que sale más barato hacerlo todo de una, se haga así.

**Recomendación: secuenciar, como propuso el Supervisor. Mi nota anterior ("dos migraciones son dos eventos de riesgo") era engañosa y queda corregida acá.**

Contar eventos no es medir riesgo. **Dos cambios controlados y diagnosticables son menos riesgosos que un cambio compuesto e indiagnosticable.** Las razones, en orden de peso:

1. **Diagnosticabilidad — el argumento central.** Si se cambia plataforma y dominio a la vez y el tráfico cae 40%, es imposible saber si fue el mapeo de 301, las plantillas nuevas, el contenido perdido, el enlazado interno o la mudanza. Con el único canal de leads del negocio en juego, quedar ciego no es aceptable. Secuenciado, siempre se sabe qué lo causó.
2. **El lanzamiento de plataforma ya carga tres cambios simultáneos**, y esto es lo que vuelve decisivo el argumento: (a) la acción de conversión de WhatsApp debe preservarse (I-011), (b) la marca cambia de `Veta de Oro` a `Veta Dorada`, lo que toca el Perfil de Empresa (I-017), y (c) el contenido y las plantillas se reescriben por completo. **Un cambio de dominio sería el cuarto.** Son demasiados para un solo evento.
3. **El sitio actual es Wix y es esencialmente una sola página con anclas** (confirmado en `Estrategia de mercado.md` §1). Eso significa que **el mapa de 301 de la migración de plataforma es diminuto** — casi no hay estructura de URLs que preservar. La migración de plataforma es, por lo tanto, la **de bajo riesgo**; la de dominio es la de alto riesgo, porque mueve toda la autoridad. Hacer primero la barata y verificable, y después la cara, es exactamente el orden correcto.
4. **La guía de Google para mudanzas de sitio pide contenido estable durante el cambio de dominio.** Hacer ambos a la vez la contradice de frente.
5. **El ahorro de hacerlo una sola vez es real pero pequeño:** una ronda de mapeo 301 y una de actualización de citaciones/URL de anuncios/Perfil de Empresa. Con una estructura de una sola página, son horas. **Lo que se arriesga es depuración a ciegas sobre el único canal de demanda del negocio.** La asimetría es enorme y va en una sola dirección.

> **Condición operativa que sí importa, y es la única forma de que secuenciar pague:** el segundo movimiento debe esperar a que el primero **se estabilice**. Si la plataforma cambia en la semana 1 y el dominio en la semana 3, se obtiene lo peor de ambos: dos perturbaciones sin línea base limpia en el medio. **Esperar a tener 4-8 semanas de tráfico y posiciones estables y comparables antes de mudar el dominio.** Si por alguna razón no se puede esperar, ahí sí conviene reconsiderar hacerlo de una.

*Matiz honesto que juega a favor de no angustiarse:* la autoridad acumulada de `vetadeoro.co` es baja (sitio Wix de una página, sin blog, sin backlinks trabajados, perfil de Google con pocas o ninguna reseña según `Estrategia de mercado.md`). **Hay menos "historial de búsquedas" que absorber de lo que parece.** El riesgo real de ambas mudanzas es menor que en un sitio consolidado — pero las URL de los anuncios y el Perfil de Empresa sí apuntan a `vetadeoro.co`, así que operativamente sigue importando.

---

## 10. Pase 4 (parcial) — Estrategia de mercado e investigación SEO

### 10.1 ★ Aparece el NAP — desbloquea I-007

`Estrategia de mercado.md` §1 documenta la ficha de Google observada:

| Campo | Valor |
|---|---|
| Nombre | `Cocinas integrales Veta de Oro` |
| Dirección | **Cra. 72a #71A-57, Bogotá** |
| Horario | **Lun–Sáb 08:00–18:00** |
| Reseñas | **0 valoraciones visibles** (al momento de esa investigación) |

**Es el dato que faltaba para completar `lib/seo/jsonld.ts`.** ⚠️ Debe confirmarlo el Supervisor contra la ficha real antes de publicarlo — el documento es de una sesión anterior y el propio Supervisor dice hoy que el perfil "es bueno", lo que sugiere que las reseñas cambiaron desde entonces. **Falta el teléfono**, que el documento no registra.

### 10.2 🚨 Peligro real: el JSON-LD propuesto contiene datos de un competidor y una calificación inventada

`INVS_SEO_empresas mobiliario.md` incluye un bloque JSON-LD "listo para integrar en la página de inicio". **No se debe copiar.** Contiene:

- `"streetAddress": "Carrera 15 bis # 39a - 27"`, `"addressLocality": "Teusaquillo, Bogotá"` → **es la dirección de la oficina de `Sus Muebles a la Medida`**, un competidor listado en la tabla del mismo documento.
- `"aggregateRating": { "ratingValue": "4.9", "reviewCount": "185" }` → **inventado.** La otra investigación de la misma carpeta dice que el perfil tiene **0 reseñas**.
- `"telephone": "+573115655166"` → procedencia desconocida.
- Perfiles de YouTube e Instagram que **no existen** (la misma carpeta documenta que no hay redes sociales).

> **Publicar un `aggregateRating` fabricado viola las políticas de datos estructurados de Google y puede acarrear una acción manual.** Publicar la dirección de un competidor es peor. Es una plantilla con datos de relleno, no un entregable — y es exactamente el tipo de material que el protocolo de destilación existe para interceptar. **Clasificación: no utilizable tal cual; se rescata solo la estructura (`@graph` con `FurnitureStore` + `Service` + `FAQPage`).**

*Nota aparte:* el documento afirma que `ProfessionalService` está descontinuado y recomienda `FurnitureStore`. El repo hoy usa `HomeAndConstructionBusiness`, que es un subtipo válido de `LocalBusiness`. ⚠️ **No es obvio que `FurnitureStore` sea mejor**; se verifica antes de cambiar, no se adopta por recomendación.

### 10.3 ★ Convergencia fuerte: la estrategia por barrio, confirmada por dos fuentes independientes

`INVS_SEO_empresas mobiliario.md` propone silos de contenido por localidad (Usaquén, Rosales, Chapinero, Quinta Camacho, Cedritos). **Y los datos de Google Ads muestran búsquedas reales por barrio sin un solo clic** (`carpinteria fontibon`, `carpinteria suba`, `carpinteria cedritos`, `cocinas integrales fontibon`, `cocinas integrales suba` — §2.6).

**Investigación de escritorio y comportamiento medido coinciden. Eso es señal, no opinión.** Es la recomendación más sólida de toda la carpeta.

**Pero con una tensión que hay que decir:** la investigación asume un cliente **premium del norte** (Usaquén, Rosales, Chicó). Las búsquedas reales que aparecieron incluyen **Fontibón y Suba**, que no son ese perfil. → **La demanda revelada no coincide del todo con el posicionamiento asumido.** Es el mismo eje de la disputa "¿fábrica o autor?" (§5.5), ahora con evidencia por el lado geográfico. Va a R5 como pregunta abierta, no como conclusión.

### 10.4 ★ Referencias de precio del mercado — informan la pregunta del diseño 3D

La tabla de competidores trae tarifas reales del sector, y **el "Amaderarte Model" que `Tono de voz de marca.md` citaba sin explicar queda documentado**:

| Competidor / referencia | Modelo de cobro |
|---|---|
| **Amaderarte** | Visita técnica de 3h con diseño 3D en vivo, **deducible del proyecto**, +$60.000 COP por mueble adicional |
| **Madecentro (Proyecta)** | Diseño individual $37.370; paquete de 10 diseños $274.309 |
| **Homarq** | Cocinas desde **$16.000.000 COP** |
| Diseño interior residencial completo (mercado) | $60.000–$120.000 COP/m² |
| Renders individuales (mercado) | $300.000–$900.000 COP por pieza |
| Modelo propuesto en el documento | Sesión fija $150.000 + $60.000 por mueble adicional, deducible |

**Lectura para el negocio:** Veta cobra **$130.000 por 2 espacios**, deducible. El mercado comparable cobra una sesión de ese orden **más un adicional por cada mueble extra**. → **La estructura de precio de Veta deja plata sobre la mesa en proyectos grandes**, porque no escala con el número de espacios. Es una hipótesis con referencias reales, no una opinión — y responde a la pregunta abierta del mapa sobre el neto post-DIAN del diseño 3D.

### 10.5 Un modelo de negocio que el mapa no tiene: silo dual diseño / fabricación

El documento propone **separar comercialmente el Diseño de Interiores (monetizado por m²) de la Fabricación**, con el argumento de que arquitectos, constructoras y remodeladores **ya llegan con planos** y solo necesitan despiece y producción en taller tecnificado.

→ **Eso es un segmento de cliente B2B que no está en `logica_de_negocio.md`.** El mapa modela cliente residencial directo. Vender capacidad de taller a quien ya trae el diseño es otra línea, con otro ciclo y otro margen. **Va al mapa como hallazgo de negocio (Parte I), igual que la restauración de pisos (I-014).**

### 10.6 Competidores reales que la investigación no vio

La investigación identifica: Amaderarte, Sergio Velosa, Mundo CasaBella, Homarq, Sipte Design, AS Mobiliario, Sus Muebles a la Medida, Madecentro, Incormaderas, Arther, Muebles Innova, Homecenter, IKEA, Liuri Deco.

**Pero los datos de Ads muestran que usuarios reales buscan por nombre a `cociarte` y `sanicoc` (§2.6), y ninguno de los dos aparece en el análisis.** → La investigación de escritorio encontró competidores plausibles; **los términos de búsqueda revelan competidores efectivos.** Se agregan al análisis de R5.

### 10.7 Calidad de las dos investigaciones — dónde creerles y dónde no

**`Estrategia de mercado.md` (267 líneas):** competente y **honesto donde corresponde** — marca explícitamente los volúmenes como *"No públicamente verificable"* en vez de inventarlos. Buen material de observación (sitio, ficha, competidores). Dos problemas:
- **El roadmap de 24 meses está desconectado del negocio real**: pone *"Campañas de Adwords Geo-local"* en Q4 2027 cuando **la cuenta de Google Ads lleva corriendo desde al menos abril de 2026** y es hoy la única fuente de leads. El documento fue escrito sin conocer la cuenta.
- Es un playbook SEO estándar de 24 meses, y la restricción #1 declarada del negocio es el dinero. **Clasificación del roadmap: afirmación / no accionable en su forma actual.**

**`INVS_SEO_empresas mobiliario.md`:** el mejor material competitivo y de precios de la carpeta, y a la vez el más contaminado. Está lleno de **estadísticas con precisión falsa y sin fuente** (activación de AI Overviews >70% vs <20%, caída de CTR de 34,5%, cuota de ChatGPT 45-64%, correlación de menciones en YouTube *r ≈ 0,737*, Google Lens +30% interanual). Una correlación citada a tres decimales sin fuente es una señal de alarma, no un dato. **Clasificación: la tabla de competidores y precios es evidencia utilizable; toda la capa de estadísticas SEO/GEO es afirmación y no se cita hacia afuera.**

**Lo técnico que sí se rescata y ya está resuelto o es barato:**
- **SSR obligatorio** para que los rastreadores de IA lean el contenido → **el repo nuevo ya cumple** (Next.js App Router con Server Components). ✅
- `robots.txt` permitiendo bots de IA + archivo `llms.txt` → barato, el repo ya tiene `app/robots.ts`.
- **Sitemap de imágenes** y `<figcaption>` visible con más peso que el `alt` ⚠️ (verificar) → relevante y urgente dado I-016 (las 6 landings sirven imágenes rotas).

---

## 11. Pase 4 (cierre) — datos reales del Perfil de Empresa, geo-ejes y SEO de imágenes

### 11.1 ★ El Perfil de Empresa real — NAP completo y correcciones a lo anterior

El Supervisor aportó una captura del panel real. **Reemplaza lo que decía la investigación previa.**

| Campo | Valor real (2026-08-03) |
|---|---|
| Nombre | `Cocinas integrales Veta de oro` |
| Calificación | **4,4 ★ con 8 opiniones** |
| Categoría principal | **`Diseñador de interiores` en Bogotá** |
| Dirección | **Cra. 72a #71A 57, Bogotá** (confirmada por el Supervisor) |
| **Teléfono** | **302 5922101** ← *dato que faltaba; el NAP queda completo* |
| Horario | Abre 8:00 a.m. |
| Interacciones con clientes | **276** |
| Estado del perfil | **Incompleto** — Google muestra *"Completa el Perfil de Negocio para mejorar tu visibilidad"* |

**Correcciones que esto obliga:**
- La investigación previa decía **0 reseñas**; hoy son **8 con 4,4**. El dato viejo queda superado.
- *(Corrección del asesor)* Interpreté que el Supervisor había dicho que el perfil "es bueno". Él aclara que no dijo eso. El perfil **está incompleto y con 8 reseñas** — no es un activo consolidado, es una palanca sin usar.

**Cuatro palancas gratis que la captura deja a la vista:**

1. **`Agregar WhatsApp` está sin activar.** Google lo ofrece explícitamente (*"Recibe mensajes directamente de los clientes"*). **WhatsApp es la acción de conversión del negocio** (I-011). Es el canal de cierre, ofrecido gratis, en la superficie que ya recibe 276 interacciones, y no está conectado.
2. **8 reseñas para un negocio que cierra ~15 proyectos al año desde hace años.** Las reseñas son factor de posicionamiento local de primer orden **y** alimentan la extensión de calificación que ya se ve en el anuncio pagado (`4,4 ★ (8)`). Es la palanca de mayor relación impacto/costo de todo el diagnóstico: cero pesos, y mejora orgánico y pauta a la vez.
3. **Desajuste de categoría.** La categoría es `Diseñador de interiores`, el nombre dice `Cocinas integrales`, y la identidad declarada en `Tono de voz de marca.md` es **fabricante directo con proceso "híbrido artesanal"** — explícitamente *"no somos un estudio de arquitectura"*. **Tres identidades distintas en la misma entidad.** La categoría principal pesa mucho en el posicionamiento local; ⚠️ verificar qué categorías ofrece Google en Colombia antes de cambiarla, y medir antes/después.
4. **El anuncio se muestra con la etiqueta `Cerrado`.** Visible en la captura del resultado patrocinado. Mostrar "Cerrado" deprime el CTR. Cruza con el hallazgo de que los domingos están apagados a propósito: **hipótesis a verificar — alinear el calendario de pauta con el horario real, o ampliar el horario publicado.**

**Corrección sobre la estructura del sitio actual:** dije en §9 que el sitio Wix es "una sola página con anclas" (siguiendo a `Estrategia de mercado.md`). **La captura lo desmiente**: el anuncio apunta a `vetadeoro.co/cocinas` y muestra enlaces de sitio a *Nuestros proyecto*, *acabados especiales*, *Crea la cocina de tus sueños*, *Fabricantes directos*. **Hay subrutas reales, así que el mapa de 301 es más grande de lo que dije.** Esto **no cambia la recomendación de secuenciar** — si acaso la refuerza, porque ahora sí hay estructura de URLs que preservar y conviene hacerlo en un movimiento aislado y verificable.

**Corrección sobre la antigüedad de la cuenta de Ads:** el Supervisor confirma que **corre desde 2024**, no "desde al menos abril de 2026". Dos consecuencias: (a) el roadmap de `Estrategia de mercado.md` que programa *"Campañas de Adwords Geo-local"* para Q4 2027 fue escrito con **~2 años de cuenta activa** a la vista, lo que agrava el diagnóstico de que ese documento se escribió sin conocer el negocio; (b) **existen ~2 años de histórico de Ads disponibles**, no 2,5 meses. Es una línea base mucho más rica para responder la pregunta del CPA (§8.1).

### 11.2 ★ La tensión geográfica, ahora con evidencia dura

`INVS_sectores bogotá.md` es el documento mejor fundamentado de la carpeta (se apoya en Catastro Distrital, DIAN, DANE y la Lonja, aunque sin citas puntuales). Construye **13 ejes geográficos** con centroide, estrato y radio, apuntando a estratos 4, 5 y 6 — casi todos en el **norte y centro premium** (Chapinero, Usaquén, Suba, Salitre, Teusaquillo).

**Pero el negocio está físicamente en el occidente** (Cra. 72a #71A-57; el mapa de la ficha lo sitúa junto a la Alcaldía Local de Engativá). En los 13 ejes, el occidente aparece **una sola vez y en el escalón más bajo**: `BOG-ZP-12 — Eje Occidente Residencial (Modelia, Normandía), estrato 4`.

Y las búsquedas reales con impresiones y cero clics fueron **Fontibón, Suba, Cedritos** — occidente y noroccidente, no el corredor de los cerros.

> **La pregunta estratégica que esto plantea, y es real:** ¿se compite por **proximidad** (occidente y noroccidente, donde el negocio está y donde el algoritmo local lo favorece por cercanía, con ticket menor) o por **aspiración** (Chapinero/Usaquén, donde está la plata, pero a 10+ km y contra competidores con showroom en la zona)?
>
> **Dato técnico que inclina la respuesta:** el paquete local de Google pondera fuertemente la proximidad. Un negocio en Engativá **no va a ganar el paquete local** de "cocinas integrales Chicó" por más contenido que publique. La estrategia premium-norte **no se puede ganar por SEO local** — requiere pauta, contenido y reputación, que son caros y lentos. La estrategia de proximidad, en cambio, ya está mostrando impresiones gratis que nadie está capturando.
>
> Es la misma disputa de "¿fábrica o autor?" (§5.5) por el eje geográfico. **Va a R5 como la decisión de posicionamiento a tomar, ahora con las dos opciones costeadas.**

*Matiz que evita caricaturizar la opción occidente:* el propio documento describe Normandía y Modelia como *"puertos seguros de la clase media alta... comerciantes prósperos y ejecutivos de mandos medios"*, estrato 4, con suelo a $4,5–5,5M/m². No es un mercado pobre; es un mercado distinto.

**Artefacto reutilizable tal cual:** la tabla de 13 ejes con latitud, longitud y radio, lista para `areaServed` como `GeoCircle`. **Y usa `HomeAndConstructionBusiness`, exactamente el tipo que el repo ya implementa en `lib/seo/jsonld.ts`** — a diferencia del JSON-LD envenenado del §10.2, este es consistente y no trae datos ajenos. Se adopta, ajustando los ejes a la decisión de posicionamiento.

### 11.3 `GUIA_SEO_IMAGENES_ESPACIOS.md` — el más accionable de la carpeta

Guía operativa, no teórica: **5 niveles de metadatos por imagen** (nombre de archivo, alt text, título, keywords, caption visible), con convención de nombres `{espacio}-{tipo}-{ubicación}-{numero}.jpg`, límites concretos (alt 125-150 caracteres, caption 60-120, <500KB, mínimo 4000x2400px, JPEG 87-90% o WebP), `ImageObject` JSON-LD y checklist por imagen. Cubre 4 de las 6 categorías que ya existen como landings en `dev`.

**★ Y resuelve la naturaleza de I-016.** Los archivos rotos que encontré (`vetadeoro-cavas-bares-cava-vinos-img-1.jpg`, `vetadeoro-closets-vestidor-espacioso-img-1.jpg`, `vetadeoro-cocinas-cocina-de-superficies-continuas-img-1.jpg`) **siguen esta convención de nombres**. Es decir: **las imágenes existieron y fueron nombradas según esta guía** — el repo simplemente no las tiene. → El arreglo probablemente sea **recuperar los archivos del sitio actual**, no producir imágenes nuevas. Bastante más barato de lo que I-016 sugería.

*Nota:* la guía menciona que el `ImageObject` "se genera automáticamente en el componente `SeoImageUploader`" — componente del legacy que no existe en el repo nuevo.

---

## 12. Pase 5 — la sesión del 2026-07-02: un plan completo que nunca se ejecutó

**Qué es:** una carpeta de sesión con 7 documentos que planifican al detalle la reconstrucción del Home, el embudo y el SEO técnico. **`07_PROGRESO_Y_CIERRE.md` está vacío — es una plantilla sin llenar.** El plan se escribió, se aprobó, y **nunca se completó**. Es la pieza que explica por qué tantas cosas diseñadas no existen.

Y es, con diferencia, **el material de mayor calidad de toda la carpeta**: rigor de capas, reglas anti-invención, y reconciliación explícita de contradicciones entre sus propias fuentes.

### 12.1 ★★ Este plan ya tenía la disciplina anti-invención que el research posterior violó

Tres reglas escritas en julio que **anticipan y refutan** el JSON-LD envenenado del §10.2:

| Regla del plan de julio | Qué previene |
|---|---|
| *"`aggregateRating`: solo si `buildAggregateRatingSchema(testimonios)` retorna no-null… **nunca inventar rating**"* | Exactamente el `4.9 / 185 reseñas` fabricado de `INVS_SEO_empresas mobiliario.md` |
| *"si `testimonios` está vacío, la sección **no se renderiza** — nunca placeholder ni datos de ejemplo hardcodeados"* | Prueba social falsa |
| *"`geo`: si siguen siendo el valor referencial, **omitir el bloque** en vez de publicar coordenadas sin verificar (mejor ausente que incorrecto)"* | Coordenadas inventadas |

> **La regla correcta ya existía en el propio corpus del Supervisor.** El documento de research posterior la violó. Refuerza I-020: no es una opinión del asesor, es la disciplina que el proyecto ya se había dado.

**Y reconcilió explícitamente una contradicción entre sus fuentes** (§1 de `06_PLAN_SEO_TECNICO.md`): `INVS_SEO_empresas mobiliario.md` proponía `FAQPage`; el plan lo rechaza porque **Google retiró los rich results de `FAQPage`** ⚠️ *(el documento fecha el retiro el 2026-05-07; la dirección es correcta y bien establecida, la fecha exacta debe verificarse antes de citarla)*. En su lugar define el formato **"Respuesta Atómica"**: preguntas de cola larga como `<h2>` visibles en el DOM, seguidas de 40-60 palabras de respuesta. Mejor criterio que el research posterior, otra vez.

### 12.2 ⚠️ Corrección del asesor: recomendé algo que el Supervisor ya había decidido en contra

`06_PLAN_SEO_TECNICO.md` §4 dice, textualmente:

> *"`areaServed`: **sin `GeoCircle`** (decisión ya tomada en `plan_json_ld_dinamico.md` §1, **ratificada por el usuario en esta sesión**: 'solo Bogotá, sectores de investigación'). Usar `AdministrativeArea`/`containsPlace`… **No agregar Chía ni municipios de sabana** — el usuario fue explícito en limitar a Bogotá."*

**Dos correcciones a lo que dije en pasos anteriores de esta destilación:**

1. **I-027 queda corregida.** Recomendé adoptar los 13 ejes `GeoCircle` de `INVS_sectores bogotá.md` "tal cual". **El Supervisor ya había rechazado `GeoCircle` explícitamente** y ratificado `AdministrativeArea`. La tabla de 13 ejes sigue siendo útil como *investigación de zonas*, pero **el formato del JSON-LD ya estaba decidido y no era ese**.
2. **En la revisión del Perfil de Empresa recomendé agregar `Chía` a las áreas de servicio.** Contradice la decisión ratificada de limitar a Bogotá. **Quitala**, salvo que la decisión haya cambiado desde julio — que es una pregunta legítima, no una suposición.

*Lección de método:* la destilación debe leerse **en orden cronológico inverso al de tamaño**: los planes ejecutables con decisiones ratificadas pesan más que los research amplios, aunque sean más cortos. Los leí al final por seguir el orden de "dato duro → prosa", y eso me costó dos recomendaciones erróneas.

### 12.3 ★ Decisiones de diseño ya confirmadas por el Supervisor (marcadas "no reabrir")

`00_INDICE.md` las declara cerradas:

1. **Tema visual: migrar de dark-lujo (`#0A0A0A`) a "Luz & Biofilia".** La biofilia se sugiere **con luz solar y fotografía natural, nunca con verde literal en los tokens**. El acento dorado permanece.
2. **NAP real: `Carrera 72A # 71A-57, Bogotá D.C.`** — tercera fuente independiente que lo confirma.
3. **El footer del sitio legacy dice "Medellín, Colombia"** — dato incorrecto documentado como bug a corregir.

**Tokens concretos de Luz & Biofilia, listos para portar** (el repo nuevo no tiene sistema de diseño):

```css
--veta-bg-warm-paper: 40 30% 98%;   /* #FCFBF9 — fondo principal, luz solar */
--veta-bg-linen:      38 26% 93%;   /* #F3EFE9 — fondo alterno, lino natural */
--veta-text-carbon:    0 0% 17%;    /* #2B2B2B — texto principal */
--veta-text-stone:    43 4% 46%;    /* #7A7873 — texto secundario */
--veta-glass-light-bg:     rgba(255, 255, 255, 0.55);
--veta-glass-light-border: rgba(43, 43, 43, 0.08);
```

### 12.4 ★ Reglas de UX/responsive — agnósticas de arquitectura, portables tal cual

Del plan (destiladas de `Practicas de codivo UX y responisve.md`). **Ninguna depende de Agnostic; todas aplican al repo nuevo:**

- Tipografía fluida con `clamp()`, no tamaños por breakpoint: `clamp(2rem, calc(1.5rem + 1.8vw), 3.5rem)` para H1.
- **Ninguna imagen sin `aspect-ratio` explícito** (evita CLS). Hero con `aspect-ratio` + `fetchpriority="high"`, WebP/AVIF.
- Grids con `repeat(auto-fill, minmax(min(100%, 320px), 1fr))` en vez de columnas fijas — reflowea sin media queries.
- CTAs de **mínimo 48px de alto**, 8px de separación, en la zona cómoda del pulgar (inferior/central), no en la esquina superior.
- `:hover` encapsulado en `@media not all and (hover: none)` para no interferir con táctil.
- Objetivos de Core Web Vitals: **LCP < 2,5s · INP < 200ms · CLS < 0,1**.
- `<figcaption>` visible con material + ubicación (*"Cocina integral en Cedritos, melamina RH 18mm"*).
- `robots.txt` permitiendo `ChatGPT-User`, `GPTBot`, `PerplexityBot`, `ClaudeBot`; `llms.txt` en la raíz **generado después** de finalizar el contenido, no antes.

### 12.5 ★ La home especificada — y hoy en `dev` es un placeholder

Estructura completa con copy aprobado:

1. **Hero** — *"Carpintería arquitectónica de alta precisión."* / *"Diseñamos, fabricamos e instalamos espacios integrales pensados para tu bienestar. Tecnología 3D, materiales premium y calidad de fábrica, sin intermediarios."* + **Respuesta Atómica de 46 palabras visible bajo el H1**, redactada y lista.
2. **Validación Técnica** — grid de 3, con copy real: *"Disminuye la incertidumbre"* (visualizar antes de cortar la primera pieza) · *"Punto de Fábrica Directo"* · *"Asesoría con diseñadores"* — **este tercero está literalmente vacío (`" "`) en el original**, y el plan instruye rellenarlo con el copy ya aprobado de `Tono de voz de marca.md`, no inventar.
3. **Portafolio Aspiracional** — 16:9, hover `scale-103` en 0.8s.
4. **Testimonios reales** — solo si existen.
5. **CTA final.**

**Nota de posicionamiento:** la Respuesta Atómica define el negocio como **"estudio de carpintería arquitectónica"** — que es, de hecho, una síntesis de la disputa "¿fábrica o autor?" (§5.5): ni taller informal ni estudio esnob.

### 12.6 ★ Resuelve la confusión de identidad legal (y aparece el NIT)

`diseno_detalle_modulo_home.md` §5 trae la fórmula aprobada para el pie de página, que responde al defecto #6 de la auditoría web (tres nombres mezclados):

> *"Veta Dorada es una marca comercial registrada. Todos los procesos de facturación, contratos legales, recaudos y garantías son operados y representados legalmente por la sociedad HERMANOS GARCIA GONZALEZ SAS, con NIT 901421357-9."*

**Marca comercial arriba, sociedad legal abajo, sin mezclarlas.** Directamente usable en el sitio nuevo. *(Discrepancia menor: el eslogan acá es "Habita en el bienestar"; en `Tono de voz de marca.md` es "Diseña tu espacio. Habita el bienestar". Confirmar cuál rige.)*

### 12.7 ★ Código portable

- **`useGclidCapture`** — hook completo, plain React, portable sin cambios: lee `gclid` y `utm_*` de la query y los persiste en **`sessionStorage`, no `localStorage`**, con razón declarada (*"el GCLID pierde validez entre sesiones y no debe sobrevivir indefinidamente"*). Regla dura: **nunca mostrar el GCLID en la UI**.
- **Arquitectura del modal** — extraer el formulario a un componente compartido que se abra como `Dialog` desde cualquier CTA, manteniendo `/agendar` como ruta que renderiza el mismo componente en línea (no romper el enlace directo ni el SEO de esa URL). Patrón portable y correcto.

### 12.8 Lo que sí es obsoleto

`01_AUDITORIA_SCHEMAS.md`, `02_AUDITORIA_ZAPS.md` y `03_CONTRATO_SCHEMAS_ZAPS.md` operan sobre el motor Agnostic (comandos `agno`, zaps `capturar_lead_embudo` / `actualizar_score_lead`, `npm run agnostic:compile`). **El mecanismo no se migra.** Lo que sí se rescata ya está capturado arriba y en I-012: los campos que debían existir (`gclid`, `estado_proyecto`, `score_conversion`, `utm_*` en `leads`; tabla `testimonios`; NAP en `configuracion_comercial`) son **exactamente H1, H2, H3, H6 y H7**.

> **Conclusión del pase 5, y de la destilación entera:** el plan de julio especifica, con calidad de ingeniería, **las mismas correcciones que este diagnóstico encontró desde cero dos meses después**. No es que falte análisis: **falta ejecución**. La convergencia entre un plan escrito sin conocer este arnés y un diagnóstico hecho sin conocer ese plan es la mejor validación disponible de que ambos apuntan al problema real.

---

## 12-bis. Pase 6 — `Segundo input` (reapertura)

> **Nota de método.** El §13 declaró la destilación cerrada tras 5 pases, y estaba bien: **la carpeta `Segundo input` no existía cuando corrió el inventario del pase 0.** El Supervisor la agregó después, deliberadamente, junto con la tabla de Notion — de ahí el nombre.
>
> Lo que sí ajusta el protocolo: **el corpus es aditivo, así que "cierre" significa cerrado *para la versión del corpus que se inventarió*, no cerrado para siempre.** Cada input nuevo abre un pase nuevo con su propio inventario; no invalida los anteriores.

**Contenido:** `Fase paralela de mercados 1.txt` (955 líneas), `Marca y discurso.txt` (89), la tabla de Notion `Flujo de contenido marketing` (16 piezas) y 18 subpáginas de contenido.

### 12-bis.1 🚨 Contradicción dura: ¿6 años o desde 1995?

| Fuente | Antigüedad |
|---|---|
| `Marca y discurso.txt` | *"Somos una empresa **joven con 6 años de experiencia**"* |
| `Tono de voz de marca.md` | *"**Más de dos décadas** de trayectoria en el mercado de Bogotá (**desde 1995**)"* |

**Las dos se usan como señal de confianza y son incompatibles.** Reconciliación plausible —no confirmada—: la *tradición familiar de carpintería* puede venir de 1995 y la *sociedad actual* tener 6 años. Si es así, la formulación honesta es *"tradición familiar desde 1995, empresa constituida en 20XX"*, no "desde 1995" a secas.

> **⚠️ Retiro una recomendación que ya di.** En la revisión del Perfil de Empresa recomendé llenar `Fecha de apertura` con **1995**. **No lo hagas hasta resolver esto.** Publicar "desde 1995" siendo una empresa de 6 años es una afirmación falsa en una superficie que Google usa para evaluar la entidad, y es justo el tipo de dato que un competidor puede reportar.

### 12-bis.2 Otras contradicciones que este pase abre

| Tema | Versiones en conflicto |
|---|---|
| **Capacidad comercial** | `Marca y discurso`: *"atendiendo **2.3 proyectos al mes**"* · `logica_de_negocio.md`: **1.25 proyectos/mes**. **El ratio 4:1 y toda la tesis de "la demanda es el cuello de botella" descansan en el 1.25.** Con 2.3 el ratio es ~2:1 — sigue limitado por demanda, pero menos dramáticamente. **Hay que resolver cuál rige.** |
| **Precio del diseño 3D** | Dos piezas de contenido dicen **$100,000** (*"¿Qué incluye exactamente mi asesoría de $100,000?"*, *"Pagó $100,000 y esto fue lo que recibió"*). Tercer dato distinto tras $100k/2 espacios y $130k+DIAN. |
| **Cobertura geográfica** | Una pieza es *"**Mónica vive en Cajicá** y transformó su cocina en Bogotá **sin salir de casa**"*. **Cajicá es sabana, fuera de Bogotá** — contradice la decisión ratificada en julio ("solo Bogotá, sin Chía ni municipios de sabana"). Y no es un descuido: está planteada como **capacidad** (servicio remoto), lo que la vuelve una decisión de negocio, no un error de dato. |
| **Eslogan** | Aparece un **tercero**: *"Diseñar con intención. Vivir con diseño."* Ya van tres. |
| **Audiencia** | Tres definiciones incompatibles: estratos premium del norte (research SEO) · *"personas maduras, amas de casa y familias"* (`Marca y discurso`) · *"Arquitectos, Diseñadores, Innovadores (adoptadores tempranos), Contemporáneo"* (tags de Notion). |
| **Nombre** | `Marca y discurso` cierra la Visión diciendo *"nutriendo a **Veta de Oro**"*. La inconsistencia de nombre persiste también acá. |

### 12-bis.3 ★★ `Fase paralela de mercados` es una **cuarta línea de planeación**, y es la misma que t-034

El documento tiene su propio mapa de **11 fases (0 → 10)** y declara la posición actual: **`FASE 0 ✅` (inteligencia competitiva) → `FASE 0.5 ⏳` (Mapa Maestro SEO)**.

**Cruzándolo con mis 6 ramas, es la misma línea de trabajo descrita dos veces, con vocabulario y numeración distintos:**

| Mi marco (t-034) | Fase paralela |
|---|---|
| R1 Captación | Fase 0 (inteligencia) + Fase 6 (SEO local) |
| R2 Sitio y contenido | Fases 1, 2, 3 (arquitectura, SEO técnico, páginas comerciales) |
| R3 Lead y cualificación | Fase 8 (conversión y CRO) |
| R5 Marca y tono | `Marca y discurso.txt` |
| R6 Ad manager agentivo | Fase 9 (IA + multicanal) |
| **— (no lo tenía)** | **Fase 4 — Sistema de Proyectos** |
| **— (no lo tenía)** | **Fase 5 — Máquina de contenidos** |

**Y al revés, lo que la Fase paralela no tiene:** los 8 defectos de código verificados (H1-H8), el diagnóstico de la cuenta de Ads con números, y la tensión geográfica con datos de búsqueda.

> **Esto es lo que impide cerrar el diamante: hay dos planeaciones de la misma línea que nunca se fusionaron.** No es un problema de calidad — las dos son buenas — es un problema de que no existe una sola fuente de verdad para la línea de demanda.

### 12-bis.4 ★★ Convergencias independientes (validación fuerte)

**`PRIORIDAD 0 = Medición`.** El documento dice, antes que nada: *"Search Console, GA4, Google Business Profile, tracking de WhatsApp, tracking de formularios, conversiones, Google Ads conectado. Tenemos que saber: ¿qué está funcionando?"*

**Eso es exactamente I-005 + I-006 + I-011.** Dos análisis independientes, sin conocerse, ponen lo mismo como prioridad cero. Y refuerza: *"✅ **Medir leads y ventas, no solamente tráfico**"* = H2 (conversiones offline).

**El "Sistema de Proyectos" resuelve dos cosas a la vez:**

```
1 PROYECTO REAL → 1 página SEO → 10 fotos optimizadas → 1 caso de estudio
              → 1 video → 1 reel → 1 Pinterest → 1 post de Google Business → 1 contenido informativo
```

- **Es el redireccionamiento de contenido que recomendé el turno pasado** (llenar ficha, landings y portafolio antes que Instagram), y **ya estaba escrito en el material del Supervisor**. Otra vez: no falta análisis.
- **Y resuelve la tensión geográfica con elegancia** (§5 del documento): *"NO crear páginas locales artificiales solo para meter keywords… **después, cuando tengamos proyectos reales**: Cocinas en Chicó, Cocina en Ciudad Salitre, Closet en Usaquén — pero como **casos de estudio reales**, no páginas SEO inventadas."*
  → **Se gana Chicó habiendo hecho una cocina en Chicó, no escribiendo una página sobre Chicó.** Es la mejor respuesta que ha aparecido a "¿proximidad o aspiración?": ninguna de las dos como decisión a priori — **la geografía la decide el portafolio real**, y mientras tanto la pauta cubre lo que el portafolio todavía no.

**Disciplina anti-invención, otra vez en su propio corpus:** *"❌ Crear contenido con IA sin experiencia real"*, *"❌ Crear 100 páginas de ciudades artificiales"*, *"❌ Comprar backlinks baratos"*.

### 12-bis.5 La tabla de Notion — buen trabajo, y su propio hueco

16 piezas mapeadas a un embudo real (**Descubrimiento → Interés → Decisión → Acción**), con acción esperada, formato narrativo y tags de audiencia. No es una lista suelta.

**Tres observaciones:**
1. **Las 16 están en estado `Idea`.** Cero producidas. Mismo patrón que todo lo demás.
2. **La columna `Lección / Resultado` está vacía en las 16** — no hay bucle de medición diseñado. Es el mismo hueco que I-006, ahora en el plan de contenido.
3. **Canal único: `Reel`.** Nada de YouTube, Pinterest ni blog, que es justo lo que el Sistema de Proyectos multiplicaría desde el mismo activo.

**Y hay material real que no sabíamos que existía:** un cliente con nombre, **Jose Talero**, con dos piezas (*Testimonio* y *Proceso de diseño resumido*). Es prueba social concreta para I-008 y para el protocolo de reseñas curadas.

### 12-bis.6 Material nuevo de `Marca y discurso.txt`

- **Liderazgo:** Airhon Javier García Rozo (diseño comercial) y Víctor García González (producción). Insumo directo del modelo rol-vs-persona del diamante 2.
- **Usan literalmente el término "capacidades dinámicas"** — el marco que propuse en §6 no era teoría importada, es su propio vocabulario.
- **La capa ecológica tiene nombre y horizonte propios**: *"taller de bioinspiración para desarrollar biomateriales sostenibles, contribuyendo a la **transición solar punk**"* a 5 años. La rama que el Supervisor pidió tomar "con pinzas" ya está en su documento de marca con fecha.
- **La lista de problemas que resuelven** (falta de claridad en el proceso, incertidumbre con materiales, fabricantes poco profesionales, poca funcionalidad, experiencias negativas previas) **es material JTBD desde la mirada del operador** — o sea, **parte del "informe de sector" que pedí en §5 del marco ya existe**, escrito antes de que lo pidiera.

---

## 13. Balance de la destilación (6 pases)

**Los 5 pases están completos.** 36 archivos procesados, ~2.700 líneas, sin nada pendiente de leer.

| Pase | Contenido | Resultado |
|---|---|---|
| 0 | Inventario y deduplicación | 2 pares de duplicados exactos, 2 `.md` que eran CSV renombrados, 1 archivo sin formato, 1 carpeta con presunción de obsolescencia |
| 1 | Datos duros de Google Ads | La cuenta está hambrienta, no mal optimizada. Reencuadra la restricción #2 del negocio |
| 2 | Auditorías previas | Encontró el bloqueador de corte (WhatsApp) y 3 contradicciones resueltas con datos |
| 3 | Marca, tono y tokens | El sistema de marca estaba hecho y sin implementar |
| 4 | Estrategia e investigación SEO | NAP completo, un JSON-LD envenenado interceptado, la tensión geográfica |
| 5 | Sesión 2026-07-02 | Un plan de ingeniería completo que nunca se ejecutó |

**24 insights destilados al log de Fase 2** (I-005 a I-023, I-029 a I-033, I-036 a I-042).

**Tres cosas que la destilación produjo y que no estaban en ninguno de los dos lados:**

1. **La convergencia como validación.** El plan de julio y este diagnóstico, escritos sin conocerse, señalan las mismas ocho correcciones. Eso no es coincidencia: es evidencia de que el problema está bien identificado.
2. **Dos piezas de material envenenado interceptadas** — el JSON-LD con dirección de competidor y calificación fabricada (§10.2), y la afirmación de "la web pierde el 99% de las visitas" refutada por los propios datos de la carpeta (§5.4). Ambas habrían llegado a producción si el material se hubiera adoptado sin filtro.
3. **Dos correcciones al propio asesor**, registradas: la recomendación de `GeoCircle` contra una decisión ya ratificada (§12.2), y el encuadre de "dos migraciones = más riesgo" que invertía la conclusión correcta (§9).

**La lectura de fondo no cambió en los cinco pases, y se reforzó en cada uno:** no falta estrategia ni análisis. **Falta ejecución**, y el material para ejecutar ya existe casi entero.

---

## 14. Preguntas abiertas para el Supervisor

Quedan sin resolver, y ninguna bloquea la ejecución si se toma una decisión explícita:

1. **¿La restricción "solo Bogotá, sin Chía ni sabana"** (ratificada en julio, §12.2) **sigue vigente?** Determina `areaServed` en el JSON-LD y las áreas de servicio del Perfil de Empresa.
2. **¿Proximidad o aspiración?** (§11.2) La decisión de posicionamiento geográfico: occidente/noroccidente donde el negocio está y el paquete local lo favorece, o norte premium vía pauta y contenido. Las dos vías están costeadas; falta elegir.
3. **¿Fábrica o autor?** (§5.5) La Respuesta Atómica del plan de julio propone una síntesis — *"estudio de carpintería arquitectónica"* — que puede cerrar la disputa.
4. **¿Qué precio rige para el diseño 3D**, y por cuántos espacios? (§6.3 y §10.4: $100k/2 espacios vs $130k, contra un mercado que cobra sesión + adicional por mueble.)
5. **¿Qué eslogan rige?** *"Habita en el bienestar"* o *"Diseña tu espacio. Habita el bienestar"*.
6. **¿Las imágenes de las landings se pueden recuperar del sitio actual?** (§11.3 e I-016.)
7. **Exportes nuevos de Google Ads** — con ~2 años de histórico disponible, para responder si el CPA se mantuvo al duplicar el presupuesto (§8.1).

---

*Nada de este documento reemplaza al `marco_estrategia_mercado.md`: acá se destila, allá se decide.*
