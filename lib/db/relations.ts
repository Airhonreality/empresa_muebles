import { relations } from "drizzle-orm/relations";
import { proyectos, contratos, espacioVariantes, hitosPago, portfolioPublico, imagenesPortfolio, itemsVariante, productosCatalogo, cuentasFinancieras, movimientosFinancieros, obligacionesPendientes, clientes, proveedores, ordenesTrabajo, pedidosWeb, tareasProduccion, usuarios } from "./schema";

export const contratosRelations = relations(contratos, ({one, many}) => ({
	proyecto: one(proyectos, {
		fields: [contratos.proyectoId],
		references: [proyectos.id]
	}),
	hitosPagos: many(hitosPago),
	movimientosFinancieros: many(movimientosFinancieros),
	obligacionesPendientes: many(obligacionesPendientes),
}));

export const proyectosRelations = relations(proyectos, ({one, many}) => ({
	contratos: many(contratos),
	espacioVariantes: many(espacioVariantes),
	portfolioPublicos: many(portfolioPublico),
	movimientosFinancieros: many(movimientosFinancieros),
	obligacionesPendientes: many(obligacionesPendientes),
	ordenesTrabajos: many(ordenesTrabajo),
	productosCatalogos: many(productosCatalogo),
	cliente: one(clientes, {
		fields: [proyectos.clienteId],
		references: [clientes.id]
	}),
}));

export const espacioVariantesRelations = relations(espacioVariantes, ({one, many}) => ({
	proyecto: one(proyectos, {
		fields: [espacioVariantes.proyectoId],
		references: [proyectos.id]
	}),
	itemsVariantes: many(itemsVariante),
}));

export const hitosPagoRelations = relations(hitosPago, ({one}) => ({
	contrato: one(contratos, {
		fields: [hitosPago.contratoId],
		references: [contratos.id]
	}),
}));

export const portfolioPublicoRelations = relations(portfolioPublico, ({one, many}) => ({
	proyecto: one(proyectos, {
		fields: [portfolioPublico.proyectoId],
		references: [proyectos.id]
	}),
	imagenesPortfolios: many(imagenesPortfolio),
}));

export const imagenesPortfolioRelations = relations(imagenesPortfolio, ({one}) => ({
	portfolioPublico: one(portfolioPublico, {
		fields: [imagenesPortfolio.portfolioId],
		references: [portfolioPublico.id]
	}),
}));

export const itemsVarianteRelations = relations(itemsVariante, ({one}) => ({
	espacioVariante: one(espacioVariantes, {
		fields: [itemsVariante.varianteId],
		references: [espacioVariantes.id]
	}),
	productosCatalogo: one(productosCatalogo, {
		fields: [itemsVariante.catalogoId],
		references: [productosCatalogo.id]
	}),
}));

export const productosCatalogoRelations = relations(productosCatalogo, ({one, many}) => ({
	itemsVariantes: many(itemsVariante),
	proveedore: one(proveedores, {
		fields: [productosCatalogo.proveedorId],
		references: [proveedores.id]
	}),
	proyecto: one(proyectos, {
		fields: [productosCatalogo.proyectoOrigenId],
		references: [proyectos.id]
	}),
}));

export const movimientosFinancierosRelations = relations(movimientosFinancieros, ({one}) => ({
	cuentasFinanciera_cuentaOrigenId: one(cuentasFinancieras, {
		fields: [movimientosFinancieros.cuentaOrigenId],
		references: [cuentasFinancieras.id],
		relationName: "movimientosFinancieros_cuentaOrigenId_cuentasFinancieras_id"
	}),
	cuentasFinanciera_cuentaDestinoId: one(cuentasFinancieras, {
		fields: [movimientosFinancieros.cuentaDestinoId],
		references: [cuentasFinancieras.id],
		relationName: "movimientosFinancieros_cuentaDestinoId_cuentasFinancieras_id"
	}),
	obligacionesPendiente: one(obligacionesPendientes, {
		fields: [movimientosFinancieros.obligacionId],
		references: [obligacionesPendientes.id]
	}),
	proyecto: one(proyectos, {
		fields: [movimientosFinancieros.proyectoId],
		references: [proyectos.id]
	}),
	contrato: one(contratos, {
		fields: [movimientosFinancieros.contratoId],
		references: [contratos.id]
	}),
}));

export const cuentasFinancierasRelations = relations(cuentasFinancieras, ({many}) => ({
	movimientosFinancieros_cuentaOrigenId: many(movimientosFinancieros, {
		relationName: "movimientosFinancieros_cuentaOrigenId_cuentasFinancieras_id"
	}),
	movimientosFinancieros_cuentaDestinoId: many(movimientosFinancieros, {
		relationName: "movimientosFinancieros_cuentaDestinoId_cuentasFinancieras_id"
	}),
}));

export const obligacionesPendientesRelations = relations(obligacionesPendientes, ({one, many}) => ({
	movimientosFinancieros: many(movimientosFinancieros),
	cliente: one(clientes, {
		fields: [obligacionesPendientes.clienteId],
		references: [clientes.id]
	}),
	proveedore: one(proveedores, {
		fields: [obligacionesPendientes.proveedorId],
		references: [proveedores.id]
	}),
	proyecto: one(proyectos, {
		fields: [obligacionesPendientes.proyectoId],
		references: [proyectos.id]
	}),
	contrato: one(contratos, {
		fields: [obligacionesPendientes.contratoId],
		references: [contratos.id]
	}),
}));

export const clientesRelations = relations(clientes, ({many}) => ({
	obligacionesPendientes: many(obligacionesPendientes),
	pedidosWebs: many(pedidosWeb),
	usuarios: many(usuarios),
	proyectos: many(proyectos),
}));

export const proveedoresRelations = relations(proveedores, ({many}) => ({
	obligacionesPendientes: many(obligacionesPendientes),
	productosCatalogos: many(productosCatalogo),
}));

export const ordenesTrabajoRelations = relations(ordenesTrabajo, ({one, many}) => ({
	proyecto: one(proyectos, {
		fields: [ordenesTrabajo.proyectoId],
		references: [proyectos.id]
	}),
	tareasProduccions: many(tareasProduccion),
}));

export const pedidosWebRelations = relations(pedidosWeb, ({one}) => ({
	cliente: one(clientes, {
		fields: [pedidosWeb.clienteId],
		references: [clientes.id]
	}),
}));

export const tareasProduccionRelations = relations(tareasProduccion, ({one}) => ({
	ordenesTrabajo: one(ordenesTrabajo, {
		fields: [tareasProduccion.ordenId],
		references: [ordenesTrabajo.id]
	}),
	usuario: one(usuarios, {
		fields: [tareasProduccion.operarioId],
		references: [usuarios.id]
	}),
}));

export const usuariosRelations = relations(usuarios, ({one, many}) => ({
	tareasProduccions: many(tareasProduccion),
	cliente: one(clientes, {
		fields: [usuarios.clienteId],
		references: [clientes.id]
	}),
}));