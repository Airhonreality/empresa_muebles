# Diamante 2 · Discover — inventario de eventos del sistema

**Qué es esto:** la apertura del segundo diamante (Fase 2). Destila el mapa sistémico (`logica_de_negocio.md`, Parte I) en el **inventario de eventos** que el software debe modelar. Es el peldaño intermedio de la cadena *modelo de negocio → mapa sistémico → **eventos** → interfaces*: los eventos salen del mapa, las interfaces emergen de los eventos, y el schema/UI se concreta en un segundo ciclo abrir/cerrar (loop 2 de diseño).

**Estado: DIVERGE (abierto). No convergido.** Nada de esto es schema ni UI todavía. Es el inventario completo, sin filtrar por prioridad ni por "se construye ahora" — el filtrado es trabajo del Define.

> **Loop de apertura aplicado (2026-08-03):** tras la segunda pasada de auditoría (`diamante2_loop_apertura.md`) el inventario pasó de 43 a **47 eventos**. Se agregaron E-44 (enganche tienda→producción), E-45 (reposición de herramientas), E-46 (no-show de visita), E-47 (KPIs operativos). Los refuerzos están marcados en sus filas. El estado sigue en diverge.

> **Ciclo de pasadas sistémicas aplicado (2026-08-03):** tras el panorama consolidado (P2-P8, `pasadas/diamante2_panorama_consolidado.md` — 61 hallazgos P2-P7 + 12 de P8) y las decisiones del Supervisor (I-024..I-043), el inventario pasó de 47 a **61 eventos**. Se agregaron E-48..E-61. Los refuerzos están marcados en sus filas con el hallazgo que los originó. Las correcciones a contrato vivo (I-025 check de 15 días, I-027 flow de cambios, I-034 cronograma doble, I-035/I-043 verificador único y sin conflicto de comisiones) se integraron al mapa vía loop focalizado y se reflejan acá. El estado sigue en diverge.

**Método:** `ARNES_AGENTICO.md` §2.C (Event Storming): línea de tiempo de eventos en lenguaje de negocio puro, cronológica, cero vocabulario técnico. Por cada evento: qué dato debe existir para que pase, quién lo dispara, qué cambia de estado, qué dato nace ahí.

**Fuentes:** `logica_de_negocio.md` Parte I (diagrama, línea de tiempo, narrativas, Control de cronograma, Capa 1), `cierre_diamante.md`, `loop2_y_retroalimentacion.md` (A1-A12), `log_insights_fase2.md` (I-001..I-043), `marco_estrategia_mercado.md` (H1-H8), panorama consolidado P2-P8.

---

## Convenciones de la tabla

- **ID** — código del evento (E-01, E-02...) para trazabilidad en el Define.
- **Dato previo** — qué debe existir para que el evento pueda pasar.
- **Dispara** — quién/quiénes lo hacen ocurrir (rol, no persona).
- **Cambio de estado** — qué transición produce en el proyecto/lead/entidad.
- **Dato que nace** — qué registro nuevo se crea.
- **Fuente** — dónde lo documenta el mapa (traza verificable) + hallazgo del panorama (Px-x/F-x) cuando aplica.

---

## A. Embudo de demanda (Comercial / Marketing) — llega, se atiende, se califica

| ID | Evento | Dato previo | Dispara | Cambio de estado | Dato que nace | Fuente |
|---|---|---|---|---|---|---|
| E-01 | **Lead entra al sistema** | contacto/canal (web, IG, TikTok, WhatsApp) | formulario web o conversación entrante | lead: ninguno (recién nace) | registro de lead con canal y datos de contacto | mapa: canal de leads; `leads` |
| E-02 | **Lead se atiende por WhatsApp/IG** | lead existente (E-01) | comercial vía Chatwoot/WhatsApp Business | lead: `nuevo → en_contacto` | conversación + hora de primera respuesta | mapa: decisión técnica canal de leads. ⚠ **SLA de primera respuesta sin ventana ni escalación** → P8 F-7 (nuevo E-50); ⚠ **P4-F5: el comercial es el rol más cargado (13 eventos) y el cuello de demanda (ratio 4:1)** |
| E-50 | **SLA de primera respuesta al lead** | lead en contacto (E-02) | sistema (temporizador sobre hora de primera respuesta) | lead: se marca cumplimiento/incumplimiento de ventana SLA; si se excede → escalación | ventana SLA + hora real de primera respuesta + a quién se escala | P8 F-7; logica_de_negocio.md:508 (leads perdidos por demora). ⚠ **VACÍO: ventana (¿minutos/horas?) y escalación por definir** en el Define. Fallo si no ocurre: el lead se enfría y se pierde en silencio |
| E-03 | **Lead se califica** | criterio de cualificación (comunicación, geografía, tipo de proyecto) | comercial | lead: `en_contacto → calificado | descartado | redirigido` | puntaje/resultado de cualificación | mapa punto 1; H1 (`score_conversion` existe y está muerto) |
| E-04 | **Lead se descarta o se redirige** (marmolero, geografía, refacción puntual) | lead no calificado (E-03) | comercial | lead: `→ descartado` o `→ redirigido` | registro del motivo + destino | mapa punto 1 |
| E-05 | **Presupuesto preliminar (por fotos, sin visita)** | lead calificado + fotos | comercial | proyecto: `borrador` (con poca info) | proyecto + cotización preliminar | mapa: línea de tiempo; narrativa presupuesto. ⚠ **rama "no viable" sin proceso definido** (Z1 del diagrama) → P8 F-8 (nuevo E-49) |
| E-49 | **Presupuesto preliminar NO viable** | presupuesto preliminar inviable (E-05, rama Z1) | comercial | lead: `→ no_viable` (distinto de `descartado` E-04 y de `no_show` E-46) | motivo de no viabilidad + destino del lead (¿se pierde? ¿redirige?) | P8 F-8; logica_de_negocio.md:40 (Z1 "¿Se pierde el lead? sin proceso definido"). ⚠ **VACÍO: regla de consecuencia por definir** en el Define |
| E-06 | **Se agenda visita** | franjas libres compartidas cliente+comercial | comercial o IA (híbrido) | lead/proyecto: se fija cita | evento de agenda con fecha/franja | mapa punto 2; Q7 (visitas por franjas libres). ⚠ **decisión del Define abierta:** tensión híbrido app vs. trato humano (punto 2 del mapa) |
| E-07 | **Visita ocurre** | cita agendada (E-06) + proyecto | comercial + cliente en sitio | proyecto: visita realizada; se completa info de medidas/contexto | registro estructurado de visita (H4: hoy no deja dato) | mapa punto 2; H4 (instrumentar lo que ya pasa, no agregar actividad). ⚠ **captura duplicada con E-15 (retoma) sin relación de superación** → P3-09 |
| E-46 | **Visita NO ocurre (no-show)** | cita agendada (E-06) | cliente que no se presenta | cita: `agendada → no_show` | registro de no-show + regla por definir (¿reagenda? ¿pierde lead?) | loop apertura A-3; mapa:400,506 (hueco en blanco). ⚠ **fuga causal sin dato** (consume capacidad comercial) → P7 H-09 |
| E-48 | **Diseño 3D producido** | proyecto con presupuesto preliminar (E-05) | diseñador-comercial | proyecto: se produce el diseño pagado (E-08) | artefacto de diseño 3D (2 espacios, $130k+DIAN) | P4-F1 (rol diseñador ausente: 0 eventos); I-022 (precio $130k). ⚠ **el rol diseñador no estaba materializado** — solapamiento real comercial+diseñador no declarado |
| E-08 | **Cliente paga diseño 3D** ($130k, DIAN) | propuesta de diseño 3D | cliente (pre-contrato) | pago registrado; pendiente descuento del anticipo final | movimiento financiero ligado al proyecto + cuenta de cobro del diseñador | mapa: gap de proceso (descuento olvidado); cierre §8.1. ⚠ **doble nacimiento de la cuenta de cobro del diseñador (E-08 y E-32)** → P3-03 |
| E-52 | **Estimación de duración y re-estimación** | proyecto en ajustes o previo a contrato | comercial / sistema | proyecto: se proyecta cronograma pre-contrato o se recalcula al crecer el alcance | estimación `f(valor, cantidad de ítems/módulos)` + % de crecimiento | P8 F-10; mapa:254 (función de estimación documentada, sin evento que la dispare). Fallo si no ocurre: cronograma nace a ojo |
| E-09 | **Cliente recibe presupuesto/diseño** | proyecto con diseño 3D listo | sistema (publicación) | proyecto: `borrador → en_revision` | vista pública de propuesta | mapa: `/propuesta/:proyectoId`. ⚠ **snapshot congelado vs. proyecto vivo editándose** → P3-07 |
| E-10 | **Ajustes del cliente** | propuesta en revisión (E-09) | cliente/comercial | proyecto: revisión con cambios | revisión/versión ajustada de la cotización | mapa: línea de tiempo. ⚠ **scope creep sin re-estimación** → nuevo E-52 |
| E-11 | **Cotización formal** | ajustes cerrados (E-10) | comercial | proyecto: `en_revision → cotizado` | cotización formal | mapa: línea de tiempo. ⚠ **cadencia anclada a la promesa de 7 semanas (I-024)** — la promesa es 7 semanas, entregable antes; ⚠ **P4-F5/P4-F6: el comercial promete fechas que no controla y satura el embudo** |
| E-51 | **Lead → cliente (materialización)** | cotización formal (E-11) o cierre | sistema | lead: `→ cliente` (mismo registro, no duplicado) | conversión de lead a cliente con vínculo al proyecto | P3-01 (conversión manual hoy, contacto duplicado, bloquea E-42) |

## B. Contratos y cronograma

| ID | Evento | Dato previo | Dispara | Cambio de estado | Dato que nace | Fuente |
|---|---|---|---|---|---|---|
| E-12 | **Contrato se crea (borrador)** | cotización formal (E-11) + hitos de pago | comercial | contrato: `borrador` | contrato + hitos de pago | mapa: t-009; hitos_pago. ⚠ **6/7 contratos sin hitos** → P3-02 (nacimiento de obligación, nuevo E-56) |
| E-13 | **Contrato se firma** | contrato borrador + mecanismo de firma | cliente | contrato: `borrador → firmado` | registro de firma (evento del sistema — hoy no existe mecanismo) | mapa: gap firma virtual (RED2); V-6. ⚠ **al cerrar, se captura disponibilidad del cliente** → nuevo E-53 (I-024) |
| E-53 | **Cuestionario de viajes/situaciones del cliente** | contrato firmado (E-13) | comercial | contrato: se registran restricciones de disponibilidad del cliente | campo estructurado de viajes/situaciones externas | I-024; P8 F-3. Fallo si no ocurre: la instalación (E-25) puede chocar con la ausencia del cliente. **Riesgo de campo muerto:** sin consumidor en el motor de cronograma, repetirá la muerte de `score_conversion` (I-005) |
| E-14 | **Cronograma se fija en el contrato** | contrato firmado (E-13) + estimación (E-52) | sistema (derivado del contrato) | proyecto: cronograma programado | fechas por etapa (compras → aprobación → ensamblaje → instalación), rango de instalación de 5 días, holgura total ≤5 días | mapa: Control de cronograma (Q7); cierre §6. ⚠ **ancla la promesa de 7 semanas (I-024)**; ⚠ **cronograma DOBLE (I-034):** línea interna de producción (movible) + línea contractual al cliente (inmutable dentro de las 7 semanas); ⚠ **holguras sin validación** → P2-5; ⚠ **comercial promete fechas que no controla (responsabilidad sin autoridad)** → P4-F6; ⚠ **orden inconsistente: "check pre-compras" vs. lista de etapas "compras → aprobación"** → P5-09; ⚠ **dimensión transversal: calendario por rol** → P6-01 |

## C. Desarrollo (capa 1)

| ID | Evento | Dato previo | Dispara | Cambio de estado | Dato que nace | Fuente |
|---|---|---|---|---|---|---|
| E-15 | **Retoma de medidas** | contrato firmado (E-13) | comercial + desarrollador en sitio | proyecto: comienza Desarrollo | mediciones/detalles técnicos post-contrato | mapa: narrativa retoma de medidas; cierre §10. ⚠ **captura duplicada con E-07 (visita)** → P3-09 |
| E-16 | **Ajuste de contrato en paralelo** (solo si hay anomalía en E-15) | anomalía detectada en retoma | comercial | contrato: revisión de cambios | cambio de contrato (**flow organizado de I-027**, ya no "corre en paralelo, no bloquea" como única respuesta) | mapa: línea de tiempo (N2). ⚠ **I-027:** adicional = módulo con especificación y tiempo propio; cambio = protocolo con impacto medible (¿insumos homologables en compras?); reprocesos con costo al cliente. **Tercer origen de causa en E-33: "cambio de contrato"** |
| E-17 | **Desarrollo técnico** | retoma de medidas (E-15) | desarrollador | proyecto: `→ desarrollo` | modelo 3D (piezas exactas), lista de materiales detallada (BOM), órdenes de armado, lista de compras | mapa: narrativa desarrollo técnico; posible gap de schema (granularidad). ⚠ **versionado del schema exigido por la tesis** → P2-8/P6-07; ⚠ **linaje del material (cotización→BOM→lista→OC→recepción)** → P3-05 |
| E-18 | **Check de schema pre-compras** | desarrollo técnico (E-17) | **verificador único designado** (comercial o gerente, I-035) | proyecto: `desarrollo → aprobado_compras` | validación registrada (gate estructural; hoy reunión) | mapa: Capa 1 gate (a); A2; cierre §8.6. ⚠ **rama negativa sin evento de reproceso** (¿desarrollo corrige? ¿corre cronograma?) → P8 F-9 (nuevo E-54); ⚠ **precedencia frente a E-38/E-39** (corte contra schema no aprobado = reproceso) → P5-13; ⚠ **gate sin rol de autorización: el gerente hace todo, "ni el dueño lo salta" no se materializa** → P4-F3; ⚠ **pool de verificadores 1-2 personas con producción de 2.5 es irreal de poblar** → P4-F4 (resuelto: I-035 verificador único); ⚠ **orden inconsistente con la lista de etapas** → P5-09 |

## D. Compras (capa 1)

| ID | Evento | Dato previo | Dispara | Cambio de estado | Dato que nace | Fuente |
|---|---|---|---|---|---|---|
| E-19 | **Pedido de compra** | aprobación (E-18) | compras/desarrollador | proyecto: se inicia aprovisionamiento | orden de compra (soporta ≥3 mecánicas: anticipo+saldo, único, subcontratación) | mapa: narrativa Compras |
| E-20 | **Pago a proveedor** | pedido (E-19) + **dinero disponible (gate de caja con consecuencia, no solo dato previo)** | compras | pago registrado | movimiento financiero + comprobante + prioridad de pago (materiales → arriendos → nóminas) | mapa: política "no acumular deuda"; A8. ⚠ **gate de caja sin enforcement** → P2-2; ⚠ **RED3: el dinero gobierna el timing de compras** → P5-04/H-03; ⚠ **3er flujo de pago (arriendos)** → P2-1 (nuevo E-57) |
| E-21 | **Recepción de material con triple verificación** | pedido pagado + entrega del proveedor | desarrollador (3 sub-verificaciones: pedido bien hecho, despacho bien hecho, material verificado) | proyecto: **pasa a control total del subsistema desarrollo-taller** | gate de recepción registrado (gate estructural) | mapa: Capa 1 gate (b); A4; I-001 (inconsistencia de carpetas en VETA_ERP). ⚠ **rama negativa: material mal recibido sin reproceso** → P2-3 |
| E-45 | **Reposición de herramienta/consumible** | desgaste o agotamiento operativo (no atado a proyecto) | taller | — | compra operativa ligada a proveedor (vista conjunta con E-19 por proveedor) | loop apertura A-2; mapa:566-567 (dos orígenes de compra: proyecto vs. operativa). ⚠ **sin hogar en el cierre §4 (su contexto solo vive en la Parte II)** → P6-04 |

## E. Armado y calidad

| ID | Evento | Dato previo | Dispara | Cambio de estado | Dato que nace | Fuente |
|---|---|---|---|---|---|---|
| E-22 | **Armado en taller** | recepción verificada (E-21) | desarrollador distribuye a auxiliares | proyecto: `→ armado` | órdenes de armado por módulo + tareas | mapa: narrativa producción (**capa 2** — el detalle se difiere, el evento de frontera sí existe). ⚠ **la cola del taller es input del check de 15 días (I-025)** — hoy no es dato → nuevo E-59; ⚠ **bucle de equilibrio: el taller es el recurso común (capacidad 1.25/semana)** → H-04 |
| E-23 | **Citación de calidad (push)** | proyecto en armado | subsistema desarrollo-taller → **empuja** hacia Comercial | proyecto: se cita revisión de calidad | citación de calidad (Comercial no agenda: espera) | mapa: Capa 1 gate (c); A4 |
| E-24 | **Verificación de calidad pre-despacho** | citación (E-23) | **verificador único designado** (comercial o gerente, I-035) | proyecto: `armado → verificado` | veredicto de calidad (pre-despacho) | mapa: narrativa calidad. ⚠ **rama negativa: calidad rechazada sin reproceso** (retorno al taller, quién se entera) → P8 F-9 (nuevo E-54). **I-035: sin conflicto de interés** — la comisión del comercial es por ventas, no por producción (I-043). ⚠ **gate sin rol de autorización** → P4-F3; ⚠ **pool irreal de poblar** → P4-F4 |
| E-54 | **Reproceso por calidad/schema rechazado** | veredicto negativo (E-24/E-18) o instalación fallida (E-25) | quien ejecuta la etapa | proyecto: vuelve a la etapa anterior | registro de rechazo + reproceso + quién se entera | P8 F-9; mapa:436 (taxonomía de fallas #4: "reprocesar o devolver un módulo al taller") |

## F. Entrega / instalación

| ID | Evento | Dato previo | Dispara | Cambio de estado | Dato que nace | Fuente |
|---|---|---|---|---|---|---|
| E-25 | **Instalación** | proyecto verificado (E-24) | instalador (rango de fecha de 5 días) | proyecto: `verificado → instalado` | registro de instalación | mapa: Q7 (rango de instalación). ⚠ **desenlace del check de 15 días (I-025):** si el log va bien, se insinúa instalación en los 15 días siguientes (entrega antes de las 7 semanas); ⚠ **rama negativa: instalación que falla en sitio** → P8 F-9 (nuevo E-54) |
| E-26 | **Acta de entrega digital** | instalación (E-25) | cliente + empresa | proyecto: `instalado → entregado` | acta de entrega firmada + holgura operativa de 12 días visible | mapa: narrativa entrega (momento de verdad máximo); RED4 (hoy informal). ⚠ **prueba social: testimonio/reseña post-entrega** → P6-06 (nuevo E-55) |
| E-55 | **Testimonio/reseña post-entrega** | proyecto entregado (E-26) | cliente | — | reseña curada (protocolo de I-013, no widget de Google) | P6-06; I-008 (tabla `testimonios` existió en legacy y se perdió); I-013 (protocolo de reseñas curadas) |

## G. Finanzas / compensación (capa 1)

| ID | Evento | Dato previo | Dispara | Cambio de estado | Dato que nace | Fuente |
|---|---|---|---|---|---|---|
| E-56 | **Nacimiento de la obligación de cobro** | contrato firmado (E-13) con hitos | sistema | obligación: nace con el contrato | obligación de cobro por hito (reemplaza la doble creación manual en 4 namespaces) | P3-02 (mismo dinero en `hitos_pago`, `obligaciones_pendientes`, `abonos_contrato`, `movimientos_financieros` sin nacimiento declarado) |
| E-27 | **Notificación de pago al cliente** | hito de pago por vencer | sistema | — | notificación (cuándo/cuánto pagar) | mapa: línea de tiempo (gap real) |
| E-28 | **Pago del cliente / cobro** | hito de pago | cliente | obligación: `pendiente → pagada` | movimiento financiero + saldo de obligación | mapa: t-017 (integridad transaccional). ⚠ **reconciliación de pago parcial** → P3-02/P3-12 |
| E-29 | **Cobro con atraso** | obligación vencida (E-28 sin ocurrir) | comercial + sistema | obligación: marca atraso | recordatorio + holgura contractual de 12 días | mapa: narrativa cobro (hoy 100% manual). ⚠ **sin consecuencia después de los 12 días** (VACÍO, prioridad baja) → P8 F-12; ⚠ **P4-F5/P4-F6: cobro manual suma carga al comercial y cobra sobre entrega que no ejecuta** |
| E-30 | **Deducción del diseño 3D del anticipo** | pago de E-08 + anticipo final | sistema (no memoria) | anticipo: se descuenta lo ya pagado | ajuste en la obligación | mapa: gap del árbol de problemas (solución de raíz: C1/C2 eliminados). ⚠ **memoria humana en descuento/cobro = *fixes that fail*** → P7 H-10 |
| E-31 | **Compensación por rol** | proyecto con fases terminadas | sistema (regla de comisión) | — | pago/nómina por rol: diseñador ($130k+comisión), desarrollador (quincena + 5% cronograma), carpintero (% por tamaño), auxiliar (horas + comisión por módulo) | mapa: tabla de compensación; Q15-18. ⚠ **2 parámetros sin número** (no bloquean modelar la regla): % del carpintero "por tamaño" (sin definir) y neto post-impuestos del diseñador (pendiente contador). ⚠ **nómina como dato compuesto (E-31 base + E-35 ajuste)** → P3-04; ⚠ **la comisión del comercial es por VENTAS, no por producción (I-043)** — sin acople a métricas de cronograma; ⚠ **success to the successful: comisión por cierre (volumen) vs. por cumplimiento (calidad); E-35 es el compensador** → H-11 |
| E-57 | **Pago de arriendos / flujos operativos** | dinero disponible (E-43) | sistema/gerente | — | movimiento financiero del 3er flujo (arriendos) | P2-1; mapa: política "no acumular deuda" (3 flujos de pago; el inventario solo modelaba 2) |
| E-32 | **Micro cuenta de cobro autogenerada** | registro transaccional de un socio (E-31, E-08) | sistema (permiso de uso de firma previo) | — | documento de cuenta de cobro por registro | mapa: Q12; A7. ⚠ **doble nacimiento con E-08** → P3-03 |
| E-58 | **Lectura de cuenta/saldo por socio** | movimientos de un socio | sistema | — | visibilidad de cuenta/saldo por diseñador/desarrollador (análogo a E-43 para caja) | P2-7 ("el sistema debe llevar la cuenta del diseñador") |

## H. Control de cronograma (contexto central)

| ID | Evento | Dato previo | Dispara | Cambio de estado | Dato que nace | Fuente |
|---|---|---|---|---|---|---|
| E-59 | **Check de los 15 días (log de producción)** | proyecto a ~15 días del contrato | sistema (revisión programada) | cronograma: se decide desenlace | log real de producción: (a) insumos en taller, (b) comprados o pagados, (c) proyectos en fila en el taller | I-025; P8 F-4 (el enforcement más grande del cronograma). **3 desenlaces:** (1) todo bien → insinuar instalación en 15 días (E-25, entrega antes de 7 semanas, cambio predefinido y POSITIVO para el cliente); (2) novedad → pospone cronograma INTERNO (comisiones se reducen, E-35), el cliente NO ve cambios (silencio deliberado por diseño), entrega 3 semanas tarde dentro de la promesa; (3) extremo (máximo estrés sin entrega) → negociar con el cliente |
| E-33 | **Cambio de cronograma con causa** | cronograma fijado (E-14) | **causa estructurada: interno / externo / cambio de contrato (tercer origen, I-027)** | cronograma: recalculo automático de fechas | registro del desfase con causa + motivo — dato auditable | mapa: Control de cronograma (Q7); A6. ⚠ **regla del Define:** las tareas internas se imprimen una vez y NO se modifican espontáneamente — solo eventos externos las mueven (inmutabilidad). ⚠ **cronograma doble (I-034):** la línea interna puede moverse sin avisar al cliente; la contractual es inmutable dentro de las 7 semanas. ⚠ **clasificador sin actor asignado** → P4-F2; ⚠ **relación con E-34 (¿novedad crítica es subtipo de desfase?) sin declarar** → P3-08; ⚠ **bucle de equilibrio: saturación del taller (capacidad 1.25/semana) corta temprano vía E-34** → H-04; ⚠ **dimensión transversal: calendario por rol** → P6-01 |
| E-60 | **Comunicación frontstage de progreso al cliente** | proyecto en cualquier etapa post-contrato | sistema / comercial | — | progreso visible del proyecto (único mecanismo frontstage: reemplaza los tramos silenciosos sueltos) | P5-01 (tramo silencioso E-15→E-26 de ~4 semanas); P5-02 (matizada por I-025: el único cambio visible al cliente es el positivo — entrega antes); P5-10 (garantía sin evento intermedio). **I-043:** el deslizamiento interno es invisible por diseño; lo visible es el progreso y el adelanto |
| E-34 | **Novedad crítica** | evento del cronograma | incidente en cualquier fase | cronograma: entra al SLA | evento con ventana de respuesta 5-24h + hora de entrada y resolución | mapa: A5. ⚠ **consecuencia del SLA sin definir (un SLA sin consecuencia es deseo)** → P2-9 VACÍO; ⚠ **sin actor respondiente asignado** → P4-F2 |
| E-35 | **Cálculo de comisiones según cumplimiento** | cronograma (E-14) + desfases (E-33) | sistema (cierre de período) | nómina/incentivos: se liquidan | ajuste de comisión (cumplió → recibe; causa interna → pierde; causa externa → se mide contra nuevos plazos) | mapa: Control de cronograma; A6; tabla de compensación. ⚠ **la reducción de comisiones por novedad del check de 15 días (I-025) dispara desde E-59**; ⚠ **la comisión del comercial es por ventas, no por producción (I-043)** — solo el desarrollador queda acoplado al cronograma (5%); ⚠ **compensador del success to the successful (comisión volumen vs. cumplimiento)** → H-11; ⚠ **bucle de equilibrio: corte temprano por saturación del taller** → H-04 |
| E-43 | **Lectura de caja y restricción de dinero** | movimientos financieros | gerente / sistema | — | visibilidad de dinero disponible real (restricción máxima) | mapa: política financiera; cierre §5. ⚠ **dos verdades: derivado de movimientos vs. `saldo_actual` almacenado** → P3-12; ⚠ **límite al crecimiento operado por esta única vista** → H-03; ⚠ **dimensión transversal: transparencia de compras por rol** → P6-01 |
| E-42 | **Medición de embudo** | eventos E-01..E-11 con datos | sistema (agregado) | — | métricas por salto del embudo (impresión → clic → lead → contacto → visita → cotización → contrato) | marco_estrategia §7 Fase A; H3 (imposible hoy sin etapa en leads). ⚠ **sin bounded context en el cierre §4** → P6-03 |
| E-47 | **Lectura de KPIs operativos** | proyecto/semana, ciclo de entrega, salud de caja, bienestar | gerente / sistema (agregado) | — | métricas: ≥1 proyecto vendido/semana, entrega en ~15-20 días de la venta, salud de caja, capa de bienestar (cero horas extra, no sábados). ⚠ la parte de bienestar requiere registrar horas hoy (no se mide) | mapa punto 6 (KPIs propios del mapa); loop apertura A-5; V-5. ⚠ **KPI "15-20 días" contradicho por la promesa de 7 semanas + check de 15 días** → P8 F-2 (reconciliar en el Define: 15+15=~30 días ideal, 3 semanas de atraso tolerable → 7 semanas) |

## I. Garantía

| ID | Evento | Dato previo | Dispara | Cambio de estado | Dato que nace | Fuente |
|---|---|---|---|---|---|---|
| E-36 | **Garantía se agenda** | proyecto entregado (E-26) + problema reportado | cliente / comercial | se crea orden de servicio | cita de garantía (8-12 días hábiles contractuales) | mapa: narrativa garantía; Q7. ⚠ **ventana 8-12 sin validación** → P2-5; ⚠ **P4-F5: otro evento comercial sobre el rol más cargado** |
| E-61 | **Check de completitud de orden de garantía** | orden de garantía creada | instalador (verificación antes de salir) | orden: lista para salir (materiales incluidos) | verificación de que la orden trae todo lo necesario | P8 F-11; mapa:470 ("si el instalador no lleva todo, hay que volver 2-3 veces más") — fricción cobrada en reputación (mapa:545) |
| E-37 | **Orden de garantía** | cita (E-36) + check de completitud (E-61) | instalador | orden: `→ en_garantia` | orden de trabajo (reutiliza patrón `ordenes_trabajo` con tipo distinguible producción/garantía) | mapa: narrativa garantía |

## J. Integraciones y herramientas externas

| ID | Evento | Dato previo | Dispara | Cambio de estado | Dato que nace | Fuente |
|---|---|---|---|---|---|---|
| E-38 | **Traducción schema → modelo 3D** | proyecto definido (E-17) **con schema aprobado (E-18)** | Veta Designer / SketchUp+OpenCutList | — | etiquetas de modelo 3D (piezas melamínicas, herrajes, colores, escenas) | mapa: integraciones; A1; I-003 (SDK mobiliario como fuente de predefinidos). ⚠ **precedencia frente a E-18** → P5-13 |
| E-39 | **CVC → servicio de corte** | listas de corte generadas (E-38) | integración a Corte Cloud (SivalTriplex preferido) | — | archivo CVC / pedido de corte (hoy: copia/pega manual si no es SivalTriplex) | mapa: integraciones; I-002 (CSV a mano). ⚠ **precedencia frente a E-18** → P5-13 |
| E-40 | **Conversión offline → Google Ads** | proyecto que cierra (E-11/E-13) + señal de conversión | sistema → Google Ads API | — | señal de conversión. **Dos caminos** (no solo `gclid`): (1) `gclid` hoy perdido en migración; (2) *enhanced conversions for leads* con email/teléfono hasheado (ya se capturan) — verificar documentación vigente de Google Ads antes de implementar | marco_estrategia H2/H3; H1; loop apertura A-6. ⚠ **sin bounded context en el cierre §4** → P6-03 |

## K. Documentación y medición

| ID | Evento | Dato previo | Dispara | Cambio de estado | Dato que nace | Fuente |
|---|---|---|---|---|---|---|
| E-41 | **Foto/documento por etapa** | proyecto en cualquier fase | quien ejecuta la etapa | — | registro de documentación con alojador (hoy Drive VETA_ERP; idea R2 diferida). ⚠ I-001: la plantilla de carpetas estandarizada de VETA_ERP (PEDIDOS/, MODELADOS 3D/, ORDENES DE ARMADO INSTALACIÓN/) es evidencia de la taxonomía por etapa que la capa 1 puede reproducir | mapa: narrativa documentación; I-004 (estructura PROPUESTAS sin convención); I-001 (plantilla inconsistente); loop apertura B-1. ⚠ **sin rol de captura (único disparador catch-all)** → P4-F8 VACÍO |

## L. Tienda web (línea de negocio con su propio pipeline)

| ID | Evento | Dato previo | Dispara | Cambio de estado | Dato que nace | Fuente |
|---|---|---|---|---|---|---|
| E-44 | **Pedido de tienda → dispara producción** | `pedidos_web` (t-015) registra pedido + pago | cliente compra en tienda | producto pasa al MISMO pipeline (desarrollo → aprovisionamiento → armado) | enganche pedido→orden de producción (**hoy no existe**: el pedido no dispara nada) | loop apertura A-1; mapa:157,188 (gap confirmado); V-4 (alcance de envío por definir). ⚠ **identidad del cliente en tienda sin relación tipada al ERP** → P3-11; ⚠ **tragedy of the commons: la tienda comparte el taller** → H-05 |

---

## Notas del Discover (para el Define, no son decisiones)

1. **E-14 y E-33 (cronograma) son la espina dorsal**: nacen en el contrato y gobiernan incentivos (E-35). Es el contexto central de la Parte I — acá aparece como eventos del sistema, no como un "módulo cronograma". **Con I-034 el cronograma es doble** (línea interna de producción + línea contractual al cliente), lo que toca la inmutabilidad original de E-33/A-7.
2. **Los 4 gates de la capa 1 están distribuidos como eventos de frontera:** E-18 (check de schema), E-21 (triple verificación), E-23 (citación de calidad), E-33 (cronograma con causa). Son eventos entre contextos, no dentro de uno — el Define deberá decidir de quién es cada uno (problema B del mapa ya lo advirtió para E-18/E-21). **I-035 asignó un verificador único designado (comercial o gerente) para E-18/E-24.**
3. **Eventos que hoy no producen dato (los 4 de marco_estrategia):** E-03 (cualificación muerta), E-07 (visita sin registro), E-40 (conversión offline sin `gclid`), y E-42 (embudo no medible). Son código, no análisis — precondición de la palanca de demanda. Se suman los VACÍO del ciclo: E-34 (consecuencia del SLA), E-29 (consecuencia tras 12 días), E-49 (presupuesto no viable, Z1).
4. **Eventos con dato parcial (gaps del mapa):** E-08 (descuento olvidado), E-13 (sin mecanismo de firma), E-26 (acta nunca se hace), E-27/E-29 (cobro manual).
5. **Capa 2 (diferida, no se construye):** el detalle interno de E-22 (tareas por módulo, manual ISO, pantallas de carpinteros) y la estructura de E-41 alojada en la nube (R2). Los eventos de frontera se modelan; el detalle interno queda registrado como alcance futuro.
6. **Eventos sin profundizar que el Define podría reabrir:** agenda/visita (híbrido, punto 2 del mapa — tensión documentada en E-06), tienda web como línea de negocio (envío nacional — E-44, hay 1 insight diferido), KPIs de bienestar (capa filosófica del punto 6 — E-47), modelo rol-vs-persona (P2-12, diferido).
7. **Las decisiones I-024..I-043 ya resueltas que el inventario materializa:** promesa de 7 semanas (E-14/E-11), cuestionario de viajes (E-53), check de los 15 días con 3 desenlaces (E-59), cronograma doble (E-14/E-33), verificador único (E-18/E-24), flow de cambios de contrato con tercer origen (E-16/E-33), comisión del comercial por ventas (E-31/E-35).

---

## Registro

- Fecha: 2026-08-03
- Estado: **Discover abierto (diverge)**. Inventario completo de punta a punta, **61 eventos** (47 previos + 14 del ciclo de pasadas: E-48 diseño 3D producido, E-49 presupuesto no viable, E-50 SLA de primera respuesta, E-51 lead→cliente, E-52 estimación, E-53 cuestionario de viajes, E-54 reproceso, E-55 testimonio, E-56 nacimiento de obligación, E-57 arriendos, E-58 cuenta por socio, E-59 check de 15 días, E-60 comunicación frontstage, E-61 check de completitud de garantía), sin filtrado.
- Aplicado por decisión del Supervisor (2026-08-03): "ejecuta las aplicaciones al inventario, correcciones y destilación de info". Las correcciones a contrato vivo (I-024..I-027, I-034..I-043) se integraron al mapa vía loop focalizado y se reflejaron en el inventario.
- Próximo paso del método: **Define** — agrupar los 61 eventos en bounded contexts del sistema, decidir fronteras de los gates (E-18/E-21/E-23/E-33) y de ahí emergen las interfaces. El schema/UI concreto es el segundo ciclo abrir/cerrar (loop 2 de diseño).
- Trazabilidad: cada evento cita su fuente en el mapa; los insights I-001..I-043, H1-H8, el loop de apertura y el panorama consolidado P2-P8 están referenciados.
