// Punto de entrada del subsistema de datos para componentes React.
// La fábrica getDataStore() vive en ./store (sin imports de React) para que
// módulos de servidor plano (ej. lib/auth/session.ts) puedan importarla sin
// arrastrar el hook useDataStore() de acá abajo — ver comentario en store.ts.
import { useCallback, useSyncExternalStore } from 'react'
import type { DataStore } from './contracts'
import { getDataStore } from './store'

export { getDataStore } from './store'

/**
 * Contrato de reactividad (M-07, ver arnes/lineas/ola7/tecnico/m07_capa_reactividad.md).
 * Único punto de lectura del store para componentes de app/. Se suscribe vía
 * useSyncExternalStore: cualquier mutación (desde cualquier componente) re-renderiza
 * automáticamente a todos los suscriptores. Reemplaza el patrón manual
 * `useState(0) + setTrigger` que cada pantalla reinventaba por su cuenta.
 */
export function useDataStore(): DataStore {
  const dataStore = getDataStore()
  const subscribe = useCallback((onStoreChange: () => void) => dataStore.subscribe(onStoreChange), [dataStore])
  const getSnapshot = useCallback(() => dataStore.getVersion(), [dataStore])
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return dataStore
}

export type {
  DataStore, Proyecto, EstadoProyecto, Cliente, EspacioVariante, ItemVariante, EspacioArtefacto, ProductoCatalogo,
  Parametro, Contrato, HitoPago, UsuarioMock, TransicionesProyecto, ProyectosEstadosHistorial,
  Cronograma, CronogramaEtapa, LineaCronograma, EtapaCronograma, DesfaseCronograma, CausaDesfase,
  CheckProduccion, DesenlaceCheck, NovedadCritica, EstadoNovedadCritica, ComunicacionProgreso,
  SchemaProyecto, EstadoSchema, BomMaterial, OrigenBom, Verificacion, TipoGate, VeredictoGate,
  Retoma, CambioContrato, Persona, PersonaRol, RolCanonico, Modulo, Estimacion,
  OrdenTrabajo, TipoOrdenTrabajo, PedidoWeb, CitacionCalidad, Reproceso, OrigenReproceso,
  Instalacion, EstadoInstalacion, ActaEntrega, EstadoActaEntrega, CasoGarantia, EstadoCasoGarantia, CitaGarantia,
  CuentaFinanciera, MovimientoFinanciero, TipoMovimientoFinanciero, ObligacionPendiente, OrigenObligacion, EstadoObligacion,
  Proveedor, OrdenCompra, EstadoOrdenCompra, MecanicaPagoOC, RegistroGateCaja, CuentaCobroProveedor, EstadoCuentaCobro,
  Categoria, ProductoTienda, CatalogoAcabado, CatalogoProductoAcabado, AcabadoMuestra,
  Portafolio, ModuloArtefacto, TipoModuloArtefacto, FuenteModuloArtefacto,
  ItemOrdenCompra, RecepcionMaterial, EstadoRecepcionMaterial, Herramienta, EstadoOperativoHerramienta,
  DocumentoProyecto, MacroFaseProyecto, AlojadorDocumento,
} from './contracts'
