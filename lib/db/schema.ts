import { pgTable, uuid, text, integer, timestamp, foreignKey, unique, numeric, boolean, jsonb, pgEnum, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const estadoContrato = pgEnum("estado_contrato", ['borrador', 'firmado'])
export const estadoProyecto = pgEnum("estado_proyecto", ['activa', 'enviada', 'en_contrato', 'pre_produccion', 'produccion', 'entregado', 'perdida', 'cancelada', 'retoma'])
export const rolEmpleado = pgEnum("rol_empleado", ['admin', 'comercial', 'desarrollador', 'compras', 'taller', 'finanzas', 'supervisora_qa'])
export const tipoHitoPago = pgEnum("tipo_hito_pago", ['percentage', 'fixed'])
export const tipoProyecto = pgEnum("tipo_proyecto", ['personalizado', 'producto_fijo'])
export const tipoUsuario = pgEnum("tipo_usuario", ['empleado', 'cliente'])


// ── F0 · Cimientos — identidad, roles y auditoría ────────────────────────

export const roles = pgTable("roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: text().notNull(),
	nombre: text().notNull(),
	descripcion: text(),
}, (table) => {
	return {
		rolesCodigoUnique: unique("roles_codigo_unique").on(table.codigo),
	}
});

export const personas = pgTable("personas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: text().notNull(),
	documento: text(),
	telefono: text(),
	activo: boolean().default(true).notNull(),
});

export const personasRoles = pgTable("personas_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	personaId: uuid("persona_id").references(() => personas.id),
	rolId: uuid("rol_id").references(() => roles.id),
	activo: boolean().default(true).notNull(),
	desde: timestamp("desde", { mode: 'string' }).defaultNow().notNull(),
});


export const leads = pgTable("leads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: text().notNull(),
	telefonoWhatsapp: text("telefono_whatsapp"),
	email: text(),
	utmSource: text("utm_source"),
	utmMedium: text("utm_medium"),
	utmCampaign: text("utm_campaign"),
	scoreConversion: integer("score_conversion").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const contratos = pgTable("contratos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	codigoContrato: text("codigo_contrato").notNull(),
	fechaContrato: text("fecha_contrato"),
	contratanteDomicilio: text("contratante_domicilio"),
	plazoEjecucionTexto: text("plazo_ejecucion_texto").default('4 a 5'),
	holguraDias: integer("holgura_dias").default(8),
	garantiaAnios: integer("garantia_anios").default(2),
	objetoItems: text("objeto_items"),
	especificacionesEstructura: text("especificaciones_estructura"),
	especificacionesHerrajes: text("especificaciones_herrajes"),
	especificacionesMesones: text("especificaciones_mesones"),
	condicionesDesmonte: text("condiciones_desmonte"),
	valorTotal: numeric("valor_total", { precision: 14, scale:  2 }).notNull(),
	estado: estadoContrato().default('borrador').notNull(),
	emailAsunto: text("email_asunto"),
	emailCuerpo: text("email_cuerpo"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		contratosProyectoIdProyectosIdFk: foreignKey({
			columns: [table.proyectoId],
			foreignColumns: [proyectos.id],
			name: "contratos_proyecto_id_proyectos_id_fk"
		}),
		contratosCodigoContratoUnique: unique("contratos_codigo_contrato_unique").on(table.codigoContrato),
	}
});

export const espacioVariantes = pgTable("espacio_variantes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	nombreEspacio: text("nombre_espacio").notNull(),
	nombreVariante: text("nombre_variante").default('Inicial'),
	descripcion: text(),
	activa: boolean().default(false).notNull(),
	visiblePdf: boolean("visible_pdf").default(true).notNull(),
	orden: integer().default(0),
	jornadasDesarrolloTecnico: numeric("jornadas_desarrollo_tecnico", { precision: 8, scale:  2 }).default('0'),
	jornadasEnsamblajeTaller: numeric("jornadas_ensamblaje_taller", { precision: 8, scale:  2 }).default('0'),
	jornadasInstalacionObra: numeric("jornadas_instalacion_obra", { precision: 8, scale:  2 }).default('0'),
	colores: jsonb().default([]),
	fotosEspacio: jsonb().default([]),
	fotosDisenio: jsonb().default([]),
	fotosReferencia: jsonb().default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		espacioVariantesProyectoIdProyectosIdFk: foreignKey({
			columns: [table.proyectoId],
			foreignColumns: [proyectos.id],
			name: "espacio_variantes_proyecto_id_proyectos_id_fk"
		}),
	}
});

export const hitosPago = pgTable("hitos_pago", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contratoId: uuid("contrato_id").notNull(),
	orden: integer().notNull(),
	tipo: tipoHitoPago().notNull(),
	montoOPorcentaje: numeric("monto_o_porcentaje", { precision: 14, scale:  2 }).notNull(),
	razon: text(),
	fechaLimite: text("fecha_limite"),
}, (table) => {
	return {
		hitosPagoContratoIdContratosIdFk: foreignKey({
			columns: [table.contratoId],
			foreignColumns: [contratos.id],
			name: "hitos_pago_contrato_id_contratos_id_fk"
		}),
	}
});

export const portfolioPublico = pgTable("portfolio_publico", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id"),
	titulo: text().notNull(),
	slug: text().notNull(),
	categoriaEspacio: text("categoria_espacio"),
	barrio: text(),
	publicado: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		portfolioPublicoProyectoIdProyectosIdFk: foreignKey({
			columns: [table.proyectoId],
			foreignColumns: [proyectos.id],
			name: "portfolio_publico_proyecto_id_proyectos_id_fk"
		}),
		portfolioPublicoSlugUnique: unique("portfolio_publico_slug_unique").on(table.slug),
	}
});

export const imagenesPortfolio = pgTable("imagenes_portfolio", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	portfolioId: uuid("portfolio_id").notNull(),
	imagenUrl: text("imagen_url").notNull(),
	descripcion: text(),
	orden: integer().default(0),
}, (table) => {
	return {
		imagenesPortfolioPortfolioIdPortfolioPublicoIdFk: foreignKey({
			columns: [table.portfolioId],
			foreignColumns: [portfolioPublico.id],
			name: "imagenes_portfolio_portfolio_id_portfolio_publico_id_fk"
		}),
	}
});

export const itemsVariante = pgTable("items_variante", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	varianteId: uuid("variante_id").notNull(),
	catalogoId: uuid("catalogo_id"),
	nombrePersonalizado: text("nombre_personalizado"),
	cantidad: numeric({ precision: 10, scale:  2 }).default('1').notNull(),
	precioUnitario: numeric("precio_unitario", { precision: 14, scale:  2 }).default('0').notNull(),
	totalLinea: numeric("total_linea", { precision: 14, scale:  2 }),
	anulado: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		itemsVarianteVarianteIdEspacioVariantesIdFk: foreignKey({
			columns: [table.varianteId],
			foreignColumns: [espacioVariantes.id],
			name: "items_variante_variante_id_espacio_variantes_id_fk"
		}),
		itemsVarianteCatalogoIdProductosCatalogoIdFk: foreignKey({
			columns: [table.catalogoId],
			foreignColumns: [productosCatalogo.id],
			name: "items_variante_catalogo_id_productos_catalogo_id_fk"
		}),
	}
});

// ── F3 · Retoma de medidas (P-07) — checklist de definición de proyecto ──────
export const espaciosArtefactos = pgTable("espacios_artefactos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	espacioVarianteId: uuid("espacio_variante_id").notNull(),
	categoria: text().notNull(),
	dimensionesMm: text("dimensiones_mm"),
	tipoSpecifique: text("tipo_specifique"),
	ubicacion: text(),
	fotoUrl: text("foto_url"),
	requiereVerificacion: boolean("requiere_verificacion").default(false).notNull(),
	validadoPor: uuid("validado_por"),
	validadoEn: timestamp("validado_en", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		espaciosArtefactosEspacioVarianteIdEspacioVariantesIdFk: foreignKey({
			columns: [table.espacioVarianteId],
			foreignColumns: [espacioVariantes.id],
			name: "espacios_artefactos_espacio_variante_id_espacio_variantes_id_fk"
		}),
	}
});

export const cuentasFinancieras = pgTable("cuentas_financieras", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: text().notNull(),
	tipo: text(),
	saldoInicial: numeric("saldo_inicial", { precision: 14, scale:  2 }).default('0'),
	saldoActual: numeric("saldo_actual", { precision: 14, scale:  2 }).default('0'),
});

export const movimientosFinancieros = pgTable("movimientos_financieros", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fecha: text().notNull(),
	descripcion: text(),
	tipo: text().notNull(),
	monto: numeric({ precision: 14, scale:  2 }).notNull(),
	estado: text().default('asentado').notNull(),
	cuentaOrigenId: uuid("cuenta_origen_id"),
	cuentaDestinoId: uuid("cuenta_destino_id"),
	obligacionId: uuid("obligacion_id"),
	proyectoId: uuid("proyecto_id"),
	contratoId: uuid("contrato_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		movimientosFinancierosCuentaOrigenIdCuentasFinancierasId: foreignKey({
			columns: [table.cuentaOrigenId],
			foreignColumns: [cuentasFinancieras.id],
			name: "movimientos_financieros_cuenta_origen_id_cuentas_financieras_id"
		}),
		movimientosFinancierosCuentaDestinoIdCuentasFinancierasI: foreignKey({
			columns: [table.cuentaDestinoId],
			foreignColumns: [cuentasFinancieras.id],
			name: "movimientos_financieros_cuenta_destino_id_cuentas_financieras_i"
		}),
		movimientosFinancierosObligacionIdObligacionesPendientesI: foreignKey({
			columns: [table.obligacionId],
			foreignColumns: [obligacionesPendientes.id],
			name: "movimientos_financieros_obligacion_id_obligaciones_pendientes_i"
		}),
		movimientosFinancierosProyectoIdProyectosIdFk: foreignKey({
			columns: [table.proyectoId],
			foreignColumns: [proyectos.id],
			name: "movimientos_financieros_proyecto_id_proyectos_id_fk"
		}),
		movimientosFinancierosContratoIdContratosIdFk: foreignKey({
			columns: [table.contratoId],
			foreignColumns: [contratos.id],
			name: "movimientos_financieros_contrato_id_contratos_id_fk"
		}),
	}
});

export const obligacionesPendientes = pgTable("obligaciones_pendientes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	descripcion: text().notNull(),
	tipo: text().notNull(),
	montoTotal: numeric("monto_total", { precision: 14, scale:  2 }).notNull(),
	montoPagado: numeric("monto_pagado", { precision: 14, scale:  2 }).default('0'),
	fechaVencimiento: text("fecha_vencimiento"),
	estado: text().default('pendiente').notNull(),
	clienteId: uuid("cliente_id"),
	proveedorId: uuid("proveedor_id"),
	proyectoId: uuid("proyecto_id"),
	contratoId: uuid("contrato_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		obligacionesPendientesClienteIdClientesIdFk: foreignKey({
			columns: [table.clienteId],
			foreignColumns: [clientes.id],
			name: "obligaciones_pendientes_cliente_id_clientes_id_fk"
		}),
		obligacionesPendientesProveedorIdProveedoresIdFk: foreignKey({
			columns: [table.proveedorId],
			foreignColumns: [proveedores.id],
			name: "obligaciones_pendientes_proveedor_id_proveedores_id_fk"
		}),
		obligacionesPendientesProyectoIdProyectosIdFk: foreignKey({
			columns: [table.proyectoId],
			foreignColumns: [proyectos.id],
			name: "obligaciones_pendientes_proyecto_id_proyectos_id_fk"
		}),
		obligacionesPendientesContratoIdContratosIdFk: foreignKey({
			columns: [table.contratoId],
			foreignColumns: [contratos.id],
			name: "obligaciones_pendientes_contrato_id_contratos_id_fk"
		}),
	}
});

export const clientes = pgTable("clientes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: text().notNull(),
	documento: text(),
	telefono: text(),
	email: text(),
	domicilio: text(),
	origen: text().default('manual'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const proveedores = pgTable("proveedores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: text().notNull(),
	nit: text(),
	categoria: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const ordenesTrabajo = pgTable("ordenes_trabajo", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	codigoOrden: text("codigo_orden").notNull(),
	estado: text().default('pendiente').notNull(),
	fechaEntrega: text("fecha_entrega"),
	notas: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		ordenesTrabajoProyectoIdProyectosIdFk: foreignKey({
			columns: [table.proyectoId],
			foreignColumns: [proyectos.id],
			name: "ordenes_trabajo_proyecto_id_proyectos_id_fk"
		}),
		ordenesTrabajoCodigoOrdenUnique: unique("ordenes_trabajo_codigo_orden_unique").on(table.codigoOrden),
	}
});

export const pedidosWeb = pgTable("pedidos_web", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clienteId: uuid("cliente_id").notNull(),
	itemsSnapshot: jsonb("items_snapshot").notNull(),
	subtotal: numeric({ precision: 14, scale:  2 }).notNull(),
	total: numeric({ precision: 14, scale:  2 }).notNull(),
	direccionEntrega: text("direccion_entrega"),
	estado: text().default('pendiente').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		pedidosWebClienteIdClientesIdFk: foreignKey({
			columns: [table.clienteId],
			foreignColumns: [clientes.id],
			name: "pedidos_web_cliente_id_clientes_id_fk"
		}),
	}
});

export const tareasProduccion = pgTable("tareas_produccion", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ordenId: uuid("orden_id").notNull(),
	nombreTarea: text("nombre_tarea").notNull(),
	estado: text().default('pendiente').notNull(),
	operarioId: uuid("operario_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		tareasProduccionOrdenIdOrdenesTrabajoIdFk: foreignKey({
			columns: [table.ordenId],
			foreignColumns: [ordenesTrabajo.id],
			name: "tareas_produccion_orden_id_ordenes_trabajo_id_fk"
		}),
		tareasProduccionOperarioIdUsuariosIdFk: foreignKey({
			columns: [table.operarioId],
			foreignColumns: [usuarios.id],
			name: "tareas_produccion_operario_id_usuarios_id_fk"
		}),
	}
});

export const usuarios = pgTable("usuarios", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	tipo: tipoUsuario().notNull(),
	rolEmpleado: rolEmpleado("rol_empleado"),
	clienteId: uuid("cliente_id"),
	nombre: text().notNull(),
	activo: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	personaId: uuid("persona_id").references(() => personas.id),
}, (table) => {
	return {
		usuariosClienteIdClientesIdFk: foreignKey({
			columns: [table.clienteId],
			foreignColumns: [clientes.id],
			name: "usuarios_cliente_id_clientes_id_fk"
		}),
		usuariosEmailUnique: unique("usuarios_email_unique").on(table.email),
	}
});

export const productosCatalogo = pgTable("productos_catalogo", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sku: text().notNull(),
	descripcion: text().notNull(),
	tipo: text(),
	unidadMedida: text("unidad_medida").default('ud'),
	precioDirecto: numeric("precio_directo", { precision: 14, scale:  2 }),
	precioPublico: numeric("precio_publico", { precision: 14, scale:  2 }),
	stockActual: integer("stock_actual").default(0),
	proveedorId: uuid("proveedor_id"),
	imagenUrl: text("imagen_url"),
	modelo3DUrl: text("modelo_3d_url"),
	categoriaComercial: text("categoria_comercial"),
	publicadoWeb: boolean("publicado_web").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	proyectoOrigenId: uuid("proyecto_origen_id"),
}, (table) => {
	return {
		productosCatalogoProveedorIdProveedoresIdFk: foreignKey({
			columns: [table.proveedorId],
			foreignColumns: [proveedores.id],
			name: "productos_catalogo_proveedor_id_proveedores_id_fk"
		}),
		productosCatalogoProyectoOrigenIdProyectosIdFk: foreignKey({
			columns: [table.proyectoOrigenId],
			foreignColumns: [proyectos.id],
			name: "productos_catalogo_proyecto_origen_id_proyectos_id_fk"
		}),
		productosCatalogoSkuUnique: unique("productos_catalogo_sku_unique").on(table.sku),
		productosCatalogoProyectoOrigenIdUnique: unique("productos_catalogo_proyecto_origen_id_unique").on(table.proyectoOrigenId),
	}
});

export const proyectos = pgTable("proyectos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clienteId: uuid("cliente_id"),
	comercialId: uuid("comercial_id"),
	nombreProyecto: text("nombre_proyecto").notNull(),
	direccionObra: text("direccion_obra"),
	estado: estadoProyecto().default('activa').notNull(),
	costosOperativos: numeric("costos_operativos", { precision: 14, scale:  2 }).default('0'),
	imprevistosInstalacion: numeric("imprevistos_instalacion", { precision: 14, scale:  2 }).default('0'),
	descuentoComercial: numeric("descuento_comercial", { precision: 14, scale:  2 }).default('0'),
	ajusteArbitrario: numeric("ajuste_arbitrario", { precision: 14, scale:  2 }).default('0'),
	garantiaAnios: integer("garantia_anios").default(2),
	diasEntregaEstimados: integer("dias_entrega_estimados"),
	aplicaIva: boolean("aplica_iva").default(false),
	porcentajeIva: numeric("porcentaje_iva", { precision: 5, scale:  2 }).default('19'),
	descripcionSemantica: text("descripcion_semantica"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	tipoProyecto: tipoProyecto("tipo_proyecto").default('personalizado').notNull(),
}, (table) => {
	return {
		proyectosClienteIdClientesIdFk: foreignKey({
			columns: [table.clienteId],
			foreignColumns: [clientes.id],
			name: "proyectos_cliente_id_clientes_id_fk"
		}),
		proyectosComercialIdPersonasIdFk: foreignKey({
			columns: [table.comercialId],
			foreignColumns: [personas.id],
			name: "proyectos_comercial_id_personas_id_fk"
		}),
	}
});

export const proyectosEstadosHistorial = pgTable("proyectos_estados_historial", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").references(() => proyectos.id).notNull(),
	estadoAnterior: estadoProyecto().notNull(),
	estadoNuevo: estadoProyecto().notNull(),
	cambiadoPor: uuid("cambiado_por").references(() => personas.id),
	razon: text("razon"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		proyectosEstadosHistorialProyectoIdFk: foreignKey({
			columns: [table.proyectoId],
			foreignColumns: [proyectos.id],
			name: "proyectos_estados_historial_proyecto_id_fk"
		}),
		proyectosEstadosHistorialCambiadoPorFk: foreignKey({
			columns: [table.cambiadoPor],
			foreignColumns: [personas.id],
			name: "proyectos_estados_historial_cambiado_por_fk"
		}),
	}
});

// ── F0 · Parámetros del negocio (append-only versionado) ────────────────

export const parametros = pgTable("parametros", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clave: text().notNull(),
	grupo: text(),
	tipo: text().notNull(),
	valorNumeric: numeric("valor_numeric", { precision: 14, scale: 2 }),
	valorTexto: text("valor_texto"),
	valorBooleano: boolean("valor_booleano"),
	unidad: text(),
	descripcion: text(),
	vigenteDesde: timestamp("vigente_desde", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		parametrosClaveUnique: unique("parametros_clave_unique").on(table.clave),
		parametrosExclusionValores: check("parametros_exclusion_valores", sql`(
			(${table.tipo} = 'numerico' AND ${table.valorNumeric} IS NOT NULL AND ${table.valorTexto} IS NULL AND ${table.valorBooleano} IS NULL) OR
			(${table.tipo} = 'texto' AND ${table.valorNumeric} IS NULL AND ${table.valorTexto} IS NOT NULL AND ${table.valorBooleano} IS NULL) OR
			(${table.tipo} = 'booleano' AND ${table.valorNumeric} IS NULL AND ${table.valorTexto} IS NULL AND ${table.valorBooleano} IS NOT NULL)
		)`),
	}
});

export const parametrosHistorial = pgTable("parametros_historial", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	parametroId: uuid("parametro_id").references(() => parametros.id),
	claveSnapshot: text("clave_snapshot").notNull(),
	valorNumericAnterior: numeric("valor_numeric_anterior", { precision: 14, scale: 2 }),
	valorNumericNuevo: numeric("valor_numeric_nuevo", { precision: 14, scale: 2 }),
	valorTextoAnterior: text("valor_texto_anterior"),
	valorTextoNuevo: text("valor_texto_nuevo"),
	valorBooleanoAnterior: boolean("valor_booleano_anterior"),
	valorBooleanoNuevo: boolean("valor_booleano_nuevo"),
	actorId: uuid("actor_id").references(() => usuarios.id),
	actorRol: text("actor_rol"),
	motivo: text(),
	vigenteDesde: timestamp("vigente_desde", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

// ── F0 · Eventos (auditoría append-only del dominio) ─────────────────────

export const eventos = pgTable("eventos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ocurrenciaId: text("ocurrencia_id"),
	tipoEvento: text("tipo_evento").notNull(),
	entidad: text().notNull(),
	entidadId: uuid("entidad_id").notNull(),
	estadoAntes: text("estado_antes"),
	estadoDespues: text("estado_despues"),
	actorId: uuid("actor_id").references(() => usuarios.id),
	actorRol: text("actor_rol"),
	eventoReferenciaId: uuid("evento_referencia_id"),
	leadId: uuid("lead_id").references(() => leads.id),
	clienteId: uuid("cliente_id").references(() => clientes.id),
	proyectoId: uuid("proyecto_id").references(() => proyectos.id),
	contratoId: uuid("contrato_id").references(() => contratos.id),
	payload: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		eventosEventoReferenciaIdFk: foreignKey({
			columns: [table.eventoReferenciaId],
			foreignColumns: [table.id],
			name: "eventos_evento_referencia_id_eventos_id_fk"
		}),
	}
});

// ── F0 · Procedencia (lineage "al nacer el dato") ────────────────────────

export const procedencia = pgTable("procedencia", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	hijoEntidad: text("hijo_entidad").notNull(),
	hijoId: uuid("hijo_id").notNull(),
	padreEntidad: text("padre_entidad").notNull(),
	padreId: uuid("padre_id").notNull(),
	tipoEvento: text("tipo_evento"),
	tipoRelacion: text("tipo_relacion"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

// ── F0 · Audit logs (subsistema de logs Ola 6, append-only) ──────────────

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	timestamp: timestamp("timestamp", { mode: 'string' }).defaultNow().notNull(),
	actorId: uuid("actor_id").references(() => usuarios.id),
	actorRol: text("actor_rol"),
	accion: text().notNull(),
	entidadTipo: text("entidad_tipo"),
	entidadId: uuid("entidad_id"),
	cambiosJson: jsonb("cambios_json"),
	gateEvaluado: text("gate_evaluado"),
	decision: text(),
	ipOrigen: text("ip_origen"),
	razonTexto: text("razon_texto"),
});
