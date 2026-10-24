import type { Cliente, Contrato, ObligacionPendiente, PedidoWeb, Proyecto } from '../contracts'

export interface ClientesSnapshot {
  clientes: Cliente[]
  proyectos: Proyecto[]
  pedidos: PedidoWeb[]
  obligaciones: ObligacionPendiente[]
  contratos: Contrato[]
}

export const CLIENTES_VACIO: ClientesSnapshot = {
  clientes: [],
  proyectos: [],
  pedidos: [],
  obligaciones: [],
  contratos: [],
}
