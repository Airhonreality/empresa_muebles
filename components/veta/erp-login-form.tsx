'use client'

import { useState } from 'react'
import { InputField } from './input-field'
import { Button } from './button'
import type { AuthResult } from '@/lib/auth/session'

// Mensajes por código de error (lib/auth/session.ts AuthResult['error']) —
// distinguen sistema/usuario/contraseña en vez de un genérico único (pedido
// de Javier, 2026-08-17, ver lib/auth/session.ts loginEmpleado()).
const ERRORES: Record<string, string> = {
  credenciales_invalidas: 'Email o contraseña incorrectos.',
  usuario_no_encontrado: 'No encontramos una cuenta activa con ese email.',
  password_incorrecta: 'La contraseña no es correcta.',
  error_sistema: 'Hubo un problema del sistema al iniciar sesión. Intentá de nuevo en un momento.',
}

const MENSAJE_ERROR_RED =
  'No se pudo conectar con el servidor. Revisá tu conexión (o desactivá extensiones/VPN que puedan estar bloqueando la petición) e intentá de nuevo.'

/**
 * fetch() JSON directo contra app/api/erp/login (Route Handler), NO Server
 * Action -- ver comentario en esa ruta: el mecanismo de streaming
 * `text/x-component` de las Server Actions se comprobó roto para este flujo
 * (servidor respondía bien y rápido en Runtime Logs, el navegador nunca
 * recibía la respuesta, botón trabado en "Ingresando..." para siempre). Un
 * fetch JSON normal es el patrón más simple y confiable disponible acá.
 */
export function ErpLoginForm() {
  const [pending, setPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    setPending(true)

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    try {
      const res = await fetch('/api/erp/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const resultado = (await res.json()) as AuthResult
      if (resultado.ok) {
        window.location.href = '/erp/comercial'
        return
      }
      setErrorMsg(ERRORES[resultado.error ?? ''] ?? 'No pudimos iniciar sesión. Intentá de nuevo.')
    } catch (err) {
      console.error('[ErpLoginForm] fallo de red al enviar el login:', err)
      setErrorMsg(MENSAJE_ERROR_RED)
    } finally {
      setPending(false)
    }
  }

  return (
    // method="post" (aunque onSubmit siempre gana con JS) es la red de seguridad:
    // sin esto, un click justo antes de que React termine de hidratar cae al
    // comportamiento nativo del <form> -- por defecto GET, que manda email y
    // password como query string (visibles en la URL, historial y logs del
    // servidor). Se vio pasar exactamente eso en los logs locales de dev.
    <form onSubmit={handleSubmit} method="post" className="flex flex-col gap-4">
      <InputField label="Email" name="email" type="email" required autoComplete="email" disabled={pending} />
      <InputField
        label="Contraseña"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        disabled={pending}
      />
      {errorMsg && (
        <p role="alert" className="text-xs text-error-text">
          {errorMsg}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg" className="mt-2" disabled={pending}>
        {pending ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}
