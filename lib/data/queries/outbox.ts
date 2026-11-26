// Cola de escrituras (outbox) del cotizador. Núcleo puro: sin React, sin IndexedDB directo.
//
// Reglas:
// - Las escrituras se ejecutan en orden (FIFO). Un ítem puede depender del anterior.
// - MEMORIA PRIMERO: la cola en memoria es la verdad durante la sesión. El almacén persistente
//   (IndexedDB) solo sirve para sobrevivir a una recarga. Un fallo de almacenamiento NUNCA cambia
//   el resultado de una escritura: no la rechaza, no la reenvía dos veces y no la descarta. Solo
//   se avisa con onErrorPersistencia (lo pendiente podría perderse si se recarga la pestaña).
// - Fallo de RED: la escritura se queda en la cola y se reintenta sola con espera creciente.
// - RECHAZO del servidor (validación, regla de negocio): la escritura sale de la cola, se avisa
//   con onRechazada y la promesa de la mutación se rechaza. Ahí la pantalla vuelve a la verdad.
// - CONFIRMACIÓN: la escritura sale de la cola ANTES de persistir y se avisa con onConfirmada.
//   Un error al guardar después de confirmar nunca la vuelve a enviar ni la marca como rechazada.
// - Las escrituras de la cola se guardan en orden (cadena de guardados) para que la última
//   instantánea escrita sea siempre la más reciente.
import { esErrorDeRed, esperaReintento } from './reintento'

/** Nombre de la acción de escritura a ejecutar (ver ACCIONES_COTIZADOR). */
export type TipoEscritura = string

export interface EscrituraPendiente {
  id: string
  tipo: TipoEscritura
  args: unknown
  proyectoId: string
  creadaEn: number
  intentosRed: number
}

export interface AlmacenOutbox {
  leer(): Promise<EscrituraPendiente[]>
  guardar(lista: EscrituraPendiente[]): Promise<void>
}

export type ContextoPersistencia = 'leer' | 'guardar'

export interface OpcionesOutbox {
  almacen: AlmacenOutbox
  /** Ejecuta la escritura contra el servidor. Lanza error si falla. */
  ejecutar: (tipo: TipoEscritura, args: unknown) => Promise<unknown>
  /** `conEspera`: true si una mutación de la sesión actual sigue esperando este resultado (la
   *  pantalla ya se actualiza sola). false si viene de una recarga: hay que refrescar la caché. */
  onConfirmada?: (escritura: EscrituraPendiente, resultado: unknown, conEspera: boolean) => void
  onRechazada?: (escritura: EscrituraPendiente, error: Error, conEspera: boolean) => void
  /** Fallo al leer o guardar la cola en el dispositivo. No cambia el resultado de ninguna escritura. */
  onErrorPersistencia?: (error: Error, contexto: ContextoPersistencia) => void
  /** Fallo de red: la escritura sigue en cola y se reintentará. `intento` cuenta desde 1. */
  onFalloRed?: (escritura: EscrituraPendiente, error: Error, intento: number) => void
  /** Programa un reintento. Inyectable para pruebas. */
  programar?: (fn: () => void, ms: number) => unknown
}

interface Espera {
  resolver: (valor: unknown) => void
  rechazar: (error: Error) => void
}

function aError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err))
}

export class Outbox {
  private cola: EscrituraPendiente[] = []
  private esperas = new Map<string, Espera>()
  private procesando = false
  private cargada = false
  private guardando: Promise<void> = Promise.resolve()
  private timer: unknown = null
  private readonly programar: (fn: () => void, ms: number) => unknown

  constructor(private readonly opciones: OpcionesOutbox) {
    this.programar = opciones.programar ?? ((fn, ms) => setTimeout(fn, ms))
  }

  /** Carga la cola persistida y la fusiona con lo que ya está en memoria. Si la lectura falla,
   *  avisa y deja la cola en memoria; la próxima llamada vuelve a intentar leer. Nunca rechaza. */
  async iniciar(): Promise<void> {
    if (this.cargada) return
    try {
      const lista = await this.opciones.almacen.leer()
      if (this.cargada) return
      const enMemoria = this.cola.filter((e) => !lista.some((l) => l.id === e.id))
      this.cola = [...lista, ...enMemoria]
      this.cargada = true
    } catch (err) {
      this.notificarPersistencia(err, 'leer')
    }
  }

  /** Encola una escritura y devuelve una promesa que resuelve con el resultado del servidor, o
   *  se rechaza si el servidor la rechaza de forma definitiva. Los fallos de red no rechazan, y
   *  los fallos de almacenamiento tampoco: la escritura sigue en memoria. */
  async encolar(tipo: TipoEscritura, args: unknown, proyectoId: string): Promise<unknown> {
    await this.iniciar()
    const escritura: EscrituraPendiente = {
      id: crypto.randomUUID(),
      tipo,
      args,
      proyectoId,
      creadaEn: Date.now(),
      intentosRed: 0,
    }
    this.cola.push(escritura)
    const promesa = new Promise<unknown>((resolver, rechazar) => {
      this.esperas.set(escritura.id, { resolver, rechazar })
    })
    void this.persistir()
    void this.procesar()
    return promesa
  }

  /** Número de escrituras que todavía no confirmó el servidor. */
  pendientes(): number {
    return this.cola.length
  }

  /** Ejecuta la cola en orden hasta vaciarla o hasta un fallo de red (que deja la cola en espera). */
  async procesar(): Promise<void> {
    if (this.procesando) return
    this.procesando = true
    try {
      await this.iniciar()
      while (this.cola.length > 0) {
        const actual = this.cola[0]
        let resultado: unknown
        try {
          resultado = await this.opciones.ejecutar(actual.tipo, actual.args)
        } catch (err) {
          const error = aError(err)
          if (esErrorDeRed(error)) {
            actual.intentosRed += 1
            await this.persistir()
            const intento = actual.intentosRed
            this.notificar(() => this.opciones.onFalloRed?.(actual, error, intento))
            this.agendarReintento(intento)
            return
          }
          this.quitar(actual.id)
          await this.persistir()
          const espera = this.esperas.get(actual.id)
          this.notificar(() => this.opciones.onRechazada?.(actual, error, espera !== undefined))
          espera?.rechazar(error)
          this.esperas.delete(actual.id)
          continue
        }

        // El servidor ya aplicó la escritura. Sale de la cola antes de persistir: un fallo al
        // guardar no puede reenviarla ni tratarla como rechazo.
        this.quitar(actual.id)
        await this.persistir()
        const espera = this.esperas.get(actual.id)
        this.notificar(() => this.opciones.onConfirmada?.(actual, resultado, espera !== undefined))
        espera?.resolver(resultado)
        this.esperas.delete(actual.id)
      }
    } finally {
      this.procesando = false
    }
  }

  private quitar(id: string): void {
    this.cola = this.cola.filter((e) => e.id !== id)
  }

  /** Un callback del consumidor que lanza no debe detener la cola. */
  private notificar(fn: () => void): void {
    try {
      fn()
    } catch (err) {
      console.error('[outbox] callback del consumidor lanzó un error:', aError(err))
    }
  }

  private notificarPersistencia(err: unknown, contexto: ContextoPersistencia): void {
    this.notificar(() => this.opciones.onErrorPersistencia?.(aError(err), contexto))
  }

  private agendarReintento(intento: number): void {
    if (this.timer !== null) return
    this.timer = this.programar(() => {
      this.timer = null
      void this.procesar()
    }, esperaReintento(Math.min(intento - 1, 6)))
  }

  /** Guarda una instantánea de la cola. Las llamadas se encadenan para que se apliquen en orden.
   *  Nunca rechaza: un fallo se avisa con onErrorPersistencia y la cola en memoria sigue. */
  private persistir(): Promise<void> {
    const instantanea = [...this.cola]
    this.guardando = this.guardando
      .then(() => this.opciones.almacen.guardar(instantanea))
      .catch((err: unknown) => this.notificarPersistencia(err, 'guardar'))
    return this.guardando
  }
}
