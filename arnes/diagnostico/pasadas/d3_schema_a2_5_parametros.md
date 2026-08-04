# Pase A2-5 — Parámetros configurables del schema consolidado (subagente, loop de 3 iteraciones)

**Lente:** parámetros configurables del ERP — todos los valores que el negocio ajusta sin tocar código (SLA, porcentajes de comisión, retención/IVA, días de aviso, promesas de cronograma, datos de marca/legal), con valores por defecto RESUELTOS vs DECISION_PENDIENTE.
**Rol:** sub-agente A2-5 del Diamante 3 (grafo Schema→UI, `pasadas/diamante3_metodologia.md:37`).
**Alcance:** unificar las propuestas divergentes `parametros` (A1-2) y `parametros_compensacion` (A1-4) en un subsistema convergido, con inventario, versionado/auditoría y política de efecto en tiempo real.

**⚠️ ADVERTENCIA DE FUENTE (bloqueante parcial):** la fuente PRIMARIA del pase — `d3_schema_a2_1_normalizacion.md` (schema consolidado) — **NO EXISTE todavía** (2026-08-04; el directorio `pasadas/` contiene A1-1..A1-5 y B1-1..B1-3, más los pases de define). Este pase se ejecutó contra las pasadas A1 divergentes (A1-2 enforcement, A1-4 dinero, A1-5 datos) y `lib/db/schema.ts` existente. La convergencia con el consolidado real de A2-1 queda marcada como hallazgo P-01 y dependencia para el Orquestador.

**Referencias cortas usadas en la traza:** `define` = `arnes/diagnostico/diamante2_define_eventos.md` · `log` = `arnes/diagnostico/log_insights_fase2.md` · `a1-2` = `arnes/diagnostico/pasadas/d3_schema_a1_2_enforcement.md` · `a1-4` = `arnes/diagnostico/pasadas/d3_schema_a1_4_dinero.md` · `a1-5` = `arnes/diagnostico/pasadas/d3_schema_a1_5_datos.md` · `schema` = `lib/db/schema.ts` · `metodo` = `arnes/diagnostico/pasadas/diamante3_metodologia.md`.

---

## Iteración 1 (bruta)

**Barrido crudo, sin filtro, de todo lo que el negocio ajusta sin tocar código:**

1. **Dos propuestas de tabla de parámetros compiten en A1 (la divergencia que A2 debe converger):**
   - A1-2 (enforcement): tabla `parametros` [nuevo], clave/valor tipado, seed con 11 claves (SLA 5 min, novedad crítica 5/24 h, holgura cobro 12 días, holgura cronograma 5, rango instalación 5, promesa 7 semanas, reagenda 1, comisiones 5/5, diseño 3D $130k, retención PENDIENTE, reducción causa interna PENDIENTE, umbral check15 PENDIENTE, `llm_disponible`) (`a1-2:172-189`). El `parametro('clave')` es la API de los predicados de gates (`a1-2:71,95,165,168`).
   - A1-4 (dinero): tabla `parametros_compensacion` con `clave, valor_numeric numeric(14,2), unidad, descripcion, vigente_desde, updated_at` y seed de 9 claves financieras (comisiones, bruto diseño, retención, IVA, cierre, módulo, tarifa hora, quincena) (`a1-4:67-98`). A1-4 declara explícitamente que los parámetros no financieros (SLA, días de atraso) "son del lente de enforcement, no de dinero — acá solo los financieros" (`a1-4:98`).
   - **Superposición confirmada:** `comision_desarrollador_pct`=5, `comision_carpintero_pct`=5, `diseno3d_bruto`=$130k, `retencion_disenador_pct` (PENDIENTE) existen en AMBAS semillas (`a1-2:183-186`; `a1-4:87-90`).

2. **Valores RESUELTOS del Define §6/§7 y del Registro (`define:128-145,178,196-197`; `log:69` I-054):** SLA primera respuesta **5 min**; atraso **12 días** → aviso gerente; lead no viable → se pierde, solo se registra; SLA novedad crítica → registro + visibilidad + escalación, **sin multa**; % carpintero **5% por tamaño** + módulo instalado; neto diseñador = **parámetro configurable** ($130k − retención ± IVA), retención real pendiente con el contador. + KPI 4 semanas → 5% dev+carpintero (`define:178`); promesa 7 semanas (`define:17`; `log:39`); instalación rango 5 días (`define:43`); garantía 8-12 días (`define:44`); reagenda 1 vez (`define:140`); comisión comercial por ventas (`define:22`).

3. **Valores ya materializados en `schema.ts` (que un subsistema de parámetros debe reconocer):** `proyectos.aplica_iva` + `proyectos.porcentaje_iva` numeric(5,2) default '19' (`schema:104-105`); `proyectos.garantiaAnios` integer default 2 (`schema:102`); `proyectos.diasEntregaEstimados` (`schema:103`). El IVA y la garantía son **por proyecto**, no globales.

4. **Datos de marca/legal resueltos que hoy no viven en ningún lado del schema:** NAP (Cra. 72a #71A 57, Bogotá; 302 5922101; apertura 8:00 a.m. — `log:34` I-019), razón social HERMANOS GARCIA GONZALEZ SAS, NIT 901421357-9 (`log:54` I-039), marca Veta Dorada (`log:32` I-017). I-007 las marcó como pendientes de confirmación; I-019/I-039 las resolvieron (`log:22,34,54`).

5. **Parámetros mencionados en fuentes pero SIN número (→ DECISION_PENDIENTE, no inventar):** retención diseñador (`define:128,145`), IVA diseño 3D ± (`define:128,145`; `a1-4:91`), comisión de cierre (% no definido, `define:22`; `logica:219`), comisión por módulo instalado (`logica:221-222`), tarifa hora auxiliar y quincena desarrollador (`logica:220,222`), reducción de comisiones por causa interna (`define:79`; `a1-2:187`), umbral de novedad del check 15 días (`log:40`; `a1-2:188`), base del 5% "por tamaño" (`a1-4:362` H17).

6. **Falta en ambas propuestas A1 (primer vistazo):** tabla de versionado/auditoría de cambios; `garantia_ventana_dias_min/max` (8-12) (`define:44`); `kpi_cumplimiento_semanas`=4 (`define:178`); `recargo_hora_extra_pct` (`logica:222`); storage de NAP/NIT.

**Vuelco bruto:** ~30 claves candidatas, 2 tablas competidoras, 1 necesidad de versionado, 1 política de efecto temporal pendiente.

---

## Iteración 2 (autocrítica)

Lo que sobrevive, lo que cae y por qué:

1. **Cae la separación física `parametros_compensacion` (→ CORRECCION_SCHEMA P-03).** A1-4 separó los financieros de los operativos por lente (`a1-4:98`), pero las dos tablas resultan idénticas en forma (clave, valor, unidad, descripción, vigencia) y comparten ciclo de vida, API de lectura (`parametro('clave')`, `a1-2:71`) y necesidades de auditoría. Mantenerlas separadas es **RUIDO_SCHEMA**: la misma entidad partida por dominio. **Resolución:** UNA tabla `parametros` con columna `grupo` (dominio) como discriminador, no como tabla nueva. Es la convergencia que A2 exige (goal A2 = "1 schema relacional convergido", `metodo:146`).

2. **Se corrige la doble fuente de verdad `updated_at` (P-10).** `parametros.updated_at` (propuesto en `a1-4:79`) duplica lo que `parametros_historial` va a guardar — mismo patrón de "dos verdades" que ENF-11 denunció para `saldo_actual` (`a1-2:245`). Resolución: `updated_at` se conserva como **materializado de lectura** con la regla "la fuente de verdad es el historial" (append-only, `a1-5:96`), nunca como fuente para auditoría.

3. **Se añade lo que se escapó en la pasada 1:**
   - **Versionado:** `parametros_historial` (append-only, actor + rol denormalizado + motivo + valor anterior/nuevo). El rol se denormaliza al escribir para que la historia no cambie si cambia la asignación persona→rol (`a1-5:30`). **No** se usa la tabla `eventos` para loguear cambios de parámetro: el enum de `tipoEvento` está cerrado en 61 códigos (`a1-5:59`; contrato `define:49`); extenderlo es un cambio de contrato → se marca DECISION_PENDIENTE (P-11). El historial propio es autocontenido.
   - **Valores del Define que ninguna semilla A1 tenía:** `garantia_ventana_dias_min/max` = 8/12 (`define:44`), `kpi_cumplimiento_semanas` = 4 (`define:178`).
   - **Extras del auxiliar:** `recargo_hora_extra_pct` — "horas + extras" (`logica:222`) sin % → parámetro DECISION_PENDIENTE.
   - **Base del 5% "por tamaño":** `base_comision_tamano` — H17 de A1-4 recomendó `contratos.valor_total`; si sobre subtotal o total con IVA sin confirmar (`a1-4:362`) → parámetro DECISION_PENDIENTE.

4. **Se delimita la frontera con lo existente (política de efecto, §4 del entregable):** `proyectos.aplica_iva`/`porcentaje_iva` (`schema:104-105`) y `proyectos.garantiaAnios` (`schema:102`) son valores **por proyecto** y ya se congelan en el proyecto/cotización. El parámetro global solo **siembra** el default de proyectos nuevos; un cambio global NO toca proyectos existentes (inmutabilidad contractual, consistente con cronograma contractual inmutable de I-034, `log:48`). Esto evita RUIDO_SCHEMA (no duplicar el parámetro en cada proyecto) y respeta P3-12 (una sola fuente de verdad, `define:117`).

5. **NAP/NIT/razón social (P-09):** son valores RESUELTOS (`log:34,54,32`) y su consumidor natural es el sitio público/`jsonld.ts` (subsistema DIFERIDO, `a1-2:212`; `log:56`). Se incluyen en el inventario como RESUELTO con inclusión opcional en `parametros` — la decisión de dónde viven (ERP vs config de sitio) queda DECISION_PENDIENTE (no bloquea el modelado).

6. **Dos valores del seed A1-2 tienen procedencia en el mapa, no en el Define §6 (P-12):** `sla_novedad_critica` 5/24 h (`logica:258` vía `a1-2:177`) y `holgura_cronograma_max_dias` 5 (`logica:255` vía `a1-2:179`). Se mantienen RESUELTO (son fuente documentada) pero con la traza exacta para que A2-1/A3 las valide contra el consolidado.

7. **No se inventa ningún número:** todo lo sin valor en las fuentes va `DECISION_PENDIENTE` con su traza. Regla del método (`metodo:18`) y del Define ("solo el valor real de la retención queda pendiente de validación con el contador", `define:128`).

---

## Iteración 3 (refinamiento final)

Resultado depurado:

- **1 tabla `parametros`** (clave única, `grupo` de dominio, `tipo` + 3 columnas de valor con CHECK de exclusión) en lugar de las 2 propuestas A1.
- **1 tabla `parametros_historial`** append-only para versionado/auditoría (actorId + actorRol + motivo + valor anterior/nuevo + `vigente_desde`).
- **Inventario de 26 claves core** (16 RESUELTAS, 10 DECISION_PENDIENTE) + **6 opcionales de marca/legal** RESUELTAS — ninguna DECISION_PENDIENTE bloquea el modelado (los parámetros se crean con valor vacío/null y el motor queda funcional con los RESUELTOS).
- **Política de efecto en tiempo real:** lectura viva del parámetro en el momento del cálculo → resultado congelado en la fila de negocio → sin recálculo histórico → transición programada por `vigente_desde`.
- **7 GAP_SCHEMA, 2 CORRECCION_SCHEMA, 1 NORMALIZACION, 2 DECISION_PENDIENTE estructurales, 2 RUIDO evitados, 1 DIFERIDO** (tabla de hallazgos).

---

## Inventario de parámetros

| # | Parámetro (`clave`) | Tabla.columna | Tipo | Valor por defecto (RESUELTO) | DECISION_PENDIENTE? | Regla de negocio que controla (E-XX) |
|---|---|---|---|---|---|---|
| 1 | `sla_primera_respuesta_min` | `parametros.valor_numeric` | numérico, minutos | **5** | No | E-50 SLA primera respuesta → escalación IA (LLM) / segundo comercial (`define:132`; `log:69`) |
| 2 | `sla_novedad_critica_min_horas` | `parametros.valor_numeric` | numérico, horas | **5** | No ⚠¹ | E-34 ventana SLA novedad crítica (`logica:258` vía `a1-2:177`) |
| 3 | `sla_novedad_critica_max_horas` | `parametros.valor_numeric` | numérico, horas | **24** | No ⚠¹ | E-34 escalación + visibilidad gerente, sin multa (`logica:258` vía `a1-2:177`; `define:135`) |
| 4 | `holgura_cobro_dias` | `parametros.valor_numeric` | numérico, días | **12** | No | E-29 atraso de cobro → aviso automático al gerente (`define:133`; `log:69`) |
| 5 | `garantia_ventana_dias_min` | `parametros.valor_numeric` | numérico, días | **8** | No | E-36 agenda de garantía (`define:44`) |
| 6 | `garantia_ventana_dias_max` | `parametros.valor_numeric` | numérico, días | **12** | No | E-36 agenda de garantía (`define:44`) |
| 7 | `promesa_semanas` | `parametros.valor_numeric` | numérico, semanas | **7** | No | E-11/E-14 promesa contractual (línea inmutable) (`define:17`; `log:39`) |
| 8 | `rango_instalacion_dias` | `parametros.valor_numeric` | numérico, días | **5** | No | E-25 instalación (rango) (`define:43`; `logica:254`) |
| 9 | `holgura_cronograma_max_dias` | `parametros.valor_numeric` | numérico, días | **5** | No ⚠¹ | E-33 holgura de la línea interna (`logica:255` vía `a1-2:179`) |
| 10 | `kpi_cumplimiento_semanas` | `parametros.valor_numeric` | numérico, semanas | **4** | No | E-35 KPI de producción → 5% dev+carpintero (`define:178`; D6) |
| 11 | `reagenda_max` | `parametros.valor_numeric` | numérico, veces | **1** | No | E-46 no-show V-1 (segunda falla → descartado) (`define:140`; `a1-2:95`) |
| 12 | `umbral_novedad_check15` | `parametros.valor_numeric` | numérico, umbral | — | **SÍ** | E-59 check de los 15 días (desenlace 1/2/3) (`log:40`; `a1-2:188`) |
| 13 | `comision_desarrollador_pct` | `parametros.valor_numeric` | porcentaje | **5** | No | E-31/E-35 comisión por cumplimiento de cronograma (`define:178`; `logica:220`) |
| 14 | `comision_carpintero_pct` | `parametros.valor_numeric` | porcentaje | **5** | No | E-31/E-35 5% por tamaño + módulo (`define:144,162`; `log:69`) |
| 15 | `bruto_diseno_3d` | `parametros.valor_numeric` | pesos | **130000** | No | E-08/E-30/E-31 diseño 3D (`logica:225`; `log:69`; `a1-4:89`) |
| 16 | `base_comision_tamano` | `parametros.valor_texto` | texto (enum 'valor_total'\|'subtotal') | — | **SÍ** | E-35 base del 5% por tamaño; H17 recomienda `contratos.valor_total`, sin confirmar subtotal/total IVA (`a1-4:362`; `logica:265`) |
| 17 | `comision_cierre_pct` | `parametros.valor_numeric` | porcentaje | — | **SÍ** | E-31 comisión del comercial (ventas, no producción) y del diseñador (`define:22`; `logica:219`) |
| 18 | `comision_modulo_instalado` | `parametros.valor_numeric` | pesos | — | **SÍ** | E-35 comisión por módulo instalado (carpintero/auxiliar, simétrico al dev) (`define:144`; `logica:221-222`) |
| 19 | `tarifa_hora_auxiliar` | `parametros.valor_numeric` | pesos/hora | — | **SÍ** | E-31 base por horas del auxiliar (`logica:222`) |
| 20 | `recargo_hora_extra_pct` | `parametros.valor_numeric` | porcentaje | — | **SÍ** | E-31 horas + extras del auxiliar (`logica:222`) |
| 21 | `quincena_desarrollador` | `parametros.valor_numeric` | pesos/quincena | — | **SÍ** | E-31 base quincenal del desarrollador (`logica:220`) |
| 22 | `reduccion_comision_causa_interna_pct` | `parametros.valor_numeric` | porcentaje | — | **SÍ** | E-33 (causa interna) → E-35 reduce comisiones; dato auditable (`define:79`; `a1-2:187`) |
| 23 | `retencion_disenador_pct` | `parametros.valor_numeric` | porcentaje | — | **SÍ** | Neto del diseñador = bruto − retención ± IVA; **validar con el contador** (`define:128,145`; `log:69`) |
| 24 | `iva_diseno_3d_pct` | `parametros.valor_numeric` | porcentaje | 19 (estimado) | **SÍ** | Tratamiento ± IVA del diseño 3D facturado (`define:128,145`; `a1-4:91`) |
| 25 | `iva_default_pct` | `parametros.valor_numeric` | porcentaje | **19** | No ⚠² | Siembra `proyectos.porcentaje_iva` en proyectos nuevos (`schema:104-105`) |
| 26 | `llm_disponible` | `parametros.valor_booleano` | booleano | **true** (según entorno) | No | E-50 destino de escalación: IA LLM vs segundo comercial (`define:132`; `a1-2:189`) |

**Bloque opcional de marca/legal (RESUELTO, inclusión DECISION_PENDIENTE — consumidor principal sitio público/jsonld, DIFERIDO):**

| # | Parámetro (`clave`) | Tabla.columna | Tipo | Valor por defecto (RESUELTO) | DECISION_PENDIENTE? | Fuente |
|---|---|---|---|---|---|---|
| 27 | `empresa_marca` | `parametros.valor_texto` | texto | **Veta Dorada** | No | `log:32` (I-017) |
| 28 | `empresa_razon_social` | `parametros.valor_texto` | texto | **HERMANOS GARCIA GONZALEZ SAS** | No | `log:54` (I-039) |
| 29 | `empresa_nit` | `parametros.valor_texto` | texto | **901421357-9** | No | `log:54` (I-039) |
| 30 | `empresa_direccion` | `parametros.valor_texto` | texto | **Cra. 72a #71A 57, Bogotá** | No | `log:34` (I-019) |
| 31 | `empresa_telefono` | `parametros.valor_texto` | texto | **302 5922101** | No | `log:34` (I-019) |
| 32 | `empresa_horario_apertura` | `parametros.valor_texto` | texto | **08:00** | No | `log:34` (I-019) |

**Notas de fuente:**
- ⚠¹ `sla_novedad_critica` (5/24) y `holgura_cronograma_max_dias` (5) provienen del mapa (`logica_de_negocio.md:258,255`), NO del Define §6 — se mantienen RESUELTO por ser fuente documentada (P-12).
- ⚠² `iva_default_pct` y `garantia_anios_default` (=2, `schema:102`, no listado arriba por ser columna existente) son **defaults de siembra** derivados de `schema.ts`; el IVA real de cada cotización vive en `proyectos` por proyecto (política de efecto, §4).
- `sla_novedad_critica` y `holgura_cobro_dias` son los nombres canónicos; A1-2 los llamó `sla_novedad_critica_horas_*` y `holgura_cobro_dias` — la clave única de `parametros` evita duplicados (P-03).

---

## Diseño del subsistema de parámetros

**Decisión central (CORRECCION_SCHEMA P-03):** UNA tabla `parametros` en lugar de `parametros` + `parametros_compensacion`. Justificación: (a) misma forma y ciclo de vida → separar por dominio es RUIDO_SCHEMA (`a1-4:98`); (b) una sola API `parametro('clave')` usada por los predicados de gates (`a1-2:71,95,165,168`) y por el motor de comisiones; (c) versionado/auditoría único; (d) es la convergencia que el goal A2 exige (`metodo:146`). El dominio se expresa con la columna `grupo`.

**Patrones heredados respetados:** dineros/porcentajes `numeric` (nunca float, `a1-4:61`); nombres camelCase/snake_case (`a1-5:219`); timestamps `createdAt/updatedAt` (`schema:73-74`); acceso transaccional (`a1-5:33`, `lib/modules/finanzas/acciones.ts:58`).

```ts
export const tipoParametroEnum = pgEnum('tipo_parametro', ['numerico', 'texto', 'booleano'])

export const parametros = pgTable('parametros', {
  id: uuid('id').primaryKey().defaultRandom(),
  clave: text('clave').notNull().unique(),              // ej. 'comision_desarrollador_pct'
  grupo: text('grupo'),                                 // 'sla' | 'cronograma' | 'comercial' | 'compensacion' | 'fiscal' | 'marca' | 'sistema'
  tipo: tipoParametroEnum('tipo').notNull(),
  valorNumeric: numeric('valor_numeric', { precision: 14, scale: 2 }),  // dinero o porcentaje
  valorTexto: text('valor_texto'),                      // NAP, base_comision_tamano, etc.
  valorBooleano: boolean('valor_booleano'),             // llm_disponible
  unidad: text('unidad'),                               // 'porcentaje' | 'pesos' | 'dias' | 'horas' | 'minutos' | 'semanas' | 'veces' | 'texto'
  descripcion: text('descripcion'),
  vigenteDesde: timestamp('vigente_desde').notNull().defaultNow(),  // cuándo toma efecto
  updatedAt: timestamp('updated_at').notNull().defaultNow(),        // materializado de lectura (P-10)
})
// CHECK (exclusión exacta de un valor): num_nonnulls(valor_numeric, valor_texto, valor_booleano) = 1
```

```ts
export const parametrosHistorial = pgTable('parametros_historial', {
  id: uuid('id').primaryKey().defaultRandom(),
  parametroId: uuid('parametro_id').notNull().references(() => parametros.id),
  claveSnapshot: text('clave_snapshot').notNull(),      // sobrevive a renombres
  valorNumericAnterior: numeric('valor_numeric_anterior', { precision: 14, scale: 2 }),
  valorNumericNuevo: numeric('valor_numeric_nuevo', { precision: 14, scale: 2 }),
  valorTextoAnterior: text('valor_texto_anterior'),
  valorTextoNuevo: text('valor_texto_nuevo'),
  valorBooleanoAnterior: boolean('valor_booleano_anterior'),
  valorBooleanoNuevo: boolean('valor_booleano_nuevo'),
  actorId: uuid('actor_id').references(() => usuarios.id),  // NULL = sistema
  actorRol: text('actor_rol'),                              // denormalizado (a1-5:30)
  motivo: text('motivo').notNull(),
  vigenteDesde: timestamp('vigente_desde').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
// Append-only: sin UPDATE/DELETE de aplicación (a1-5:96). La fuente de verdad del cambio ES esta tabla.
```

**Eventos que consumen el subsistema (lookup `parametro('clave')`):** E-50 (SLA 5 min), E-34 (ventana novedad), E-29 (12 días), E-46 (reagenda), E-59 (check 15 días), E-33 (holgura), E-35 (comisiones: `comision_*`, `base_comision_tamano`, `reduccion_comision_causa_interna_pct`), E-08/E-30/E-31 (bruto diseño, retención, tarifas). La siembra de `proyectos.porcentaje_iva`/`garantia_anios` la consumen E-09/E-11 (cotización/contrato). **Relaciones:** `parametros 1—N parametros_historial`; el resto son FKs de contexto en `parametros_historial` (actor). Ninguna tabla de negocio referencia `parametros` (política de efecto §4).

---

## Política de versionado y efecto

**Versionado (quién cambió qué cuándo):**
1. Todo cambio de parámetro escribe **en la misma transacción** `parametros` (nuevo valor + `updated_at`) y una fila append-only en `parametros_historial` (`actorId` + `actorRol` denormalizado + `motivo` + valor anterior/nuevo + `vigente_desde`). Patrón de atomicidad idéntico al de `eventos` (`a1-5:33`) y a `acciones.ts:58`.
2. El rol se denormaliza al momento del cambio para que la historia no se reescriba si cambia la asignación persona→rol (`a1-5:30`).
3. La historia NO se usa para reescribir el presente: `parametros` es el valor vigente (materializado de lectura); `parametros_historial` es la fuente de verdad del cambio (P-10, patrón ENF-11 `a1-2:245`).
4. Opción de espejar el cambio en `eventos` queda **DECISION_PENDIENTE** (P-11): el enum de 61 códigos está cerrado (`define:49`); el historial propio evita tocar ese contrato.

**Efecto en tiempo real (política — cómo el cambio afecta cálculos FUTUROS sin recalcular históricos):**
1. **Lectura viva:** toda lógica lee `parametro('clave')` en el momento de calcular. No hay copias del parámetro en tablas intermedias (evita RUIDO y dos verdades).
2. **Congelamiento del resultado:** al liquidar, `comisiones_proyecto` persiste `base_calculo`, `porcentaje` y `monto` (`a1-4:250-254`); `obligaciones_pendientes` persiste `monto_total`. El histórico queda **inmune** a cambios posteriores del parámetro: cambiar la comisión al 6% NO toca comisiones ya liquidadas, ni montos de obligaciones ya nacidas.
3. **Sin recálculo automático:** un cambio de parámetro no reabre liquidaciones, cobros ni cronogramas ya fijados. El reproceso es excepcional y SOLO por decisión del Supervisor (la política de congelamiento lo hace explícito, no silencioso).
4. **Valores derivados en vivo (no persistidos):** el neto del diseñador se calcula en código desde el parámetro vigente cada vez que se lee — no persiste, no hay histórico que migrar (`a1-4:321`).
5. **Transición programada:** `vigente_desde` permite programar cuándo toma efecto un cambio; hasta entonces opera el valor vigente anterior. Ideal para cambios coordinados (p. ej., ajuste de comisión a inicio de quincena).
6. **Inmutabilidad contractual:** los parámetros que anclan promesas contractuales (`promesa_semanas`) NO cambian a mitad de contrato; si cambian, aplican solo a proyectos nuevos (consistente con la línea contractual inmutable, `log:48` I-034). Los defaults de siembra (`iva_default_pct`, garantía) solo afectan proyectos nuevos — los existentes conservan su valor por proyecto (`schema:102-105`).

---

## Hallazgos

| ID | Tipo | Descripción | Fuente (archivo:línea) |
|---|---|---|---|
| P-01 | GAP_SCHEMA | **Fuente primaria ausente:** `d3_schema_a2_1_normalizacion.md` (schema consolidado) no existe todavía (2026-08-04). Este pase usó las pasadas A1 divergentes; reconciliar contra el consolidado real cuando exista | `metodo:33`; directorio `arnes/diagnostico/pasadas/` |
| P-02 | GAP_SCHEMA | `schema.ts` (18 tablas) no tiene ninguna tabla de parámetros; A1-2 propone `parametros` y A1-4 `parametros_compensacion` — la divergencia que A2 debe converger | `schema.ts:64-313` (ausencia); `a1-2:172`; `a1-4:67` |
| P-03 | CORRECCION_SCHEMA | **Unificación:** UNA tabla `parametros` con columna `grupo` en vez de `parametros` + `parametros_compensacion`. Separar por dominio es RUIDO_SCHEMA (misma forma, ciclo de vida, API `parametro('clave')` y auditoría) | `a1-4:98`; `a1-2:71,95,165,168` |
| P-04 | GAP_SCHEMA | No existe `parametros_historial` (versionado/auditoría de quién cambió qué cuándo) en ninguna propuesta A1 | `a1-2:172-189`; `a1-4:67-98` |
| P-05 | GAP_SCHEMA | `garantia_ventana_dias_min/max` (8-12, E-36) está en el Define pero sin seed en A1-2/A1-4 | `define:44` |
| P-06 | GAP_SCHEMA | `kpi_cumplimiento_semanas` (=4, D6) sin seed — es la ventana del KPI de producción que dispara el 5% | `define:178` |
| P-07 | GAP_SCHEMA | `base_comision_tamano` (base del 5% "por tamaño") no definida — H17 de A1-4; se modela como parámetro DECISION_PENDIENTE (¿subtotal o total con IVA?) | `a1-4:362`; `define:144` |
| P-08 | GAP_SCHEMA | `recargo_hora_extra_pct` (extras del auxiliar, "horas + extras") sin seed | `logica:222` (vía `a1-4:334`) |
| P-09 | GAP_SCHEMA | NAP/NIT/razón social (I-019, I-039) sin storage en `schema.ts`; candidatos a `parametros` con consumidor principal en el sitio público/jsonld (subsistema DIFERIDO) — la inclusión es DECISION_PENDIENTE | `log:22,34,54,56` |
| P-10 | NORMALIZACION | `parametros.updated_at` duplicaría lo que `parametros_historial` guarda (dos verdades, patrón ENF-11); se conserva solo como materializado de lectura con regla explícita | `a1-4:79`; `a1-2:245`; `a1-5:96` |
| P-11 | DECISION_PENDIENTE | ¿Espejar los cambios de parámetro en la tabla `eventos`? El enum de `tipoEvento` está cerrado en 61 códigos (`define:49`) — extenderlo es cambio de contrato; `parametros_historial` es autocontenido y no lo exige | `a1-5:59`; `define:49` |
| P-12 | DECISION_PENDIENTE | `sla_novedad_critica` (5/24 h) y `holgura_cronograma_max_dias` (5) provienen del mapa (`logica:258,255`), NO del Define §6 — validar su fuente en la convergencia A2-1 | `a1-2:177,179`; `define:128-145` |
| P-13 | RUIDO_SCHEMA (evitado) | NO duplicar cada parámetro en las tablas de negocio que lo consumen (ej. el % de comisión en cada fila de comisión Y en `parametros`). El resultado liquidado sí se congela (`base_calculo`, `porcentaje`, `monto`); el parámetro vive solo en `parametros` | `a1-4:250-254`; `define:117` (P3-12) |
| P-14 | DIFERIDO | Parámetros de la palanca de demanda/t-034 (B2B por m² I-021, restauración de pisos I-014), tienda web y marketing — fuera del core capa 1 | `define:174`; `log:29,36` |

---

## Notas para el Orquestador

1. **Dependencia bloqueante parcial (P-01):** A2-1 (schema consolidado) no existe al momento de este pase. Mi propuesta asume que A2-1 unificó las tablas de parámetros (P-03); si A2-1 resolvió distinto, A3 debe conciliar este pase contra el consolidado real. **Este pase NO escribe `lib/db/schema.ts` ni ningún archivo fuera de esta salida** (prohibido cumplido).
2. **Implementación sugerida:** módulo `lib/modules/parametros/` con `getParametro(clave)` tipado (getter) y `setParametro(tx, { clave, valor, actorId, actorRol, motivo, vigenteDesde })` transaccional que escribe `parametros` + `parametros_historial` — patrón de `lib/modules/finanzas/acciones.ts:58` y del helper `registrarEvento` de `a1-5:45`. Tests `*.test.ts` con el placeholder de `DATABASE_URL` de `AGENTS.md`.
3. **API de consumo ya definida en A1-2:** los predicados de gates usan `parametro('clave')` (`a1-2:71,95,165,168`) — el módulo debe exponer exactamente esa firma para no reescribir los gates.
4. **Nada de este pase modifica archivos existentes.** La política de congelamiento (resultado liquidado = snapshot) es la garantía de que los DECISION_PENDIENTE (retención, IVA, comisiones, tarifas, umbrales) pueden crearse con valor vacío sin romper el motor que usa los valores RESUELTOS (5%, $130k).
5. **Decisiones que A3/el Supervisor deben resolver antes del corte (ninguna bloquea el modelado):** retención/IVA del diseñador con el contador (`define:128,145`), valores de comisiones/tarifas/quincena, umbral check15, base del 5% (P-07), destino del espejo en `eventos` (P-11), inclusión del bloque marca/legal en `parametros` (P-09).

---

## Registro

- Fecha: 2026-08-04
- Pase: A2-5 (ola 2, en paralelo con A2-1..A2-4 y B2-1..B2-2)
- Archivo de salida (único escrito): `arnes/diagnostico/pasadas/d3_schema_a2_5_parametros.md`
- Loop de 3 iteraciones completado: 1 bruta (2 tablas competidoras + ~30 claves) → 2 autocrítica (unificación P-03, doble verdad P-10, gaps P-05..P-09, frontera con schema.ts) → 3 refinamiento (1 tabla `parametros` + `parametros_historial` + inventario + políticas).

**Confirmación final de conteo (parámetros core, inventario §2):**
- **RESUELTOS: 16** (claves 1-11, 13, 14, 15, 25, 26)
- **DECISION_PENDIENTE: 10** (claves 12, 16-24)
- **Opcionales marca/legal: 6 RESUELTAS** (claves 27-32) — inclusión en `parametros` DECISION_PENDIENTE (P-09)
- Ningún DECISION_PENDIENTE bloquea el modelado: los parámetros se crean con valor vacío y el motor queda funcional con los RESUELTOS.
