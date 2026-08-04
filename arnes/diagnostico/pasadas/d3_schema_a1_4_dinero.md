# Pase A1-4 — Schema por dinero y compensación (subagente, loop de 3 iteraciones)

**Lente:** dinero y compensación. **Rol:** sub-agente A1-4 del Diamante 3 (grafo Schema→UI, `pasadas/diamante3_metodologia.md`).
**Alcance:** cotización/item, orden de compra, pagos/recibos, facturas, comisiones, parámetros de compensación, IVA/retención, gate de caja E-20 — consistente con el módulo de Finanzas ya construido (t-008..t-022, `lib/db/schema.ts:231-267` y `lib/modules/finanzas/*`).
**Referencias cortas usadas en la traza:** `define` = `arnes/diagnostico/diamante2_define_eventos.md` · `discover` = `arnes/diagnostico/diamante2_discover_eventos.md` · `logica` = `arnes/diagnostico/logica_de_negocio.md` · `log` = `arnes/diagnostico/log_insights_fase2.md` · `schema` = `lib/db/schema.ts` · `acciones` = `lib/modules/finanzas/acciones.ts` · `estado` = `lib/modules/finanzas/estado.ts` · `validacion` = `lib/modules/contratos/validacion.ts` · `calculo` = `lib/modules/cotizador/calculo.ts`.

---

## Iteración 1 (bruta)

**Barrido de eventos con dinero que nacen o se transforman** (del inventario): E-08 pago diseño 3D, E-11 cotización formal, E-12 contrato+hitos, E-16 adicional (costo), E-19 pedido de compra, E-20 pago a proveedor, E-27 notificación de pago, E-28 pago/cobro del cliente, E-29 cobro con atraso, E-30 deducción diseño 3D, E-31 compensación por rol, E-32 micro cuenta de cobro, E-33 desfase (→E-35), E-35 cálculo de comisiones, E-43 lectura de caja, E-56 nacimiento de obligación, E-57 arriendos, E-58 cuenta por socio (discover:43,72-73,98-106,116-117; define:22,90,102,114,120,122,136,144-145,178).

**Mapeo bruto evento → entidad:**
- E-11/E-12 → `proyectos` + `espacio_variantes` + `items_variante` + `contratos` + `hitos_pago` (ya existen, schema.ts:91-206).
- E-19/E-20/E-45 → tabla nueva `ordenes_compra` (+ ítems).
- E-08/E-28/E-20/E-57 → `movimientos_financieros` + `obligaciones_pendientes` (ya existen).
- E-56 → `obligaciones_pendientes` (nacimiento desde `hitos_pago`).
- E-30 → ajuste en `obligaciones_pendientes`.
- E-31/E-35 → tablas nuevas de compensación.
- E-32 → documento generado por registro (cuenta de cobro).
- E-43/E-20 gate → `cuentas_financieras.saldo_actual` + registro de la rama negativa.
- E-58 → vista por socio sobre movimientos/compensación.
- Facturación (externo "Aliado") → tabla ligera `facturas` para el dashboard del contador.

**Vuelco bruto de columnas** (sin filtrar): 8 tablas nuevas, 6 tablas existentes tocadas, ~14 eventos mapeados. Detalle en iteración 3.

---

## Iteración 2 (autocrítica)

Lo que **cae** y por qué:
- **`recibos` como tabla propia → RUIDO_SCHEMA.** E-28 produce "movimiento financiero + saldo de obligación" (discover:100); el recibo/acta es un documento derivado del movimiento, no una nueva entidad de dinero. La reconstrucción ya consolidó los 4 namespaces del legacy (`hitos_pago`, `obligaciones_pendientes`, `abonos_contrato`, `movimientos_financieros`) en dos tablas (P3-02, discover:98) — volver a separar es re-crear el drift que P3-12 denuncia (define:117).
- **`cuentas_socios` con saldo almacenado → RUIDO_SCHEMA.** E-58 "lectura de cuenta/saldo por socio" (discover:106) se resuelve como vista derivada de `movimientos_financieros.socio_id`, no como tabla con saldo (evita el problema de "dos verdades" de P3-12, define:117). Basta con la FK.
- **`declaraciones_dian` → DIFERIDO.** La visibilidad de declaraciones DIAN (logica:391) es el lente de impuestos/capa de lectura, no bloquea el schema de dinero de capa 1.
- **Motor de facturación → DIFERIDO.** La facturación vive en "Aliado" (externo, logica:386-393); solo se registra el hecho facturado.
- **`cuenta_cobro_url` como columna en vez de tabla `documentos_compensacion`.** E-32 es una autogeneración documental (logica:383-384); una columna en `liquidaciones_compensacion` basta, no una tabla.

Lo que **se corrige** (errores de la pasada 1):
- **La deducción del diseño 3D NO toca `contratos.valor_total`.** El contrato se firma por el valor total; la deducción reduce el anticipo A COBRAR, no el precio (E-30, discover:102; logica:460). Y `validar_hitos` exige que la suma de hitos = `valor_total` (validacion:37-43) — si se restara del contrato, se rompería. Se modela `obligaciones_pendientes.deduccion_diseno_3d` (CORRECCION_SCHEMA propia).
- **El neto del diseñador "± IVA" no se inventa.** La fuente lo deja pendiente de validación con el contador (define:128,145; logica:225). Se modela el parámetro y el cálculo del neto; el tratamiento del IVA queda `DECISION_PENDIENTE` (es exactamente lo que la fuente declara).
- **% de comisión de cierre (comercial/diseñador), monto por módulo instalado, tarifa hora del auxiliar, quincena del desarrollador: NO hay números en las fuentes.** No se inventan → `DECISION_PENDIENTE` cada uno. Lo que sí está resuelto: 5% carpintero por tamaño, 5% desarrollador por cumplimiento, $130k diseño 3D (define:144-145,178; logica:217-222; log:69).

Lo que **se escapó** en la pasada 1 y se agrega:
- `socio_id` en `movimientos_financieros` (necesario para E-58 y para la cuenta de cobro del diseñador de E-08, define:120).
- `orden_compra_id` en `movimientos_financieros` (traza E-20 → OC).
- `origen` + `hito_id` en `obligaciones_pendientes` (E-56 nace "con los hitos como especificación", define:122; arriendos E-57).
- `estado 'atrasada'` de obligación (E-29, discover:101).
- `fecha` y `fecha_vencimiento` como `text` impiden aritmética de fechas del atraso de 12 días (E-29) → NORMALIZACION.
- Dependencia del modelo rol-vs-persona: comisiones/liquidaciones referencian a la tabla `personas` (precondición de capa 1, define:57-61,176) — se delega su definición a A1-3 y se marca la FK.

---

## Iteración 3 (refinamiento final)

Conjunto final depurado (8 tablas nuevas, 3 tablas existentes ampliadas, 0 tablas redundantes):

**Nuevas:** `parametros_compensacion`, `ordenes_compra`, `items_orden_compra`, `facturas`, `liquidaciones_compensacion`, `comisiones_proyecto`, `registros_horas`, `registros_gate_caja`.
**Ampliadas:** `movimientos_financieros` (+6 columnas), `obligaciones_pendientes` (+5 columnas), `liquidaciones_compensacion` (cuenta de cobro E-32).
**Existentes sin tocar en lo monetario:** `proyectos`, `items_variante`, `contratos`, `hitos_pago`, `cuentas_financieras` (saldo ya transaccional, acciones:96-101).

Dinero siempre `numeric(14,2)` (patrón heredado, schema.ts:98-105); porcentajes `numeric(5,2)` (patrón `porcentaje_iva`, schema.ts:105); cantidades `numeric(10,2)` (patrón `items_variante.cantidad`, schema.ts:157); conteos `integer`. Nada de float en toda la propuesta.

---

## Entregable: tablas financieras

### 1. `parametros_compensacion` — valores resueltos del Define como configuración (I-054)

> Materializa el cierre de los VACÍOs financieros: % carpintero = 5% por tamaño, neto diseñador configurable (define:128,144-145,162; log:69; logica:225).

```ts
export const parametrosCompensacion = pgTable('parametros_compensacion', {
  id: uuid('id').primaryKey().defaultRandom(),
  clave: text('clave').notNull().unique(),        // ej. 'comision_desarrollador_pct'
  valorNumeric: numeric('valor_numeric', { precision: 14, scale: 2 }),  // dinero o porcentaje
  unidad: text('unidad').notNull(),               // 'porcentaje' | 'pesos' | 'dias'
  descripcion: text('descripcion'),
  vigenteDesde: timestamp('vigente_desde').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

Semilla (filas iniciales con fuente):

| clave | valor | unidad | fuente |
|---|---|---|---|
| `comision_desarrollador_pct` | 5 | porcentaje | define:178; logica:220 |
| `comision_carpintero_pct` | 5 | porcentaje | define:144,162 |
| `bruto_diseno_3d` | 130000 | pesos | logica:225,460; discover:43 |
| `retencion_disenador_pct` | — | porcentaje | `DECISION_PENDIENTE` (contador, define:128,145) |
| `iva_diseno_3d_pct` | 19 (estimado) | porcentaje | `DECISION_PENDIENTE` (tratamiento ± IVA, define:128,145) |
| `comision_cierre_pct` | — | porcentaje | `DECISION_PENDIENTE` (logica:219; define:22) |
| `comision_modulo_instalado` | — | pesos | `DECISION_PENDIENTE` (logica:221-222) |
| `tarifa_hora_auxiliar` | — | pesos | `DECISION_PENDIENTE` (logica:222) |
| `quincena_desarrollador` | — | pesos | `DECISION_PENDIENTE` (logica:220) |

**Eventos:** E-31/E-35 usan estos valores como entrada; E-43 (caja) no.
**Relaciones:** ninguna (tabla de parámetros). **Nota:** los parámetros no financieros (SLA 5 min E-50, SLA novedad E-34, días de atraso E-29) son del lente de datos/enforcement (A1-5/A1-2), no de dinero — acá solo los financieros.

### 2. `ordenes_compra` + `items_orden_compra` — E-19 / E-20 / E-45

> Materializa: E-19 pedido de compra (soporta ≥3 mecánicas de pago), E-20 pago a proveedor, E-45 reposición operativa (discover:72-73,75; logica:352).

```ts
export const tipoOrdenCompraEnum = pgEnum('tipo_orden_compra', [
  'anticipo_saldo', 'pago_unico', 'subcontratacion',
])
export const origenCompraEnum = pgEnum('origen_compra', ['proyecto', 'operativa'])
export const estadoOrdenCompraEnum = pgEnum('estado_orden_compra', [
  'solicitada', 'aprobada', 'en_pago', 'pagada', 'recibida', 'cancelada',
])

export const ordenesCompra = pgTable('ordenes_compra', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigoOrden: text('codigo_orden').notNull().unique(),
  proyectoId: uuid('proyecto_id').references(() => proyectos.id),   // null para E-45 (operativa)
  proveedorId: uuid('proveedor_id').notNull().references(() => proveedores.id),
  tipo: tipoOrdenCompraEnum('tipo').notNull(),
  origen: origenCompraEnum('origen').notNull().default('proyecto'), // E-45 → 'operativa'
  montoTotal: numeric('monto_total', { precision: 14, scale: 2 }).notNull(), // decimal
  anticipoMonto: numeric('anticipo_monto', { precision: 14, scale: 2 }),      // solo 'anticipo_saldo'
  estado: estadoOrdenCompraEnum('estado').notNull().default('solicitada'),
  fechaSolicitud: timestamp('fecha_solicitud').notNull().defaultNow(),
  fechaPago: timestamp('fecha_pago'),
  fechaRecepcion: timestamp('fecha_recepcion'),   // E-21 (gate, ver A1-2)
  notas: text('notas'),
})

export const itemsOrdenCompra = pgTable('items_orden_compra', {
  id: uuid('id').primaryKey().defaultRandom(),
  ordenId: uuid('orden_id').notNull().references(() => ordenesCompra.id),
  catalogoId: uuid('catalogo_id').references(() => productosCatalogo.id), // nullable, patrón items_variante (schema.ts:155)
  nombrePersonalizado: text('nombre_personalizado'),
  cantidad: numeric('cantidad', { precision: 10, scale: 2 }).notNull().default('1'),
  precioUnitario: numeric('precio_unitario', { precision: 14, scale: 2 }).notNull().default('0'),
  totalLinea: numeric('total_linea', { precision: 14, scale: 2 }),
})
```

**Eventos:** E-19 → fila OC (`solicitada`); E-20 → `pagada` + movimiento egreso con `orden_compra_id`; E-21 → `recibida` (checklist de compra esperada, C3 — enforcement en A1-2, define:76); E-45 → `origen='operativa'`.
**Relaciones:** `ordenesCompra 1—N itemsOrdenCompra`; `ordenesCompra N—1 proyectos/proveedores`.
**RUIDO evitado:** no se crea `solicitudes_compra` (decisión explícita del mapa: se resuelve con `proveedor_id`, logica:593).

### 3. `movimientos_financieros` (ampliada) — E-08 / E-20 / E-28 / E-57 / E-58

> Ya existe (schema.ts:239-252) y su escritura es transaccional con recálculo por SUM (acciones:57-128). Faltan las 6 columnas para trazar socio, OC, comprobante y prioridad.

```ts
export const prioridadPagoEnum = pgEnum('prioridad_pago', ['materiales', 'arriendos', 'nominas'])

// ADD en movimientosFinancieros:
  socioId: uuid('socio_id').references(() => personas.id),      // E-58/E-08: a quién va el dinero (rol-vs-persona, A1-3)
  ordenCompraId: uuid('orden_compra_id').references(() => ordenesCompra.id),  // E-20
  medioPago: text('medio_pago'),                                 // 'efectivo' | 'transferencia' | 'pasarela' (logica:88)
  comprobanteUrl: text('comprobante_url'),                       // E-20 "comprobante" (discover:73)
  prioridadPago: prioridadPagoEnum('prioridad_pago').notNull().default('materiales'), // materiales → arriendos → nóminas (logica:358)
  referencia: text('referencia'),                                // id externo de transacción/pasarela
```

**Eventos:** E-08 (ingreso, `socio_id`=diseñador), E-20 (egreso, `orden_compra_id`), E-28 (ingreso por cobro, `obligacion_id`), E-57 (egreso arriendo), E-58 (lectura por `socio_id`). El tipo ingreso/egreso se deriva de `obligaciones_pendientes.tipo` (patrón existente, acciones:77) — no lo manda el llamador.
**Relaciones:** N—1 a `personas`, `ordenesCompra`, `cuentasFinancieras`, `obligacionesPendientes`, `proyectos`, `contratos`.
**NORMALIZACION (propuesta a A2):** `fecha` como `text` (schema.ts:244) impide la aritmética de E-29 (12 días) y agregación de caja — recomendar `date`/`timestamp` manteniendo la convención del módulo hasta decisión de A2-1.

### 4. `obligaciones_pendientes` (ampliada) — E-56 / E-29 / E-30 / E-57

> Ya existe (schema.ts:254-267) con recálculo `pendiente|parcial|pagado` (estado:17-20). Faltan: origen (E-56), hito de origen (traza), deducción del diseño 3D (E-30) y el estado de atraso (E-29).

```ts
export const origenObligacionEnum = pgEnum('origen_obligacion', [
  'contrato_hito', 'diseno_3d', 'proveedor', 'arriendo', 'nomina',
])
export const estadoObligacionEnum = pgEnum('estado_obligacion', ['pendiente', 'parcial', 'pagado', 'atrasada'])

// ADD en obligacionesPendientes:
  origen: origenObligacionEnum('origen').notNull().default('contrato_hito'),
  hitoId: uuid('hito_id').references(() => hitosPago.id),       // traza E-56 → hito que la origina (define:122)
  deduccionDiseno3d: numeric('deduccion_diseno_3d', { precision: 14, scale: 2 }).default('0'), // E-30
  periodicidad: text('periodicidad'),                            // 'mensual' para arriendos E-57
```

**Flujo E-56/E-30 (el sistema, no la memoria):**
1. E-08: se crea obligación `origen='diseno_3d'`, `por_cobrar`, `monto_total=bruto_diseno_3d`, y su ingreso con `socio_id`=diseñador (define:120; discover:43).
2. E-56: al firmar el contrato (E-13) se crean las obligaciones `origen='contrato_hito'` por cada hito (define:122; discover:98).
3. E-30: si el pago de E-08 está registrado, la obligación del **primer hito (anticipo)** nace con `monto_total = montoRealHito − bruto_diseno_3d` y `deduccion_diseno_3d = bruto_diseno_3d`. Precedencia declarada: E-08 → E-30 exige el pago registrado (define:90,102).
4. E-29: al vencer sin pago, el estado deriva a `atrasada` (aviso al gerente a los 12 días, discover:101; define:133). **Nota:** `fecha_vencimiento` como `text` (schema.ts:260) → NORMALIZACION para el cálculo de los 12 días (ver H9).

**CORRECCION_SCHEMA propia:** la deducción NO se aplica restando de `contratos.valor_total` (rompería `validar_hitos`, validacion:37-43, y falsearía el precio firmado); se aplica al monto a cobrar del anticipo.

### 5. `facturas` — registro del hecho facturado (externo "Aliado")

> La facturación NO se construye: se hace en "Aliado" (logica:386-393). Esta tabla solo registra lo que el contador emite afuera, para el dashboard de "contratos pendientes de facturar".

```ts
export const facturas = pgTable('facturas', {
  id: uuid('id').primaryKey().defaultRandom(),
  contratoId: uuid('contrato_id').notNull().references(() => contratos.id),
  numeroFactura: text('numero_factura').notNull().unique(),
  fechaEmision: timestamp('fecha_emision').notNull(),
  valorTotal: numeric('valor_total', { precision: 14, scale: 2 }).notNull(), // decimal
  estado: text('estado').notNull().default('emitida'),  // 'emitida' | 'anulada'
  urlDocumento: text('url_documento'),
})
```

**Eventos:** E-12/E-13 (contrato firmado → pendiente de facturar = sin fila en `facturas`); E-16 adicional (nueva factura). **Relaciones:** N—1 `contratos`. **DIFERIDO:** `declaraciones_dian` (visibilidad DIAN, logica:391) y la integración profunda con Aliado (H21).

### 6. `liquidaciones_compensacion` — E-31 (base) + E-32 (cuenta de cobro)

> E-31 "compensación por rol" = la base de nómina por rol y período (discover:103). P3-04: nómina como dato compuesto (base E-31 + ajuste E-35) (discover:103). E-32: micro cuenta de cobro autogenerada por registro (discover:105; logica:381-384).

```ts
export const rolCompensacionEnum = pgEnum('rol_compensacion', [
  'desarrollador', 'carpintero', 'diseniador', 'comercial', 'auxiliar',
])
export const tipoBaseCompensacionEnum = pgEnum('tipo_base_compensacion', [
  'quincena', 'horas', 'proyecto', 'diseno_3d',
])

export const liquidacionesCompensacion = pgTable('liquidaciones_compensacion', {
  id: uuid('id').primaryKey().defaultRandom(),
  personaId: uuid('persona_id').notNull().references(() => personas.id), // rol-vs-persona (A1-3, define:57-61)
  rol: rolCompensacionEnum('rol').notNull(),
  periodoInicio: date('periodo_inicio').notNull(),
  periodoFin: date('periodo_fin').notNull(),
  tipoBase: tipoBaseCompensacionEnum('tipo_base').notNull(),
  montoBase: numeric('monto_base', { precision: 14, scale: 2 }).notNull().default('0'), // decimal
  estado: text('estado').notNull().default('proyectada'),  // 'proyectada' | 'pagada'
  cuentaCobroUrl: text('cuenta_cobro_url'),                // E-32 (autogenerada, con permiso de firma)
  fechaPago: timestamp('fecha_pago'),
})
```

**Eventos:** E-31 → fila de base (diseñador `diseno_3d` $130k; desarrollador `quincena`; auxiliar `horas`; etc.); E-32 → `cuenta_cobro_url` generada al liquidar; E-58 → lectura por `persona_id`. **Relaciones:** N—1 `personas`; 1—N `comisiones_proyecto` (nómina compuesta).

### 7. `comisiones_proyecto` — E-31 (comisiones) + E-35 (ajuste por cumplimiento)

> E-35: cálculo de comisiones según cumplimiento — cumple → recibe; causa interna → pierde; causa externa → se mide contra nuevos plazos (discover:116). Dispara desde E-59 (check 15 días, desenlace 2: comisiones se reducen) y desde E-33 (desfase auditable, define:102) (discover:112-113,116).

```ts
export const tipoComisionEnum = pgEnum('tipo_comision', [
  'cumplimiento_cronograma', 'tamano', 'venta', 'modulo_instalado', 'diseno_3d',
])

export const comisionesProyecto = pgTable('comisiones_proyecto', {
  id: uuid('id').primaryKey().defaultRandom(),
  proyectoId: uuid('proyecto_id').notNull().references(() => proyectos.id),
  personaId: uuid('persona_id').notNull().references(() => personas.id),
  rol: rolCompensacionEnum('rol').notNull(),
  tipoComision: tipoComisionEnum('tipo_comision').notNull(),
  baseCalculo: numeric('base_calculo', { precision: 14, scale: 2 }).notNull(), // sobre qué se aplica el %
  porcentaje: numeric('porcentaje', { precision: 5, scale: 2 }),               // null si monto fijo por módulo
  montoFijo: numeric('monto_fijo', { precision: 14, scale: 2 }),               // comisión por módulo instalado
  cantidadModulos: integer('cantidad_modulos'),
  monto: numeric('monto', { precision: 14, scale: 2 }).notNull(),              // resultado (decimal)
  estado: text('estado').notNull().default('proyectada'),                      // 'proyectada' | 'liquidada' | 'ajustada'
  desfaseId: uuid('desfase_id').references(() => desfases.id),                 // E-33: causa que reduce (auditable, define:79,102)
  liquidacionId: uuid('liquidacion_id').references(() => liquidacionesCompensacion.id), // P3-04: nómina compuesta
})
```

**Eventos:** E-31 (generación), E-35 (liquidación/ajuste), E-33→E-35 (causa interna reduce `monto`; `desfase_id` deja la causa auditable), E-59 desenlace 2 (reducción), E-58 (lectura por socio). **Relaciones:** N—1 `proyectos`/`personas`/`desfases`/`liquidacionesCompensacion`. **Nota:** `desfases` la define el lente de cronograma (A1-2/A1-5) — acá solo la FK de trazabilidad causal.

### 8. `registros_horas` — E-31 (auxiliar por horas) + E-47 (bienestar, V-5)

> El auxiliar cobra por horas + extras (logica:222). El registro de horas es automático (V-5: "se mide cuánto trabaja vs. cuánto gana", define:142) — alimenta tanto la base por horas como el KPI de bienestar (cero horas extra, define:119).

```ts
export const registrosHoras = pgTable('registros_horas', {
  id: uuid('id').primaryKey().defaultRandom(),
  personaId: uuid('persona_id').notNull().references(() => personas.id),
  fecha: date('fecha').notNull(),
  rol: rolCompensacionEnum('rol').notNull(),
  horasNormales: numeric('horas_normales', { precision: 5, scale: 2 }).notNull().default('0'),
  horasExtra: numeric('horas_extra', { precision: 5, scale: 2 }).notNull().default('0'),
  observacion: text('observacion'),
})
```

**Eventos:** E-31 (base por horas del auxiliar), E-47 (KPI bienestar). **Restricción:** único `(persona_id, fecha)` — una persona, un registro por día. **Relaciones:** N—1 `personas`.

### 9. `registros_gate_caja` — E-20 rama negativa (bloqueante, D1)

> El gate de caja es COMPLETAMENTE BLOQUEANTE (D1): el pago a proveedor no ocurre sin caja real; lo resuelve el gerente moviendo cronogramas; "el sistema registra y recalcula" (define:87,136,154; discover:73). Esta tabla es la traza auditable de la rama negativa.

```ts
export const registrosGateCaja = pgTable('registros_gate_caja', {
  id: uuid('id').primaryKey().defaultRandom(),
  ordenCompraId: uuid('orden_compra_id').notNull().references(() => ordenesCompra.id),
  fecha: timestamp('fecha').notNull().defaultNow(),
  montoSolicitado: numeric('monto_solicitado', { precision: 14, scale: 2 }).notNull(), // decimal
  saldoDisponible: numeric('saldo_disponible', { precision: 14, scale: 2 }).notNull(), // decimal
  bloqueado: boolean('bloqueado').notNull().default(true),
  decision: text('decision'),     // decisión del gerente: mover cronograma / liberar / esperar (D1, define:136)
  resolucion: text('resolucion'),
})
```

**Eventos:** E-20 (bloqueo), E-33 (recalculo disparado por el bloqueo — causa externa "dinero", define:87), E-43 (lectura de caja que fundamenta la decisión).

---

## Gate E-20 — campos/checks que lo materializan

| Capa | Qué lo materializa | Fuente |
|---|---|---|
| **Check** | Antes de transicionar OC `en_pago → pagada` (y de insertar el movimiento), se lee `cuentas_financieras.saldo_actual` (mantenido transaccionalmente por `registrarMovimiento`, acciones:96-101) y se exige `saldo_actual ≥ monto_pago` | define:87,136; discover:73 |
| **Enforcement** | El estado de la OC no transiciona sin el guard (máquina de estados con guard, define:71). El patrón transaccional a replicar es el de `acciones.ts:57-128` | define:71 |
| **Rama negativa** | Si el check falla: NO hay movimiento ni transición; se inserta `registros_gate_caja` (bloqueado=true, saldo real) y el cronograma se recalcula vía E-33 con causa externa/dinero → `desfases` | define:87,136; discover:73,113 |
| **Prioridad** | `movimientos_financieros.prioridad_pago` (materiales → arriendos → nóminas) ordena qué se paga cuando la caja no alcanza | logica:358; discover:73 |
| **Veracidad de la caja** | Un solo origen de verdad: `saldo_actual` almacenado, actualizado en la misma transacción del movimiento (evita P3-12, define:117). E-43 lee este saldo | define:117; discover:117 |

---

## IVA / Retención — modelado

| Concepto | Modelado | Fuente |
|---|---|---|
| **IVA de proyecto/cotización** | `proyectos.aplica_iva` (bool) + `proyectos.porcentaje_iva` numeric(5,2) (default 19) + base = subtotal; fórmula `iva = subtotal * pct/100` ya implementada en `calculo.ts:139`. **Ya existe, sin gap.** | schema.ts:104-105; calculo.ts:139 |
| **Coherencia IVA ↔ contrato** | `contratos.valor_total` = total con IVA (nace de `calcularTotalProyecto`); `validar_hitos` exige suma de hitos = `valor_total` (tolerancia 0.01) | schema.ts:188; validacion:37-43 |
| **Diseño 3D facturado DIAN** | `bruto_diseno_3d` = $130.000 (parámetro); `iva_diseno_3d_pct` = 19 (estimado). El servicio sube de precio porque se factura | logica:225; discover:43 |
| **Neto del diseñador (retención)** | Parámetros `retencion_disenador_pct` y `iva_diseno_3d_pct`; **neto = columna calculada en código** desde `bruto_diseno_3d × (1 − retención_pct/100)`, nunca persistida (evita drift P3-12). El tratamiento "± IVA" y el valor real de la retención quedan `DECISION_PENDIENTE` — pendiente de validación con el contador | define:128,145; logica:225 |
| **Porcentajes de comisión** | `parametros_compensacion` con unidad `'porcentaje'`, numeric(5,2) — mismos patrón y escala que `porcentaje_iva` | schema.ts:105; log:69 |

---

## Tabla de reglas de compensación y su modelado

| Rol | Regla (valor resuelto) | Fuente | Modelado |
|---|---|---|---|
| **Desarrollador** | Desarrollo aparte + mano de obra aparte + **5% por cumplimiento de cronograma** (KPI 4 semanas); pago por quincena e hitos; si se desfasa, se resta | logica:220; define:178; discover:103 | `parametros_compensacion.comision_desarrollador_pct`=5; `liquidaciones_compensacion` tipo `quincena`/`proyecto`; `comisiones_proyecto` tipo `cumplimiento_cronograma`, base=`contratos.valor_total`; desfase interno (E-33/E-59) → `estado='ajustada'` + `desfase_id` |
| **Carpintero** | **5% por tamaño del proyecto** + comisión por módulo instalado si cumple cronograma (simétrico al desarrollador) | define:144,162,178; logica:221 | `parametros_compensacion.comision_carpintero_pct`=5 (tipo `tamano`); `comisiones_proyecto` tipo `modulo_instalado` (`monto_fijo × cantidad_modulos` — monto `DECISION_PENDIENTE`); mismo disparo KPI 4 semanas |
| **Diseñador** | **$130k por diseño 3D** + comisión por cierre | logica:219,225; discover:43 | `parametros_compensacion.bruto_diseno_3d`=130000; `liquidaciones_compensacion` tipo `diseno_3d`; comisión de cierre: `DECISION_PENDIENTE` (% no definido) |
| **Neto del diseñador** | Bruto − retención ± IVA (parámetro configurable) | define:128,145,162; log:69 | `parametros_compensacion.retencion_disenador_pct` + `iva_diseno_3d_pct`; neto calculado en código (no persistido) |
| **Auxiliar** | Tiempo (horas + extras) + comisión por módulo instalado si cumple cronograma | logica:222; discover:103 | `registros_horas` (normales/extra) + `liquidaciones_compensacion` tipo `horas`; comisión por módulo: `DECISION_PENDIENTE` |
| **Comercial** | Comisión por **ventas**, NO por producción (sin conflicto de interés) | define:22; discover:103,116; logica:259 | `comisiones_proyecto` tipo `venta`, desacoplada de `desfase_id`; % `DECISION_PENDIENTE` |
| **Deducción diseño 3D (E-30)** | El anticipo final descuenta lo ya pagado — sistema, no memoria | discover:102; logica:460; define:90 | `obligaciones_pendientes.deduccion_diseno_3d` sobre la obligación del primer hito; nunca toca `contratos.valor_total` |
| **Micro cuenta de cobro (E-32)** | Autogenerada por registro transaccional del socio | discover:105; logica:381-384 | `liquidaciones_compensacion.cuenta_cobro_url` (documento generado, no tabla nueva) |
| **Arriendos (E-57)** | Tercer flujo de pago; prioridad tras materiales | discover:104; logica:358 | `obligaciones_pendientes` con `origen='arriendo'` + `periodicidad='mensual'`; movimiento egreso |

---

## Hallazgos

| ID | Tipo | Descripción | Fuente (archivo:línea) |
|---|---|---|---|
| H1 | GAP_SCHEMA | Faltan `ordenes_compra` + `items_orden_compra` (E-19/E-20/E-45, 3 mecánicas de pago) | discover:72-73,75; logica:352 |
| H2 | GAP_SCHEMA | Falta `parametros_compensacion` (valores resueltos I-054 como configuración) | define:128,144-145,162; log:69 |
| H3 | GAP_SCHEMA | Faltan `liquidaciones_compensacion` + `comisiones_proyecto` (E-31/E-35, nómina compuesta P3-04) | discover:103,116; define:22,178 |
| H4 | GAP_SCHEMA | `movimientos_financieros` sin `socio_id` (E-58 cuenta por socio; cuenta de cobro del diseñador de E-08) | discover:105-106; define:120 |
| H5 | GAP_SCHEMA | `movimientos_financieros` sin `orden_compra_id` ni `comprobante_url` (E-20) | discover:73 |
| H6 | GAP_SCHEMA | `movimientos_financieros` sin `medio_pago` ni `prioridad_pago` (política "no acumular deuda", 3 flujos) | logica:88,358; discover:73 |
| H7 | GAP_SCHEMA | `obligaciones_pendientes` sin `origen`, `hito_id`, `deduccion_diseno_3d` (E-56/E-30) | discover:98,102; define:90,122 |
| H8 | GAP_SCHEMA | Obligación sin estado `atrasada` (E-29 marca atraso) | discover:101 |
| H9 | NORMALIZACION | `fecha`/`fecha_vencimiento` como `text` impiden la aritmética de fechas del atraso de 12 días (E-29) y agregaciones de caja; proponer `date`/`timestamp` (decidir en A2-1) | schema.ts:244,260; discover:101 |
| H10 | GAP_SCHEMA | Falta `facturas` (registro de lo emitido en "Aliado") para el dashboard "contratos pendientes de facturar" | logica:386-393 |
| H11 | GAP_SCHEMA | Falta `registros_horas` (base por horas del auxiliar + KPI bienestar V-5 automático) | logica:222; define:142 |
| H12 | GAP_SCHEMA | Falta `registros_gate_caja` (traza auditable de la rama negativa del gate E-20) | define:87,136; discover:73 |
| H13 | DECISION_PENDIENTE | % de comisión por cierre (comercial por ventas y diseñador) sin número en las fuentes | logica:219; define:22 |
| H14 | DECISION_PENDIENTE | Monto/forma de la comisión por módulo instalado (carpintero y auxiliar) sin definir | logica:221-222 |
| H15 | DECISION_PENDIENTE | Valor real de la retención del diseñador y tratamiento ± IVA (validar con el contador) | define:128,145; logica:225 |
| H16 | DECISION_PENDIENTE | Tarifa hora del auxiliar y quincena del desarrollador sin números | logica:220,222 |
| H17 | DECISION_PENDIENTE | Base del 5% "por tamaño": recomendación `contratos.valor_total`; confirmar si sobre subtotal o total con IVA | logica:265; define:144 |
| H18 | RUIDO_SCHEMA (evitado) | NO crear tablas `recibos` ni `cuentas_socios` con saldo almacenado (recrean el drift de P3-12) | discover:100; define:117 |
| H19 | CORRECCION_SCHEMA | La deducción del diseño 3D no debe restarse de `contratos.valor_total` (rompe `validar_hitos`); se modela en la obligación del anticipo | schema.ts:188; validacion:37-43; logica:460 |
| H20 | DIFERIDO | Visibilidad de declaraciones DIAN (`declaraciones_dian`) — lente de impuestos, capa de lectura | logica:391 |
| H21 | DIFERIDO | Integración profunda con "Aliado" (facturación electrónica) — solo registro del hecho en capa 1 | logica:386-393 |
| H22 | DIFERIDO | Snapshot congelado de la propuesta entre E-09/E-11 (P3-07) — el valor que firma el contrato ya queda congelado en `contratos.valor_total`; el resto lo define el lente de datos (A1-5) | schema.ts:188; discover:45 |
| H23 | CORRECCION_SCHEMA (dependencia) | Comisiones/liquidaciones/movimientos referencian `personas` (rol-vs-persona). **No existe tabla `personas` todavía** — precondición de capa 1, la define A1-3 | define:57-61,176 |

---

## Notas para el Orquestador

1. **Consistencia con lo construido:** las tablas financieras de t-008..t-022 (`cuentas_financieras`, `movimientos_financieros`, `obligaciones_pendientes`, `hitos_pago`, `contratos`) se respetan como fuente de verdad; esta propuesta solo las AMPLÍA con columnas de traza (socio, OC, origen, deducción) y conserva el patrón transaccional de `acciones.ts:57-128` y el recálculo por SUM.
2. **Dependencias cruzadas con otros pases:** `personas` (A1-3, H23), `desfases` (A1-2/A1-5, usado por `comisiones_proyecto.desfase_id`), `desfases`/E-33 y el enforcement de la máquina de estados (A1-2, gate E-20), snapshot de propuesta (A1-5, H22). **El Orquestador debe verificar que la tabla `personas` y `desfases` existan en el pase A1-3/A1-2; si no, estos FKs quedan huérfanos.**
3. **H9 (NORMALIZACION de fechas)** toca tipos de columnas existentes (`movimientos_financieros.fecha`, `obligaciones_pendientes.fecha_vencimiento`) — es candidata a resolver en A2-1 (normalización), NO debe aplicarse suelta en este pase.
4. **DECISION_PENDIENTE para el Supervisor (ninguna bloquea el modelado):** % comisión por cierre (H13), comisión por módulo instalado (H14), retención/IVA del diseñador (H15), tarifa hora/quincena (H16), base del 5% (H17). Todas se modelan como parámetros con valor vacío/estimado — el motor de comisiones y el neto del diseñador quedan funcionales con los valores resueltos (5%, $130k).
5. **Verificación del goal de A1:** este pase deja el lente de dinero con trazabilidad evento→tabla→columna para E-08, E-19, E-20, E-27, E-28, E-29, E-30, E-31, E-32, E-35, E-43, E-56, E-57, E-58 (14 eventos monetarios), además de los puntos de contacto E-11/E-12/E-16/E-33/E-59.
