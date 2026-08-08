# Pasada C5 — Contrato vivo (subagente, loop de 3 pasadas)

**Lente:** CONTRATO VIVO. Unidad de análisis: la consistencia del Define (`diamante2_define_eventos.md`) contra el cierre del diamante 1 (`cierre_diamante.md`), el mapa maestro (`logica_de_negocio.md`) y las decisiones del Supervisor I-024..I-043 (`log_insights_fase2.md`). Pregunta rectora: ¿la convergencia contradice el contrato vivo, y las contradicciones que hay están todas declaradas?

**Fuentes leídas:** `diamante2_define_eventos.md` (LA UNIDAD A AUDITAR), `cierre_diamante.md` (referencia diamante 1), `logica_de_negocio.md` (mapa), `loop2_y_retroalimentacion.md` (A1-A12), `log_insights_fase2.md` (I-024..I-043), `pasadas/diamante2_panorama_consolidado.md` (P2-P8). Anti-duplicación cruzada contra las pasadas C4 (`define_c4_ejecutabilidad.md`) y C6 (`define_c6_restriccion.md`) ya escritas.

---

## Iteración 1 (bruta)

Hallazgos crudos, sin filtrar:

- **B1.** Invariante 4 del cierre (§2.4, "Calendario por rol, no público") no aparece en NINGÚN lugar del Define: ni §3 (roles), ni §5 (interfaces), ni §8 (capa 1). P6-01 (panorama:163) la llama "dimensión transversal sin evento propio"; el inventario la arrastra como ⚠ en E-14/E-33 (discover:57,113), pero la convergencia no la materializa ni la declara.
- **B2.** I-027 (flow organizado de cambios) tiene **doble destino** que el Define no tipa en §5: (a) el **adicional entra como módulo con su especificación** (I-027, mapa:257) → mutación del schema de proyecto → contexto **Desarrollo** (re-pasa E-17/E-18); (b) **reprocesos con costo al cliente** → input de **Finanzas**. El Define solo declara `E-16 → E-33` (§4.3) y §5 no tiene filas `Contratos → Desarrollo` ni `Contratos → Finanzas` para el costo.
- **B3.** El cierre §4 lista "recepción de material" bajo **Calidad/Verificación** (cierre:55); el Define coloca E-21 (recepción triple) bajo **Compras** (define:40). El mapa hallazgo B (mapa:510) dejó el dueño de la recepción **abierto** ("hay que decidir de quién es el evento"); el Define decidió Compras pero no lo declara en el registro como resolución de esa duplicación del cierre.
- **B4.** El cuestionario de viajes (E-53) tiene consumidor declarado solo como **riesgo** en §1 ("campo muerto si no se consume", define:18); §5 no tipa qué evento del motor de cronograma lo consume (el mapa I-024 dice "se anticipan cambios del flow incluso por parte del cliente", mapa:249 → consumidor = clasificador E-33 / fijación E-14).
- **B5.** La capa 1 del Define (§8) incluye **10 contextos** (Comercial embudo, Contratos, Finanzas de 12 eventos, Documentación, Garantía "orden simple", Integraciones) frente al "alcance mínimo del MVP" de A10 (4 rutinas + 4 gates, loop2:67-85) y a los "candidatos" del cierre §10 (Control, Desarrollo, Calidad, Finanzas — cierre:130). Expansión no declarada como decisión de alcance.
- **B6.** Cierre §6 (cierre:85) mantiene la lista de etapas "compras → aprobación → ensamblaje → instalación" que el propio Define corrige en §4.2 (P5-09) solo contra el mapa (define:80). El cierre queda con el defecto sin declarar.
- **B7.** El KPI "15-20 días" (mapa:169, discover:119) vs. promesa 7 semanas: el mapa dice "reconciliado en el Define" y el Define §1 dice "no '15-20 días'" (define:17). ¿Declarado o silencioso?
- **B8.** Tesis "versionable" (cierre:11): P2-8/P6-07 piden versionado del schema (E-17); el Define no menciona versioning en ningún contexto de Desarrollo.
- **B9.** P5-09: única contradicción DECLARADA (define:78-80). Verificar que el resto no tenga contradicciones silenciosas equivalentes.

---

## Iteración 2 (autocrítica)

**Lo que cae (anti-duplicación y filtro):**

- **B6 cae — YA SEÑALADO por C4-10:** "cabo (b) fuentes desactualizadas (mapa:253, cierre:85, discover:57) hasta el loop focalizado ya planificado". El defecto del cierre §6 ya está en el registro de la pasada C4; re-reportarlo sería duplicar.
- **B8 cae (rebajado a nota):** el versionado es propiedad de schema del loop 2 (E-17 ya está en capa 1, define:39). C4-07 ya lo operacionalizó como "pin de versión" del guard de E-18. Mi ángulo (tesis "versionable" sin declaración explícita) es redundante: no es una contradicción, es detalle de schema que el Define legítimamente no repite.
- **B7 cae — YA RESUELTO:** la reconciliación está declarada en las dos puntas (mapa:169 "reconciliado en el Define"; define:17 "calcula hacia 7 semanas, no '15-20 días'"; discover:119 arrastra la cuenta 15+15=30 → 7 semanas). No es silenciosa.
- **B9 (P5-09):** verificada. Declarada y consistente (C4-10 confirma que no introduce contradicción).
- **Candidatos descartados por cobertura de C4/C6:** E-23 destinatario del push (C4-06), E-52 interfaz pre-contrato (C6-02), E-59 "fila del taller" (C6-01), E-33 camino positivo (C4-01), E-54 back-edges (C4-02), rol-vs-persona en §8 (C6-05), identidad del verificador único (C6-03).
- **Preguntas rectoras con respuesta AFIRMATIVA (no hallazgo):**
  - **Los 15 contextos vs. los 12 del cierre:** los 3 nuevos (Marketing/Demanda, Tienda web, Gobierno/Medición) son **adiciones limpias** — resuelven P6-03 (5 huérfanos), el mapa ya los anticipaba en el Discover ancho (mapa:321-322), los 12 del cierre quedan intactos (definidos 61/61, define:49), y el contexto central **Control de cronograma** se mantiene coherente (E-14/E-33/E-34/E-52/E-59/E-60 materializan el cierre §4 y las reglas del mapa:247-264). La tabla del cierre §4 se actualiza solo por mutación del arnés (ya listado como pendiente en define:169).
  - **Invariante 7 (aprobación = check de schema):** respetada — E-18 con guard del verificador único (define:73), consistente con mapa:462 y I-035.
  - **Invariante 5 (dos capas):** respetada en esqueleto (Taller/Marketing/Tienda/Gobierno fuera de capa 1, define:148-150).
  - **Las 4 rutinas clave (A10):** TODAS en capa 1 — retoma (E-15, Desarrollo), check de schema (E-18, Desarrollo), comprar (E-19/E-20, Compras), recibir material (E-21, Compras). **Respuesta afirmativa.**
  - **Rol del diseñador:** resuelto — E-48 (diseño 3D) vive en Comercial/Cotizador (define:33) y §3 declara el solapamiento comercial=diseñador (P4-F1). No contradice el cierre §3 (compensación $130k + comisión: E-08/E-31/E-32/E-58).

**Lo que sobrevive y por qué:** B1 (invariante 4, única invariante del cierre sin materialización), B2 (fronteras de I-027 no tipadas en §5), B3 (E-21 reasignado sin declarar), B4 (E-53 consumidor sin frontera tipada), B5 (expansión de capa 1 sin criterio declarado). Ninguno es C4/C6 ni P2-P8 resuelto.

**Qué se me escapó en la pasada 1:** que el E-60 ("único mecanismo frontstage", define:38) es la materialización de P5-01/P5-02/P5-10 **y** del invariante del cierre sobre momentos de verdad (cierre §7) — coherente, no es contradicción, lo registro como respaldo. Y que la única respuesta a "¿hay contradicciones silenciosas?" honesta es: **no hay contradicciones SILENCIOSAS de contenido; hay tres omisiones de declaración** (fronteras y decisiones tomadas sin registro) — eso es lo que distingue mi pasada.

---

## Iteración 3 (refinamiento final)

Hallazgos depurados (5, de 9 brutos):

1. **C5-01 — OK_CON_DOC:** invariante 4 (calendario por rol, no público) sin respaldo en la convergencia. Única invariante del cierre §2 sin materialización ni declaración en el Define.
2. **C5-02 — REFORZAR_FRONTERA:** I-027 (flow organizado de cambios) tiene doble destino (schema/Desarrollo + costo/Finanzas) que §5 no tipa; solo se declara `E-16 → E-33`.
3. **C5-03 — OK_CON_DOC:** E-21 (recepción triple) reasignado a Compras sin declarar la resolución de la duplicación del cierre §4 ("recepción de material" en Calidad; mapa hallazgo B).
4. **C5-04 — OK_CON_DOC:** E-53 (cuestionario de viajes) con consumidor declarado solo como riesgo en §1; falta la frontera `Contratos → Control de cronograma` que lo consuma (I-024, mapa:249).
5. **C5-05 — OK_CON_DOC (afirmativo con nota):** las 4 rutinas SÍ están en capa 1 (respuesta rectora afirmativa); pero la capa 1 del Define (10 contextos) excede el "alcance mínimo del MVP" de A10 y los "candidatos" del cierre §10 sin declarar el criterio de expansión.

---

## Tabla de consistencia (invariante/decisión → ¿respetado? → evidencia)

| Elemento del contrato vivo | ¿El Define lo respeta? | Cita de evidencia |
|---|---|---|
| Tesis: schema + control simbióticos (cierre:11) | SÍ | define:67-87 (máquina de estados con guard + precedencias E-18→E-38/E-39, E-08→E-30); define:38 (Control central) |
| Invariante 1: roles-no-personas, todos-socios (cierre:17) | SÍ | define:53-59 (§3 roles tipados + personas + asignación explícita) |
| Invariante 2: el log es la acción (cierre:18) | SÍ (implícito) | define:67-69 ("máquina de estados con guard... no hay 'instrucción que se respeta si se quiere'"; E-54 rechazo explícito) |
| Invariante 3: cronograma inmutable → DOBLE (I-034) (cierre:19; mapa:250-256) | SÍ, resuelto vía I-034 | define:20 ("E-14/E-33 modelan dos líneas; E-60 solo ve la contractual + adelantos"); define:76 (guard E-33) |
| **Invariante 4: calendario por rol, no público (cierre:20)** | **NO — sin respaldo** | cierre:20; P6-01 (panorama:163); el Define no la menciona en §3/§5/§8 → **C5-01** |
| Invariante 5: dos capas (cierre:21) | SÍ (esqueleto) | define:143-152 (§8); nota de expansión → **C5-05** |
| Invariante 6: no acumular deuda (cierre:22) | SÍ | define:40 (E-43/E-20/E-57); define:84 (dinero disponible → E-20, RED3) |
| Invariante 7: aprobación = check de schema (cierre:23) | SÍ | define:73 (E-18 guard, verificador único I-035); mapa:462 |
| Invariante 8: schema+control simbióticos (cierre:24) | SÍ | define:67-76 (cada gate es un guard sobre schema); define:85 (E-18→E-38/E-39) |
| Modelo socios-por-comisión §3 (cierre:28-41) | SÍ | define:44 (Finanzas: E-31/E-32/E-35/E-56/E-58); define:57 (verificador por despacho) |
| 12 bounded contexts §4 (cierre:47-61) | SÍ (12 + 3 nuevos) | define:27-49; 61/61 verificado (define:49); adiciones limpias resuelven P6-03 |
| Modelo temporal §6 (cierre:85-91) | SÍ, con corrección declarada P5-09 | define:78-80 (etapas "aprobación → compras → ensamblaje → instalación"); resto: E-14/E-33/E-52/E-59 |
| Momentos de verdad §7 (cierre:95-101) | SÍ | E-15/E-25/E-36 + E-60 (define:38) |
| Decisiones §8 (cierre:105-111) | SÍ | E-08/E-18/E-33/E-57/E-59 |
| I-024: promesa 7 semanas (log:39) | SÍ | define:17; mapa:249 |
| I-024: cuestionario de viajes (log:39) | SÍ (con riesgo declarado) | define:18 (E-53); consumidor sin frontera tipada → **C5-04** |
| I-025: check de 15 días (log:40) | SÍ | define:19 (E-59); mapa:251 |
| I-027: flow organizado de cambios (log:42) | SÍ parcial (fronteras incompletas) | define:23 (E-16 tercer origen); define:86 (E-16→E-33); doble destino schema/Finanzas sin tipar → **C5-02** |
| I-034: cronograma doble (log:48) | SÍ | define:20; mapa:250-251 |
| I-035: verificador único (log:49) | SÍ | define:21, 57, 73, 75 |
| I-043: sin conflicto de interés (log:50) | SÍ | define:22; mapa:259/287 |
| KPI "15-20 días" vs. 7 semanas (mapa:169; discover:119) | SÍ, DECLARADO (no silencioso) | mapa:169 ("reconciliado en el Define"); define:17 ("no '15-20 días'") |
| P5-09: orden de etapas (panorama:85) | SÍ, DECLARADO (única contradicción declarada) | define:78-80; vía loop focalizado con checkpoint (define:80, 159, 169) |

---

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Elemento del contrato vivo afectado | Fuente (archivo:línea) |
|---|---|---|---|---|
| C5-01 | OK_CON_DOC | La invariante 4 (calendario por rol, no público) es la única invariante del cierre §2 sin materialización ni declaración en la convergencia. Es transversal (P6-01), no un evento: no es contradicción, pero quedó sin contexto que la materialice. El inventario la arrastra como ⚠ en E-14/E-33; el Define no la menciona. | Invariante 4 del cierre | cierre:20; panorama:163; discover:57,113; define:53-59 (ausencia) |
| C5-02 | REFORZAR_FRONTERA | I-027 (flow organizado) tiene doble destino sin fronteras tipadas en §5: (a) el adicional entra como módulo con especificación → mutación del schema → contexto Desarrollo (E-17/E-18); (b) reprocesos con costo al cliente → input de Finanzas. El Define solo declara `E-16 → E-33` (§4.3). El mapa declara ambos efectos (mapa:257, 538); el Define no. | I-027 (log:42); Mapa §Control de cronograma y §Retoma | log:42; mapa:257,538; define:23,86,95-105 (ausencia) |
| C5-03 | OK_CON_DOC | E-21 (recepción triple) vive en Compras (define:40) pero el cierre §4 lista "recepción de material" bajo Calidad/Verificación (cierre:55) y el mapa hallazgo B dejó el dueño de la recepción abierto (mapa:510). El Define decidió Compras sin declararlo en el registro como resolución de la duplicación del cierre. | Cierre §4 (Calidad/Compras); Mapa hallazgo B | cierre:55; mapa:510,531; define:40,74; define:168-169 (registro sin la resolución) |
| C5-04 | OK_CON_DOC | E-53 (cuestionario de viajes) tiene consumidor declarado solo como riesgo en §1 ("campo muerto si no se consume"); §5 no tipa la frontera `Contratos → Control de cronograma` que lo consume (el mapa I-024: "se anticipan cambios del flow incluso por parte del cliente" → consumidor = E-14/E-33). | I-024 (log:39); Mapa §Control de cronograma | log:39; mapa:249; define:18,95-105 (ausencia de fila) |
| C5-05 | OK_CON_DOC (afirmativo) | Las 4 rutinas clave (A10) SÍ están en capa 1 (retoma E-15, check de schema E-18, comprar E-19/E-20, recibir material E-21). Nota: la capa 1 del Define (10 contextos, incl. Documentación y Garantía "orden simple") excede el "alcance mínimo del MVP" de A10 y los "candidatos" del cierre §10 sin declarar el criterio de expansión. No contradice la invariante 5 (Taller sigue fuera); es una decisión de alcance no declarada. | Invariante 5; A10; Cierre §10 | loop2:67-76,83-85; cierre:21,130; define:143-152 |

---

## Notas para el Orquestador / Define

- **Veredicto de la lente contrato vivo: no hay contradicciones SILENCIOSAS de contenido.** La convergencia respeta el mapa, el cierre y las decisiones I-024..I-043 en todos los puntos duros (invariantes 1,2,3,5,6,7,8; tesis; 12 contextos; modelo temporal; momentos de verdad). La única contradicción declarada (P5-09) está bien declarada y su corrección ya va a checkpoint del Supervisor al converger (define:169). No se dispara checkpoint nuevo por esta pasada.
- **C5-01 (invariante 4):** es la respuesta a "¿alguna invariante quedó sin respaldo?" — sí, una. No requiere mover fronteras: al converger (loop 2), declarar el calendario por rol como propiedad transversal de vista (P6-01) en el diseño de la UI/agenda, junto con C6-04 (desarrollador-proxy) y C6-02 (E-52). Añadir una línea en el Define §3 o §5 ("dimensión transversal: calendario por rol, ver P6-01") basta para cerrar el respaldo.
- **C5-02 (I-027):** el Define declara el tercer origen en E-33 y el recalculo, pero no el **doble destino del cambio de contrato**. Al converger, agregar en §5: `Contratos → Desarrollo · E-16 adicional = módulo nuevo en schema (re-pasa E-17/E-18)` y `Contratos/Control → Finanzas · costo de reprocesos al cliente (I-027 #3)`. Sin esto, el flow organizado queda a medias (se recalcula el cronograma pero nadie declara dónde muta el schema ni dónde nace el cobro del costo).
- **C5-03 (E-21):** no es error de contenido — es una decisión correcta y consistente con el mapa (recepción en Compras, mapa:531) — pero quedó **sin declarar**. Al converger, registrar en el Define que E-21 resuelve el hallazgo B del mapa (dueño de la recepción = Compras→Taller) y que la fila "recepción de material" del cierre §4 (Calidad) se reconcilia con esa decisión en la actualización de la tabla (ya listada como mutación del arnés, define:169).
- **C5-04 (E-53):** el propio Define ya honesta el riesgo ("campo muerto si no se consume"); el cierre del circuito es tipar el consumidor. El mapa dice que el dato "anticipa cambios del flow incluso por parte del cliente" → el consumidor natural es el clasificador de causa de E-33 (pre-clasificar causa externa) o la fijación E-14. Tiparlo en §5 evita que la decisión I-024 (cuestionario) quede como promesa no operada.
- **C5-05 (capa 1):** respuesta afirmativa a la pregunta rectora (las 4 rutinas están en capa 1). La expansión no contradice la invariante 5 (Taller sigue en capa 2), pero conviene que el Define declare el criterio de capa 1 (gates + eventos de frontera indispensables del flujo + inclusión deliberada de Documentación/Garantía-simple) para que A10 ("todo lo demás es capa 2") y el cierre §10 (4 candidatos) no se lean como contradichos.
- **Lo que ya cubren C4 y C6 (no re-reportar en el checkpoint del Define):** C4-01 (E-33 camino positivo), C4-02 (E-54 back-edges), C4-03 (E-21 estado discreto), C4-06 (E-23 destinatario), C4-07 (pin de versión E-18), C4-10 (P5-09 + fuentes cierre §6/discover), C6-01 (fila del taller → E-59), C6-02 (E-52 pre-contrato), C6-03 (identidad verificador único), C6-05 (§8 rol-vs-persona). C5 se suma con 5 hallazgos de declaración, ninguno estructural.

---

## Registro

- Fecha: 2026-08-03
- Pasada: C5 — lente CONTRATO VIVO, loop interno de 3 pasadas.
- Resultado: 5 hallazgos depurados (de 9 brutos): 4 OK_CON_DOC + 1 REFORZAR_FRONTERA. Cero contradicciones silenciosas de contenido; 3 omisiones de declaración (C5-02, C5-03, C5-04) + 1 invariante sin respaldo (C5-01) + 1 nota de alcance (C5-05).
- Trazabilidad: 100% con archivo:línea. Anti-duplicación cruzada contra C4, C6 y P2-P8 declarada y verificada.
