# Pasada P5 — Tiempo y dependencias ocultas (subagente, loop de 3 pasadas)

**Lente:** la SECUENCIA como unidad. Grafo de precedencias entre los 47 eventos + dónde se gasta el tiempo.
**Fuentes:** `diamante2_discover_eventos.md` (47 eventos), `diamante2_loop_apertura.md` (anti-duplicación), `logica_de_negocio.md` (mapa, Parte I + II), `segunda_ronda_preguntas.md` (respuestas de Javier).
**Datos duros de referencia (del mapa):** promesa de entrega ~15-20 días de la venta (`logica:169`); modelo temporal 2 ciclos de 15 días = 30 días ≈ 4 semanas ideal, hoy 6.5 semanas (`logica:256`, `segunda_ronda:109`); rango de instalación 5 días (`logica:248`); holgura total ≤5 días (`logica:249`); garantía 8-12 días hábiles (`logica:418`); holgura contractual de cobro 12 días (`logica:466`); SLA novedad crítica 5-24h (`logica:252`).

---

## Iteración 1 (bruta)

Grafo de precedencias (resumen): E-01→E-02→E-03→{E-04 | E-05→E-06→{E-07|E-46}→E-08→E-09→E-10→E-11}→E-12→E-13→E-14; rama desarrollo E-15→{E-16 en paralelo | E-17→E-18→E-19→E-20→E-21}→E-22→E-23→E-24→E-25→E-26; ramas laterales E-27/E-28/E-29/E-30 (finanzas), E-33/E-34/E-35 (cronograma), E-36→E-37 (garantía), E-38/E-39 (integraciones, derivan de E-17), E-41 (docs por etapa), E-44 (tienda→mismo pipeline), E-45 (operativa, sin proyecto). La cadena crítica de punta a punta (E-11→E-26) pasa por: firma→retoma→desarrollo→check→compras→recepción→armado→calidad→instalación→acta.

1. **Tramo silencioso E-15→E-26 (retoma → entrega):** entre el momento en que el cliente ve su proyecto por última vez (E-09/E-11) y la instalación/acta (E-25/E-26), no hay ningún evento frontstage. El Service Blueprint lista los contactos directos: primer contacto, recibe presupuesto/diseño, firma, retoma, entrega, garantía (`logica:538-546`). Eso deja un hueco de ~4 semanas (ciclo 2 completo + desarrollo/compras) sin que el cliente reciba nada. E-41 (foto/documento por etapa) existe pero es documentación backstage (`diamante2 E-41`; `logica:362-363`), no comunicación al cliente.
2. **Espera silenciosa por deslizamiento de cronograma (E-33):** el cliente recibe un rango de instalación de 5 días en el contrato (E-14/E-25). Cuando E-33 mueve el cronograma (causa externa/interna), el inventario solo registra el desfase con causa — no hay evento que avise al cliente que su rango prometido cambió. La promesa puede romperse en silencio.
3. **E-16 (ajuste de contrato en paralelo) → E-33/E-18: dependencia no declarada.** E-16 dice "corre EN PARALELO, no bloquea" pero no engancha al cronograma: un cambio por causa externa (cliente/scope) debería recalcular fechas (E-33) y re-medir comisiones contra nuevos plazos (`logica:251`). Además cambia el baseline contra el cual E-18 (check de schema) valida el desarrollo.
4. **La cadena crítica pasa por el dinero, y el inventario no la declara:** E-20 (pago a proveedor) depende de dinero disponible (E-43/E-28). El mapa lo marca como RED3 ("retraso en ventas retrasa TODO el proyecto", `logica:57,149,345`) pero el inventario modela E-19→E-20→E-21→E-22 sin declarar que el timing de compras está gobernado por caja.
5. **Compras multi-proveedor modeladas como una sola secuencia:** el mapa documenta ≥3 mecánicas con proveedores distintos en paralelo (melamina/corte, prefabricados, ferretería; `logica:334-339`), cada una con lead propio. El inventario tiene una sola línea E-19→E-20→E-21. Y el gate E-21 (triple verificación) es todo-o-nada para el proyecto (`logica:275`): si falta un material, el armado entero espera — se serializa al proveedor más lento.
6. **Espera del gate E-18 por cadencia semanal:** la aprobación pre-compras hoy es reunión, "mínimo 1 reunión semanal de aprobación" (`segunda_ronda:40`). Un proyecto que termina desarrollo puede esperar hasta ~7 días por la siguiente reunión.
7. **La promesa de 15-20 días no reconcilia con el modelo interno:** KPI "entrega en ~15-20 días de la venta" (`logica:169`) vs. modelo "2 ciclos de 15 días = 30 días ≈ 4 semanas ideal" (`logica:256`) vs. real "hoy 6.5 semanas" (`segunda_ronda:109`). ~2x de diferencia entre promesa y modelo, sin definición de qué cuenta como "venta" (¿E-11 cotización o E-13 firma?).
8. **Desarrollo técnico (E-17), la etapa más bloqueante, sin duración documentada:** el mapa dice "si desarrollo no está completo, no se clava un tornillo" (`logica:148`) pero no da número; los 15 días del ciclo 1 (desarrollo+compras) no tienen desglose trabajo vs. espera.
9. **Inconsistencia de orden entre fuentes del cronograma:** E-18 es "check de schema **pre-compras**" (`diamante2 E-18`) pero la lista de etapas del cronograma dice "compras → aprobación → ensamblaje → instalación" (`logica:247`). Dos fuentes documentadas con orden opuesto.
10. **Garantía: ventana de 8-12 días hábiles sin evento intermedio hacia el cliente** (`diamante2 E-36`; `logica:418`). Es un momento de verdad de confianza (`logica:545`) y el cliente queda sin novedades durante toda la espera.
11. **Compensación del diseñador disparada en E-08, no en E-31:** E-31 dispara con "proyecto con fases terminadas" (`diamante2 E-31`), pero el diseñador cobra en E-08, pre-contrato, "puede pagarlo sin nunca comprar el proyecto" (`logica:446`), y el $130k va directo al diseñador (`logica:137`). Regla temporal distinta no declarada.
12. **Proyección de cronograma pre-contrato no modelada:** el mapa documenta "estimar antes de contratar… proyectar el cronograma antes del contrato" (`logica:254`); el inventario fija E-14 solo post-firma (E-13). El armado de fechas podría correr en paralelo con la fase comercial.
13. **E-38/E-39 (traducción a 3D y CVC→corte) sin dependencia declarada con E-18:** ambos derivan de E-17, y el check (E-18) valida contra el mismo schema (`logica:355`). Si el corte (E-39) se genera antes de que E-18 pase, hay material ya cortado contra un schema no aprobado → reproceso.
14. **E-08→E-30 (pago diseño → deducción del anticipo):** el vínculo y la ventana temporal entre el pago pre-contrato y la deducción en el anticipo final. → **YA LOOP 1** (loop 1 D-4, `diamante2_loop_apertura.md:116-118`).
15. **No-show de visita (E-46) como pérdida de tiempo de embudo:** qué pasa con el lead y el calendario. → **YA LOOP 1** (loop 1 A-3 / V-1).
16. **Firma virtual (E-13) como cuello previo a toda la cadena:** sin mecanismo, el cronograma no arranca. → **YA LOOP 1** (loop 1 V-6).

---

## Iteración 2 (autocrítica)

**Descartados (YA LOOP 1):** ítems 14 (D-4), 15 (A-3/V-1), 16 (V-6) del pase bruto — ya reportados por el loop 1, no se repiten en la tabla final.

**Descartados sin valor nuevo:** E-45 (reposición operativa) ya es paralelo por naturaleza, no es un hallazgo de secuencia. E-43/E-27 por sí solos ya existen; solo sobreviven como parte del hallazgo 4 (cadena de dinero). El matiz de que la instalación la hace la misma persona que ensambla (`logica:460`) es de carga por rol, no de secuencia — no es mío.

**Revisados y afinados:**
- Hallazgo 13: antes de descartarlo, verifiqué que la precedencia E-18↔E-39 no está declarada en ningún lado del inventario — sobrevive como dependencia oculta, aunque con impacto acotado (solo si el corte corre antes del check). Se queda como ADICIÓN menor.
- Hallazgo 12: el mapa lo dice con las palabras "estimar antes de contratar" — es paralelización disponible, no forzada. Se queda como REFUERZO (no inventa regla, solo pide exponer la opción).
- Hallazgo 5: la parte "todo-o-nada del gate E-21" es lo más especulativo. El mapa dice que el proyecto pasa a control total cuando el material está "en el taller, verificado" (`logica:275`) pero NO dice si la recepción es por pedido o por proyecto completo. Lo marco con su componente VACÍO explícito, no invento la regla.

**Qué se me escapó en la pasada 1:**
- La tienda (E-44) hereda el mismo tramo silencioso y la misma cadena de 4 semanas del proyecto: el pedido de tienda entra al MISMO pipeline (`logica:157`) y no tiene promesa de entrega propia ni evento de avance. Se pliega a los hallazgos 1 y 7 (no abre un hallazgo aparte).
- El rango de instalación de 5 días (E-14/E-25) es la ÚNICA fecha visible al cliente en todo el backstage — refuerza la severidad del hallazgo 2 (si se mueve, es lo único que el cliente tenía).
- La holgura total de 5 días (`logica:249`) es un slack documentado: las fases pueden correrse "un par de días" pero la suma no pasa de 5 — es espera presupuestada, pero no hay evento que la comunique cuando se consume. Se pliega al hallazgo 2.

---

## Iteración 3 (refinamiento final)

Los 13 hallazgos del pase bruto sobreviven en versión depurada (16 → 13 tras descartar los 3 YA LOOP 1). Distribución: 8 ADICIÓN, 4 VACÍO, 1 REFUERZO, 0 DIFERIDO.

**Resumen de dónde están los días (evidencia para el Define):** de la promesa de 15-20 días vs. el modelo de 30 días ideal vs. 45.5 días reales (6.5 semanas), lo único desglosado como trabajo son ~1 semana de ensamblaje + ~1 semana de instalación (`logica:247`) y el rango de 5 días de instalación. El resto del ciclo (desarrollo —la etapa más bloqueante— y compras con su espera de caja) no tiene duración ni desglose trabajo/espera documentado. El 6.5 vs. 4 semanas de diferencia ≈ 1.5 semanas de espera/slack no contabilizada. Las esperas documentadas son: gate semanal de aprobación (hasta ~7 días), flujo de caja (sin número), holgura total 5 días, garantía 8-12 días hábiles, holgura de cobro 12 días, SLA 5-24h.

---

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Evento(s) afectado(s) | Fuente (archivo:línea) |
|---|---|---|---|---|
| P5-01 | `ADICIÓN` | Tramo silencioso E-15→E-26: ~4 semanas sin evento frontstage hacia el cliente (retoma → entrega); E-41 es documentación backstage, no comunicación. Opción disponible (no forzada): exponer la foto por etapa en el portal de cliente (alineado con H4 "instrumentar lo que ya pasa"). La tienda (E-44) hereda el mismo hueco | E-15, E-17, E-25, E-26, E-41, E-44 | `diamante2_discover_eventos.md:57,73,122`; `logica_de_negocio.md:536,538-546,362-363` |
| P5-02 | `ADICIÓN` | Deslizamiento de cronograma (E-33) sin comunicación al cliente: el rango de instalación de 5 días (única fecha visible al cliente en todo el backstage) puede moverse sin que exista evento que lo avise | E-14, E-25, E-33 | `diamante2_discover_eventos.md:99`; `logica_de_negocio.md:248,249,250` |
| P5-03 | `ADICIÓN` | E-16 (ajuste de contrato en paralelo) no engancha al cronograma: un cambio por causa externa debe recalcular fechas (E-33) y re-medir comisiones contra nuevos plazos; además cambia el baseline que E-18 valida | E-16, E-18, E-33, E-35 | `diamante2_discover_eventos.md:56,58`; `logica_de_negocio.md:251,530` |
| P5-04 | `ADICIÓN` | Cadena crítica pasa por el dinero: E-20 (pago proveedor) gobernado por caja (E-43/E-28); RED3 está en el mapa pero no como dependencia declarada del inventario | E-20, E-28, E-33, E-43 | `diamante2_discover_eventos.md:65,124`; `logica_de_negocio.md:57,149,345` |
| P5-05 | `ADICIÓN` + `VACÍO` | Compras multi-proveedor (≥3 mecánicas paralelas, lead propio) modeladas como una sola secuencia E-19→E-20→E-21; el gate E-21 todo-o-nada puede serializar el armado tras el proveedor más lento. Regla de recepción parcial por pedido/módulo: no existe dato | E-19, E-20, E-21, E-22 | `diamante2_discover_eventos.md:64-66,73`; `logica_de_negocio.md:334-339,275` |
| P5-06 | `VACÍO` | Espera del gate E-18 por cadencia semanal de reunión de aprobación (hasta ~7 días); el check de schema lo resuelve a futuro pero hoy es tiempo documentado sin número | E-18 | `segunda_ronda_preguntas.md:40,22`; `logica_de_negocio.md:454` |
| P5-07 | `VACÍO` | Promesa de 15-20 días no reconcilia con el modelo de 30 días ideal ni con 6.5 semanas reales; "venta" sin definir (¿E-11 o E-13?) | E-11, E-13, E-14, E-47 | `logica_de_negocio.md:169,256`; `segunda_ronda_preguntas.md:109` |
| P5-08 | `VACÍO` | Desarrollo técnico (E-17), la etapa más bloqueante, sin duración documentada; los 15 días del ciclo 1 no se desglosan en trabajo vs. espera | E-17 | `logica_de_negocio.md:148,256`; `diamante2_discover_eventos.md:57` |
| P5-09 | `VACÍO` | Inconsistencia de orden entre fuentes: E-18 es "check pre-compras" pero la lista de etapas del cronograma dice "compras → aprobación". Orden conflictivo a resolver | E-14, E-18 | `diamante2_discover_eventos.md:58`; `logica_de_negocio.md:247` |
| P5-10 | `ADICIÓN` | Garantía (E-36): ventana de 8-12 días hábiles sin evento intermedio hacia el cliente en un momento de verdad de confianza | E-36, E-37 | `diamante2_discover_eventos.md:107`; `logica_de_negocio.md:418,545` |
| P5-11 | `ADICIÓN` | Compensación del diseñador disparada en E-08 (pre-contrato, aun sin cierre de proyecto), no en E-31 ("proyecto con fases terminadas"); regla temporal distinta no declarada | E-08, E-31, E-32 | `diamante2_discover_eventos.md:92,38`; `logica_de_negocio.md:137,446` |
| P5-12 | `REFUERZO` | Proyección de cronograma pre-contrato (función de estimación ≈ f(valor, ítems)) disponible para paralelizar el armado de fechas con la fase comercial; E-14 hoy solo post-firma | E-12, E-13, E-14 | `logica_de_negocio.md:254`; `diamante2_discover_eventos.md:49` |
| P5-13 | `ADICIÓN` | E-38/E-39 (traducción a 3D y CVC→corte) sin precedencia declarada frente a E-18: el corte puede generarse contra un schema aún no aprobado (reproceso) | E-18, E-38, E-39 | `diamante2_discover_eventos.md:58,114-115`; `logica_de_negocio.md:355` |

**Total:** 13 hallazgos (8 ADICIÓN, 4 VACÍO, 1 REFUERZO, 0 DIFERIDO).

---

## Notas para el Define

- **No hay adición que cambie bounded contexts ni gates**: ninguna obliga a reabrir el diamante 1. Todas son eventos de comunicación/notificación, dependencias a declarar, o huecos de dato.
- P5-01, P5-02 y P5-10 son la misma familia: **el cliente no tiene canal de novedades en los tramos largos**. El portal de cliente ya existe como módulo (`logica:526`) y E-41 ya captura las fotos por etapa — el Define podría resolver los tres con un solo mecanismo frontstage (progreso visible del proyecto) en vez de tres eventos sueltos.
- P5-07 y P5-08 son los dos vacíos que más le importan al negocio (la promesa comercial y la etapa más bloqueante): si el Define los deja abiertos, el KPI de 15-20 días queda sin ancla numérica. Requieren dato de Javier o de campo, no decisión de arquitectura.
- P5-03, P5-04 y P5-13 son dependencias que el inventario debe declarar como precedencias explícitas, no como reglas nuevas: E-16→E-33, dinero→E-20, E-18→E-38/E-39.
- P5-09 debe cerrarse en el Define antes de fijar el cronograma (E-14): si "aprobación" en la lista de etapas es el check pre-compras, la lista está mal escrita; si es otra cosa, hay que nombrarla.
- P5-12 es la única paralelización de fondo disponible hoy (cronograma pre-contrato); el resto de la cadena dura diseño+contrato→desarrollo→compras→armado es una secuencia declarada como innegociable por Javier (`logica:143-149`) y no se toca.

---

## Registro

- Fecha: 2026-08-03
- Estado: pasada P5 completada (lente tiempo y dependencias ocultas), loop interno de 3 pasadas aplicado.
- Resultado: 13 hallazgos finales (8 ADICIÓN, 4 VACÍO, 1 REFUERZO, 0 DIFERIDO). 3 ítems del pase bruto descartados por `YA LOOP 1` (D-4, A-3/V-1, V-6).
- Trazabilidad: cada hallazgo cita `archivo:línea`; no se inventaron tiempos ni reglas no documentados.
