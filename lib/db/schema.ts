import { pgTable, uuid, text, integer, timestamp, foreignKey, unique, numeric, boolean, jsonb, pgEnum, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const estadoContrato = pgEnum("estado_contrato", ['borrador', 'firmado'])
// F10 (2026-08-13): ampliado de 9 a 19 valores para calzar con EstadoProyecto real de contracts.ts —
// el enum viejo no tenía borrador/en_revision/cotizado/negociacion/desarrollo/aprobado_compras/armado/verificado/en_instalacion/instalado.
export const estadoProyecto = pgEnum("estado_proyecto", [
	'borrador', 'en_revision', 'cotizado', 'negociacion', 'en_contrato',
	'desarrollo', 'aprobado_compras', 'armado', 'verificado', 'en_instalacion', 'instalado',
	'entregado', 'perdida', 'cancelada',
	'activa', 'enviada', 'pre_produccion', 'produccion', 'retoma',
])
export const rolEmpleado = pgEnum("rol_empleado", ['admin', 'comercial', 'desarrollador', 'compras', 'taller', 'finanzas', 'supervisora_qa'])
export const tipoHitoPago = pgEnum("tipo_hito_pago", ['percentage', 'fixed'])
export const tipoProyecto = pgEnum("tipo_proyecto", ['personalizado', 'producto_fijo'])
export const tipoUsuario = pgEnum("tipo_usuario", ['empleado', 'cliente'])
export const estadoLead = pgEnum("estado_lead", ['nuevo_lead', 'contactado', 'asesoria_agendada', 'cotizado', 'contrato_firmado', 'descartado'])
export const estadoEnvioGoogle = pgEnum("estado_envio_google", ['pendiente', 'procesando', 'enviado_exitoso', 'error_matching'])

// ── F10: enums nuevos para las ~30 tablas que faltaban (derivados 1:1 de lib/data/contracts.ts) ──
export const lineaCronograma = pgEnum("linea_cronograma", ['contractual', 'interna'])
export const etapaCronograma = pgEnum("etapa_cronograma", ['aprobacion', 'compras', 'ensamblaje', 'instalacion'])
export const causaDesfase = pgEnum("causa_desfase", ['interna', 'externa', 'cambio_contrato'])
export const desenlaceCheck = pgEnum("desenlace_check", ['todo_bien', 'novedad', 'extremo'])
export const estadoNovedadCritica = pgEnum("estado_novedad_critica", ['abierta', 'en_atencion', 'resuelta', 'escalada'])
export const estadoSchemaProyecto = pgEnum("estado_schema_proyecto", ['borrador', 'en_desarrollo', 'para_revision', 'aprobado_compras', 'rechazado', 'en_reproceso'])
export const origenBom = pgEnum("origen_bom", ['cotizacion', 'desarrollo'])
export const tipoGate = pgEnum("tipo_gate", ['schema', 'recepcion', 'calidad'])
export const veredictoGate = pgEnum("veredicto_gate", ['aprobado', 'rechazado', 'rechazado_total', 'reproceso_parcial'])
export const tipoOrdenTrabajo = pgEnum("tipo_orden_trabajo", ['produccion', 'garantia'])
export const estadoInstalacion = pgEnum("estado_instalacion", ['programada', 'en_curso', 'instalada', 'fallida'])
export const estadoActaEntrega = pgEnum("estado_acta_entrega", ['generada', 'enviada', 'firmada'])
export const estadoCasoGarantia = pgEnum("estado_caso_garantia", ['reportado', 'diagnosticado', 'en_reparacion', 'resuelto', 'cerrado'])
export const origenReproceso = pgEnum("origen_reproceso", ['schema', 'calidad', 'instalacion', 'garantia', 'recepcion'])
export const estadoOrdenCompra = pgEnum("estado_orden_compra_v2", ['solicitada', 'aprobada', 'en_pago', 'pagada', 'recibida_verificada', 'rechazada', 'cancelada'])
export const mecanicaPagoOc = pgEnum("mecanica_pago_oc", ['anticipo_saldo', 'unico', 'subcontratacion'])
export const estadoRecepcionMaterial = pgEnum("estado_recepcion_material", ['pendiente', 'recibido_verificado', 'recibido_defectuoso'])
export const estadoOperativoHerramienta = pgEnum("estado_operativo_herramienta", ['operativa', 'reparacion', 'fuera_servicio', 'necesita_reposicion'])
export const estadoCuentaCobro = pgEnum("estado_cuenta_cobro", ['emitida', 'vinculada', 'pagada', 'anulada'])
export const alojadorDocumento = pgEnum("alojador_documento", ['r2', 'drive_veta_erp'])
export const macroFaseProyecto = pgEnum("macro_fase_proyecto", ['pre_venta', 'cotizacion', 'produccion', 'instalacion', 'post_venta'])
export const fuenteTestimonio = pgEnum("fuente_testimonio", ['GBP', 'WhatsApp', 'Notion', 'video', 'otro'])
export const tipoModuloArtefacto = pgEnum("tipo_modulo_artefacto", ['imagen', 'plano_armado', 'orden_armado', 'modelo_3d'])
export const fuenteModuloArtefacto = pgEnum("fuente_modulo_artefacto", ['heredado_catalogo', 'dedicado_proyecto'])
export const bitacoraCategoria = pgEnum("bitacora_categoria", ['casos_estudio', 'materiales_tecnica', 'diseno_arquitectura', 'mantenimiento'])
export const fuenteReferencial = pgEnum("fuente_referencial", ['electrodomestico', 'obra_civil', 'servicio_tercero', 'otro'])
export const tipoCambioContrato = pgEnum("tipo_cambio_contrato", ['adicional', 'cambio', 'reproceso'])
export const shopCategoria = pgEnum("shop_categoria", ['Cocinas', 'Closets', 'Estudios', 'Comedores', 'Baños'])
export const origenObligacion = pgEnum("origen_obligacion", ['contrato_hito', 'proveedor', 'diseno_3d', 'nomina', 'comision', 'arriendo'])
export const rolCanonico = pgEnum("rol_canonico", ['admin', 'comercial', 'desarrollador', 'compras', 'taller', 'finanzas', 'supervisora_qa'])


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
	// F10 (2026-08-13): faltaban contra Persona de contracts.ts (C-02 foto, D-08a contacto).
	fotoUrl: text("foto_url"),
	email: text(),
	activo: boolean().default(true).notNull(),
	// F10 (2026-08-15): datos legales/RRHH del empleado (dirección + 2 referencias personales).
	direccion: text(),
	referencia1Nombre: text("referencia_1_nombre"),
	referencia1Relacion: text("referencia_1_relacion"),
	referencia1Telefono: text("referencia_1_telefono"),
	referencia2Nombre: text("referencia_2_nombre"),
	referencia2Relacion: text("referencia_2_relacion"),
	referencia2Telefono: text("referencia_2_telefono"),
}, (table) => {
	return {
		// F10 (2026-08-17): evita altas duplicadas con el mismo documento — NULL sigue permitiendo
		// múltiples personas sin documento cargado (Postgres no compara NULLs como iguales).
		personasDocumentoUnique: unique("personas_documento_unique").on(table.documento),
	}
});

export const personasRoles = pgTable("personas_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	personaId: uuid("persona_id").references(() => personas.id),
	// F10 (2026-08-13): corregido de FK uuid a tabla `roles` (legacy, sin uso real) a
	// enum RolCanonico directo — así es como contracts.ts/mock-store.ts lo definen y usan.
	rolId: rolCanonico("rol_id").notNull(),
	activo: boolean().default(true).notNull(),
	desde: timestamp("desde", { mode: 'string' }).defaultNow().notNull(),
});


export const leads = pgTable("leads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: text().notNull(),
	telefonoWhatsapp: text("telefono_whatsapp"),
	email: text(),
	gclid: text("gclid"),
	wbraid: text("wbraid"),
	gbraid: text("gbraid"),
	utmSource: text("utm_source"),
	utmMedium: text("utm_medium"),
	utmCampaign: text("utm_campaign"),
	utmTerm: text("utm_term"),
	utmContent: text("utm_content"),
	hashedPhone: text("hashed_phone"),
	hashedEmail: text("hashed_email"),
	tipoProyecto: text("tipo_proyecto"),
	ubicacion: text("ubicacion"),
	scoreConversion: integer("score_conversion").default(0),
	etapa: estadoLead("etapa").default('nuevo_lead').notNull(),
	proyectoId: uuid("proyecto_id"),
	clienteId: uuid("cliente_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		leadsProyectoIdFk: foreignKey({
			columns: [table.proyectoId],
			foreignColumns: [proyectos.id],
			name: "leads_proyecto_id_proyectos_id_fk"
		}),
		leadsClienteIdFk: foreignKey({
			columns: [table.clienteId],
			foreignColumns: [clientes.id],
			name: "leads_cliente_id_clientes_id_fk"
		}),
	}
});

export const eventosConversionOffline = pgTable("eventos_conversion_offline", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	leadId: uuid("lead_id").notNull(),
	contratoId: uuid("contrato_id"),
	nombreEventoGoogle: text("nombre_evento_google").notNull(),
	valorConversion: numeric("valor_conversion", { precision: 14, scale: 2 }).default('0').notNull(),
	gclidUsado: text("gclid_usado"),
	hashedPhoneUsado: text("hashed_phone_usado"),
	estadoEnvio: estadoEnvioGoogle("estado_envio").default('pendiente').notNull(),
	respuestaGoogleApi: jsonb("respuesta_google_api"),
	reintentos: integer("reintentos").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	enviadoEn: timestamp("enviado_en", { mode: 'string' }),
}, (table) => {
	return {
		eventosConversionOfflineLeadIdFk: foreignKey({
			columns: [table.leadId],
			foreignColumns: [table.id],
			name: "eventos_conversion_offline_lead_id_leads_id_fk"
		}),
		eventosConversionOfflineContratoIdFk: foreignKey({
			columns: [table.contratoId],
			foreignColumns: [contratos.id],
			name: "eventos_conversion_offline_contrato_id_contratos_id_fk"
		}),
	}
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
	// F10 (2026-08-13): renombrado de condicionesDesmonte — contracts.ts usa especificacionesDesmonte.
	especificacionesDesmonte: text("especificaciones_desmonte"),
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
	// F09/F14 (2026-08-17): tipo canónico del espacio (lib/catalogos/tipos-espacio.ts) — el
	// proyecto tipa su espacio acá, y Portafolio lo hereda vía espacioVarianteId en vez de
	// volver a tipar a mano.
	tipoEspacio: text("tipo_espacio"),
	descripcion: text(),
	activa: boolean().default(false).notNull(),
	// F10 (2026-08-13): renombrado de visiblePdf — contracts.ts usa visibleEnPropuestaPublica.
	visibleEnPropuestaPublica: boolean("visible_en_propuesta_publica").default(true).notNull(),
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

// F10 (2026-08-13): superseded por ARCH-012 (2026-08-12, ver estado.md) — el portafolio
// público se desacopló de EspacioVariante y ganó galeriaPortafolioUrl propia. La tabla
// `portafolio` de más abajo (cluster F-03/F-15) es la que implementa Portafolio de
// contracts.ts hoy. Estas dos tablas quedan sin uso en el store nuevo — no se leen ni
// escriben desde createDrizzleStore(); se conservan por ahora en el schema, sin migrar
// datos hacia ellas, hasta que el Supervisor decida si hay algo que rescatar y limpiar.
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
	// F10 (2026-08-13): faltaban contra ItemVariante de contracts.ts (C2 presupuesto adicional referencial).
	esReferencial: boolean("es_referencial").default(false).notNull(),
	fuenteReferencial: fuenteReferencial("fuente_referencial"),
	grupoReferencial: text("grupo_referencial"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
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
	saldoInicial: numeric("saldo_inicial", { precision: 14, scale:  2 }).default('0').notNull(),
	saldoActual: numeric("saldo_actual", { precision: 14, scale:  2 }).default('0').notNull(),
	// F10 (2026-08-13): faltaba contra CuentaFinanciera de contracts.ts.
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
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
	// F10 (2026-08-13): faltaban contra MovimientoFinanciero de contracts.ts (P-21/P-22/P-23).
	ordenCompraId: uuid("orden_compra_id"),
	socioId: uuid("socio_id"),
	medioPago: text("medio_pago"),
	comprobanteUrl: text("comprobante_url"),
	prioridadPago: integer("prioridad_pago"),
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
		movimientosFinancierosOrdenCompraIdFk: foreignKey({
			columns: [table.ordenCompraId],
			foreignColumns: [ordenesCompra.id],
			name: "movimientos_financieros_orden_compra_id_ordenes_compra_id_fk"
		}),
	}
});

export const obligacionesPendientes = pgTable("obligaciones_pendientes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	descripcion: text().notNull(),
	// F10 (2026-08-13): renombrado de 'tipo' — contracts.ts usa 'origen' (OrigenObligacion).
	origen: origenObligacion().notNull(),
	montoTotal: numeric("monto_total", { precision: 14, scale:  2 }).notNull(),
	montoPagado: numeric("monto_pagado", { precision: 14, scale:  2 }).default('0').notNull(),
	fechaVencimiento: text("fecha_vencimiento").notNull(),
	estado: text().default('pendiente').notNull(),
	clienteId: uuid("cliente_id"),
	proveedorId: uuid("proveedor_id"),
	proyectoId: uuid("proyecto_id"),
	contratoId: uuid("contrato_id"),
	// F10 (2026-08-13): faltaban contra ObligacionPendiente de contracts.ts (P-21/P-22/P-23, D-08a).
	personaId: uuid("persona_id"),
	hitoId: uuid("hito_id"),
	ordenCompraId: uuid("orden_compra_id"),
	baseCalculo: text("base_calculo"),
	porcentaje: numeric({ precision: 5, scale: 2 }),
	tipoComision: text("tipo_comision"),
	cantidadModulos: integer("cantidad_modulos"),
	desfaseId: uuid("desfase_id"),
	periodicidad: text(),
	deduccionDiseno3d: boolean("deduccion_diseno_3d").default(false).notNull(),
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
		obligacionesPendientesPersonaIdFk: foreignKey({
			columns: [table.personaId],
			foreignColumns: [personas.id],
			name: "obligaciones_pendientes_persona_id_personas_id_fk"
		}),
		obligacionesPendientesHitoIdFk: foreignKey({
			columns: [table.hitoId],
			foreignColumns: [hitosPago.id],
			name: "obligaciones_pendientes_hito_id_hitos_pago_id_fk"
		}),
		obligacionesPendientesOrdenCompraIdFk: foreignKey({
			columns: [table.ordenCompraId],
			foreignColumns: [ordenesCompra.id],
			name: "obligaciones_pendientes_orden_compra_id_ordenes_compra_id_fk"
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
	// F10 (2026-08-13): columnas que faltaban contra Proveedor de contracts.ts (F4/F7, P-13).
	telefonoComercial: text("telefono_comercial"),
	direccionDespacho: text("direccion_despacho"),
	ciudad: text(),
	medioPago: text("medio_pago"),
	diasEntregaDefault: integer("dias_entrega_default"),
	transportadora: text(),
	tarifaFlete: numeric("tarifa_flete", { precision: 14, scale: 2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const ordenesTrabajo = pgTable("ordenes_trabajo", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	codigoOrden: text("codigo_orden").notNull(),
	// F10 (2026-08-13): pedidoWebId + tipo faltaban contra OrdenTrabajo de contracts.ts (E-44, engancha pedidos web).
	pedidoWebId: uuid("pedido_web_id"),
	tipo: tipoOrdenTrabajo().default('produccion').notNull(),
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
		ordenesTrabajoPedidoWebIdFk: foreignKey({
			columns: [table.pedidoWebId],
			foreignColumns: [pedidosWeb.id],
			name: "ordenes_trabajo_pedido_web_id_pedidos_web_id_fk"
		}),
		ordenesTrabajoCodigoOrdenUnique: unique("ordenes_trabajo_codigo_orden_unique").on(table.codigoOrden),
	}
});

export const pedidosWeb = pgTable("pedidos_web", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clienteId: uuid("cliente_id").notNull(),
	// F10 (2026-08-13): proyectoId faltaba — null hasta que P-24 engancha el pedido a producción (E-44).
	proyectoId: uuid("proyecto_id"),
	// F10 (2026-08-13): renombrado de total/subtotal/itemsSnapshot/direccionEntrega (schema legacy
	// pre-V3 sin uso real en la app) a totalPedido, el único campo que PedidoWeb de contracts.ts define.
	totalPedido: numeric("total_pedido", { precision: 14, scale: 2 }).notNull(),
	estado: text().default('pendiente').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		pedidosWebClienteIdClientesIdFk: foreignKey({
			columns: [table.clienteId],
			foreignColumns: [clientes.id],
			name: "pedidos_web_cliente_id_clientes_id_fk"
		}),
		pedidosWebProyectoIdFk: foreignKey({
			columns: [table.proyectoId],
			foreignColumns: [proyectos.id],
			name: "pedidos_web_proyecto_id_proyectos_id_fk"
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
	// Nullable (F10 2026-08-15, login interno D-08b): una invitación de autoregistro crea la fila
	// antes de que el empleado elija su propia contraseña — no puede haber un hash todavía.
	passwordHash: text("password_hash"),
	tipo: tipoUsuario().notNull(),
	rolEmpleado: rolEmpleado("rol_empleado"),
	clienteId: uuid("cliente_id"),
	nombre: text().notNull(),
	activo: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	personaId: uuid("persona_id").references(() => personas.id),
	// F10 (2026-08-15, login interno D-08b): invitación de autoregistro de empleado.
	inviteToken: text("invite_token"),
	inviteTokenExpiraEn: timestamp("invite_token_expira_en", { mode: 'string' }),
}, (table) => {
	return {
		usuariosClienteIdClientesIdFk: foreignKey({
			columns: [table.clienteId],
			foreignColumns: [clientes.id],
			name: "usuarios_cliente_id_clientes_id_fk"
		}),
		usuariosEmailUnique: unique("usuarios_email_unique").on(table.email),
		usuariosInviteTokenUnique: unique("usuarios_invite_token_unique").on(table.inviteToken),
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
	// t-139 (2026-08-15): galería multi-imagen para el slider de la ficha de
	// presentación. Patrón de galeria_portafolio_url / fotos_espacio (jsonb array).
	galeriaImagenesUrl: jsonb("galeria_imagenes_url").default([]).notNull(),
	// F10 (2026-08-13): renombrado modelo3DUrl -> modelo3dUrl (contracts.ts usa 'd' minúscula).
	modelo3dUrl: text("modelo_3d_url"),
	categoriaComercial: text("categoria_comercial"),
	publicadoWeb: boolean("publicado_web").default(false).notNull(),
	// F10 (2026-08-13): faltaba contra ProductoCatalogo de contracts.ts (P-27 #8/R8 soft-delete).
	anulado: boolean().default(false).notNull(),
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
	// F10 (2026-08-13): faltaban contra Proyecto de contracts.ts (F3, D3/I-035 verificador único; gate E-18).
	verificadorId: uuid("verificador_id"),
	fechaEntradaDesarrollo: text("fecha_entrada_desarrollo"),
	comercialVendedorId: uuid("comercial_vendedor_id"),
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
		proyectosVerificadorIdFk: foreignKey({
			columns: [table.verificadorId],
			foreignColumns: [personas.id],
			name: "proyectos_verificador_id_personas_id_fk"
		}),
		proyectosComercialVendedorIdFk: foreignKey({
			columns: [table.comercialVendedorId],
			foreignColumns: [personas.id],
			name: "proyectos_comercial_vendedor_id_personas_id_fk"
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

// ── F10 (2026-08-13): tablas faltantes contra lib/data/contracts.ts (55 dominios, schema.ts solo tenía 28) ──
// F3 · Cronograma y control (REGISTRO §5)

export const cronogramas = pgTable("cronogramas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	baseSemanas: integer("base_semanas").notNull(),
	holguraMaximaDias: integer("holgura_maxima_dias").notNull(),
	promesaSemanas: integer("promesa_semanas").notNull(),
	fechaFijacion: text("fecha_fijacion").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		cronogramasProyectoIdProyectosIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "cronogramas_proyecto_id_proyectos_id_fk"
		}),
	}
});

export const cronogramaEtapas = pgTable("cronograma_etapas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cronogramaId: uuid("cronograma_id").notNull(),
	linea: lineaCronograma().notNull(),
	etapa: etapaCronograma().notNull(),
	fechaIdeal: text("fecha_ideal").notNull(),
	fechaReal: text("fecha_real").notNull(),
	estado: text().notNull(),
}, (table) => {
	return {
		cronogramaEtapasCronogramaIdFk: foreignKey({
			columns: [table.cronogramaId], foreignColumns: [cronogramas.id], name: "cronograma_etapas_cronograma_id_cronogramas_id_fk"
		}),
	}
});

export const desfasesCronograma = pgTable("desfases_cronograma", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	diasDesfase: integer("dias_desfase").notNull(),
	causa: causaDesfase().notNull(),
	composicionCausal: jsonb("composicion_causal").default([]).notNull(),
	motivo: text().notNull(),
	aplicado: boolean().default(false).notNull(),
	decisionManual: text("decision_manual"),
	autorizadoPor: uuid("autorizado_por"),
	resultadoRecalculo: text("resultado_recalculo"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		desfasesCronogramaProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "desfases_cronograma_proyecto_id_proyectos_id_fk"
		}),
		desfasesCronogramaAutorizadoPorFk: foreignKey({
			columns: [table.autorizadoPor], foreignColumns: [personas.id], name: "desfases_cronograma_autorizado_por_personas_id_fk"
		}),
	}
});

export const checksProduccion = pgTable("checks_produccion", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	fechaCheck: text("fecha_check").notNull(),
	ratioInsumos: numeric("ratio_insumos", { precision: 5, scale: 2 }).notNull(),
	ratioPagos: numeric("ratio_pagos", { precision: 5, scale: 2 }).notNull(),
	ratioProduccion: numeric("ratio_produccion", { precision: 5, scale: 2 }).notNull(),
	desenlaceSugerido: desenlaceCheck("desenlace_sugerido").notNull(),
	desenlaceFinal: desenlaceCheck("desenlace_final"),
	overrideJustificacion: text("override_justificacion"),
	comisionesReducidasPct: numeric("comisiones_reducidas_pct", { precision: 5, scale: 2 }),
	verificadorId: uuid("verificador_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		checksProduccionProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "checks_produccion_proyecto_id_proyectos_id_fk"
		}),
		checksProduccionVerificadorIdFk: foreignKey({
			columns: [table.verificadorId], foreignColumns: [personas.id], name: "checks_produccion_verificador_id_personas_id_fk"
		}),
	}
});

export const novedadesCriticas = pgTable("novedades_criticas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	descripcion: text().notNull(),
	fase: text().notNull(),
	ventanaSlaHoras: integer("ventana_sla_horas").notNull(),
	estado: estadoNovedadCritica().default('abierta').notNull(),
	escaladoA: uuid("escalado_a"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		novedadesCriticasProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "novedades_criticas_proyecto_id_proyectos_id_fk"
		}),
		novedadesCriticasEscaladoAFk: foreignKey({
			columns: [table.escaladoA], foreignColumns: [personas.id], name: "novedades_criticas_escalado_a_personas_id_fk"
		}),
	}
});

export const comunicacionesProgreso = pgTable("comunicaciones_progreso", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	tipo: text().default('adelanto').notNull(),
	contenido: text().notNull(),
	visibleAlCliente: boolean("visible_al_cliente").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		comunicacionesProgresoProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "comunicaciones_progreso_proyecto_id_proyectos_id_fk"
		}),
	}
});

// F3 · Desarrollo y schema (REGISTRO §6)

export const schemasProyecto = pgTable("schemas_proyecto", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	version: integer().notNull(),
	estado: estadoSchemaProyecto().default('borrador').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	aprobadoEn: timestamp("aprobado_en", { mode: 'string' }),
}, (table) => {
	return {
		schemasProyectoProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "schemas_proyecto_proyecto_id_proyectos_id_fk"
		}),
	}
});

export const bomMaterial = pgTable("bom_material", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schemaId: uuid("schema_id").notNull(),
	productoId: uuid("producto_id"),
	cantidad: numeric({ precision: 10, scale: 2 }).notNull(),
	unidad: text().notNull(),
	origen: origenBom().notNull(),
	homologable: boolean().default(false).notNull(),
	itemVarianteId: uuid("item_variante_id"),
}, (table) => {
	return {
		bomMaterialSchemaIdFk: foreignKey({
			columns: [table.schemaId], foreignColumns: [schemasProyecto.id], name: "bom_material_schema_id_schemas_proyecto_id_fk"
		}),
		bomMaterialProductoIdFk: foreignKey({
			columns: [table.productoId], foreignColumns: [productosCatalogo.id], name: "bom_material_producto_id_productos_catalogo_id_fk"
		}),
		bomMaterialItemVarianteIdFk: foreignKey({
			columns: [table.itemVarianteId], foreignColumns: [itemsVariante.id], name: "bom_material_item_variante_id_items_variante_id_fk"
		}),
	}
});

export const verificaciones = pgTable("verificaciones", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	tipoGate: tipoGate("tipo_gate").notNull(),
	veredicto: veredictoGate().notNull(),
	verificadorId: uuid("verificador_id").notNull(),
	creadoEn: timestamp("creado_en", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		verificacionesProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "verificaciones_proyecto_id_proyectos_id_fk"
		}),
		verificacionesVerificadorIdFk: foreignKey({
			columns: [table.verificadorId], foreignColumns: [personas.id], name: "verificaciones_verificador_id_personas_id_fk"
		}),
	}
});

export const retomas = pgTable("retomas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	medidas: jsonb(),
	fotos: jsonb().default([]),
	anomaliaDetectada: boolean("anomalia_detectada").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		retomasProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "retomas_proyecto_id_proyectos_id_fk"
		}),
		retomasProyectoIdUnique: unique("retomas_proyecto_id_unique").on(table.proyectoId),
	}
});

export const cambiosContrato = pgTable("cambios_contrato", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	tipoCambio: tipoCambioContrato("tipo_cambio").notNull(),
	descripcion: text().notNull(),
	disparaDesfase: boolean("dispara_desfase").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		cambiosContratoProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "cambios_contrato_proyecto_id_proyectos_id_fk"
		}),
	}
});

// F3 · Producción (REGISTRO §8, mínimo para gates)

export const modulos = pgTable("modulos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	espacioVarianteId: uuid("espacio_variante_id"),
	nombre: text().notNull(),
	estado: text().notNull(),
	padreId: uuid("padre_id"),
	padreLinaje: jsonb("padre_linaje").default([]).notNull(),
	tipoModulo: text("tipo_modulo"),
	cantidad: integer().default(1).notNull(),
	horasEstimadas: numeric("horas_estimadas", { precision: 8, scale: 2 }).default('0').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		modulosProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "modulos_proyecto_id_proyectos_id_fk"
		}),
		modulosEspacioVarianteIdFk: foreignKey({
			columns: [table.espacioVarianteId], foreignColumns: [espacioVariantes.id], name: "modulos_espacio_variante_id_espacio_variantes_id_fk"
		}),
		modulosPadreIdFk: foreignKey({
			columns: [table.padreId], foreignColumns: [table.id], name: "modulos_padre_id_modulos_id_fk"
		}),
	}
});

export const estimaciones = pgTable("estimaciones", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	valor: numeric({ precision: 14, scale: 2 }).notNull(),
	cantidadModulos: integer("cantidad_modulos").notNull(),
	duracionEstimada: text("duracion_estimada").notNull(),
	factorCrecimiento: numeric("factor_crecimiento", { precision: 5, scale: 2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		estimacionesProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "estimaciones_proyecto_id_proyectos_id_fk"
		}),
		estimacionesProyectoIdUnique: unique("estimaciones_proyecto_id_unique").on(table.proyectoId),
	}
});

// F7/F4 · Compras: proveedores y órdenes de compra (REGISTRO §7, P-13/P-14/P-15)

export const ordenesCompra = pgTable("ordenes_compra", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigoOrden: text("codigo_orden").notNull(),
	proyectoId: uuid("proyecto_id"),
	proveedorId: uuid("proveedor_id").notNull(),
	montoTotal: numeric("monto_total", { precision: 14, scale: 2 }).notNull(),
	anticipoMonto: numeric("anticipo_monto", { precision: 14, scale: 2 }),
	estado: estadoOrdenCompra().default('solicitada').notNull(),
	mecanicaPago: mecanicaPagoOc("mecanica_pago").notNull(),
	fechaRecepcionEsperada: text("fecha_recepcion_esperada"),
	tiempoEntregaDias: integer("tiempo_entrega_dias"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		ordenesCompraCodigoOrdenUnique: unique("ordenes_compra_codigo_orden_unique").on(table.codigoOrden),
		ordenesCompraProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "ordenes_compra_proyecto_id_proyectos_id_fk"
		}),
		ordenesCompraProveedorIdFk: foreignKey({
			columns: [table.proveedorId], foreignColumns: [proveedores.id], name: "ordenes_compra_proveedor_id_proveedores_id_fk"
		}),
	}
});

export const itemsOrdenCompra = pgTable("items_orden_compra", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ordenCompraId: uuid("orden_compra_id").notNull(),
	productoCatalogoId: uuid("producto_catalogo_id"),
	especificacion: text(),
	cantidadEsperada: integer("cantidad_esperada").notNull(),
	recibidoCantidad: integer("recibido_cantidad").default(0).notNull(),
	sinDefectos: boolean("sin_defectos").default(true).notNull(),
}, (table) => {
	return {
		itemsOrdenCompraOrdenCompraIdFk: foreignKey({
			columns: [table.ordenCompraId], foreignColumns: [ordenesCompra.id], name: "items_orden_compra_orden_compra_id_ordenes_compra_id_fk"
		}),
		itemsOrdenCompraProductoCatalogoIdFk: foreignKey({
			columns: [table.productoCatalogoId], foreignColumns: [productosCatalogo.id], name: "items_orden_compra_producto_catalogo_id_fk"
		}),
	}
});

export const recepcionesMaterial = pgTable("recepciones_material", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ordenCompraId: uuid("orden_compra_id").notNull(),
	proyectoId: uuid("proyecto_id"),
	checkPedidoBien: boolean("check_pedido_bien").default(false).notNull(),
	checkDespachoBien: boolean("check_despacho_bien").default(false).notNull(),
	checkMaterial: boolean("check_material").default(false).notNull(),
	estado: estadoRecepcionMaterial().default('pendiente').notNull(),
	descripcionDefecto: text("descripcion_defecto"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		recepcionesMaterialOrdenCompraIdFk: foreignKey({
			columns: [table.ordenCompraId], foreignColumns: [ordenesCompra.id], name: "recepciones_material_orden_compra_id_ordenes_compra_id_fk"
		}),
		recepcionesMaterialProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "recepciones_material_proyecto_id_proyectos_id_fk"
		}),
	}
});

export const herramientas = pgTable("herramientas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: text().notNull(),
	estadoOperativo: estadoOperativoHerramienta("estado_operativo").default('operativa').notNull(),
	valor: numeric({ precision: 14, scale: 2 }).notNull(),
	fotoUrl: text("foto_url"),
	proveedorId: uuid("proveedor_id"),
	ordenCompraReposicionId: uuid("orden_compra_reposicion_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		herramientasProveedorIdFk: foreignKey({
			columns: [table.proveedorId], foreignColumns: [proveedores.id], name: "herramientas_proveedor_id_proveedores_id_fk"
		}),
		herramientasOrdenCompraReposicionIdFk: foreignKey({
			columns: [table.ordenCompraReposicionId], foreignColumns: [ordenesCompra.id], name: "herramientas_orden_compra_reposicion_id_ordenes_compra_id_fk"
		}),
	}
});

export const registrosGateCaja = pgTable("registros_gate_caja", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ordenCompraId: uuid("orden_compra_id").notNull(),
	fecha: text().notNull(),
	montoSolicitado: numeric("monto_solicitado", { precision: 14, scale: 2 }).notNull(),
	saldoDisponible: numeric("saldo_disponible", { precision: 14, scale: 2 }).notNull(),
	bloqueado: boolean().default(false).notNull(),
	decision: text(),
	resolucion: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		registrosGateCajaOrdenCompraIdFk: foreignKey({
			columns: [table.ordenCompraId], foreignColumns: [ordenesCompra.id], name: "registros_gate_caja_orden_compra_id_ordenes_compra_id_fk"
		}),
	}
});

export const cuentasCobroProveedor = pgTable("cuentas_cobro_proveedor", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proveedorId: uuid("proveedor_id").notNull(),
	ordenCompraId: uuid("orden_compra_id"),
	obligacionId: uuid("obligacion_id"),
	concepto: text().notNull(),
	valor: numeric({ precision: 14, scale: 2 }).notNull(),
	estado: estadoCuentaCobro().default('emitida').notNull(),
	firmaDigital: text("firma_digital").notNull(),
	urlDocumento: text("url_documento"),
	fechaEmision: text("fecha_emision").notNull(),
	fechaVencimiento: text("fecha_vencimiento"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		cuentasCobroProveedorProveedorIdFk: foreignKey({
			columns: [table.proveedorId], foreignColumns: [proveedores.id], name: "cuentas_cobro_proveedor_proveedor_id_proveedores_id_fk"
		}),
		cuentasCobroProveedorOrdenCompraIdFk: foreignKey({
			columns: [table.ordenCompraId], foreignColumns: [ordenesCompra.id], name: "cuentas_cobro_proveedor_orden_compra_id_ordenes_compra_id_fk"
		}),
		cuentasCobroProveedorObligacionIdFk: foreignKey({
			columns: [table.obligacionId], foreignColumns: [obligacionesPendientes.id], name: "cuentas_cobro_proveedor_obligacion_id_fk"
		}),
	}
});

// F5 · Taller, calidad, instalación, entrega, garantía (REGISTRO §8 Producción)

export const citacionesCalidad = pgTable("citaciones_calidad", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	modulosIds: jsonb("modulos_ids").default([]).notNull(),
	estado: text().default('citada').notNull(),
	fecha: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		citacionesCalidadProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "citaciones_calidad_proyecto_id_proyectos_id_fk"
		}),
	}
});

export const reprocesos = pgTable("reprocesos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	origen: origenReproceso().notNull(),
	moduloId: uuid("modulo_id"),
	culpable: text(),
	granularidad: text(),
	descripcion: text(),
	estado: text().default('abierto').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		reprocesosProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "reprocesos_proyecto_id_proyectos_id_fk"
		}),
		reprocesosModuloIdFk: foreignKey({
			columns: [table.moduloId], foreignColumns: [modulos.id], name: "reprocesos_modulo_id_modulos_id_fk"
		}),
	}
});

export const instalaciones = pgTable("instalaciones", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	rangoFechaInicio: text("rango_fecha_inicio").notNull(),
	rangoFechaFin: text("rango_fecha_fin").notNull(),
	estado: estadoInstalacion().default('programada').notNull(),
	adelantadaPor: uuid("adelantada_por"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		instalacionesProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "instalaciones_proyecto_id_proyectos_id_fk"
		}),
		instalacionesAdelantadaPorFk: foreignKey({
			columns: [table.adelantadaPor], foreignColumns: [checksProduccion.id], name: "instalaciones_adelantada_por_checks_produccion_id_fk"
		}),
	}
});

export const actasEntrega = pgTable("actas_entrega", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	pdfUrl: text("pdf_url"),
	estado: estadoActaEntrega().default('generada').notNull(),
	holguraOperativaDias: integer("holgura_operativa_dias").default(12).notNull(),
	fotos: jsonb().default([]),
	observaciones: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		actasEntregaProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "actas_entrega_proyecto_id_proyectos_id_fk"
		}),
		actasEntregaProyectoIdUnique: unique("actas_entrega_proyecto_id_unique").on(table.proyectoId),
	}
});

export const casosGarantia = pgTable("casos_garantia", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	moduloId: uuid("modulo_id"),
	clienteId: uuid("cliente_id"),
	descripcion: text().notNull(),
	fotos: jsonb().default([]),
	estado: estadoCasoGarantia().default('reportado').notNull(),
	dentroGarantiaContractual: boolean("dentro_garantia_contractual").default(true).notNull(),
	fechaReporte: text("fecha_reporte").notNull(),
	diagnostico: text(),
	solucionAplicada: text("solucion_aplicada"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		casosGarantiaProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "casos_garantia_proyecto_id_proyectos_id_fk"
		}),
		casosGarantiaModuloIdFk: foreignKey({
			columns: [table.moduloId], foreignColumns: [modulos.id], name: "casos_garantia_modulo_id_modulos_id_fk"
		}),
		casosGarantiaClienteIdFk: foreignKey({
			columns: [table.clienteId], foreignColumns: [clientes.id], name: "casos_garantia_cliente_id_clientes_id_fk"
		}),
	}
});

export const citasGarantia = pgTable("citas_garantia", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	casoId: uuid("caso_id").notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	fecha: text().notNull(),
	diagnosticadoPor: uuid("diagnosticado_por"),
	resultado: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		citasGarantiaCasoIdFk: foreignKey({
			columns: [table.casoId], foreignColumns: [casosGarantia.id], name: "citas_garantia_caso_id_casos_garantia_id_fk"
		}),
		citasGarantiaProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "citas_garantia_proyecto_id_proyectos_id_fk"
		}),
	}
});

// F-02 · Tienda web (REGISTRO §2/§10)

export const categorias = pgTable("categorias", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: text().notNull(),
	tipo: text().notNull(),
	padreId: uuid("padre_id"),
	activo: boolean().default(true).notNull(),
}, (table) => {
	return {
		categoriasPadreIdFk: foreignKey({
			columns: [table.padreId], foreignColumns: [table.id], name: "categorias_padre_id_categorias_id_fk"
		}),
	}
});

export const productosTienda = pgTable("productos_tienda", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	catalogoId: uuid("catalogo_id").notNull(),
	descripcionDiseno: text("descripcion_diseno"),
	imagenPrincipalUrl: text("imagen_principal_url"),
	categoria: shopCategoria().notNull(),
	visibleEnTienda: boolean("visible_en_tienda").default(false).notNull(),
	valorTienda: numeric("valor_tienda", { precision: 14, scale: 2 }).notNull(),
	inventarioDisponible: integer("inventario_disponible").default(0).notNull(),
	calificacionPromedio: numeric("calificacion_promedio", { precision: 3, scale: 2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		productosTiendaCatalogoIdFk: foreignKey({
			columns: [table.catalogoId], foreignColumns: [productosCatalogo.id], name: "productos_tienda_catalogo_id_productos_catalogo_id_fk"
		}),
	}
});

export const productosTiendaComponentes = pgTable("productos_tienda_componentes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productoTiendaId: uuid("producto_tienda_id").notNull(),
	catalogoId: uuid("catalogo_id").notNull(),
	cantidad: numeric({ precision: 10, scale: 2 }).default('1').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		productosTiendaComponentesProductoTiendaIdFk: foreignKey({
			columns: [table.productoTiendaId], foreignColumns: [productosTienda.id], name: "prod_tienda_componentes_producto_tienda_id_fk"
		}),
		productosTiendaComponentesCatalogoIdFk: foreignKey({
			columns: [table.catalogoId], foreignColumns: [productosCatalogo.id], name: "prod_tienda_componentes_catalogo_id_fk"
		}),
	}
});

export const catalogoAcabados = pgTable("catalogo_acabados", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: text().notNull(),
	familia: text(),
	color: text(),
	colorHex: text("color_hex"),
	textura: text(),
	precioDiferencial: numeric("precio_diferencial", { precision: 14, scale: 2 }),
	imagenTexturaUrl: text("imagen_textura_url"),
});

export const catalogoProductoAcabados = pgTable("catalogo_producto_acabados", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productoCatalogoId: uuid("producto_catalogo_id").notNull(),
	acabadoId: uuid("acabado_id").notNull(),
	esDefault: boolean("es_default").default(false).notNull(),
}, (table) => {
	return {
		catalogoProductoAcabadosProductoCatalogoIdFk: foreignKey({
			columns: [table.productoCatalogoId], foreignColumns: [productosCatalogo.id], name: "catalogo_producto_acabados_producto_catalogo_id_fk"
		}),
		catalogoProductoAcabadosAcabadoIdFk: foreignKey({
			columns: [table.acabadoId], foreignColumns: [catalogoAcabados.id], name: "catalogo_producto_acabados_acabado_id_catalogo_acabados_id_fk"
		}),
	}
});

export const acabadosMuestras = pgTable("acabados_muestras", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	acabadoId: uuid("acabado_id").notNull(),
	imagenMuestraUrl: text("imagen_muestra_url"),
	disponibleWeb: boolean("disponible_web").default(true).notNull(),
}, (table) => {
	return {
		acabadosMuestrasAcabadoIdFk: foreignKey({
			columns: [table.acabadoId], foreignColumns: [catalogoAcabados.id], name: "acabados_muestras_acabado_id_catalogo_acabados_id_fk"
		}),
	}
});

// F-03 · Portafolio de proyectos (REGISTRO §10, ARCH-012 2026-08-12: desacoplado de EspacioVariante)

export const portafolio = pgTable("portafolio", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	titulo: text().notNull(),
	descripcionComercial: text("descripcion_comercial"),
	categoriaEspacio: text("categoria_espacio").notNull(),
	// F09 (2026-08-17): espacio de origen dentro del proyecto — cuando está vinculado,
	// categoriaEspacio se hereda de espacioVariantes.tipoEspacio en vez de tipar dos veces.
	espacioVarianteId: uuid("espacio_variante_id"),
	materialesDestacados: jsonb("materiales_destacados").default([]).notNull(),
	precioReferencial: text("precio_referencial"),
	imagenPortafolioUrl: text("imagen_portafolio_url"),
	galeriaPortafolioUrl: jsonb("galeria_portafolio_url").default([]).notNull(),
	barrio: text(),
	tipoProyecto: text("tipo_proyecto"),
	publicado: boolean().default(false).notNull(),
	destacado: boolean().default(false).notNull(),
	orden: integer().default(0).notNull(),
	slug: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		portafolioProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "portafolio_proyecto_id_proyectos_id_fk"
		}),
		portafolioEspacioVarianteIdFk: foreignKey({
			columns: [table.espacioVarianteId], foreignColumns: [espacioVariantes.id], name: "portafolio_espacio_variante_id_espacio_variantes_id_fk"
		}),
		portafolioSlugUnique: unique("portafolio_slug_unique").on(table.slug),
	}
});

// Renders conceptuales (F09, 2026-08-17): diseños propios (no proyectos reales entregados),
// usados como relleno visual en una landing de categoría mientras esa categoría no tiene
// todavía fotos reales publicadas. Siempre se muestran etiquetados "Render conceptual" en
// público — nunca se presentan como un proyecto entregado (regla anti-invención del arnés).
export const rendersConceptuales = pgTable("renders_conceptuales", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tipoEspacio: text("tipo_espacio").notNull(),
	imagenUrl: text("imagen_url").notNull(),
	titulo: text(),
	visible: boolean().default(true).notNull(),
	orden: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

// Testimonios (REGISTRO §10, DC-1)

export const testimonios = pgTable("testimonios", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contenido: text().notNull(),
	// 2026-08-19: nombre del autor (texto libre) — reseñas reales de GBP traídas por el
	// equipo comercial tienen nombre de persona; el modelo anterior solo ataba cliente/proyecto.
	nombreAutor: text("nombre_autor"),
	rating: integer(),
	curado: boolean().default(false).notNull(),
	aprobado: boolean().default(false).notNull(),
	publicado: boolean().default(false).notNull(),
	fuente: fuenteTestimonio().notNull(),
	barrio: text(),
	tipoProyecto: text("tipo_proyecto"),
	urlFuente: text("url_fuente"),
	fechaPublicacion: text("fecha_publicacion"),
	clienteId: uuid("cliente_id"),
	proyectoId: uuid("proyecto_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		testimoniosClienteIdFk: foreignKey({
			columns: [table.clienteId], foreignColumns: [clientes.id], name: "testimonios_cliente_id_clientes_id_fk"
		}),
		testimoniosProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "testimonios_proyecto_id_proyectos_id_fk"
		}),
	}
});

// REGISTRO §8: assets de producción por nodo de módulo (imagen/plano/orden/3D)

export const modulosArtefactos = pgTable("modulos_artefactos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	moduloId: uuid("modulo_id").notNull(),
	tipo: tipoModuloArtefacto().notNull(),
	fuente: fuenteModuloArtefacto().notNull(),
	url: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		modulosArtefactosModuloIdFk: foreignKey({
			columns: [table.moduloId], foreignColumns: [modulos.id], name: "modulos_artefactos_modulo_id_modulos_id_fk"
		}),
	}
});

// F7 · Documentación del proyecto (P-26)

export const documentosProyecto = pgTable("documentos_proyecto", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proyectoId: uuid("proyecto_id").notNull(),
	etapa: macroFaseProyecto().notNull(),
	alojador: alojadorDocumento().notNull(),
	url: text().notNull(),
	nombre: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		documentosProyectoProyectoIdFk: foreignKey({
			columns: [table.proyectoId], foreignColumns: [proyectos.id], name: "documentos_proyecto_proyecto_id_proyectos_id_fk"
		}),
	}
});

// F-15 · Bitácora de Diseño (Blog / Sistema de Proyectos)

export const bitacoraArticulos = pgTable("bitacora_articulos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	titulo: text().notNull(),
	extracto: text().notNull(),
	contenidoLargo: text("contenido_largo").notNull(),
	categoria: bitacoraCategoria().notNull(),
	imagenPortada: text("imagen_portada"),
	fechaPublicacion: text("fecha_publicacion").notNull(),
	autorId: uuid("autor_id"),
	proyectoRelacionadoId: uuid("proyecto_relacionado_id"),
	publicado: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		bitacoraArticulosSlugUnique: unique("bitacora_articulos_slug_unique").on(table.slug),
		bitacoraArticulosAutorIdFk: foreignKey({
			columns: [table.autorId], foreignColumns: [personas.id], name: "bitacora_articulos_autor_id_personas_id_fk"
		}),
		bitacoraArticulosProyectoRelacionadoIdFk: foreignKey({
			columns: [table.proyectoRelacionadoId], foreignColumns: [proyectos.id], name: "bitacora_articulos_proyecto_relacionado_id_proyectos_id_fk"
		}),
	}
});
