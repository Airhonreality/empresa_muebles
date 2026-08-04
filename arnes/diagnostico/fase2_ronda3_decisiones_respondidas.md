# Fase 2, Ronda 3 — Decisiones respondidas (2026-08-04)

**Supervisor:** Javier (Hermanos García González S.A.S)  
**Fecha:** 2026-08-04  
**Contexto:** Las 16 decisiones pendientes del Diamante 3 (Fase B, schema y UI) fueron respondidas por el Supervisor. Este documento sistematiza cada respuesta, clasifica el estado de la decisión y documenta mini-diamantes que abren.

---

## Resumen ejecutivo

- **Decisiones cerradas (sí/no/valor definido):** 9
- **Decisiones que abren mini-diamante (requieren metodología):** 5
- **Decisiones que necesitan aclaración/refinamiento:** 2

**Próxima acción:** abrir fase de Define sobre estos hallazgos. Las metodologías pendientes no bloquean el corte final pero sí determinan la arquitectura del Execute (Fase 3).

---

## DECISIONES CERRADAS (aprobadas por el Supervisor)

### D-01: Modelos de roles — preferencia por tipado + herencia de permisos

**Decisión:** Roles tipados (compras, contador, comercial, etc.) asignados explícitamente a personas. Cada persona puede tener múltiples roles; permisos se heredan por acumulación (gerente = gerente + comercial + [compras], etc.). El rol de gerente absorbe todas las operaciones de gestión.

**Status en Diamante 3:** DP-02 (UI y schema) — **CERRADA**

**Fuente:** Respuesta Supervisor a P1 y P9 (rol compras tipado): *"entre más roles dedicados mejor escalabilidad... el gerente se le asigna rol gerente + rol dedicado compras. Así si las personas cambian, a la persona que ocupe el cargo se le asigna rol y compras."*

**Implicaciones técnicas:**
- Tabla `roles` tipados: 8 + 1 (contador) = 9 roles en `parametros.roles` (ya definido en schema)
- Tabla `personas_roles` para N:N (ya en schema sch_c:107)
- Deprecación de `usuarios.rolEmpleado` en Fase 4 (DP-03, tratada separadamente)
- Matriz roles×pantallas coherente validada en B5

**Anotación para código:** Permisos NO son sumas. Son predicados por rol tipado + contexto (ej. comercial ve solo sus leads). Ver matriz de B5 en `d3_ui_consolidado.md:§Reglas transversales`.

---

### D-02: Onboarding de empleados — HR diseña, empleado registra

**Decisión:** El gerente (con rol HR) genera un enlace de registro con el rol previa asignación. El empleado recibe el enlace, rellena datos personales (email, teléfono, nombre) y crea password. El rol le fue controlado por el empleador en la generación del enlace.

**Status en Diamante 3:** Derivado de P2 (login contador) — **CERRADA**

**Fuente:** Respuesta Supervisor a P2: *"no es que ellos escogen que rol van a ocupar más bien el gerente con rol de recursos humanos crea el enlace de registro con el rol asignado y envia para que el empleado rellene sus datos personales y cree password, el empleado realiza la tarea de registro pero el rol empleador le controla su ingreso al sistema."*

**Implicaciones técnicas:**
- Flow `POST /api/erp/equipo` (t-018 ya existe): gerente crea empleado + genera token temporal + envía enlace
- Flow `/app/register/[token]`: empleado llena datos, crea password. Token valida rol preaprobado.
- No hay un flow de "elección de rol por empleado" (nunca ocurre)
- Session.ts se valida el rol contra `personas_roles`, no `usuarios.rolEmpleado` en Fase 4+

**Pendiente:** Revisar t-018 para confirmar que genera token temporal (está en `esperando_humano`).

---

### D-03: Compensación — 5 parámetros explícitos

**Decisión:** Los parámetros se definen por el Supervisor con valores concretos. El sistema los lee de `parametros` y calcula compensaciones sobre ellos, sin hardcoding.

**Status en Diamante 3:** DP-01 (UI y schema) — **CERRADA (valores iniciales definidos)**

**Fuente:** Respuesta Supervisor a P7 y P8:
- `comision_cierre_comercial`: 5% sobre valor total del proyecto
- `comision_modulo_instalado`: 5% sobre valor del módulo
- `tarifa_hora_carpintero`: 15.000 COP
- `tarifa_hora_auxiliar`: 6.500 COP
- `quincena_desarrollador`: se calcula sobre horas trabajadas (no hardcoded en 1 o 2)

**Anotación:** "Parametros estimados luego se configuran bien en el sistema" (Supervisor). Implica que estos valores son "v1 de trabajo" y se afinará post-lanzamiento vía UI de parámetros (P-22 en consolidado UI).

**Implicaciones técnicas:**
- Tabla `parametros` contiene estas 5 claves + 5 más resueltas en D-04/D-05
- E-35 (cálculo de comisión) lee de `parametros` en tiempo de ejecución
- No hay valores hardcodeados en código de cálculo
- UI de parametrización (panel de admin) es parte de P-20/P-22 (finanzas)

---

### D-04: Comisiones — lógica diferenciada por tipo de trabajo

**Decisión:** 
- Comisión comercial: 5% sobre ventas (por cierre de venta), sin descuento por desfase del cronograma (el desfase afecta al equipo de producción, no al comercial)
- Comisión carpintero: 5% sobre valor del módulo instalado (por tamaño)
- Comisión desarrollador: variable por espacio (65k–250k COP por espacio según tipo/tamaño)
- Reducción por desfase: 0.5% por cada día de retraso hasta máx 5 días (carpintero). Tras 5 días = pérdida total de comisión.
- Diseño 3D: bruto $130.000 + IVA. Neto = configurable, validar con contador

**Status en Diamante 3:** Derivado de P7, P8 y respuestas de finanzas — **CERRADA (estructura definida, algunos valores pendiente contador)**

**Fuente:** Respuesta Supervisor a P7-P8:
- *"comicion cierre comercial 5% total sobre todo el proyecto"*
- *"modulo instalado 5% sobre el valor del modulo"*
- *"pago por desarrollo oscila entre 65 x espacio... closet estandar 65mil, cocina pequeña 100mil..."*
- *"comicion reduce 0.5% por cada dia de retraso en cronograma... si se retrasa 10 dias pierde total comision, y factor negativo cuando se retrasa mas del tiempo exitra..."*

**Implicaciones técnicas:**
- E-35 (compensación del mes) calcula 3 conceptos (cierre, módulo, desarrollo) con lógicas independientes
- Tabla `parametros` contiene factores % y bases
- Tabla de tarifas por espacio → integración con cotizador
- Validación con contador: neto diseñador ($130k − retención − IVA)
- P-22 (compensación) mostrar desglose de cada componente

---

### D-05: Pedidos públicos — cuenta obligatoria

**Decisión:** El checkout de tienda (F-06) exige login/registro previo. No hay "compra como anónimo" (guest checkout).

**Status en Diamante 3:** H12 (UI) — **CERRADA**

**Fuente:** Respuesta Supervisor a P4: *"si hago un pedido sin cuenta que confianza voy a tener en la empresa... otra cosa es un agendamiento de proyecto personalizado donde todos son anonimos... es distinto."* Y: *"todas las tiendas virtuales de todo el mundo funcionan con cuenta no conozco ninguna que realice despachos sin cuenta que yo sepa."*

**Implicaciones técnicas:**
- F-06 (checkout frontera DIFERIDO) exige `requireCliente()` en servidor
- `clienteId` siempre de sesión, nunca nullable en `pedidos_web`
- Flujo: cliente no autenticado → redirect `/cuenta/registro` → post-registro → vuelve a `/tienda/checkout`
- Control de acceso verificado en t-015 (ya existe, esperando checkpoint)

**Nota:** No afecta a `F-01` (lead captura anónima en landing).

---

### D-06: Base de comisión del carpintero — subtotal SIN IVA

**Decisión:** El 5% de comisión "por tamaño" del carpintero se calcula sobre el **subtotal sin IVA** del proyecto/módulo, no sobre el valor total con IVA.

**Status en Diamante 3:** DP-06 (UI y schema) — **CERRADA**

**Fuente:** Respuesta Supervisor a P5: *"sobre el sub total sin iva claramente."*

**Implicaciones técnicas:**
- Parámetro `base_comision_tamano` = `'subtotal_con_iva'` (NO, será 'subtotal_sin_iva')
- E-35 lee `proyectos.valor_subtotal` (o columna equivalente) en lugar de `valor_total`
- Cotizador debe exponer ambos valores (subtotal + IVA + total) para cálculo correcto

---

### D-07: Alojador de documentos — Google Drive como repositorio vivo, R2 como soporte

**Decisión:** 
- **Drive:** mantiene SKP originales (modelos SketchUp de desarrollo) + sincronización local en equipos
- **Sistema:** pedidos de herrajes (que hoy están en Excel) → pantalla P-26 con datos de sistema + gates
- **R2:** usado para imágenes/PDFs (planos exportados, fotos de módulos) asociadas a espacios dentro de P-26
- **Simplificación:** reduce archivos de proyecto (pedidos, planos) a datos estructurados en pantalla; Drive queda como repositorio técnico de diseño (SKP)

**Status en Diamante 3:** DP-09 (UI y schema) — **CERRADA**

**Fuente:** Respuesta Supervisor a P6: 
- *"se suben a google la ventja es app google desktop permite sincronizacion entre equipos"*
- *"si agregamos r2 tendiramos paso extra, subir modelado 3 a sistema, pierde comodidad"*
- *"el desarrollador generalmente pasa el skp a un layout exporta como pdf, podria modificarse a exportar como jgps separados y subir imagenes a cada espacio / modulo del sistema completando el ciclo total y relegando drive a skp y sdk mobiliario."*

**Implicaciones técnicas:**
- P-26 (documentación): datos estructurados (pedidos, especificación de herrajes) + galería de imágenes (PDFs/JPG subidos a R2)
- R2 integración: `POST /api/erp/proyectos/[id]/documentacion/upload` + validación de tipo de archivo
- Drive URL se guarda como referencia (no se gestiona desde el sistema)
- Plan: `documentos_proyecto.url_skp` (referencia a Drive), `documentos_proyecto.url_imagen_r2` (imagen en R2)

---

### D-08: Parámetros legales/marca — editables desde ERP

**Decisión:** NAP (nombre, dirección, teléfono), NIT, razón social, horario viven en `parametros` y son editables por admin desde P-20/P-22 (panel de parámetros). No son hardcodeados en config de sitio público.

**Status en Diamante 3:** DP-09 (schema) — **CERRADA**

**Fuente:** Respuesta Supervisor a P16: *"editable en el erp desde el logo en adelante requiere loop de parametrizacion general para de una vez crear un panel robusto."*

**Implicaciones técnicas:**
- Tabla `parametros` contiene 6 nuevas claves: `empresa_nombre`, `empresa_nit`, `empresa_razon_social`, `empresa_direccion`, `empresa_telefono`, `empresa_horario`
- `lib/seo/jsonld.ts` lee de `parametros` en runtime (no es datos estáticos en el build)
- API `GET /api/parametros` publica valores (sin escribir)
- Panel de admin en P-20/P-22 permite editar

---

### D-09: Rol compras — decisión técnica diferida, especificación UI clara

**Decisión:** De P1/P9 (rol compras): sí, es un rol tipado. El gerente + rol compras. Pero la **especificación completa de cuáles son exactamente los permisos del rol compras** (ej. "¿puede crear OC sin pasar por el gatekeep del desarrollo?") se define en el loop 2 de implement, no en el Define.

**Status en Diamante 3:** DP-02 (UI y schema) — **CERRADA (rol existe en tablas, permisos detallados → Fase 3)**

**Fuente:** Respuesta Supervisor a P1: *"pensaria que entre mas roles dedicados mejor escalabilidad, al gernete se le asigna ru rol de gerente + rol dedicado compras, x, y, z. asi si las personas cambian, a la persona que ocupe el cargo se le asgina rol y, + compras."*

**Implicaciones técnicas:**
- Tabla `roles` incluye rol `compras` (ya en schema)
- P-13 (pantalla Compras) muestra guardias de permisos por rol
- Detalle de "¿quién puede hacer qué en Compras?" se resuelve al codificar P-13 (Fase 3) según matriz de roles×pantallas de B5

---

## DECISIONES QUE ABREN MINI-DIAMANTE (requieren metodología)

### M-01: Determinismo de composición causal (DP-04, schema)

**Pregunta abierta:** E-33 (cronograma) exige `composicion_causal jsonb > 0`, pero no valida que el contenido sea **verdadero** — solo que **existe**. El sistema registra lo que el usuario declare sin auditar contra la realidad.

**Respuesta Supervisor a P11:** *"necesito una metodologia para desarrollar ese determinimso con jsutificacion humana natural."*

**Qué se necesita:**
1. Metodología para **derivar causa real** de un desfase (vs. declaración del usuario)
2. Protocolo de validación automática contra datos (ej. si la causa es "material llegó tarde", validar contra fecha de recepción en `recepcion`)
3. Definir grados de certidumbre (auditable/humano-verificado/derivado-automático)

**Impacto técnico:** Afecta el gate E-33 en P-09 (pantalla Cronograma). Determinismo actual = "existe causa" (débil); meta = "causa justificada" (fuerte).

**Bloqueante:** NO. E-33 funciona hoy con verificación humana (comercial/gerente declara, se registra). La metodología mejora confiabilidad pero no bloquea el corte.

**Responsable de investigación:** Orquestador (metodología de auditoría causal). Requiere mini-loop con Supervisor.

---

### M-02: Metodología de grafos para catálogo (DP-05, schema)

**Pregunta abierta:** Hoy `productos_catalogo` mezcla insumos (tableros, herrajes, tornillos) y productos terminados (mueble X). El Supervisor sugiere: *"necesita metodlogia de grafos, pensaria la subdicion relacional tabla de costos proveedores productos colores y acabados catalogo de productos y servicios - catalogo de herrajes..."*

**Respuesta Supervisor a P12:** *"necesita metodogia de grafos, pensaria la subdicion relacional..."* y más específicamente sobre la entidad: *"mi teoria es que entre hay que componer entidades simples relacionadas a grafos necesito metodogica doctoral 2027."*

**Qué se necesita:**
1. Modelo de composición: `producto = composición(insumos, servicios, mano de obra)` como grafo dirigido
2. Separación clara: insumos → costean; productos terminados → se venden
3. Cadena de costeo: insumo → componente (ej. "puerta con 3 bisagras") → módulo (ej. "closet estándar") → proyecto
4. Algoritmo de cascada de precios y cantidades (BOM → OC → factura)

**Impacto técnico:** Afecta cotizador (P-04) y compras (P-13). Hoy usa `espacio_variantes` + `items_variante`; ese modelo necesita extensión explícita para grafo de composición.

**Bloqueante:** NO. El cotizador funciona hoy sin este modelo (elige espacios preset). La metodología habilita flexibilidad (cotización por medida) pero no es condición para el corte.

**Responsable de investigación:** Orquestador (diseño de grafo relacional). Requiere mini-loop y posible sesión de arquitecto con Supervisor.

---

### M-03: Profundización en grafo de composición de proyecto (DP-06 derivado, schema)

**Pregunta abierta:** El Supervisor señala que los parámetros no se deben "parametrizar con valores sueltos" (DP-01 cerrada da valores iniciales). En su lugar: *"necesita metologia ya se sabe que no es correcto parametricar esto con valores sueltos, lo mejor es profundizar en el grafo de compoccion de proyecto para derivar un monton de parametros que afectan otros gates."*

**Respuesta Supervisor a P13:** *"necesita metodlogia ya se sabe que no es correcto parametricar esto con valores sueltos, lo mejor es profundizar en el grafo de compoccion de proyecto para derivar un monton de parametros que afectan otros gates."*

**Qué se necesita:**
1. Análisis de **factores que afectan comisiones**: tamaño (m² o # módulos?), complejidad (estándar vs. custom), tiempo (urgencia?), composición (solo muebles vs. instalación eléctrica?)
2. Derivación automática de tarifa/comisión desde factores, no lookup manual de parámetro
3. Auditoría de consistencia: si cambia `comision_modulo_instalado`, ¿qué otras comisiones/costos se afectan?

**Impacto técnico:** E-35 (compensación) lee hoy de parámetros fijos. Con grafo: `E35(p) = función(p.espacios, p.módulos, p.duración, p.complejidad_schema)` → más presición, menos variancia de parámetro.

**Bloqueante:** NO. E-35 funciona con parámetros fijos (D-03/D-04 las definen iniciales). El grafo mejora presición pero la versión v1 no lo exige.

**Responsable de investigación:** Orquestador + Supervisor (sesión de análisis de factores). Requiere mini-loop.

---

### M-04: Logging como subsistema de KPIs (DP-07, schema)

**Pregunta abierta:** Hoy `eventos` es append-only puro auditoría. El Supervisor pregunta: *"logs robustos porque son los que permiten el gate de infleuncias externas funcione entre otros gates, por eso el log es el que nos permite trazarlo todo y debe ser todo un sub sistema dedicado en generacion de kapis(necesita metologia)."*

**Respuesta Supervisor a P14:** *"logs robustos porque son los que permiten el gate de infleuncias externas funcione entre otros gates... debe ser todo un sub sistema dedicado en generacion de kapis(necesita metologia)."*

**Qué se necesita:**
1. Diseño de tabla `eventos` como **infraestructura de observabilidad**, no solo auditoría
2. Derivación automática de KPIs desde `eventos`: "cuántas órdenes compra por canal", "tiempo promedio recepción", "tasa de desfase >5d"
3. Protocolo de agregación: eventos raw → resúmenes periódicos (hora/día/mes) con materialización
4. Definición de señales de alerta: qué eventos disparan escalación (ej. desfase > 5d → notificar gerente)

**Impacto técnico:** `eventos` ya existe en schema. La metodología definiría columnas adicionales (ej. `evento_tipo` de enum determinista, `payload` extendida), vistas materializadas para KPIs, alertas automáticas.

**Bloqueante:** NO. El auditar base funciona sin esto. Es precondición para "Gobierno/Medición" (P-32, DIFERIDO t-034).

**Responsable de investigación:** Orquestador (arquitectura de logging). Requiere mini-loop con Supervisor y data team si existe.

---

### M-05: Modularización y costos de procesos de carpintería (derivado de P7-P8, finanzas)

**Pregunta abierta:** El Supervisor describe el modelo ideal: *"el modelo real final ideal, si logramos definir la lista de modularizacion de procesos y costearla hoy podriamos arrancar bien desde el incio (requiere metodlogica de abstraccion de modulos + tasacion del costo..."*

**Respuesta Supervisor a P8 (derivado):** *"se debe diseñar para continuar asi, pero el sistema debe estar preparado para definir modulos y sub modulos tan precisos que se pueda costear un contratar por servicio (armado de cajon, postura de bisagra, postura de manija, armado de estructura modular, instalacion de fachada, instalacion de luz led, asi cada proyecto iria hiper costeado..."*

**Qué se necesita:**
1. Inventario de procesos elementales: "armado de cajón", "instalación de bisagra", "postura de herraje", etc.
2. Estimación de tiempo para cada proceso + costo (tiempo × tarifa hora)
3. Composición de módulos como suma de procesos elementales
4. Definición de SLA por proceso (ej. "armado de cajón ≤ 30 min")
5. Alternativa: costo por servicio (vs. tiempo actual) — cambio de modelo de compensación

**Impacto técnico:** Afecta:
- Tabla `tareas_produccion` (capa 2, DIFERIDO)
- Estimación de duración (E-52)
- Cotizador (P-04): debería mostrar breakdown por proceso
- Compensación (P-22): si pasa a "costo por servicio", E-35 se reescribe

**Bloqueante:** NO. El sistema funciona hoy con tarifa hora fija (D-03). La modularización habilita flexibilidad y mayor precisión, pero es post-corte.

**Responsable de investigación:** Supervisor + Gerente de producción (si existe). Requiere sesión de análisis de procesos.

---

## DECISIONES QUE NECESITAN ACLARACIÓN

### A-01: Parámetros críticos — umbral_novedad_check15 y otros

**Pregunta:** P7 del Supervisor menciona *"umbral_novedad_check15 no se que significa, falta valor"*. Hay varios parámetros que el Supervisor describe en descripción pero no especifica valor numérico.

**Parámetros pendientes valor:**
- `umbral_novedad_check15`: ¿Qué desfase (en días? horas?) dispara el check de 15 días (E-59)?
- `recargo_hora_extra_pct`: Revisar % legal en Colombia, aplicar
- Retención diseñador `neto_diseno_3d_pct`: Validar con contador ($130k − retención − IVA)
- `iva_diseno_3d_pct`: Validar con contador

**Fuente:** Respuesta Supervisor a P7-P8: *"umbral_novedad_check15 no se que significa, falta valor"* e *"otros parametros como retenciones y eso ponle un estimado no son bloqueantes porque la UI debe permitir precisamente parametrizarlos no hardcode."*

**Status:** **PENDIENTE ACLARACIÓN** — no bloquea el corte (UI de parametrización existe en P-22), pero sí requiere conversación breve para definir valores iniciales.

**Próxima acción:** Conversa breve Supervisor+Orquestador (15 min) para definir:
1. Unidad de `umbral_novedad_check15` (días, horas, %)
2. % legal para recargo hora extra en Colombia (revisar Ministerio de Trabajo)
3. Valores iniciales de retención y IVA (o rango si es flexible)

---

### A-02: Migración vs. levantamiento de 0 — decisión arquitectónica pendiente

**Pregunta:** P10 abre una pregunta meta: *"que crees mejor migrar codigo, o levantar de 0, usa metodlogia dev senior 2027 agentiva con ingenieria de grafos"*. Y: *"si el cotizador mejora y define mejor los modulos el cotizador viejo sera obsoleto, solo hay que garantizar una forma de migracion de datos ajustados a los neuvos schemas no rollo."*

**Respuesta Supervisor:** La pregunta NO es "¿puedo reutilizar código viejo?" sino "¿cuál es la arquitectura de implementación?". La respuesta implícita es: **levantamiento de 0** (como ya se está haciendo en `dev`), con **plan de migración de datos** (CC-01..CC-10 en `d3_schema_a2_4_contrato_vivo.md`).

**Status:** **CERRADA (implícitamente)**. No se reutiliza código del legacy Agnostic. Se construye nuevo con Next.js/Drizzle. Los datos se migran ajustados a nuevo schema.

**Nota:** El cotizador viejo se descarta; si hay versión nueva mejor, se usa. Plan de migración en 4 fases ya está en consolidado.

---

## Mini-diamantes resumidos para la Fase 3

| Mini-diamante | Metodología | Requiere | Bloqueante | Responsable | Plazo sugerido |
|---|---|---|---|---|---|
| M-01 Causalidad | Auditoría de composición causal automática | Mini-loop Define | NO | Orquestador | Pre-Execute (2-3 sesiones) |
| M-02 Grafos catálogo | Modelo de composición insumo→producto→proyecto | Sesión de arquitecto | NO | Orquestador + Supervisor | Pre-Execute (1 sesión) |
| M-03 Grafo composición | Derivación de parámetros desde factores de proyecto | Análisis de factores | NO | Supervisor + Orquestador | Ciclo 1 post-lanzamiento |
| M-04 Logging como KPIs | Diseño de `eventos` como infraestructura de observabilidad | Sesión de arquitecto | NO | Orquestador | Pre-Gobierno (t-034) |
| M-05 Modularización carpintería | Inventario y costo de procesos elementales | Entrevista producción | NO | Supervisor + Gerente producción | Ciclo 2 post-lanzamiento |

---

## Consolidación de parámetros — tabla final

**Estado de todos los parámetros de negocio (26 core + 6 marca):**

| Parámetro | Tipo | Valor | Fuente | Status |
|---|---|---|---|---|
| `comision_cierre_pct` | float | 5% | D-04 | ✅ |
| `comision_modulo_instalado_pct` | float | 5% | D-04 | ✅ |
| `tarifa_hora_carpintero_cop` | int | 15.000 | D-03 | ✅ |
| `tarifa_hora_auxiliar_cop` | int | 6.500 | D-03 | ✅ |
| `quincena_desarrollador` | enum | "sobre_horas" | D-03 | ✅ |
| `base_comision_tamano` | enum | "subtotal_sin_iva" | D-06 | ✅ |
| `reduccion_comision_retraso_dia_pct` | float | 0.5% | D-04 | ✅ |
| `retraso_max_sin_comision_dias` | int | 5 | D-04 | ✅ |
| `bruto_diseno_3d_cop` | int | 130.000 | D-04 | ✅ |
| `neto_diseno_3d_pct` | float | — | A-01 | ⏳ Validar contador |
| `iva_diseno_3d_pct` | float | — | A-01 | ⏳ Validar contador |
| `recargo_hora_extra_pct` | float | — | A-01 | ⏳ Revisar legal CO |
| `umbral_novedad_check15_dias` | int | — | A-01 | ⏳ Aclarar con Supervisor |
| `sla_primera_respuesta_min` | int | 5 | D-04 ref | ✅ |
| `sla_novedad_critica_min` | int | derivado | estado.md | ✅ |
| `sla_novedad_critica_max_h` | int | 24 | estado.md | ✅ |
| `holgura_cronograma_max_dias` | int | 5 | estado.md | ✅ |
| `promesa_proyecto_semanas` | int | 7 | estado.md | ✅ |
| `base_cronograma_semanas` | int | 4 | estado.md | ✅ |
| `empresa_nombre` | string | — | D-08 | ⏳ Input Supervisor |
| `empresa_nit` | string | — | D-08 | ⏳ Input Supervisor |
| `empresa_razon_social` | string | — | D-08 | ⏳ Input Supervisor |
| `empresa_direccion` | string | — | D-08 | ⏳ Input Supervisor |
| `empresa_telefono` | string | — | D-08 | ⏳ Input Supervisor |
| `empresa_horario` | string | — | D-08 | ⏳ Input Supervisor |

---

## Próxima acción

1. **Checkpoint de Orquestador:** Este documento sistematiza las respuestas. El Supervisor revisa y confirma que las 9 decisiones están bien resumidas.
2. **Mini-diamantes:** Las 5 metodologías se abordan en sesiones separadas (no bloquean el corte), prioridad = M-01 > M-04 > M-02 > M-03 > M-05.
3. **Aclaraciones (A-01, A-02):** Conversa breve para completar parámetros faltantes.
4. **Apertura de fase Define:** Una vez aprobado este documento, se abre la fase de codificación (Ola 7 + Fase 3 Execute).

---

**Registro:** 2026-08-04 · Orquestador · Fase 2 Ronda 3 cierre
