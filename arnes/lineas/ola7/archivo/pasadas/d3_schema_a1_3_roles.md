# Pase A1-3 — Schema por roles (subagente, loop de 3 iteraciones)

Lente: **schema por roles y permisos**. Objetivo: proponer el schema de identidad/acceso (usuarios, roles, permisos, asignación de roles) derivado de los roles de negocio reales del ERP y de la matriz roles×gates del Define, consistente con `lib/db/schema.ts`.

---

## Iteración 1 (bruta)

### Roles que aparecen en las fuentes (sin filtro, enumeración cruda)

De `diamante2_define_eventos.md` §3 (rol-vs-persona) salen los roles tipados **explícitos**:

> "Roles tipados: comercial, diseñador, desarrollador, carpintero, auxiliar, instalador, gerente, **verificador** (rol asignado por despacho a UNA persona, I-035)." — `diamante2_define_eventos.md:59`

Del inventario de eventos (`diamante2_discover_eventos.md`) emergen los **actores** que disparan cada evento (columna "Dispara"), donde además aparecen **compras** (E-19, E-20), **taller** (E-45), **cliente** (E-08, E-13, E-26, E-36, E-44, E-55), **sistema/IA** (E-27, E-30, E-31, E-35, E-40, E-42, E-47, E-50, E-52, E-56, E-59, E-60, E-32, E-58) y actores mixtos (E-15 "comercial + desarrollador", E-22 "desarrollador distribuye a auxiliares").

Del mapa maestro (`logica_de_negocio.md`) salen roles adicionales sin evento propio de capa 1: **contador** (dashboard, mapa:390-391), **fotógrafo/creador de contenido** y **diseñador de producto** (mapa:397, 329).

El schema existente hoy solo modela **4 roles** en un enum de un solo valor:

```ts
rolEmpleadoEnum: 'admin' | 'comercial' | 'taller' | 'finanzas'
// lib/db/schema.ts:27-32, aplicado en usuarios.rolEmpleado (schema.ts:69)
```

### Nota clave del Define que el schema actual NO materializa

- **Rol-vs-persona** (`diamante2_define_eventos.md:57`): "el sistema modela **roles tipados** y **personas** por separado; la asignación persona→rol es explícita, y **una persona puede ocupar varios roles** (hoy comercial = diseñador, el solapamiento real que P4-F1 destapó). Los guards de autorización se evalúan contra el **rol**, nunca contra la persona."
- Mismo principio en el mapa: "el sistema modela ROLES (desarrollador, auxiliar de taller, verificador de calidad, comercial), nunca personas específicas" — `logica_de_negocio.md:438`.
- Y el propio mapa anticipa que el schema actual se queda corto: "hoy `usuarios.rol_empleado` solo tiene `admin | comercial | taller | finanzas`, y ya es visible que eso va a quedarse corto" — `logica_de_negocio.md:397`.

### Cruda de la matriz roles × gates

| Gate | Guard del Define | Rol(es) del guard |
|---|---|---|
| E-18 check de schema pre-compras | veredicto del **verificador único = el comercial vendedor** (D3) | comercial (designado) — `diamante2_define_eventos.md:75,153` |
| E-21 recepción triple verificación | checklist de la lista de compra esperada → `recibido_verificado` | **desarrollador** ejecuta la triple verificación — `diamante2_define_eventos.md:76`; `diamante2_discover_eventos.md:74` |
| E-23 citación de calidad | push Taller→Calidad, señal, no bloquea | subsistema desarrollo-taller empuja, **comercial espera** — `diamante2_discover_eventos.md:82` |
| E-24 veredicto pre-despacho | veredicto del **verificador único = el comercial** (D3) | comercial (designado) — `diamante2_define_eventos.md:78,153` |
| E-33 cambio de cronograma con causa | determinante = composición causal de dependencias; decisión manual justificada si hace falta | sistema (cálculo) + **gerente/comercial** (decisión manual) — `diamante2_define_eventos.md:79`; `diamante2_discover_eventos.md:113` |
| E-20 gate de caja | **completamente bloqueante**; la respuesta es del gerente, que mueve cronogramas | gerente — `diamante2_define_eventos.md:87` |

### Cruda del cliente externo

Ya existe modelado en `lib/db/schema.ts` + `app/api/auth/*`:
- `usuarios.tipo = 'cliente'` con `usuarios.clienteId` FK a `clientes` (`lib/db/schema.ts:64-75, 77-87`).
- Autoregistro con email+password, vínculo a `clientes` por email/documento, sin cola de revisión (`app/api/auth/registro/route.ts:38-91`; decisión en `arnes/planes/plan_arquitectura_destino.md:72`).
- Password con bcrypt salt 12 (`lib/auth/password.ts:3-11`).
- Sesión iron-session, cookie `erp_session` httpOnly (`lib/auth/session.ts:17-35`).
- Portal `/cuenta` con aislamiento por `clienteId` (nunca traer un registro por id sin el filtro) (`lib/modules/cuenta/queries.ts:53-88`).

---

## Iteración 2 (autocrítica)

### Qué cae y por qué

1. **"Calidad" como rol tipado permanente → CAE.** D3 resuelto por el Supervisor: el verificador es **una sola persona designada por despacho — el comercial vendedor del proyecto, punto. No es un pool ni una separación forzosa por persona, y no es el gerente** (`diamante2_define_eventos.md:153`, `log_insights_fase2.md:49` I-035 y `:50` I-043). El rol "verificador" del §3 del Define no es un puesto permanente: es una **designación por despacho** que recae en el comercial. Se materializa como columna `proyectos.verificador_id` + registro de veredictos, no como fila en `roles`.
2. **"Verificador" como rol permanente → CAE** por lo mismo (designación, no puesto). Mantengo la capacidad de "verificar" asociada a la designación, con registro auditable.
3. **"Logística / entrega" como rol → CAE.** No existe en las fuentes. El instalador ejecuta instalación (E-25), acta (E-26 con cliente+empresa), garantía (E-37) y check de completitud (E-61) — `diamante2_discover_eventos.md:90,91,127,126`. "Entrega/Instalación" es un bounded context (`diamante2_define_eventos.md:43`), no un rol.
4. **"Soporte / garantía" como rol → CAE.** Misma razón: lo ejecuta el instalador (`diamante2_discover_eventos.md:126,127`).
5. **"Compras" como rol tipado → AMBIGÜEDAD, no invento.** E-19/E-20 disparan "compras/desarrollador" y "compras" (`diamante2_discover_eventos.md:72,73`), pero el mapa dice que la política de pago por prioridad y la lectura de caja la maneja el gerente (E-43 gerente, mapa:358 "el gerente siempre sabe cuánto dinero real tiene disponible"). No hay declaración de si "compras" es un puesto propio o una función del gerente. → `DECISION_PENDIENTE` (ver Hallazgos).
6. **Marketing / fotógrafo de contenido / diseñador de producto → DIFERIDO.** Contexto Marketing/Demanda, Tienda web y Gobierno/Medición son **capa 2 / palanca de demanda (t-034)**, solo se diseñan sus interfaces de frontera — `diamante2_define_eventos.md:174`. No tienen eventos de capa 1 que exijan login hoy.
7. **"Sistema / IA" como rol humano → CAE.** Es un actor técnico (dispara E-50, E-59, E-60, E-56, E-35...), no un rol de negocio con login. Se registra en la auditoría como `rol_usado = 'sistema'`, no en `roles`.

### Qué sobrevive (roles de negocio con soporte en fuentes)

`comercial`, `gerente` (= admin actual, `lib/auth/destino.ts:10-22`), `desarrollador`, `diseñador`, `carpintero`, `auxiliar`, `instalador`, `contador` (solo lectura, mapa:390-391) + `cliente` externo (`tipo='cliente'`). Son exactamente los 8 tipados del Define (`diamante2_define_eventos.md:59`) + contador + cliente.

### Autocrítica del schema existente

- **`usuarios.rolEmpleado` es una NORMALIZACION rota frente al Define**: un solo rol por persona contradice el modelo rol-vs-persona ("una persona puede ocupar varios roles", `diamante2_define_eventos.md:57`; el solapamiento comercial=diseñador es real, P4-F1 `diamante2_discover_eventos.md:42`). El dinero real ya paga "por rol y no por persona" (`logica_de_negocio.md:340`). → hay que mover a N:N `usuarios_roles`.
- **La sesión guarda un rol único** (`lib/auth/session.ts:9`) y `requireEmpleado` evalúa un solo rol (`lib/auth/require-session.ts:19-26`). Con multi-rol: la sesión debe cargar **array de roles** y el guard chequear **intersección**. Es un cambio de firma, no de concepto.
- **La separación ejecutor-verificador del Define** ("el check es un acto del rol verificador, distinto del acto del rol ejecutor, aunque el actor físico sea el mismo" — `logica_de_negocio.md:290`) exige que el **registro de auditoría capture con qué rol se actuó**, no solo quién. El único patrón de "quién tocó" hoy es `tareas_produccion.operarioId` (`lib/db/schema.ts:225`); no hay auditoría general.
- **El cliente externo ya está bien resuelto** (verificación de Iteración 1 punto cliente). No se reinventa.

---

## Iteración 3 (refinamiento final)

### Decisiones de diseño del schema propuesto

1. **`roles` como tabla, no como enum.** El enum `rol_empleado` de 4 valores no alcanza y no es extensible sin migración. Una tabla `roles` con `codigo` único permite los 8+ roles del Define y sumar (fotógrafo, diseñador de producto) sin tocar el schema. Difiere deliberadamente del patrón enum actual (`lib/db/schema.ts:27-32`) porque el Define exige N roles por persona.
2. **N:N `usuarios_roles`** con PK compuesta `(usuario_id, rol_id)`, `activo`, `asignado_en`, `asignado_por_id` (auditoría de quién asignó — lo hace un admin desde `/app/erp/equipo`, que ya es el patrón actual de creación de empleados: `lib/modules/equipo/queries.ts:29-50`).
3. **Deprecación de `usuarios.rolEmpleado`**: se conserva durante la migración para no romper `requireEmpleado`/`destino.ts`/`erp-nav.ts`, pero deja de ser fuente de verdad (se marca `RUIDO_SCHEMA` si queda vivo sin deprecarse).
4. **Designación del verificador por despacho (D3/I-035)**: columna `proyectos.verificador_id` (FK usuarios, nullable) + tabla `verificaciones` para los veredictos de E-18/E-24 con `tipo_gate` ('schema'|'calidad'). No se crea un rol "verificador".
5. **Auditoría de quién ejecutó cada evento**: tabla `registro_actividad` con `usuario_id`, `rol_usado` (crítico para la separación ejecutor-verificador), `accion` (E-XX), `entidad`, `entidad_id`, `detalle` (jsonb). El pase A2-3 (trazabilidad) la refina; acá se deja la columna vertebral. La causa de E-33 ya es "dato auditable" por definición (`diamante2_define_eventos.md:79`).
6. **Cliente externo**: no cambia el modelo existente. Se confirma `tipo='cliente'` + `clienteId` + bcrypt + iron-session + `/cuenta` con aislamiento. Para la tienda (E-44), `pedidosWeb.clienteId` ya es FK notNull (`lib/db/schema.ts:306`): el pedido lo dispara un cliente autenticado con la MISMA sesión — esto también resuelve en parte el vínculo tienda→ERP de P3-11 (`diamante2_discover_eventos.md:147`).

---

## Entregable: schema de identidad y matriz de roles

### 1. Inventario de roles de negocio del ERP (soportados por las fuentes)

| # | Rol (código) | Soporte en fuentes (archivo:línea) | Eventos que dispara | Observación |
|---|---|---|---|---|
| 1 | `comercial` | define:59; discover E-02/E-03/E-04/E-05/E-06/E-07/E-10/E-11/E-12/E-15/E-16/E-29/E-36/E-41/E-52/E-53/E-60 | Embudo, cotización, contrato, retoma, cobro, garantía, captura de doc | Rol más cargado (P4-F5, discover:33). Doble función: vendedor + **verificador designado** (D3). |
| 2 | `gerente` | define:59; discover E-43, E-47, E-57; define:87 (E-20), define:135 (SLA E-34) | Caja, KPIs, arriendos, gate de caja, escalaciones | Mapea al `admin` actual (`lib/auth/destino.ts:11-13`). Decide en E-33 manual. |
| 3 | `desarrollador` | define:59; discover E-15/E-17/E-19/E-21/E-22/E-41/E-54 | Retoma, desarrollo técnico, BOM, recepción triple, distribución, reproceso | Ejecutor de E-21; responsable de la rama negativa de E-18 (reproceso, define:75). |
| 4 | `diseñador` | define:59; discover E-48; define:120 (E-08→E-31/E-32 cuenta por socio) | Diseño 3D | Su cuenta de cobro nace en Finanzas (E-08/E-32, discover:43,105). Compensación E-31 (define:162). |
| 5 | `carpintero` | define:59; discover E-31 (compensación, discover:103); logica_de_negocio.md:221 | — (capa 2 E-22) | Compensación 5% por tamaño (I-054, log_insights_fase2.md:69). Sin pantallas de capa 1 (define:170). |
| 6 | `auxiliar` | define:59; discover E-22 (discover:81), E-31 (discover:103) | — (capa 2 E-22) | Compensación horas + comisión por módulo. Sin pantallas de capa 1. |
| 7 | `instalador` | define:59; discover E-25/E-37/E-61 (discover:90,127,126) | Instalación, orden de garantía, check de completitud | Cubre el contexto Entrega/Instalación + Garantía. |
| 8 | `contador` | logica_de_negocio.md:390-391 | — | Solo lectura: dashboard de finanzas + contratos pendientes de facturar. `DECISION_PENDIENTE` sobre alcance exacto (H9). |
| 9 | `cliente` (externo) | `lib/db/schema.ts:34,64-75`; registro/route.ts:38-91; discover E-08/E-13/E-26/E-36/E-44/E-55 | Pago diseño, firma, acta, garantía, pedido tienda, testimonio | No es un rol de `roles`; es `usuarios.tipo='cliente'`. Ve solo frontstage (E-60) y su propia data. |
| — | `compras` | discover E-19/E-20/E-45 (discover:72,73,75) | Pedido, pago a proveedor, reposición | **`DECISION_PENDIENTE`**: ¿rol tipado o función del gerente? (H6). |
| — | `verificador` | define:59,75,153; I-035/I-043 | E-18/E-24 (veredicto) | NO es rol permanente: designación por despacho = el comercial vendedor (D3). Se materializa como `proyectos.verificador_id`. |
| — | `sistema`/IA | discover E-50/E-52/E-56/E-59/E-60/E-35 | Automatizaciones | Actor técnico, se registra como `rol_usado='sistema'` en auditoría, no en `roles`. |
| — | `marketing` / `fotógrafo` / `diseñador de producto` | logica_de_negocio.md:329,397; define:174 | — | `DIFERIDO` (palanca de demanda t-034, sin eventos de capa 1). |

### 2. Tablas propuestas (estilo Drizzle, consistente con `lib/db/schema.ts`)

```ts
// ── Identidad / roles ─────────────────────────────────────────────────────

// Reemplaza a rolEmpleadoEnum ('admin'|'comercial'|'taller'|'finanzas',
// schema.ts:27-32) como fuente de verdad de roles. Tabla, no enum, porque el
// Define exige N roles por persona (diamante2_define_eventos.md:57) y roles
// extensibles (fotógrafo, diseñador de producto — logica_de_negocio.md:397).
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigo: text('codigo').notNull().unique(),
  // codigos soportados por las fuentes: 'comercial', 'gerente',
  // 'desarrollador', 'disenador', 'carpintero', 'auxiliar', 'instalador',
  // 'contador' (diamante2_define_eventos.md:59; logica_de_negocio.md:390).
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
})

// Asignacion persona→rol (modelo rol-vs-persona, define:57). PK compuesta:
// una persona ocupa varios roles (hoy comercial = disenador, P4-F1).
export const usuariosRoles = pgTable('usuarios_roles', {
  usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  rolId: uuid('rol_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  activo: boolean('activo').notNull().default(true),
  asignadoEn: timestamp('asignado_en').notNull().defaultNow(),
  asignadoPorId: uuid('asignado_por_id').references(() => usuarios.id), // admin que asignó
}, (t) => [{ primaryKey: { columns: [t.usuarioId, t.rolId] } }])

// ── Designacion del verificador unico por despacho (D3, I-035) ───────────
// En `proyectos` (schema.ts:91-109) se agrega:
//   verificadorId: uuid('verificador_id').references(() => usuarios.id),
// ("una sola persona designada por despacho — el comercial vendedor",
//  diamante2_define_eventos.md:153). Nullable: solo se asigna al llegar a
// desarrollo (E-15/E-17), antes de E-18.

// Veredictos de los gates con verificador (E-18 schema, E-24 calidad).
export const verificaciones = pgTable('verificaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  proyectoId: uuid('proyecto_id').notNull().references(() => proyectos.id),
  tipoGate: text('tipo_gate').notNull(), // 'schema' (E-18) | 'calidad' (E-24)
  verificadorId: uuid('verificador_id').notNull().references(() => usuarios.id),
  veredicto: text('veredicto').notNull(), // 'aprobado' | 'rechazado'
  detalle: text('detalle'), // rama negativa → dispara E-54
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
})

// ── Auditoria de quien ejecuto cada evento (enlaza con trazabilidad) ──────
// El unico patron actual de "quien toco" es tareas_produccion.operarioId
// (schema.ts:225). Se agrega la columna vertebral para el pase A2-3.
// `rolUsado` es obligatorio para la separacion ejecutor-verificador del
// Define ("el check es un acto del rol verificador, distinto del acto del rol
// ejecutor, aunque el actor fisico sea el mismo" — logica_de_negocio.md:290).
export const registroActividad = pgTable('registro_actividad', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id').references(() => usuarios.id),
  rolUsado: text('rol_usado'), // 'sistema' cuando lo dispara una automatizacion
  accion: text('accion').notNull(), // 'E-18' | 'E-21' | ... o nombre del evento
  entidad: text('entidad'), // bounded context / tabla
  entidadId: uuid('entidad_id'),
  detalle: jsonb('detalle').$type<Record<string, unknown>>(),
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
})
```

**Cambio de firma consecuente (no es tabla nueva, es contrato de sesión):**
- `lib/auth/session.ts:9`: `rolEmpleado?: ...` → `roles?: string[]` (array, multi-rol).
- `lib/auth/require-session.ts:24`: el guard pasa a intersección (`roles.some(r => rolesPermitidos.includes(r))`).
- `lib/auth/destino.ts:10-22` y `lib/erp-nav.ts:19-28`: derivar el módulo de destino desde el array (rol principal = el de mayor precedencia o el asignado primero).
- `lib/modules/equipo/queries.ts:14`: `rolEmpleado` pasa a `roles: string[]` al crear empleado.

### 3. Matriz roles × acciones de los gates

| Rol | Aprobar E-18 (schema) | Completar E-21 (recepción triple) | Recibir E-23 (citación calidad) | Veredicto E-24 (calidad) | Causa/decidir E-33 (cronograma) | Resolver E-20 (gate de caja) |
|---|---|---|---|---|---|---|
| `comercial` | ✅ **SÍ** (verificador designado, D3 — define:75,153) | ❌ | ✅ espera el push (discover:82) | ✅ **SÍ** (verificador designado, D3 — define:78) | ⚠️ decisión manual justificada con gerente (define:79) | ❌ |
| `gerente` | ❌ (D3: "no es el gerente", define:153) | ❌ | ❌ | ❌ | ✅ decide / valida manual (define:79,139) | ✅ **bloqueante, mueve cronogramas** (D1, define:87) |
| `desarrollador` | ❌ (reprocesa vía E-54 si rechazado — define:75) | ✅ ejecuta la triple verificación (define:76; discover:74) | ✅ empuja (subsistema desarrollo-taller, discover:82) | ❌ (reprocesa vía E-54 — discover:84) | ❌ (registra la novedad, define:79) | ❌ |
| `diseñador` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `carpintero` / `auxiliar` | ❌ (capa 2, define:170) | ❌ | ❌ | ❌ | ❌ | ❌ |
| `instalador` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `contador` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `cliente` | ❌ (nunca toca backstage; solo E-60 frontstage, discover:114) | ❌ | ❌ | ❌ | ❌ | ❌ |

**Matriz roles × entidades (mutar / ver):** solo se listan las relaciones que las fuentes soportan; lo que no está declarado queda `DECISION_PENDIENTE` (H8, transparencia por rol P6-01).

| Rol | Puede mutar | Puede ver |
|---|---|---|
| `comercial` | leads, proyectos (embudo → cotizado), contratos (borrador, E-12; firmar es del cliente E-13), cotizaciones, cuestionario de viajes (E-53), cobro con atraso (E-29), captura de documentación (E-41, D5 — define:138), citación de calidad registrada | proyecto completo hasta su venta + **progreso frontstage** (E-60, define:108); visibilidad de producción interna/caja **pendiente** (H8) |
| `gerente` | cronograma (vía E-33), pagos/arriendos (E-57), caja | caja real (E-43, define:87), KPIs operativos (E-47), todo el ERP (`lib/erp-nav.ts:20-27` admin) |
| `desarrollador` | schema de desarrollo/BOM (E-17), órdenes de armado (E-22), fila del taller (E-34/E-59, define:118), recepción (E-21), captura en retoma (E-41, D5) | lo suyo + transparencia de compras **pendiente** (H8) |
| `diseñador` | diseño 3D (E-48) | su cuenta de cobro/saldo (E-58, discover:106) |
| `carpintero` / `auxiliar` | — (capa 2) | — (capa 2, define:170) |
| `instalador` | instalación (E-25), orden de garantía (E-37), check de completitud (E-61) | su agenda/órdenes |
| `contador` | — (solo lectura) | dashboard finanzas + contratos pendientes de facturar (logica_de_negocio.md:390) |
| `cliente` | su propio pago (E-08), firma (E-13), acta (E-26), pedido tienda (E-44), testimonio (E-55), garantía (E-36) | SOLO su proyecto/contrato/hitos (aislamiento por `clienteId`, `lib/modules/cuenta/queries.ts:53-88`); nunca el de otro cliente |

### 4. Vinculación del usuario a los registros que toca (auditoría / trazabilidad)

- **Patrón vigente:** `tareas_produccion.operarioId` FK → `usuarios.id` (`lib/db/schema.ts:225`) — ejemplo de asignación persona→registro.
- **Propuesta:** columna `ejecutado_por_id`/`verificado_por_id` (FK usuarios) en las entidades de los gates (verificaciones ya la tiene como `verificador_id`), y la tabla transversal `registro_actividad` con `usuario_id` + `rol_usado` + `accion` (E-XX). Esto materializa:
  - la **causa auditable** de E-33 (`diamante2_define_eventos.md:79`), insumo de comisiones E-35;
  - el **rastreo de origen del reproceso** (D2: el culpable asume — proveedor/desarrollador/comercial, `diamante2_define_eventos.md:76`);
  - la **separación ejecutor-verificador** (con qué rol se actuó, `logica_de_negocio.md:290`);
  - la regla "el sistema es guía + registrador de la realidad" (D1 — si la guía no se cumple, avanza y **registra**, `diamante2_define_eventos.md:71`).
- El detalle fino de esta tabla es responsabilidad del pase **A2-3 (trazabilidad)**.

### 5. Cliente externo (cuenta para tienda/portal)

Ya construido y consistente; A1-3 lo **confirma**, no lo reinventa:

| Aspecto | Cómo está modelado hoy | Fuente |
|---|---|---|
| Identidad | `usuarios.tipo='cliente'` + `usuarios.clienteId` FK → `clientes` (el cliente de negocio se mantiene en `clientes`) | `lib/db/schema.ts:34,64-75,77-87` |
| Contraseña | `passwordHash` bcrypt, salt 12 | `lib/auth/password.ts:5-11`; `lib/db/schema.ts:67` |
| Auth | iron-session, cookie `erp_session` httpOnly, maxAge 7 días | `lib/auth/session.ts:17-35` |
| Registro | Autoregistro `/registro`, vínculo a `clientes` por email/documento, sin cola de revisión (requisito de la tienda sin fricción) | `app/api/auth/registro/route.ts:38-91`; `plan_arquitectura_destino.md:72` |
| Portal | `/cuenta` con aislamiento estricto por `clienteId` (404, nunca 403, ante registro ajeno) | `lib/modules/cuenta/queries.ts:53-88` |
| Tienda (E-44) | `pedidosWeb.clienteId` FK notNull → el pedido lo dispara un cliente autenticado con la misma sesión | `lib/db/schema.ts:304-313`; `diamante2_discover_eventos.md:147` |

Pendientes de decisión de negocio (no inventar): verificación de email y reset de contraseña **no están especificados en ninguna fuente** (H10), y el vínculo exacto tienda→ERP de P3-11 se resuelve reutilizando la sesión (H12).

---

## Hallazgos

| ID | Tipo | Descripción | Fuente (archivo:línea) |
|---|---|---|---|
| H1 | `GAP_SCHEMA` | `usuarios.rolEmpleado` (enum 4 valores) no materializa los 8 roles tipados del Define (comercial, diseñador, desarrollador, carpintero, auxiliar, instalador, gerente, verificador) + contador | `lib/db/schema.ts:27-32,64-75`; `diamante2_define_eventos.md:59` |
| H2 | `CORRECCION_SCHEMA` | Rol único por persona contradice el modelo rol-vs-persona del Define ("una persona puede ocupar varios roles"; hoy comercial=diseñador, P4-F1) → se requiere N:N `usuarios_roles` | `diamante2_define_eventos.md:57`; `diamante2_discover_eventos.md:42`; `logica_de_negocio.md:438` |
| H3 | `GAP_SCHEMA` | Faltan tablas `roles` y `usuarios_roles` (asignación explícita persona→rol, requisito de los guards del §4 del Define) | `diamante2_define_eventos.md:57-61,176` |
| H4 | `GAP_SCHEMA` | Falta la designación del verificador único por despacho (D3/I-035): columna `proyectos.verificador_id` + tabla `verificaciones` para E-18/E-24 | `diamante2_define_eventos.md:75,78,153`; `log_insights_fase2.md:49-50` |
| H5 | `GAP_SCHEMA` | No hay auditoría de "quién ejecutó cada evento"; único patrón actual es `tareas_produccion.operarioId`. La causa de E-33 es "dato auditable" por definición | `lib/db/schema.ts:225`; `diamante2_define_eventos.md:79` |
| H6 | `DECISION_PENDIENTE` | ¿"compras" es un rol tipado propio o una función del gerente? E-19/E-20 disparan "compras", pero caja/pagos los maneja el gerente (E-43, política de prioridad) | `diamante2_discover_eventos.md:72,73,75,117`; `logica_de_negocio.md:358` |
| H7 | `DIFERIDO` | Marketing/fotógrafo de contenido/diseñador de producto: sin eventos de capa 1 (palanca de demanda t-034); solo interfaces de frontera | `diamante2_define_eventos.md:174`; `logica_de_negocio.md:329,397` |
| H8 | `DECISION_PENDIENTE` | Transparencia por rol (P6-01): ¿qué ve el comercial/desarrollador del cronograma interno y de caja/compras? El mapa dice que la transparencia de compras es gobernanza de la sociedad | `diamante2_discover_eventos.md:117`; `logica_de_negocio.md:360` |
| H9 | `DECISION_PENDIENTE` | Contador: rol de solo lectura con login propio, ¿o vista sin sesión? (dashboard de finanzas + contratos pendientes de facturar) | `logica_de_negocio.md:390-391` |
| H10 | `DECISION_PENDIENTE` | Verificación de email y reset de contraseña: no especificados en ninguna fuente (ni para empleados ni para clientes) | `app/api/auth/registro/route.ts:38-91` (no los implementa); `app/api/auth/login/route.ts:23-31` |
| H11 | `RUIDO_SCHEMA` | `usuarios.rolEmpleado` y `rolEmpleadoEnum` quedan como fuente de verdad duplicada si no se deprecan al migrar a `usuarios_roles` | `lib/db/schema.ts:27-32,69`; `lib/modules/equipo/queries.ts:14` |
| H12 | `DECISION_PENDIENTE` | P3-11: identidad del cliente en tienda sin relación tipada al ERP. Se resuelve en parte reutilizando la sesión (`pedidosWeb.clienteId` notNull); falta decidir si se admiten pedidos anónimos | `diamante2_discover_eventos.md:147`; `lib/db/schema.ts:306` |
| H13 | `NORMALIZACION` | Sesión guarda rol único (`session.user.rolEmpleado`) y `requireEmpleado` evalúa un solo rol → con multi-rol hay que migrar a array e intersección | `lib/auth/session.ts:9`; `lib/auth/require-session.ts:19-26`; `lib/auth/destino.ts:10-22` |
| H14 | `NORMALIZACION` | El modelo "verificador" como rol permanente duplicaría al comercial designado; se resuelve como designación por despacho, no como rol | `diamante2_define_eventos.md:153`; `log_insights_fase2.md:49` |

---

## Notas para el Orquestador

- **Rol-vs-persona es precondición de capa 1** (`diamante2_define_eventos.md:176`): el schema de identidad (H2/H3/H4) debe ir antes de cualquier guard de UI.
- Este pase **extiende** `lib/db/schema.ts` (no lo contradice): conserva `usuarios`, `clientes`, `tipo_usuario`, timestamps y el patrón uuid/FK; solo reemplaza la fuente de verdad de roles (H1/H2/H11) y agrega `verificaciones` + `registro_actividad`.
- **Enlaces a otros pases:** la tabla `verificaciones` (gates E-18/E-24) y la recepción triple E-21 son competencia del pase A1-2 (enforcement); el detalle de `registro_actividad` del pase A2-3 (trazabilidad); los permisos finos por módulo/UI del pase B4-2 (roles×gates). Este pase entrega la columna vertebral de identidad, no el detalle de enforcement.
- **Decisiones que requieren Supervisor (bloqueadas para el grafo):** H6 (¿rol compras?), H8 (visibilidad por rol), H9 (contador), H10 (verificación de email/reset), H12 (pedidos anónimos de tienda). Se registran en el ledger como `esperando_humano` sin detener el grafo, aplicando el mejor juicio documentado.
- **Roles encontrados (resumen para el Orquestador):** comercial, gerente, desarrollador, diseñador, carpintero, auxiliar, instalador, contador (8 roles tipados) + cliente externo (`tipo='cliente'`). Diferenciados por no ser roles: verificador (designación), sistema (actor técnico), compras (pendiente H6), marketing/fotógrafo/diseñador de producto (diferido H7).
