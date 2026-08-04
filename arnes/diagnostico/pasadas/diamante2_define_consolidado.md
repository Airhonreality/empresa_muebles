# Diamante 2 · Define — consolidación del ciclo de pasadas C1-C6 (auditoría del Orquestador)

**Qué es esto:** la consolidación de las 6 pasadas agentivas sobre la convergencia (`diamante2_define_eventos.md`). El Orquestador auditó cada output (formato, trazabilidad `archivo:línea`, clasificación, anti-duplicación), deduplicó entre pasadas y emite el **veredicto del ciclo**: si la convergencia es estable (→ loop 2 de diseño) o si mueve fronteras/contextos (→ loop focalizado con checkpoint del Supervisor).

**Método:** `pasadas/diamante2_metodologia_define.md`. 6 subagentes en paralelo (t-042..t-047), cada uno con loop interno de 3 iteraciones.

---

## 1. Auditoría de formato (mecánica, verificada)

| Pasada | Archivo | Iteraciones 1/2/3 | Tabla | Notas | IDs propios | Trazas `archivo:línea` |
|---|---|---|---|---|---|---|
| C1 cohesión | define_c1_cohesion.md | ✓✓✓ | ✓ | ✓ | 7 (C1-01..07) | 35 |
| C2 fronteras | define_c2_fronteras.md | ✓✓✓ | ✓ | ✓ | 13 (C2-01..13) | 45 |
| C3 trazabilidad | define_c3_trazabilidad.md | ✓✓✓ | ✓ | ✓ | 10 (C3-01..10) | 65 |
| C4 ejecutabilidad | define_c4_ejecutabilidad.md | ✓✓✓ | ✓ | ✓ | 12 (C4-01..12) | 37 |
| C5 contrato vivo | define_c5_contrato_vivo.md | ✓✓✓ | ✓ | ✓ | 5 (C5-01..05) | 73 |
| C6 restricción | define_c6_restriccion.md | ✓✓✓ | ✓ | ✓ | 8 (C6-01..08) | 31 |

**Total de hallazgos brutos: 55.** C5 declaró anti-duplicación cruzada contra C4/C6 (10 hallazgos no re-reportados); las pasadas coinciden en los temas centrales (E-53 consumidor, E-54 ramas, E-59 fila del taller, E-20 gate de caja), lo que **corrobora** los hallazgos en lugar de inflarlos.

---

## 2. Hallazgos consolidados (deduplicados por tema)

### Bloque A — Estructura de la convergencia: ESTABLE (ninguno mueve contextos ni gates)

| # | Tema | Pasadas | Veredicto |
|---|---|---|---|
| A1 | **Comercial (15) y Finanzas (12) NO son cajón de sastre** — identidad evolutiva lead→cliente→proyecto y raíz de dinero respectivamente | C1-01, C1-03 | OK: no `PARTIR_CONTEXTO` ni `MOVER_CONTEXTO` en los 15. C1 recomienda declarar la identidad compartida en §2 |
| A2 | **Los 9 contratos de §5 están bien formados** (explícitos, unidireccionales, con evento existente y dueño) | C2 | OK: sin ciclos de interfaz directos |
| A3 | **61/61 eventos con hogar**, 0 sin hogar (re-verificación independiente de C3 coincide con la aritmética del Define) | C3 | OK: no se perdió ningún evento en la convergencia |
| A4 | **7/7 decisiones I-024..I-043 materializadas** en la convergencia; ninguna sin materializar | C3 | OK: no se dispara checkpoint por decisión perdida |
| A5 | **Cero contradicciones silenciosas de contenido**; la única declarada (P5-09) está bien declarada | C5, C4-10 | OK: P5-09 es consistente con mapa e inventario, no introduce contradicción |
| A6 | **El grafo soporta la tesis de capacidad** (demanda < fábrica; dinero > leads > cronograma) | C6 | OK: los diferidos (Marketing/Tienda/Gobierno) no bloquean el core |

### Bloque B — Fronteras que faltan declarar (REFORZAR_FRONTERA / NUEVO_CONTRATO — no mueven nada, completan)

| # | Tema | Pasadas | Qué se agrega |
|---|---|---|---|
| B1 | **Tabla §5 de interfaces incompleta** — ≥6 flujos cruzados reales fuera de la lista | C2-01 | loop 2: ampliar la tabla o declarar "interfaces de lectura/derivación" aparte |
| B2 | **E-59 (check 15 días) lee estado de Compras y la fila del Taller sin contrato** — la fila del taller es dato de capa 2 | C2-03, C6-01, C4 (implícito) | **NUEVO_CONTRATO.** Cruza la división capa 1/capa 2 aprobada por el Supervisor → **checkpoint** |
| B3 | **E-52 (estimación) vive en Control pero se dispara en Comercial** — falta fila Comercial→Control | C2-05, C6-02 | NUEVO_CONTRATO (barato: mismo motor de E-14) |
| B4 | **E-31 (compensación base) consume hechos de Taller/Entrega/Control sin interfaz** | C2-04 | NUEVO_CONTRATO ("Taller→Finanzas por órdenes de trabajo") |
| B5 | **E-53 (cuestionario de viajes) sin consumidor tipado** — riesgo de campo muerto (I-005) | C2-08, C3-02, C5-04 | REFORZAR_FRONTERA: tipar `Contratos → Control` en §5 (consumidor: E-14/E-33) |
| B6 | **E-54 (reproceso) ramas negativas sin declarar** (E-24, E-25, recalculo) + dueño multi-contexto ambiguo | C1-06, C2-06, C3-01, C4-02 | REFORZAR_FRONTERA: ramas negativas son fronteras tanto como las positivas |
| B7 | **P3-05 linaje del material**: interfaz Desarrollo→Compras es doble (guard E-18 + BOM de E-17) | C2-07 | REFORZAR_FRONTERA: declarar el contrato de datos |
| B8 | **P3-09 superación E-07/E-15** y **P3-11 identidad tienda** sin contrato en §5 | C3-03, C3-04 | REFORZAR_FRONTERA (loop 2) |
| B9 | **I-027 doble destino** (adicional→Desarrollo schema; costo→Finanzas) sin fronteras tipadas | C5-02 | REFORZAR_FRONTERA: agregar filas §5 |

### Bloque C — Enforcement: NO está listo para loop 2 tal cual (estructural, no parametrizable)

| # | Tema | Pasadas | Qué se cierra ANTES del loop 2 |
|---|---|---|---|
| C1 | **E-33 sin camino positivo**: el adelanto de E-59 no tiene ruta por E-33 y la rama negativa "causa interna → E-35 se reducen" castigaría el éxito | C4-01 | Declarar el adelanto como cambio SANCIÓNADO (clase "positiva" exenta de reducción de comisiones) |
| C2 | **E-54 sin set de back-edges ni granularidad**: inventario dice "proyecto", mapa manda "módulo"; recalc asimétrico (E-18 sí, E-24/E-25 no) | C4-02 | Declarar back-edges, granularidad (módulo) y política de recalc |
| C3 | **E-21 sin estado de salida con nombre** ("pasa a control total..." es prosa) | C4-03 | Nombrar el estado (ej. `recibido_verificado`) antes del schema |
| C4 | **E-18 sin pin de versión de schema** (P2-8) | C4-07 | Agregar versión al guard |
| C5 | **E-24 es gate real fuera de la tabla §4.1** (implementable, falta fila) | C4-08 | Agregar fila E-20/E-24 a §4.1 |
| C6 | **§8 precondiciones de capa 1 incompleta**: omite rol-vs-persona (requisito de §3) | C6-05 | Corregir §8 |

### Bloque D — Decisiones de negocio que quedan para el Supervisor (amplían §7 del Define)

| # | Tema | Pasadas |
|---|---|---|
| D1 | **E-20 gate de caja: bloquea o advierte + quién lo salta** (P2-2, P4-F3). Default recomendable: bloquear con override auditable por rol gerente | C1-03, C4-05, C4-12 |
| D2 | **Rama negativa de E-21** (material mal recibido, P2-3) → estado atascado si no se decide | C4-04 |
| D3 | **Identidad del verificador único** (comercial vs. gerente, I-035) — decide si E-18/E-24 compiten con el cuello de demanda (P4-F5) o revive "el gerente hace todo" (P4-F3) | C6-03 |
| D4 | **Actor del clasificador E-33** (P4-F2) — bloquea el recalc tras rechazo | C4-11 |
| D5 | **Rol de captura de E-41** (P4-F8) — deja E-60 (frontstage) sin contenido | C4-12, C6-07 |
| D6 | **Set de KPIs por subsistema — ninguno residual (corrección del Supervisor, 2026-08-03).** Estructura de 3 KPIs, cada uno mide un subsistema: (1) **KPI de 4 semanas** → comisión 5% para desarrollador Y carpintero (producción); (2) **KPI de ventas** → comisión del comercial por proyectos vendidos (comercial); (3) **KPI de 7 semanas** → el cliente recomienda Veta Dorada (entrega/promesa). El "15-20 días" que C3-06 marcó se reconcilia con el KPI de 4 semanas, no con el de 7 | C3-06 |
| D7 | **I-014 (restauración de pisos) e I-021 (B2B por m²)**: líneas de servicio reales sin evento/contexto — decisión de alcance | C3-07 |
| D8 | **VACÍOs del loop de apertura no formalizados en §6** (V-1 no-show, V-4 envío, V-5 horas bienestar, V-6 firma) | C3-05 |

---

## 3. Veredicto del Orquestador

**La convergencia es ESTRUCTURALMENTE estable:**
- Ninguna pasada encontró `PARTIR_CONTEXTO` ni `MOVER_CONTEXTO`. Los 15 bounded contexts se sostienen (C1).
- Ninguna contradicción silenciosa con el contrato vivo (C5); 61/61 eventos con hogar (C3); decisiones del Supervisor 7/7 materializadas (C3).
- Los 9 contratos declarados en §5 están bien formados (C2); el grafo soporta la tesis de capacidad (C6).

**Pero NO se abre el loop 2 todavía.** El ciclo afloró dos cosas que la metodología manda cerrar antes:
1. **Bloque B2 (NUEVO_CONTRATO, checkpoint):** E-59 necesita la fila del taller (capa 2) en capa 1 — cruza la división de capas que el Supervisor aprobó. Es la única frontera *nueva* que se agrega, no se re-posiciona nada, pero su resolución (derivación de eventos de frontera vs. lectura mínima de capa 2) es decisión del Supervisor.
2. **Bloque C (3 correcciones estructurales del enforcement):** C4-01 (E-33 camino positivo), C4-02 (E-54 back-edges/granularidad), C4-03 (E-21 estado con nombre). No son parámetros "por definir" — son la máquina de estados del §4 que el loop 2 de schema/UI congela. Si se difieren, se diseña schema sobre una máquina no determinista.

**Recomendación de secuencia:**
- Aplicar **hoy, sin checkpoint** (son documentales, no mueven fronteras): Bloque A (declarar identidad compartida §2), Bloque B menor (filas de §5: B3, B5, B6, B7, B9), C5/C6 (fila E-24 en §4.1, §8 precondiciones).
- Llevar a **checkpoint del Supervisor** (mueven/agregan frontera o requieren decisión de negocio): B2 (fila del taller→E-59), y el Bloque D completo (D1..D8).
- La **corrección P5-09 al mapa** (ya planificada) se suma al mismo checkpoint como loop focalizado.

---

## 4. Estado del ciclo

- Fecha: 2026-08-03
- Ledger: t-042 a t-047 creadas y ejecutadas por subagentes; QA del Orquestador: formato y trazabilidad verificados mecánicamente.
- Verdicto: **CONVERGENCIA ESTABLE EN ESTRUCTURA; ENFORCEMENT PENDIENTE DE 3 CORRECCIONES + CHECKPOINT DEL SUPERVISOR** (B2 + Bloque D).
- Próximo paso: Orquestador aplica Bloque A y B menor al Define; prepara el paquete de checkpoint (B2 + D1..D8 + P5-09) para el Supervisor.

---

## 5. Checkpoint del Supervisor — APROBADO (2026-08-03)

**Todas las decisiones del Bloque B2/C/D y P5-09 fueron respondidas por el Supervisor y aplicadas.** Resumen de lo resuelto (detalle en `diamante2_define_eventos.md` §5/§6/§7/§8 y `log_insights_fase2.md` I-053):

- **B2 (fila del taller):** se diseña de una vez — la fila de salida del taller (avance por módulo) es **capa 1**, input de E-59/E-34; sin pantallas de carpinteros (capa 2 sigue diferida).
- **Bloque C (enforcement):** C4-01 → el adelanto es cambio **sancionado** (clase positiva exenta de reducción de comisiones; el sistema registra el logro y avanza); C4-02 → granularidad **módulo/componente** (un módulo frena el proyecto entero, pero el reproceso se procesa exactamente el requerimiento del módulo/componente) y **rastreo de origen del reproceso** (el culpable asume: proveedor→proveedor, planos→desarrollo, requerimiento→comercial); C4-03 → **`recibido_verificado`** como estado de salida de E-21 (checklist de la lista de compra esperada, tipo + cantidades + sin defectos).
- **Bloque D (negocio):** D1 gate de caja = **bloqueante**, lo resuelve el gerente moviendo cronogramas; el sistema es **guía + registrador de la realidad** (si la guía no se cumple, avanza y registra). D2 rastreo de origen (ver C4-02). D3 verificador único = **el comercial vendedor, punto**. D4 interno/externo = **atributo, no determinante**; el determinante es la composición causal de dependencias. D5 **comercial define todo + desarrollador define en retoma** (E-41). D6 KPIs por subsistema, ninguno residual (ver fila D6). D7 I-014/I-021 → **estrategia de mercado (t-034)**, como log. D8 VACÍOs resueltos: V-1 no-show = reagenda con límite (1 vez, luego `descartado`), V-4 envío = se envía, V-5 horas = registro automático (KPI), V-6 firma = subsistema verificado simple.
- **P5-09 (mapa):** aplicado al mapa (`logica_de_negocio.md`) — cronograma corregido a "aprobación (check de schema) → compras → ensamblaje → instalación", verificador único, KPIs, gate de caja, guía+registrador, rastreo de origen, fila del taller en capa 1, estimación por factores de tamaño (C1) y causa del desfase como atributo vs. determinante (D4).

**Consecuencia:** se **abre el loop 2 de diseño (schema/UI)**. Lo único que queda por definir eran **6 valores numéricos configurables** — **todos resueltos por el Supervisor el 2026-08-03** (ver §6 del Define):

| Parámetro | Valor resuelto |
|---|---|
| Ventana SLA primera respuesta (E-50) | **5 minutos**; si se excede → escalación automática a IA (LLM) con registro; sin LLM → segundo comercial con notificación |
| Consecuencia tras 12 días de atraso (E-29) | Aviso automático al gerente |
| Destino del lead no viable (E-49) | Se pierde del flujo activo; solo se registra el motivo |
| Consecuencia SLA novedad crítica (E-34) | Registro + visibilidad del gerente + escalación automática; sin multa |
| % del carpintero | **5% por tamaño** + comisión por módulo instalado |
| Neto post-impuestos del diseñador | Parámetro configurable ($130k bruto − retención ± IVA); **valor real pendiente de validación con el contador** antes del corte |

- Veredicto final: **DEFINE CONVERGIDO Y APROBADO. LOOP 2 DE DISEÑO ABIERTO. NO QUEDAN DECISIONES DE DISEÑO PENDIENTES.**
