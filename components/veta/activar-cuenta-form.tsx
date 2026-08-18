'use client'

import { useState } from 'react'
import { InputField } from './input-field'
import { Button } from './button'
import type { AuthResult } from '@/lib/auth/session'

// Mismos mensajes que la página server-side manejaba antes por query string —
// ahora se resuelven acá porque el POST pasó a ser fetch() JSON, no Server Action.
const ERRORES: Record<string, string> = {
  token_invalido: 'Este enlace de invitación no es válido. Pedile a un administrador que te genere uno nuevo.',
  token_vencido: 'Este enlace de invitación venció. Pedile a un administrador que te genere uno nuevo.',
  password_corta: 'La contraseña debe tener al menos 8 caracteres.',
  password_no_coincide: 'Las contraseñas no coinciden.',
  error_sistema: 'Hubo un problema del sistema al activar la cuenta. Intentá de nuevo en un momento.',
}

const MENSAJE_ERROR_RED =
  'No se pudo conectar con el servidor. Revisá tu conexión (o desactivá extensiones/VPN que puedan estar bloqueando la petición) e intentá de nuevo.'

/**
 * fetch() JSON contra app/api/erp/activar (Route Handler), NO Server Action —
 * el <form action={...}> nativo devolvía 400 en el edge de Vercel, mismo
 * mecanismo ya diagnosticado y corregido para ErpLoginForm (ver ese archivo).
 */
export function ActivarCuentaForm({ token }: { token: string }) {
  const [pending, setPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    setPending(true)

    const formData = new FormData(e.currentTarget)
    const password = String(formData.get('password') ?? '')
    const passwordConfirmacion = String(formData.get('passwordConfirmacion') ?? '')

    if (password !== passwordConfirmacion) {
      setErrorMsg(ERRORES.password_no_coincide)
      setPending(false)
      return
    }

    try {
      const res = await fetch('/api/erp/activar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, passwordConfirmacion }),
      })
      const resultado = (await res.json()) as AuthResult
      if (resultado.ok) {
        window.location.href = '/erp/comercial'
        return
      }
      setErrorMsg(ERRORES[resultado.error ?? ''] ?? 'No pudimos activar tu cuenta. Intentá de nuevo.')
    } catch (err) {
      console.error('[ActivarCuentaForm] fallo de red al activar la cuenta:', err)
      setErrorMsg(MENSAJE_ERROR_RED)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} method="post" className="flex flex-col gap-4">
      <InputField
        label="Contraseña"
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        disabled={pending}
      />
      <InputField
        label="Confirmar contraseña"
        name="passwordConfirmacion"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        disabled={pending}
      />
      {errorMsg && (
        <p role="alert" className="text-xs text-error-text">
          {errorMsg}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg" className="mt-2" disabled={pending}>
        {pending ? 'Activando…' : 'Activar cuenta'}
      </Button>
    </form>
  )
}
