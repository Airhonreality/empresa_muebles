import type { ProductoCatalogo, ProductoTienda, ProductoTiendaComponente, Proveedor } from '../contracts'

export interface CatalogoSnapshot {
  catalogo: ProductoCatalogo[]
  productosTienda: ProductoTienda[]
  productosTiendaComponentes: ProductoTiendaComponente[]
  proveedores: Proveedor[]
}

export const CATALOGO_VACIO: CatalogoSnapshot = {
  catalogo: [],
  productosTienda: [],
  productosTiendaComponentes: [],
  proveedores: [],
}
