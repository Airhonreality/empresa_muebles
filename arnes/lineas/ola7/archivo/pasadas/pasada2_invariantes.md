# Pasada P2 — Invariantes y su enforcement (subagente, loop de 3 pasadas)

**Lente:** la REGLA como unidad. No "¿qué evento falta?" sino "¿qué regla debe cumplirse SIEMPRE y quién la hace cumplir?". Para cada invariante del cierre (§2, §6) y del mapa (cronograma inmutable, separación ejecutor-verificador, restricción de dinero, no acumular deuda, el log es la acción): ¿hay un evento en el inventario que la haga cumplir (enforcement)? ¿Quién la vigila? ¿Qué pasa cuando se viola? **Un invariante sin evento de enforcement es DESEO, no diseño.**

Fuentes: `diamante2_discover_eventos.md` (47 eventos), `diamante2_loop_apertura.md` (loop 1, NO repetir), `logica_de_negocio.md` (Parte I/II), `cierre_diamante.md` (tesis + 8 invariantes §2 + §6).

---

## Iteración 1 (bruta)

Barrido completo del inventario con el lente de invariantes, sin filtrar. Todos los hallazgos que el lente detecta, en bruto:

- **F-1.** Invariante "no comprar si no hay plata disponible real" (restricción máxima del negocio). E-20 lo declara como *dato previo* ("dinero disponible"), E-43 lo hace visible como lectura, pero no hay un evento de enforcement que BLOQUEE/registre el pago sin caja. Y la política "no acumular deuda" (materiales → arriendos → nóminas, CONTRATO VIVO) tiene 3 flujos de pago; el inventario solo modela 2 (E-20 proveedor, E-31 compensación). **Falta el flujo "pago de arriendos".**
- **F-2.** Gate E-21 (triple verificación de recepción): el mapa documenta la rama negativa real ("el desarrollador informa a compras si está recibido o si hay reproceso", taxonomía de fallas con "material llegó defectuoso"), pero E-21 solo modela la recepción exitosa. Sin rama negativa, el gate no puede representar "no pasó el gate → reproceso".
- **F-3.** Invariante inmutabilidad del cronograma (mapa:250-251,277; cierre:19,88). E-33 registra el cambio con causa; E-35 aplica la consecuencia (pierde estímulos si interna). Pero el BLOQUEO de una mutación espontánea no tiene evento (¿quién lo rechaza? ¿qué se registra al rechazarlo?), y la clasificación interno/externo —económicamente cargada porque alimenta E-35— no tiene verificador (solo "dato auditable").
- **F-4.** E-14 fija el cronograma, pero las restricciones del propio contexto central (holgura total ≤5 días, rango de instalación de 5 días) aparecen solo como texto en "dato que nace"; no hay validación que impida un cronograma con holgura >5. Igual la capacidad "sábado libre" (mapa:293) y la ventana contractual de garantía 8-12 días (E-36).
- **F-5.** Separación ejecutor-verificador (mapa:279,440). E-24 anota "verificador (≠ quien construyó)" como texto del disparador, pero no hay guard del sistema que impida que el rol verificador sea el mismo rol ejecutor del proyecto. Mismo caso en E-18 (check de schema).
- **F-6.** Invariante 1 + "el sistema debe llevar la cuenta del diseñador" (mapa:219) + "transparencia = moneda de confianza" (mapa:347). E-31 crea los registros, E-32 autogenera el documento, E-35 liquida comisiones; no hay evento de lectura/conciliación de cuenta/saldo por socio (análogo a E-43 para caja).
- **F-7.** Tesis: el schema debe ser "programado, verificable, versionable y auditable" (cierre:11,24). E-10 versiona la cotización, pero el schema de desarrollo (E-17) no tiene evento de versionado que los gates (E-18, E-33) y las integraciones (E-38/E-39) consuman como versión.
- **F-8.** E-34 (novedad crítica): registra hora de entrada y resolución (habilita medir el SLA 5-24h) pero el mapa no define la CONSECUENCIA de incumplir la ventana. Un SLA sin consecuencia es un deseo.
- **F-9.** Garantía (mapa:470): "si la garantía requiere materiales, necesita una orden tan completa como las de taller". E-37 reutiliza `ordenes_trabajo`, pero no hay enlace a que una necesidad de material dispare aprovisionamiento (E-19/E-45). Violación real: instalador vuelve 2-3 veces.
- **F-10.** E-06: el mapa (131) dice que el agendamiento "solo debería poder caer dentro de esas franjas" (libres). No hay guard del sistema sobre E-06 que rechace una cita fuera de franja.
- **F-11.** E-13 firma virtual sin mecanismo → **YA LOOP 1** (V-6).
- **F-12.** E-46 no-show sin regla → **YA LOOP 1** (A-3 + V-1).
- **F-13.** E-47 bienestar sin registro de horas → **YA LOOP 1** (A-5 + V-5).
- **F-14.** Inmutabilidad "no explícita" en E-33 → **YA LOOP 1** (A-7). Se reenfoca (no se repite) como F-3.
- **F-15.** E-44 enganche tienda→producción → **YA LOOP 1** (A-1).
- **F-16.** E-45 reposición de herramientas → **YA LOOP 1** (A-2).
- **F-17.** Vínculo E-08→E-30 → **YA LOOP 1** (D-4).
- **F-18.** E-31 dos parámetros sin número → **YA LOOP 1** (B-4).
- **F-19.** Regla de mensajería "la IA no responde a clientes ya en producción" (mapa:478): consulta a `proyectos.estado`, no un evento que falte. Sin traza de evento a agregar → **se descarta** (es infraestructura).
- **F-20.** Bien forzados (registro positivo, no hallazgos): E-19 solo existe con dato previo E-18 ("la aprobación es la ÚNICA causa válida de compra", mapa:147-148) ✓; E-30 deduce por sistema y no por memoria (C1/C2 eliminados) ✓; gates como propiedades de estado "el sistema no deja avanzar sin el check registrado" (mapa:262,274) ✓; E-33→E-35 cadena causa→incentivo ✓; E-23 push (Comercial no agenda) ✓.

---

## Iteración 2 (autocrítica)

**Qué cae y por qué:**

- **Caen F-11, F-12, F-13, F-15, F-16, F-17, F-18** — duplicados del loop 1 (A-1/A-2/A-3/B-4/D-4/V-1/V-5/V-6). Marcados `YA LOOP 1` y NO se re-reportan.
- **Cae F-14** como hallazgo propio — es exactamente A-7 del loop 1 (hacer explícita la regla de inmutabilidad en E-14/E-33). Pero al re-leer con el lente de enforcement, detecté que A-7 pedía **nombrar** la regla, y esto **no** cubre **ejecutarla** (bloqueo de la mutación + auditoría de la clasificación de causa). Por eso F-14 se transforma en **P2-4**, no se elimina: el ángulo es distinto, no duplica.
- **Cae F-19** — sin trazabilidad de un evento que falte; es una consulta de infraestructura de mensajería, no un invariante sin enforcement.
- **Cae el intento de "no hay versionado en ninguna parte"** — re-lectura: E-10 sí versiona la cotización ("revisión/versión ajustada"). El hueco real es el versionado del **schema de desarrollo** (E-17), no el de cotización. Se estrecha el hallazgo a eso (P2-8).

**Qué se consolidó (pasada 1 tenía fragmentos que son un solo hallazgo):**

- **F-4 + F-21/F-22/F-24** (restricciones de cronograma, rango de instalación, ventana 8-12 días de garantía, sábado libre) → un solo hallazgo **P2-5**: las "ventanas/holguras" del contexto central son invariantes sin validación de enforcement; viven solo como texto en "dato que nace".

**Qué se me escapó en la pasada 1 (re-lectura de las fuentes buscando invariantes no vistos):**

- **P2-12** — Los guards de rol (P2-6, P2-7) y la separación ejecutor-verificador son **inejecutables** si el modelo no distingue rol de persona. El mapa ya lo advierte: `usuarios.rol_empleado` solo tiene `admin|comercial|taller|finanzas` "y ya es visible que eso va a quedarse corto" (mapa:383) + principio roles-no-personas (mapa:424). Es una dependencia de schema, no un evento — por eso **DIFERIDO**, pero el Define no puede converger P2-6 sin decidirlo. Se me escapó en la pasada 1 porque pensé en "evento", no en "precondición del enforcement".

**Verificación anti-duplicación con el loop 1 (cruce explícito):**

- P2-2 (gate de caja en E-20) ≠ loop 1: el loop 1 tocó medición de caja (A-5/E-47 salud de caja), no el gate de pago. ✓
- P2-3 (rama negativa de recepción) ≠ loop 1 (no aparece). ✓
- P2-4 (enforcement de inmutabilidad) ≠ A-7 (A-7 = nombrar la regla; P2-4 = ejecutarla: bloqueo + auditoría de causa). ✓
- P2-5 (holguras/ventanas como validación) ≠ loop 1. ✓
- P2-6 (guard rol verificador) ≠ loop 1. ✓
- P2-7 (cuenta por socio) ≠ B-4 (B-4 = parámetros sin número; P2-7 = falta evento de lectura). ✓
- P2-8 (versionado del schema de desarrollo) ≠ loop 1 (el loop 1 no tocó la tesis). ✓
- P2-9 (consecuencia de SLA) ≠ loop 1. ✓
- P2-10 (garantía→material→compra) ≠ loop 1. ✓
- P2-11 (guard de franjas en E-06) ≠ A-4 (A-4 = tensión híbrido app/humano; P2-11 = enforcement de la franja). ✓

**Sobreviven:** P2-1..P2-12 (12 hallazgos). **Lo que la pasada 1 confirmó que está bien forzado** (para que el Define no toque lo que funciona): la cadena de gates (E-18→E-19 única causa de compra; E-21→E-22; E-23 push; E-24→E-25) y E-30 (deducción por sistema, no memoria) son los 5 invariantes con enforcement real.

---

## Iteración 3 (refinamiento final)

Depuración final — 12 hallazgos, cada uno con tipo, trazabilidad y la implicación para el Define. Agrupados por invariante que protegen:

1. **Dinero (restricción máxima + no acumular deuda):** P2-1 (ADICIÓN arriendos), P2-2 (REFUERZO gate de caja en E-20).
2. **Inmutabilidad del cronograma:** P2-4 (REFUERZO enforcement + auditoría de causa), P2-5 (REFUERZO holguras/ventanas como validación), P2-9 (VACÍO consecuencia SLA).
3. **Separación ejecutor-verificador:** P2-6 (REFUERZO guard de roles en E-24/E-18), P2-12 (DIFERIDO modelo rol-vs-persona).
4. **El log es la acción / schema como definidor:** P2-3 (REFUERZO rama negativa de E-21), P2-8 (REFUERZO versionado del schema de desarrollo).
5. **Socio-por-comisión (compensación = moneda de confianza):** P2-7 (ADICIÓN lectura de cuenta por socio), P2-10 (REFUERZO garantía→aprovisionamiento).
6. **Agenda por rol:** P2-11 (REFUERZO guard de franjas en E-06).

**Patrón transversal detectado:** el inventario modela fuerte los eventos de ESTADO (gates, transiciones, lecturas) y débil los eventos de NEGACIÓN/ENFORCEMENT (bloqueos, rechazos, consecuencias de violación). Cinco de los doce hallazgos son exactamente eso: una regla documentada en el mapa/cierre que se cumple solo si alguien la cumple, sin guard del sistema.

---

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Evento(s) afectado(s) | Fuente (archivo:línea) |
|---|---|---|---|---|
| P2-1 | ADICIÓN | Pago de arriendos: la política "no acumular deuda" define 3 flujos de pago (materiales → arriendos → nóminas, CONTRATO VIVO); el inventario modela E-20 (proveedor/materiales) y E-31 (compensación) pero ningún evento de pago de arriendos. Sin él, la regla de prioridad solo es ejecutable a medias. | E-20, E-31 | `logica_de_negocio.md:343-345,270`; `cierre_diamante.md:22` |
| P2-2 | REFUERZO | Restricción de dinero como gate: E-20 lista "dinero disponible" como dato previo y E-43 lo hace visible, pero no hay evento que bloquee/registre un pago sin caja ni consecuencia definida (hoy el retraso de compras es implícito, mapa:149). El enforcement de "no comprar sin plata real" no existe como evento. | E-20, E-43 | `logica_de_negocio.md:149,345`; `cierre_diamante.md:75` (§5.1) |
| P2-3 | REFUERZO | Rama negativa de recepción: E-21 modela solo la triple verificación exitosa; el mapa documenta la rama real "informa a compras si está recibido o si hay reproceso" y la taxonomía de fallas. Sin el branch de reproceso, el gate (b) no puede representar "no pasó". (La taxonomía de fallas en sí queda VACÍO/DIFERIDO, el mapa la difiere explícitamente.) | E-21 | `logica_de_negocio.md:337,428,432-438`; `cierre_diamante.md:55` |
| P2-4 | REFUERZO | Enforcement de la inmutabilidad: E-33 registra el cambio con causa y E-35 aplica la consecuencia, pero (a) no hay evento que BLOQUEE una mutación espontánea (el mapa:277 solo lo declara para los gates, no para el cronograma) y (b) la clasificación interno/externo, económica porque alimenta E-35, es solo "dato auditable" sin verificador. Complementa A-7 (nombrar la regla) con el enforcement (ejecutarla). | E-33, E-35 | `logica_de_negocio.md:250-251,277`; `cierre_diamante.md:19,88-89` |
| P2-5 | REFUERZO | Holguras/ventanas sin validación: holgura total ≤5 días, rango de instalación de 5 días (E-14), ventana de garantía 8-12 días hábiles (E-36) y "sábado libre" (capacidad) aparecen solo como texto; ningún evento impide un cronograma con holgura >5 o una cita de garantía fuera de ventana. | E-14, E-33, E-36 | `logica_de_negocio.md:248-250,293`; `cierre_diamante.md:87` |
| P2-6 | REFUERZO | Guard rol verificador ≠ rol ejecutor: E-24 anota "(≠ quien construyó)" y E-18 "(puede ser la misma persona en rol distinto)" como texto; no hay constraint del sistema que impida que el rol verificador del proyecto sea el rol ejecutor (el mapa:279 lo exige como "acto del rol verificador"). | E-24, E-18 | `logica_de_negocio.md:279,440`; `cierre_diamante.md:21,55` |
| P2-7 | ADICIÓN | Lectura de cuenta/saldo por socio: "el sistema debe llevar la cuenta del diseñador" (hoy no lleva cuenta consigo mismo) + transparencia como contrato de confianza entre socios. E-31/E-32/E-35 crean/liquidan; falta el evento de lectura de saldo por socio (análogo a E-43 para caja). | E-31, E-32, E-35 | `logica_de_negocio.md:219,347`; `cierre_diamante.md:32,58` |
| P2-8 | REFUERZO | Versionado del schema de desarrollo: la tesis exige schema "programado, verificable, versionable y auditable"; E-10 versiona la cotización pero E-17 (desarrollo técnico) no tiene evento de versión que E-18, E-33 y E-38/E-39 consuman. Sin versión, "auditable" no tiene referente. | E-17, E-18, E-38 | `cierre_diamante.md:11,24`; `logica_de_negocio.md:355` |
| P2-9 | VACÍO | Consecuencia de incumplir el SLA de novedad crítica (ventana 5-24h): E-34 registra hora de entrada y resolución (habilita medir), pero el mapa no define qué pasa si se incumple. Un SLA sin consecuencia es un deseo. | E-34 | `logica_de_negocio.md:252`; `cierre_diamante.md:88` |
| P2-10 | REFUERZO | Garantía que requiere material → debe disparar aprovisionamiento: el mapa exige que la orden de garantía sea "tan completa como las de taller" (si no, el instalador vuelve 2-3 veces); E-37 reutiliza `ordenes_trabajo` pero no enlaza necesidad de material → E-19/E-45. | E-37, E-19, E-45 | `logica_de_negocio.md:470` |
| P2-11 | REFUERZO | Guard de franjas libres en agendamiento: "el agendamiento solo debería poder caer dentro de esas franjas" (mapa:131); E-06 no tiene guard que rechace una cita fuera de franja. Distinto de A-4 (tensión híbrido app/humano), que sí cubrió el loop 1. | E-06 | `logica_de_negocio.md:131` |
| P2-12 | DIFERIDO | Modelo rol-vs-persona como precondición del enforcement: los guards de P2-6 y la compensación por rol (P2-7) solo son implementables si el modelo distingue rol de persona; el mapa ya advierte que `usuarios.rol_empleado` (admin|comercial|taller|finanzas) se queda corto. Se registra, no se modela; el Define no puede cerrar P2-6 sin decidirlo. | E-18, E-24, E-31 | `logica_de_negocio.md:383,424`; `cierre_diamante.md:17` |

**Totales:** 12 hallazgos — **ADICIÓN 2** (P2-1, P2-7) · **REFUERZO 8** (P2-2, P2-3, P2-4, P2-5, P2-6, P2-8, P2-10, P2-11) · **VACÍO 1** (P2-9) · **DIFERIDO 1** (P2-12).

---

## Notas para el Define

- **El inventario está fuerte en eventos de estado, débil en eventos de negación/enforcement.** Cinco de doce hallazgos (P2-2, P2-4, P2-6, P2-9, P2-11) son reglas documentadas sin guard del sistema. El Define debe decidir, por contexto, dónde viven esos guards: como invariantes de la máquina de estados (sin evento, el estado simplemente no transiciona — el patrón que ya usa para los gates) o como eventos de rechazo explícitos (bloqueo registrado). No decidir esto es dejar los invariantes en nivel deseo.
- **El invariante de dinero tiene cadena parcial pero un hueco claro.** La cadena dinero→cronograma→incentivos existe (E-33 causa externa "dinero" → E-35); lo que falta es el flanco de compra (gate de caja en E-20) y el tercer flujo de la política (arriendos, P2-1). El contexto Finanzas (cierre §4) debe ser dueño de los tres flujos, no solo del pago a proveedores.
- **Precondición transversal: el modelo de roles.** P2-6, P2-7 y P2-12 son una sola decisión vista tres veces: la separación ejecutor-verificador y la compensación por rol solo se pueden forzar si el modelo distingue rol de persona. El mapa ya lo dijo (mapa:383,424). El Define debería resolverlo antes que los guards, no después.
- **Las ventanas/holguras (P2-5, P2-9, P2-11) son candidatas a una capa de reglas de validación** del contexto Control de cronograma + agenda, no a eventos nuevos: holgura ≤5, rango de instalación 5 días, franjas libres, ventana SLA 5-24h, garantía 8-12 días. Agruparlas como invariantes del reloj de eventos (mapa:258) evita dispersarlas en eventos sueltos.
- **Versionabilidad es dependencia de "auditable".** La tesis declara el schema versionable (cierre:11,24); sin el evento de versión en E-17, E-33 ("causa auditable") y E-38 (traducción a 3D) no tienen referente. Es una decisión de estructura que el Define no puede aplazar sin dejar la tesis en deseo.
- **No tocar lo que ya está bien forzado:** la cadena de gates (E-18→E-19 única causa de compra, E-21→E-22, E-23 push, E-24→E-25) y E-30 (deducción por sistema) son los invariantes con enforcement real del inventario. Los refuerzos P2-3/P2-4/P2-6 los completan, no los reemplazan.
