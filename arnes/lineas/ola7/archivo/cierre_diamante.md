# Cierre del diamante — Define (convergencia)

**Qué es esto:** el cierre del primer ciclo del Double Diamond del mapeo sistémico de Hermanos García González S.A.S. (Veta de Oro). Descubre (diverge) en dos rondas de entrevista con Javier, Define (converge) en este documento. **No es el mapa** — `logica_de_negocio.md` no se modifica hasta que el Supervisor apruebe este cierre. Todo lo que hay acá sale de las respuestas reales de la ronda 2 (`segunda_ronda_preguntas.md`) más el mapeo de la ronda 1.

**Método (§2.C + §2.D del arnés):** Event Storming (bounded contexts), Value Stream Mapping (reprocesos = desperdicio), Service Blueprint (momentos de verdad), Teoría de Restricciones (cuello de botella), Balanced Scorecard/Triple Bottom Line (métricas, ya instaladas en la ronda 1). La lectura estratégica de largo plazo (§2.D, abanico ≥5 metodologías) queda registrada como sesión aparte, no se fuerza acá.

---

## 1. La tesis del negocio, destilada en una frase

> **Veta de Oro diseña y fabrica muebles a medida de alto diseño bajo un modelo de socios-por-comisión, donde el schema de proyecto (definidor por excelencia) y el control de cronograma son dos mitades simbióticas: el schema hace el proyecto programado, verificable, versionable y auditable; el control lo gobierna y administra los incentivos. Sin schema no hay evento controlable; sin control el schema no produce resultados.**

**Nota de corrección del Supervisor (no se borra, se deja como registro):** la primera versión de esta tesis lo enunció como "un sistema de control de cronograma que administra incentivos humanos". Javier lo corrigió: el negocio es además **un definidor de proyectos por excelencia** — no es control subordinado a schema ni schema subordinado a control, es una relación sinérgica y simbiótica: no es posible controlar un evento de aprobación de compras si no existe un schema de proyecto **programado, verificable, versionable y auditable**. El dinero sigue siendo la restricción máxima (puede causar "entropía total"), y el cronograma convierte el dinero disponible en plazos comprometidos que la gente cumple porque de ellos depende su paga — pero ese mecanismo solo opera sobre algo definido: el schema del proyecto.

## 2. Principios de diseño que emergen (invariantes — no se negocian en el mapa)

1. **Roles-no-personas, y todos-socios.** No hay línea dura empleado/aliado: los aliados responden a comisiones, por eso son socios (desarrollo 5%, carpintero % por tamaño, dueños estructurales). El sistema modela socios con reglas de compensación, no "empleados" con salario fijo.
2. **El log es la acción, no el reportaje.** Nadie "marca que empezó": sube la orden, marca el domicilio recibido, envía el proyecto a la siguiente etapa. El sistema registra el estado por las acciones mismas. Cero pantallas de "marcar empecé/terminé".
3. **Cronograma inmutable desde el contrato.** Las tareas internas se imprimen una vez y no se modifican espontáneamente. Solo eventos externos mueven el cronograma, y el sistema lo recalcula automáticamente. Si el cronograma se mueve por causa interna, los aliados pierden estímulos; si se mueve por factor externo, los plazos se corren y eso también se mide.
4. **Calendario por rol, no público.** Cada socio ve su línea temporal con lo que tiene que hacer y cómo hacerlo bien. Calendario común solo cuando la tarea lo requiere (desarrollador para carpinteros/instaladores; admin para flujos generales).
5. **Dos capas de sistema, y solo la primera se construye ahora.** Capa 1 = control entre subsistemas (gates de estado, verificación de despacho/recepción en taller). Capa 2 = tareas/procesos en taller + manual de buenas prácticas ISO + pantallas para carpinteros/auxiliares. **La capa 1 es el desbloqueante; la capa 2 se anticipa en el diseño pero no se construye todavía.**
6. **Política financiera: no acumular deuda.** Apenas se cierra un proyecto, el estimativo de costos sale de la caja y se paga por prioridad: materiales, arriendos, nóminas. El gerente siempre sabe cuánto dinero real tiene disponible.
7. **La aprobación es un check de schema, no una reunión.** Hoy es reunión diseñador+desarrollador; el sistema debe permitir la validación por schema y dejar los cambios en el sistema, eliminando la dependencia de la reunión.
8. **El schema de proyecto ES el definidor de proyectos (mitad simbiótica de la tesis).** Sin un schema programado, verificable, versionable y auditable no existe base para ningún control — ni aprobación de compras, ni cronograma, ni auditoría. El schema y el control se diseñan juntos: cada gate controla un schema, cada schema alimenta un gate.

## 3. El modelo de negocio corregido: de "gig para diseñadores" a "socios-por-comisión"

La ronda 1 lo llamó "modelo gig"; la ronda 2 lo corrige: **no es una app de servicios, es un sistema de socios donde la compensación es la moneda de confianza.** Precedente real: agentes inmobiliarios (comisión por cierre + fee por muestra). Ahora con números:

| Rol | Compensación | Momento de pago |
|---|---|---|
| **Diseñador** | $130k por diseño 3D + comisión por cierre | Se define en el diseño del modelo; hoy "no lleva cuenta consigo mismo" — el sistema debe llevarla |
| **Desarrollador** | Desarrollo aparte + mano de obra aparte + **comisión 5% por cumplimiento de cronograma** | **Por quincena, por hitos terminados**; si se desfasa, se resta |
| **Carpintero** | **% por tamaño** del proyecto | Por módulo instalado (con comisión si cumple cronograma) |
| **Auxiliar** | Tiempo (horas + extras) + **comisión por módulo instalado** si cumple cronograma | Por ciclo/hitos |

**Dos decisiones de fondo tomadas en esta ronda:**
- **El diseño 3D sube a $130k y se factura en DIAN** (por eso sube el precio). Pendiente de negocio: **calcular el neto post-impuestos que le queda al destinatario** para que el servicio siga siendo rentable para el diseñador.
- **Idea emergente:** capacitaciones especializadas para el diseño y venta de proyectos (el diseñador como "diseñador libre" con formación propia).

**Riesgo legal sigue vigente** (del modelo gig, no se borra): la clasificación laboral colombiana podría considerar relación laboral real a un socio que trabaja solo para Veta — se mantiene la pregunta abierta para contador/abogado laboral.

## 4. Bounded contexts emergentes (convergencia del Event Storming)

Ajustado con lo nuevo de la ronda 2. El contexto central deja de ser "Producción" y pasa a ser **"Control de cronograma"** — es el pegamento del sistema:

| Bounded context | Qué agrupa | Cambios de la ronda 2 |
|---|---|---|
| **Comercial / Cotizador** | Lead → visita (franjas libres cliente+comercial) → diseño 3D ($130k) → presupuesto → ajustes | + Diseño 3D facturado DIAN; + capacitaciones como extensión del diseñador |
| **Control de cronograma** ⭐ (contexto central emergente) | Cronograma desde el contrato, fechas por etapa, holgura máx 5 días total, recalculo automático por eventos externos, vínculo con nóminas/incentivos | **NUEVO — nace de Q7.** Antes no existía como concepto |
| **Contratos** | Contrato, firma virtual (gap real), hitos de pago ligados a eventos | + 2 ciclos de 15 días como estructura temporal del contrato |
| **Desarrollo** | Retoma de medidas → desarrollo técnico (modelado) → check de schema (aprobación) → BOM de compras | + La aprobación = check de schema, no reunión (Q3) |
| **Compras** | Pedidos, pago por prioridad (materiales→arriendos→nóminas), recepción verificada en taller | + Política "no acumular deuda" (Q19); + control de compras por confianza de socios (Q13) |
| **Taller / Armado (Capa 2, diferida)** | Órdenes de armado, tareas por módulo, manual de buenas prácticas ISO | Se anticipa, NO se construye todavía (Q5/Q6) |
| **Calidad / Verificación** | Verificación pre-despacho (quien verifica ≠ quien construyó), recepción de material | + El desarrollador marca "compras hizo bien el pedido, proveedor bien el despacho, material verificado" y el proyecto pasa a control total del subsistema (Q6) |
| **Entrega / Instalación** | Acta de entrega digital, rango de instalación de 5 días, holgura operativa 12 días | + Rango de fecha de instalación de 5 días en la semana X (Q7) |
| **Garantía** | 2 años, 8-12 días hábiles (contractual), reutiliza ordenes_trabajo | + Tiempo contractual explícito (Q7) |
| **Finanzas / Compensación** | Movimientos, cuentas de cobro, **cuenta y saldo por socio**, comisiones | + Compensación por rol con números (Q15-17); + micro cuentas de cobro (Q12) |
| **Documentación** | Fotos por etapa, Drive VETA_ERP como alojador actual, idea R2 | + Fuente real identificada: `G:\Mi unidad\VETA_ERP` (diagnóstico pendiente) |
| **Integraciones (producción)** | SketchUp + OpenCutList → CVC → Corte Cloud (SivalTriplex preferido); prototipo "Veta Designer" | **NUEVO — nace de Q9-11.** Traducción del schema de proyecto a etiquetas del modelo 3D |

**El hallazgo estructural más importante:** "Producción" ya no es un módulo sobredimensionado — se disuelve en (a) Desarrollo (capa 1, se construye), (b) Control de cronograma (capa 1, se construye), (c) Taller/Armado (capa 2, diferida), (d) Calidad (capa 1, se construye). La pregunta de la ronda 1 ("¿subdividir Producción?") se responde sola: sí, y la subdivisión ya tiene nombres.

## 5. Capacidad instalada real y restricciones (Teoría de Restricciones)

Con números de la ronda 2 (Q17/Q20/Q21):

| Recurso | Capacidad | Restricción real |
|---|---|---|
| **Producción** (2.5 personas: desarrollador + carpintero + auxiliar ocasional) | **1.25 proyectos/semana**, sábado libre | No hay restricción de capacidad declarada — el cuello está en el dinero |
| **Comercial** (2 personas) | **1.25 proyectos/mes** | **Leads cualificados** — no es capacidad de diseño, es falta de leads |
| **Diseñador** | **3 visitas + 3 diseños + 3 presupuestos/semana** | Ninguna con el volumen actual |

**La cadena de restricciones (en orden de severidad):**
1. **Dinero disponible** — el condicionante máximo, puede causar "entropía total" (Q7). No es una fase, es la restricción que gobierna compras y por lo tanto el cronograma.
2. **Leads cualificados** — limita a Comercial a 1.25 proy/mes, muy por debajo de la capacidad de producción (que haría ~5 proy/mes). **El cuello de botella del negocio hoy es la demanda, no la fábrica.**
3. **Cronograma** — el mecanismo de control; si no existe, cada proyecto se entrega "cuando se pueda" (hoy 6.5 semanas reales).

**Métrica clave que emerge:** proyecto promedio = **2 ciclos de 15 días** (desarrollo+compras / ensamblaje+instalación) → 30 días ≈ **4 semanas ideal**. Hoy tarda 6.5 semanas. El tamaño del proyecto se mide por **valor + cantidad de ítems/módulos** (para estimar crecimiento porcentual de los tiempos).

## 6. El modelo temporal (la pieza nueva que gobierna todo)

De Q7, destilado como reglas del sistema:

- El **cronograma nace en el contrato** con las fechas de cada etapa: compras → aprobación → 1 semana de ensamblaje → 1 semana de instalación.
- Al cliente se le da un **rango de fecha de instalación de 5 días** en la semana programada.
- **Holgura total: máximo 5 días** entre todas las fases. Cada fase puede correrse un par de días, pero la suma no pasa de 5.
- **Inmutabilidad:** las tareas internas se imprimen una vez; no se modifican espontáneamente. Solo eventos externos (cliente, proveedor, dinero) mueven el cronograma, y el sistema lo recalcula automáticamente.
- **Incentivo:** de este control dependen las nóminas/comisiones. Cambio por causa interna → aliados pierden estímulos. Cambio por factor externo → los plazos se corren y se mide a los empleados contra los nuevos plazos.

**Implicación de diseño:** el sistema necesita un reloj de eventos por proyecto que (a) fije el cronograma en el contrato, (b) registre cada cambio como "interno vs. externo", (c) recalcule fechas automáticamente, (d) alimente el cálculo de comisiones. Es un motor pequeño, explícito, y es la capa 1 que sí se construye.

## 7. Momentos de verdad del cliente (Service Blueprint — confirmado, no cambia)

La ronda 1 ya los identificó; la ronda 2 no los contradice, agrega precisión de tiempos:
- Primer contacto (WhatsApp) — probable momento de verdad.
- Recibe presupuesto/diseño 3D ($130k, ahora facturado) — la primera vez que "ve" su proyecto.
- Firma del contrato — se fija el cronograma; el compromiso se vuelve real.
- Retoma de medidas — confirma que avanza en serio.
- **Entrega/instalación (rango de 5 días)** — el momento de verdad más grande.
- Garantía (8-12 días hábiles) — momento de riesgo para la confianza.

## 8. Decisiones tomadas en este cierre

1. Valor del diseño 3D: **$130k**, facturado en DIAN (corrige el $100k del mapa).
2. Modelo de personas: **todos-socios**, compensación por rol con comisiones atadas al cronograma.
3. Estructura del sistema: **dos capas** — capa 1 (control entre subsistemas) ahora, capa 2 (taller/ISO) diferida pero anticipada.
4. El **cronograma inmutable** es la columna vertebral del diseño.
5. El log es **la acción misma**, no reportaje.
6. Aprobación pre-compras = **check de schema** (eliminar la reunión).
7. Política financiera: **no acumular deuda**, pagar por prioridad.

## 9. Lo que falta (no bloquea el cierre, pero es trabajo abierto)

- **Calcular el neto post-impuestos del diseñador** ($130k bruto → neto) para validar la rentabilidad del servicio de "diseñador libre".
- **Diagnosticar `G:\Mi unidad\VETA_ERP`** — estructura real de carpetas del flow de proyecto (alojador actual de la documentación gráfica).
- **Diseñar el modelo de micro cuentas de cobro / micro contratos** con permiso de uso de firma autogenerada (Q12).
- **Definir el % del carpintero "por tamaño"** — no tiene número todavía.
- **Sesión estratégica §2.D aparte** (≥5 metodologías: DOFA, Five Forces, JTBD, Blue Ocean, Golden Circle) — hacia dónde conduce el mercado, oportunidades de la capacidad instalada, capacitaciones como línea de negocio.

## 10. Próximo paso (cuando el Supervisor apruebe este cierre)

1. **Modificar `logica_de_negocio.md`** (Parte I) con todo lo destilado acá:
   - Corregir $100k → $130k + facturación DIAN.
   - Renombrar "modelo gig" → "socios-por-comisión" con la tabla de compensación.
   - Agregar el contexto central **Control de cronograma** (Q7) con sus reglas.
   - Resolver el hallazgo B (subdivisión de Producción): Desarrollo / Control de cronograma / Taller (diferido) / Calidad.
   - Agregar secciones de Integraciones (SketchUp/OpenCutList/CVC/Corte Cloud) y Documentación (Drive VETA_ERP).
   - Agregar la política financiera "no acumular deuda" a la narrativa de Compras.
2. Después de integrar, decidir qué módulos entran a diseño de schema/UI (candidatos: Control de cronograma, Desarrollo capa 1, Calidad, Finanzas/Compensación).

---

## Registro

- Fecha: 2026-08-03
- Fuente: ronda 1 (`logica_de_negocio.md`) + ronda 2 (`segunda_ronda_preguntas.md`, todas las preguntas respondidas).
- Método: Double Diamond — Discover (2 rondas) → Define (este documento) → en espera de aprobación del Supervisor antes de converger en el mapa.
