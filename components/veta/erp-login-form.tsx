'use client'

import { useState, useTransition } from 'react'
import { InputField } from './input-field'
import { Button } from './button'
import { loginEmpleadoAction } from '@/lib/auth/actions'

const MENSAJE_ERROR_RED =
  'No se pudo conectar con el servidor. Revisá tu conexión (o desactivá extensiones/VPN que puedan estar bloqueando la petición) e intentá de nuevo.'

// redirect() de next/navigation señaliza la navegación exitosa lanzando un
// error especial con este digest — hay que dejarlo pasar, no es un fallo real.
function esRedireccionInterna(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest?: unknown }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}

/**
 * Formulario de login del ERP. Antes era un <form action={loginEmpleadoAction}>
 * server-side puro: si el fetch de la Server Action fallaba a nivel de red
 * (extensión del navegador, VPN, proxy corporativo interceptando la petición
 * hacia el dominio de preview), no había ningún manejo — el botón no daba
 * ninguna señal, ni error en pantalla ni log, "UI zombie" (hallazgo de Javier,
 * 2026-08-17). Este wrapper cliente agrega estado de carga visible y atrapa
 * ese fallo de red específicamente, en vez de dejarlo desaparecer en silencio.
 */
export function ErpLoginForm({ initialError }: { initialError?: string }) {
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError ?? null)

  function handleSubmit(formData: FormData) {
    setErrorMsg(null)
    startTransition(async () => {
      try {
        await loginEmpleadoAction(formData)
      } catch (err) {
        if (esRedireccionInterna(err)) throw err
        console.error('[ErpLoginForm] fallo de red al enviar el login:', err)
        setErrorMsg(MENSAJE_ERROR_RED)
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
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
