'use server'
// Server Actions del cluster F7 (documentación, cuentas de cobro) + F-02 (tienda web).
// Porta 1:1 la lógica de lib/data/mock-store.ts. Ver plan_f10_migracion.md §3.1d.
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type {
  DocumentoProyecto, MacroFaseProyecto, AlojadorDocumento, CuentaCobroProveedor,
  Categoria, ProductoTienda, ProductoTiendaComponente, CatalogoAcabado, CatalogoProductoAcabado, AcabadoMuestra,
} from '../contracts'

export async function crearDocumentoProyectoAction(data: { proyectoId: string; etapa: MacroFaseProyecto; alojador: AlojadorDocumento; url: string; nombre: string }): Promise<DocumentoProyecto | null> {
  if (!data.url || data.url.trim().length === 0) return null
  const [nuevo] = await db.insert(s.documentosProyecto).values(data).returning()
  return nuevo as unknown as DocumentoProyecto
}

export async function eliminarDocumentoProyectoAction(id: string): Promise<boolean> {
  const [borrado] = await db.delete(s.documentosProyecto).where(eq(s.documentosProyecto.id, id)).returning()
  return Boolean(borrado)
}

export async function crearCuentaCobroProveedorAction(data: { proveedorId: string; concepto: string; valor: string; firmaDigital: string; fechaEmision: string; fechaVencimiento?: string | null }): Promise<CuentaCobroProveedor | null> {
  if (!data.firmaDigital || data.firmaDigital.trim().length === 0) return null
  return db.transaction(async (tx) => {
    const [obligacion] = await tx.insert(s.obligacionesPendientes).values({
      descripcion: `Cuenta de cobro: ${data.concepto}`, origen: 'proveedor', montoTotal: data.valor, montoPagado: '0',
      fechaVencimiento: data.fechaVencimiento ?? data.fechaEmision, estado: 'pendiente', proveedorId: data.proveedorId,
      deduccionDiseno3d: false,
    }).returning()
    const [nuevo] = await tx.insert(s.cuentasCobroProveedor).values({
      proveedorId: data.proveedorId, obligacionId: obligacion.id, concepto: data.concepto, valor: data.valor,
      estado: 'emitida', firmaDigital: data.firmaDigital, fechaEmision: data.fechaEmision,
      fechaVencimiento: data.fechaVencimiento ?? null,
    }).returning()
    return nuevo as unknown as CuentaCobroProveedor
  })
}

export async function vincularOcCuentaCobroAction(id: string, ordenCompraId: string): Promise<CuentaCobroProveedor | null> {
  return db.transaction(async (tx) => {
    const [cuenta] = await tx.select().from(s.cuentasCobroProveedor).where(eq(s.cuentasCobroProveedor.id, id))
    if (!cuenta) return null
    const [oc] = await tx.select().from(s.ordenesCompra).where(eq(s.ordenesCompra.id, ordenCompraId))
    if (!oc || oc.proveedorId !== cuenta.proveedorId) return null
    const [actualizado] = await tx.update(s.cuentasCobroProveedor).set({ ordenCompraId, estado: 'vinculada' }).where(eq(s.cuentasCobroProveedor.id, id)).returning()
    return actualizado as unknown as CuentaCobroProveedor
  })
}

export async function adjuntarFacturaCuentaCobroAction(id: string, urlDocumento: string): Promise<CuentaCobroProveedor | null> {
  const [actualizado] = await db.update(s.cuentasCobroProveedor).set({ urlDocumento }).where(eq(s.cuentasCobroProveedor.id, id)).returning()
  return (actualizado as unknown as CuentaCobroProveedor) ?? null
}

export async function marcarPagadaCuentaCobroAction(id: string): Promise<CuentaCobroProveedor | null> {
  return db.transaction(async (tx) => {
    const [cuenta] = await tx.select().from(s.cuentasCobroProveedor).where(eq(s.cuentasCobroProveedor.id, id))
    if (!cuenta || !cuenta.obligacionId) return null
    const [movimientoPago] = await tx.select().from(s.movimientosFinancieros).where(eq(s.movimientosFinancieros.obligacionId, cuenta.obligacionId))
    if (!movimientoPago || movimientoPago.tipo !== 'debito') return null
    const [actualizado] = await tx.update(s.cuentasCobroProveedor).set({ estado: 'pagada' }).where(eq(s.cuentasCobroProveedor.id, id)).returning()
    return actualizado as unknown as CuentaCobroProveedor
  })
}

export async function anularCuentaCobroAction(id: string): Promise<CuentaCobroProveedor | null> {
  const [actualizado] = await db.update(s.cuentasCobroProveedor).set({ estado: 'anulada' }).where(eq(s.cuentasCobroProveedor.id, id)).returning()
  return (actualizado as unknown as CuentaCobroProveedor) ?? null
}

export async function crearCategoriaAction(data: { nombre: string; tipo: string; padreId?: string | null }): Promise<Categoria> {
  const [nuevo] = await db.insert(s.categorias).values({ nombre: data.nombre, tipo: data.tipo, padreId: data.padreId ?? null, activo: true }).returning()
  return nuevo as unknown as Categoria
}

export async function crearProductoTiendaAction(data: Partial<ProductoTienda> & { catalogoId: string; valorTienda: string }): Promise<ProductoTienda> {
  const [nuevo] = await db.insert(s.productosTienda).values({
    catalogoId: data.catalogoId, descripcionDiseno: data.descripcionDiseno ?? null, imagenPrincipalUrl: data.imagenPrincipalUrl ?? null,
    categoria: data.categoria ?? 'Cocinas', visibleEnTienda: data.visibleEnTienda ?? false, valorTienda: data.valorTienda,
    inventarioDisponible: data.inventarioDisponible ?? 0, calificacionPromedio: data.calificacionPromedio != null ? String(data.calificacionPromedio) : null,
  }).returning()
  return { ...nuevo, calificacionPromedio: nuevo.calificacionPromedio ? Number(nuevo.calificacionPromedio) : null } as unknown as ProductoTienda
}

export async function actualizarProductoTiendaAction(id: string, partial: Partial<Pick<ProductoTienda, 'descripcionDiseno' | 'imagenPrincipalUrl' | 'categoria' | 'visibleEnTienda' | 'valorTienda' | 'inventarioDisponible'>>): Promise<ProductoTienda | null> {
  const [actualizado] = await db.update(s.productosTienda).set({ ...partial, updatedAt: new Date().toISOString() }).where(eq(s.productosTienda.id, id)).returning()
  if (!actualizado) return null
  return { ...actualizado, calificacionPromedio: actualizado.calificacionPromedio ? Number(actualizado.calificacionPromedio) : null } as unknown as ProductoTienda
}

export async function crearProductoTiendaComponenteAction(data: { productoTiendaId: string; catalogoId: string; cantidad: string }): Promise<ProductoTiendaComponente> {
  const [nuevo] = await db.insert(s.productosTiendaComponentes).values(data).returning()
  return nuevo as unknown as ProductoTiendaComponente
}

export async function eliminarProductoTiendaComponenteAction(id: string): Promise<void> {
  await db.delete(s.productosTiendaComponentes).where(eq(s.productosTiendaComponentes.id, id))
}

export async function crearCatalogoAcabadoAction(data: Partial<CatalogoAcabado> & { nombre: string }): Promise<CatalogoAcabado> {
  const [nuevo] = await db.insert(s.catalogoAcabados).values({
    nombre: data.nombre, familia: data.familia ?? null, color: data.color ?? null, colorHex: data.colorHex ?? null,
    textura: data.textura ?? null, precioDiferencial: data.precioDiferencial ?? null, imagenTexturaUrl: data.imagenTexturaUrl ?? null,
  }).returning()
  return nuevo as unknown as CatalogoAcabado
}

export async function crearCatalogoProductoAcabadoAction(data: { productoCatalogoId: string; acabadoId: string; esDefault?: boolean }): Promise<CatalogoProductoAcabado> {
  const [nuevo] = await db.insert(s.catalogoProductoAcabados).values({
    productoCatalogoId: data.productoCatalogoId, acabadoId: data.acabadoId, esDefault: data.esDefault ?? false,
  }).returning()
  return nuevo as unknown as CatalogoProductoAcabado
}

export async function crearAcabadoMuestraAction(data: { acabadoId: string; imagenMuestraUrl?: string | null; disponibleWeb?: boolean }): Promise<AcabadoMuestra> {
  const [nuevo] = await db.insert(s.acabadosMuestras).values({
    acabadoId: data.acabadoId, imagenMuestraUrl: data.imagenMuestraUrl ?? null, disponibleWeb: data.disponibleWeb ?? true,
  }).returning()
  return nuevo as unknown as AcabadoMuestra
}
