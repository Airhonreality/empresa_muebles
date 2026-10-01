'use client'
// Banner de conectividad del cotizador (t-178, cierre del hueco de persistencia local de t-170).
//
// El caché de TanStack Query del cotizador ahora se persiste a localStorage (query-provider.tsx)
// -- si cerrás la pestaña en plena desconexión, al volver a abrirla ves lo último que había en
// pantalla en vez de que la pantalla aparezca vacía. Pero un snapshot persistido que incluye
// cambios optimistas SIN confirmar, mostrado en silencio, es exactamente el tipo de "memoria
// falsa" que reportó el usuario (ver diagnóstico 2026-09-30) -- así que mientras no hay conexión,
// este banner lo deja explícito en vez de dejar que el usuario asuma que todo ya se guardó.
import { useIsMutating } from '@tanstack/react-query'
import { useConexion } from '@/lib/hooks/useConexion'
import { cotizadorKeys } from '@/lib/data/queries/queryKeys'

export function BannerSinConexion({ proyectoId }: { proyectoId: string }) {
  const online = useConexion()
  const enVuelo = useIsMutating({ mutationKey: cotizadorKeys.detalle(proyectoId) })

  if (online) return null

  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900 border-b border-amber-300"
    >
      ⚠ Sin conexión a internet. Lo que ves en pantalla queda guardado en este dispositivo y se
      sincroniza solo apenas vuelva la señal
      {enVuelo > 0 ? ` — ${enVuelo} cambio${enVuelo > 1 ? 's' : ''} esperando confirmación` : ''}.
    </div>
  )
}
