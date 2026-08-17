'use client'

import { useEffect } from 'react'
import { buttonClassName } from '@/components/veta/button'

// Boundary de error de la ruta /erp/login (convención Next.js: error.tsx
// captura excepciones no manejadas de renders/Server Actions del segmento).
// Los fallos ESPERADOS del login (credenciales inválidas, error de sistema
// del backend) ya vuelven como ?error= manejado en page.tsx/ErpLoginForm —
// esto es solo para lo que ni siquiera llega a responder: el fetch de la
// Server Action cortado a nivel de red (extensión de navegador, VPN, proxy
// corporativo interceptando el POST). Hallazgo de Javier (2026-08-17): sin
// esto, ese caso dejaba el botón en "Ingresando…" para siempre, sin ningún
// mensaje ni log.
export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[erp/login error.tsx] fallo no capturado durante el login:', error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-text-heading">No se pudo conectar</h1>
      <p className="text-sm text-text-muted">
        Hubo un problema de red al intentar iniciar sesión. Revisá tu conexión (o desactivá extensiones/VPN que
        puedan estar bloqueando la petición) e intentá de nuevo.
      </p>
      <button type="button" onClick={reset} className={buttonClassName('primary', 'lg', 'mt-2')}>
        Reintentar
      </button>
    </div>
  )
}
