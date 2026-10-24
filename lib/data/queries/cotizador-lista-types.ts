import type { Cliente, Proyecto } from '../contracts'

export interface CotizadorListaSnapshot {
  proyectos: Proyecto[]
  clientes: Cliente[]
}

export const COTIZADOR_LISTA_VACIO: CotizadorListaSnapshot = {
  proyectos: [],
  clientes: [],
}
