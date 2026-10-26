import type {
  Cliente,
  Contrato,
  EventoConversionOffline,
  Lead,
  ObligacionPendiente,
  PedidoWeb,
  Proyecto,
} from '../contracts'

export interface ClientesSnapshot {
  clientes: Cliente[]
  proyectos: Proyecto[]
  pedidos: PedidoWeb[]
  obligaciones: ObligacionPendiente[]
  contratos: Contrato[]
  /** t-188: leads del sitio con su atribución (gclid/UTM) para la vista Conversiones. */
  leads: Lead[]
  /** t-188: cola de conversiones offline escrita al firmar contrato. */
  eventosConversion: EventoConversionOffline[]
}

export const CLIENTES_VACIO: ClientesSnapshot = {
  clientes: [],
  proyectos: [],
  pedidos: [],
  obligaciones: [],
  contratos: [],
  leads: [],
  eventosConversion: [],
}
