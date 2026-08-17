'use client'

import { useEffect } from 'react'
import { buttonClassName } from '@/components/veta/button'

// Boundary de error de la ruta /erp/login (convención Next.js: error.tsx
// captura cualquier excepción no manejada del render del segmento). El login
// en sí ya no depende de esto para sus propios fallos -- ErpLoginForm hace un
// fetch() JSON directo (app/api/erp/login) con su propio try/catch, ver
// comentario ahí sobre por qué se evitó el mecanismo de Server Actions. Esto
// queda como red de seguridad genérica para cualquier otro error de render
// inesperado en esta ruta.
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
