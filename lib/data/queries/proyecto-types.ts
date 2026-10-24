import type {
  ActaEntrega,
  CitacionCalidad,
  Cliente,
  Cronograma,
  CronogramaEtapa,
  CuentaFinanciera,
  DesfaseCronograma,
  EspacioArtefacto,
  EspacioVariante,
  Instalacion,
  ItemVariante,
  Modulo,
  ModuloArtefacto,
  NotaReunion,
  ObligacionPendiente,
  OrdenCompra,
  ProductoCatalogo,
  Proyecto,
  RecepcionMaterial,
  Reproceso,
  Verificacion,
} from '../contracts'

export interface ProyectoSnapshot {
  proyecto: Proyecto | null
  cliente: Cliente | null
  espacios: EspacioVariante[]
  items: ItemVariante[]
  artefactos: EspacioArtefacto[]
  modulos: Modulo[]
  cronograma: Cronograma | null
  cronogramaEtapas: CronogramaEtapa[]
  desfases: DesfaseCronograma[]
  verificaciones: Verificacion[]
  recepciones: RecepcionMaterial[]
  citaciones: CitacionCalidad[]
  reprocesos: Reproceso[]
  instalaciones: Instalacion[]
  acta: ActaEntrega | null
  obligaciones: ObligacionPendiente[]
  ordenesCompra: OrdenCompra[]
  notas: NotaReunion[]
  modulosArtefactos: ModuloArtefacto[]
  catalogo: ProductoCatalogo[]
  cuentas: CuentaFinanciera[]
}

export const PROYECTO_VACIO: ProyectoSnapshot = {
  proyecto: null,
  cliente: null,
  espacios: [],
  items: [],
  artefactos: [],
  modulos: [],
  cronograma: null,
  cronogramaEtapas: [],
  desfases: [],
  verificaciones: [],
  recepciones: [],
  citaciones: [],
  reprocesos: [],
  instalaciones: [],
  acta: null,
  obligaciones: [],
  ordenesCompra: [],
  notas: [],
  modulosArtefactos: [],
  catalogo: [],
  cuentas: [],
}
