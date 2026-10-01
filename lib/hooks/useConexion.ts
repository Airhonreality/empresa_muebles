'use client'
import { useEffect, useState } from 'react'

/** Estado de conectividad del navegador (t-178, cierre del hueco de t-170: persistencia local).
 *  `navigator.onLine` es una señal imperfecta (no garantiza que Internet funcione, solo que hay
 *  una interfaz de red activa) pero es la única disponible sin hacer polling contra un servidor
 *  -- suficiente para avisar al usuario "no tenés señal" en vez de dejarlo adivinar por qué un
 *  cambio no se sincroniza. */
export function useConexion(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useEffect(() => {
    const marcarOnline = () => setOnline(true)
    const marcarOffline = () => setOnline(false)
    window.addEventListener('online', marcarOnline)
    window.addEventListener('offline', marcarOffline)
    return () => {
      window.removeEventListener('online', marcarOnline)
      window.removeEventListener('offline', marcarOffline)
    }
  }, [])

  return online
}
