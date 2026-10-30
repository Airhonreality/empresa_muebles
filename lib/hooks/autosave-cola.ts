// Núcleo puro del autoguardado (sin React) — probado en autosave-cola.test.ts.
//
// Patrón: "draft local → patch coalescido → una sola escritura en vuelo → última escritura
// gana". El debounce evita un request por tecla; la cola garantiza que nunca haya dos
// peticiones del mismo formulario en paralelo (la segunda espera y manda el valor más nuevo),
// así el servidor termina con el último estado que vio el usuario y no con el que llegó tarde.

export type EstadoAutosave = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

const PRIORIDAD: Record<EstadoAutosave, number> = {
  idle: 0,
  saved: 1,
  pending: 2,
  saving: 3,
  error: 4,
}

/** Estado "peor" de varios formularios de una misma sección (para un único indicador). */
export function combinarEstados(...estados: EstadoAutosave[]): EstadoAutosave {
  return estados.reduce<EstadoAutosave>(
    (peor, actual) => (PRIORIDAD[actual] > PRIORIDAD[peor] ? actual : peor),
    'idle',
  )
}

/** Igualdad estructural barata para valores de formulario (strings, arrays de URLs, objetos
 *  planos). No soporta Map/Set/Date — no se usan en estos drafts. */
export function mismoValor(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

export interface OpcionesColaAutosave<T> {
  guardar: (valor: T) => Promise<unknown>
  /** Valor ya persistido al montar: evita guardar lo que el usuario no tocó. */
  valorInicial: T
  onEstado: (estado: EstadoAutosave) => void
  delayMs?: number
  iguales?: (a: T, b: T) => boolean
  /** Inyectables para test con timers falsos. */
  programar?: (fn: () => void, ms: number) => unknown
  cancelar?: (handle: unknown) => void
}

export interface ColaAutosave<T> {
  /** Notifica el valor vigente del draft: (re)agenda el guardado si cambió. */
  programar: (valor: T) => void
  /** Guarda ya (blur, cerrar la sección, ocultar la pestaña). */
  flush: () => void
  /** Reintenta tras un error con el último valor del draft. */
  reintentar: () => void
  /** Cancela lo agendado y deja de reportar estado (desmontaje). */
  dispose: () => void
}

export function crearColaAutosave<T>(opciones: OpcionesColaAutosave<T>): ColaAutosave<T> {
  const { guardar, valorInicial, onEstado, delayMs = 700, iguales = mismoValor } = opciones
  const programarTimer = opciones.programar ?? ((fn, ms) => setTimeout(fn, ms))
  const cancelarTimer = opciones.cancelar ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>))

  let actual = valorInicial
  let ultimoGuardado = valorInicial
  let enviando = false
  let enviandoValor: T = valorInicial
  let pendiente: T | undefined
  let timer: unknown = null
  let desechada = false
  let estadoActual: EstadoAutosave = 'idle'

  const reportar = (estado: EstadoAutosave) => {
    estadoActual = estado
    if (!desechada) onEstado(estado)
  }

  const cancelarAgendado = () => {
    if (timer !== null) {
      cancelarTimer(timer)
      timer = null
    }
  }

  async function vaciar(): Promise<void> {
    // Ojo: NO se corta por `desechada`. Si la sección se cierra mientras una escritura está
    // en vuelo y había un valor más nuevo pendiente, ese pendiente todavía debe llegar al
    // servidor (dispose solo cancela lo agendado y silencia el estado, no pierde datos).

    // Una sola escritura en vuelo: si llega otro valor, se queda como pendiente y se manda
    // al terminar la actual (nunca dos requests concurrentes del mismo formulario).
    if (enviando) {
      if (!iguales(actual, enviandoValor)) pendiente = actual
      return
    }
    if (iguales(actual, ultimoGuardado)) return

    const aEnviar = actual
    enviando = true
    enviandoValor = aEnviar
    reportar('saving')

    try {
      await guardar(aEnviar)
      ultimoGuardado = aEnviar
      enviando = false
      if (pendiente !== undefined && !iguales(pendiente, ultimoGuardado)) {
        actual = pendiente
        pendiente = undefined
        await vaciar()
        return
      }
      pendiente = undefined
      reportar('saved')
    } catch {
      // El draft local queda intacto (la UI no pierde lo escrito); la caché ya revierte sola
      // vía revertirOptimista de la mutación. El usuario decide reintentar.
      enviando = false
      reportar('error')
    }
  }

  return {
    programar(valor) {
      actual = valor
      if (enviando) {
        if (!iguales(valor, enviandoValor)) pendiente = valor
        return
      }
      if (iguales(valor, ultimoGuardado)) {
        cancelarAgendado()
        // Solo vuelve a idle si había algo pendiente (el usuario deshizo su cambio). Si ya
        // estaba "Guardado", se deja el acuse visible en vez de borrarlo en el siguiente render.
        if (estadoActual === 'pending') reportar('idle')
        return
      }
      reportar('pending')
      cancelarAgendado()
      timer = programarTimer(() => {
        timer = null
        void vaciar()
      }, delayMs)
    },
    flush() {
      cancelarAgendado()
      void vaciar()
    },
    reintentar() {
      reportar('pending')
      void vaciar()
    },
    dispose() {
      cancelarAgendado()
      desechada = true
    },
  }
}
