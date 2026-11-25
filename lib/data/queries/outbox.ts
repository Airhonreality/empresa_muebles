// Cola de escrituras (outbox) del cotizador. Núcleo puro: sin React, sin IndexedDB directo.
//
// Reglas:
// - Las escrituras se ejecutan en orden (FIFO). Un ítem puede depender del anterior.
// - Fallo de RED: la escritura se queda en la cola y se reintenta sola con espera creciente.
//   Nunca se descarta por red. La pantalla sigue mostrando el cambio como pendiente.
// - RECHAZO del servidor (validación, regla de negocio): la escritura sale de la cola, se avisa
//   con onRechazada y la promesa de la mutación se rechaza. Ahí la pantalla vuelve a la verdad.
// - Cada escritura confirmada sale de la cola y se avisa con onConfirmada.
// - La cola sobrevive a una recarga: se persiste con el almacén que se inyecta.
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

export interface OpcionesOutbox {
  almacen: AlmacenOutbox
  /** Ejecuta la escritura contra el servidor. Lanza error si falla. */
  ejecutar: (tipo: TipoEscritura, args: unknown) => Promise<unknown>
  /** `conEspera`: true si una mutación de la sesión actual sigue esperando este resultado (la
   *  pantalla ya se actualiza sola). false si viene de una recarga: hay que refrescar la caché. */
  onConfirmada?: (escritura: EscrituraPendiente, resultado: unknown, conEspera: boolean) => void
  onRechazada?: (escritura: EscrituraPendiente, error: Error, conEspera: boolean) => void
  /** Programa un reintento. Inyectable para pruebas. */
  programar?: (fn: () => void, ms: number) => unknown
}

interface Espera {
  resolver: (valor: unknown) => void
  rechazar: (error: Error) => void
}

export class Outbox {
  private cola: EscrituraPendiente[] = []
  private esperas = new Map<string, Espera>()
  private procesando = false
  private inicio: Promise<void> | null = null
  private timer: unknown = null
  private readonly programar: (fn: () => void, ms: number) => unknown

  constructor(private readonly opciones: OpcionesOutbox) {
    this.programar = opciones.programar ?? ((fn, ms) => setTimeout(fn, ms))
  }

  /** Carga la cola persistida. Idempotente: varias llamadas concurrentes comparten una sola
   *  lectura, para que ninguna sobrescriba escrituras ya encoladas. */
  iniciar(): Promise<void> {
    this.inicio ??= this.opciones.almacen.leer().then((lista) => {
      this.cola = lista
    })
    return this.inicio
  }

  /** Encola una escritura y devuelve una promesa que resuelve con el resultado del servidor, o
   *  se rechaza si el servidor la rechaza de forma definitiva. Los fallos de red no rechazan. */
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
    await this.persistir()
    const promesa = new Promise<unknown>((resolver, rechazar) => {
      this.esperas.set(escritura.id, { resolver, rechazar })
    })
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
        try {
          const resultado = await this.opciones.ejecutar(actual.tipo, actual.args)
          this.cola.shift()
          await this.persistir()
          const espera = this.esperas.get(actual.id)
          this.opciones.onConfirmada?.(actual, resultado, espera !== undefined)
          espera?.resolver(resultado)
          this.esperas.delete(actual.id)
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          if (esErrorDeRed(error)) {
            actual.intentosRed += 1
            await this.persistir()
            this.agendarReintento(actual.intentosRed)
            return
          }
          this.cola.shift()
          await this.persistir()
          const espera = this.esperas.get(actual.id)
          this.opciones.onRechazada?.(actual, error, espera !== undefined)
          espera?.rechazar(error)
          this.esperas.delete(actual.id)
        }
      }
    } finally {
      this.procesando = false
    }
  }

  private agendarReintento(intento: number): void {
    if (this.timer !== null) return
    this.timer = this.programar(() => {
      this.timer = null
      void this.procesar()
    }, esperaReintento(Math.min(intento - 1, 6)))
  }

  private async persistir(): Promise<void> {
    await this.opciones.almacen.guardar(this.cola)
  }
}
