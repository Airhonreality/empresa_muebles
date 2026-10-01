'use client'
// Primitiva de notificación global mínima (t-175, diagnóstico de UI del cotizador 2026-09-30).
//
// Hasta ahora, cualquier acción que quisiera cerrarse/limpiarse en cuanto el cambio optimista
// aplica (en vez de esperar el roundtrip completo del servidor, la causa de "los botones se
// sienten lentos") tenía que elegir entre dos males: quedarse bloqueada hasta que el servidor
// responde, o cerrar ya y arriesgarse a que un fallo de red quede invisible (el problema inverso,
// exactamente el que motivó este diagnóstico). Este provider es la pieza que faltaba para poder
// cerrar de inmediato SIN perder la visibilidad del error: si la mutación falla después de que el
// modal ya se cerró, el usuario igual se entera.
import { createContext, useCallback, useContext, useState } from 'react'

interface ToastAccion {
  etiqueta: string
  onClick: () => void
}

interface ToastItem {
  id: string
  mensaje: string
  tono: 'error' | 'info'
  accion?: ToastAccion
}

interface ToastContextValue {
  /** Muestra un error que persiste ~6s. Pensado para fallos de mutaciones que ya cerraron su
   *  modal/control (no hay dónde más mostrar el mensaje inline). */
  mostrarError: (mensaje: string) => void
  /** 2026-09-30 (diagnóstico UX): confirmación ligera para acciones silenciosas de un clic que
   *  mueven plata entre el total contractual y el presupuesto referencial (sin ningún
   *  window.confirm) -- sin esto, reclasificar un ítem por error pasaba inadvertido. `accion`
   *  (ej. "Deshacer") deja revertir sin tener que ir a buscar el ítem manualmente. */
  mostrarInfo: (mensaje: string, accion?: ToastAccion) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast() debe usarse dentro de <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const agregar = useCallback((mensaje: string, tono: ToastItem['tono'], accion?: ToastAccion) => {
    const id = crypto.randomUUID()
    setToasts((cur) => [...cur, { id, mensaje, tono, accion }])
    setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 6000)
  }, [])

  const mostrarError = useCallback((mensaje: string) => agregar(mensaje, 'error'), [agregar])
  const mostrarInfo = useCallback((mensaje: string, accion?: ToastAccion) => agregar(mensaje, 'info', accion), [agregar])

  const cerrar = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ mostrarError, mostrarInfo }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`flex max-w-sm items-start gap-2 rounded-md border px-4 py-3 text-sm shadow-lg ${
              t.tono === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-gold-300 bg-gold-50 text-gold-800'
            }`}
          >
            <span className="flex-1">{t.mensaje}</span>
            {t.accion && (
              <button
                type="button"
                onClick={() => { t.accion?.onClick(); cerrar(t.id) }}
                className="shrink-0 font-semibold underline hover:no-underline"
              >
                {t.accion.etiqueta}
              </button>
            )}
            <button
              type="button"
              onClick={() => cerrar(t.id)}
              aria-label="Cerrar notificación"
              className={`shrink-0 ${t.tono === 'error' ? 'text-red-400 hover:text-red-600' : 'text-gold-500 hover:text-gold-700'}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
