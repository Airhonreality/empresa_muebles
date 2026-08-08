# Diagnóstico de proceso — patrones y antipatrones de trabajo

**Pedido explícito del Supervisor (2026-08-03):** *"Haz un diagnóstico de mi proceso, identifica flags y antipatrones que debería evitar en el futuro; síntoma de todos los proyectos en estado idea, trabajo repetitivo aislado no convergido. ¿Flag de proceso o de razonamiento?"*

**Respuesta corta: es un flag de proceso con una causa de razonamiento identificable, y ya tenés la cura construida — solo que aplicada a una sola mitad del proyecto.**

---

## 1. El experimento natural que responde la pregunta

Mismo Supervisor, mismo periodo, mismas herramientas de IA, dos líneas de trabajo:

| | Línea técnica (ERP/repo) | Línea comercial (marca/mercado/contenido) |
|---|---|---|
| **¿Tiene arnés?** | Sí — `AGENTS.md`, ledger, roles, checkpoints, `estado.md` | No |
| **Entregado** | **33 tareas cerradas**, 53 páginas, auth, cotizador, contratos, finanzas, checkout verificado contra base real | **0** |
| **Planeado** | Igual de mucho | ~3.700 líneas de planeación de alta calidad |

**No es un problema de capacidad, de criterio ni de disciplina personal.** La calidad de pensamiento en los documentos comerciales es alta —en varios puntos superior a la de los agentes que los revisaron después—. La diferencia entre 33 y 0 es **el arnés**.

Eso convierte la pregunta "¿proceso o razonamiento?" en algo casi experimental: **el mismo cerebro, con arnés, ejecuta; sin arnés, planea.**

---

## 2. El antipatrón central: la planeación se comporta como el entregable

En cada ciclo se produce un documento que **especifica** el trabajo. El documento se termina. La ejecución queda para "la siguiente fase", que nunca tiene su propio ritual de cierre.

**La evidencia más contundente de esto es literal:** `SESION_2026-07-02_HOME_SEO_EMBUDO/07_PROGRESO_Y_CIERRE.md` existe, está bien diseñado, tiene 8 pasos de verificación… y **está vacío**.

> **Se planificó el cierre. Lo único que nunca se hizo fue cerrar.**

Inventario del patrón, con estado real:

| Artefacto | Estado declarado | Estado real |
|---|---|---|
| `SESION_2026-07-02` (7 docs, plan de ingeniería completo) | "ejecutar en orden" | Nunca ejecutado |
| Tabla de contenido en Notion (16 piezas) | Columna `Estado` | **16/16 en `Idea`** |
| `MANUAL_MARCA_TOKENS.md` | `plan_borrador`, "solo arranca si se aprueba con `APROBAR TOKENS`" | Nunca aprobado |
| `Estrategia de mercado.md` | Roadmap 24 meses, 20 acciones priorizadas | Ficha de Google todavía incompleta |
| `Fase paralela de mercados` | Mapa de 11 fases | `FASE 0.5 ⏳` |
| `score_conversion` (campo en el schema) | Existe desde el legacy | **Siempre en 0, cero lecturas y escrituras** |
| `gclid`, embudo híbrido, score 1-10 | Diseñados en detalle | Perdidos en la migración |
| Tema "Luz & Biofilia" | Aprobado, "no reabrir" | No implementado |
| Perfil de Empresa en Google | Activo | Incompleto, 8 reseñas, WhatsApp sin conectar, áreas de servicio vacías |
| Cuenta de Google Ads | Corriendo desde **2024** | Sin conversiones offline, sin tag de analítica |

**Doce artefactos, un solo patrón.** No es azar ni falta de ganas: es un sistema que premia terminar documentos.

---

## 3. Antipatrón #2: re-diagnóstico en vez de reanudación

Cada sesión nueva **vuelve a diagnosticar** en lugar de leer el último plan y continuarlo.

| Evidencia | Qué muestra |
|---|---|
| `Estrategia de mercado.md` programa *"Campañas de Adwords Geo-local"* para **Q4 2027** | Se escribió sin mirar que la cuenta corre desde **2024** |
| `INVS_SEO_empresas mobiliario.md` recomienda `FAQPage` | `06_PLAN_SEO_TECNICO.md` **ya lo había rechazado** por deprecación |
| `Fase paralela de mercados` dice *"el otro agente puso como prioridad #1…"* | Un tercer agente re-prioriza el trabajo de un segundo |
| **Este mismo diagnóstico** encontró H1-H8 desde cero | El plan de julio **ya los especificaba** |

**El costo no es el tiempo perdido** —cada reinicio con IA es barato— **es que el corpus acumula verdades paralelas en vez de converger.** Por eso hoy conviven:

- **3 eslóganes** · **4 nombres de marca** · **3 definiciones de audiencia** · **3 precios del diseño 3D** · **2 cifras de capacidad** (1.25 vs 2.3 proyectos/mes) · **2 antigüedades** (6 años vs desde 1995)

Ninguna de esas contradicciones nació de un error. **Nacieron de que nada obliga a un documento nuevo a declarar qué reemplaza.**

---

## 4. Antipatrón #3: nada supera a nada

Los documentos se **acumulan**, no se **suceden**. No hay regla que obligue a marcar algo obsoleto, fusionarlo o borrarlo.

Consecuencia mecánica: **las contradicciones no se resuelven, se almacenan.** Y como todo sigue vivo, el siguiente lector no sabe cuál es la fuente de verdad — así que escribe una nueva. El bucle se realimenta.

> Nota: **el arnés ya tiene la regla correcta** — la regla de oro del `INDEX.md` dice *"borrar lo obsoleto, no acumularlo. Cuando algo deja de ser cierto, se borra"*. Está escrita, funciona, y **nunca se aplicó al dominio comercial**.

---

## 5. La causa de razonamiento (por qué pasa, y por qué ahora más)

La planeación **produce un artefacto legible y completo**. La ejecución produce **estados parciales y desprolijos**: una tabla a medio migrar, una ficha con 3 de 9 campos, un tag instalado sin eventos configurados.

Un documento terminado **se siente** como progreso. Un `score_conversion` poblado no se siente como nada.

**Y acá está el agravante moderno, que es la parte importante:**

> **La IA hizo que divergir sea casi gratis, y convergir sigue costando exactamente lo mismo que siempre.**

Antes, escribir un plan de 900 líneas costaba una semana — ese costo era, sin querer, un límite natural. Hoy cuesta veinte minutos. **La razón entre divergencia y convergencia se distorsionó**, y el resultado es previsible: se producen planes más rápido de lo que se pueden ejecutar, y cada uno parece justificar el siguiente.

**Esto no es un defecto tuyo. Es el modo de falla característico de trabajar estrategia con IA**, y le pasa a todo el mundo que no ponga una fuerza en contra. Vos ya construiste esa fuerza —el arnés— y por eso la línea técnica lleva 33 tareas cerradas.

**Y me incluyo:** en esta misma sesión produje un marco de 6 ramas y una destilación de 700 líneas. Fuiste vos quien tuvo que decir *"ejecutar"*. El arnés no me obligó a converger porque la línea de demanda todavía no tiene uno.

---

## 6. Contramedidas concretas

Ninguna es filosófica; las cinco son mecánicas.

**C1 — Límite de trabajo en curso (WIP).**
Un tope duro de planes abiertos por línea. **No se abre nada nuevo hasta que algo se cierre.** Es el mecanismo central de Kanban y es exactamente lo que falta. Con 12 artefactos abiertos, cualquier tope razonable (2 o 3) fuerza el cierre.

**C2 — Definición de "hecho" que no sea un documento.**
El criterio de cierre de cada plan debe ser **un cambio de estado en el mundo real**, no "documento aprobado":
- ❌ "Manual de tokens aprobado" → ✅ *"la home renderiza con los tokens nuevos"*
- ❌ "Plan de embudo listo" → ✅ *"un lead entró con `gclid` guardado"*
- ❌ "Plan de contenido definido" → ✅ *"3 piezas publicadas con su resultado registrado"*

**C3 — Regla de sucesión.**
Todo documento nuevo declara en su encabezado **qué reemplaza, qué refuta o qué extiende**. Si no reemplaza nada, tiene que justificar por qué hace falta. Es la regla de oro del `INDEX.md` extendida al dominio comercial. **Mata la acumulación de verdades paralelas de raíz.**

**C4 — Ritual de reingreso.**
Antes de diagnosticar cualquier cosa: **leer el último plan de ese dominio y declarar por escrito qué cambió desde entonces.** Es literalmente lo que hacen `estado.md` + `INDEX.md` en la línea técnica, y es la razón de la asimetría 33 vs 0.

**C5 — Vencimiento del estado `Idea`.**
Nada permanece en `Idea` indefinidamente. Pasado un plazo, **se promueve o se mata** — decisión forzada, no acumulación silenciosa. La tabla de Notion ya tiene la columna; le falta la regla.

---

## 7. Lo que sí funciona y no hay que tocar

Un diagnóstico que solo enumera defectos es incompleto y falso.

- **La calidad del pensamiento es alta.** El plan de julio tenía disciplina anti-invención (*"nunca inventar rating"*, *"mejor omitir `geo` que publicarlo sin verificar"*) **superior a la del research que vino después**. La decisión de *"no crear páginas locales artificiales, sino casos de estudio reales"* es mejor criterio que el de cualquier consultor SEO estándar.
- **La autocorrección es rápida y certera.** En esta sesión el Supervisor corrigió al asesor **cuatro veces** —recorte de alcance, sobrecorrección a métricas, el dominio, el apellido— y **las cuatro veces tenía razón**.
- **La pregunta correcta ya se hace sola.** *"¿Son pertinentes en este momento?"* sobre el plan de videos es exactamente la pregunta que evita el antipatrón. El instinto está; falta el mecanismo que lo haga obligatorio.
- **El arnés existe y funciona.** No hay que inventar la solución: hay que **extenderla al otro dominio**.

---

## 8. Conclusión

> **Flag de proceso, causa de razonamiento, cura ya construida.**
>
> El síntoma —todo en estado `Idea`, trabajo repetido y aislado sin converger— **no viene de falta de criterio ni de constancia. Viene de que la única línea con arnés es la que ejecuta.**
>
> La IA volvió la divergencia casi gratuita y no tocó el costo de la convergencia. Sin una fuerza mecánica en contra, cualquiera deriva hacia planear. **Esa fuerza ya existe en este proyecto y tiene 33 tareas cerradas como prueba. Solo falta ponérsela a la línea comercial.**

**La segunda convergencia que sigue no es un documento más: es la primera aplicación de C1, C2 y C3 al dominio comercial.** Si termina siendo otro plan abierto, este diagnóstico se habrá confirmado a sí mismo.

---

*Estado: diagnóstico entregado. Las contramedidas C1-C5 requieren decisión del Supervisor para incorporarse al arnés (mutación de `AGENTS.md` → checkpoint).*
