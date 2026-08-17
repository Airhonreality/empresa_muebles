'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { InputField } from './input-field'
import { Button } from './button'
import { loginEmpleadoAction, type AuthResult } from '@/lib/auth/actions'

// Mensajes por código de error (lib/auth/session.ts AuthResult['error']) —
// distinguen sistema/usuario/contraseña en vez de un genérico único (pedido
// de Javier, 2026-08-17, ver lib/auth/session.ts loginEmpleado()).
const ERRORES: Record<string, string> = {
  credenciales_invalidas: 'Email o contraseña incorrectos.',
  usuario_no_encontrado: 'No encontramos una cuenta activa con ese email.',
  password_incorrecta: 'La contraseña no es correcta.',
  error_sistema: 'Hubo un problema del sistema al iniciar sesión. Intentá de nuevo en un momento.',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="primary" size="lg" className="mt-2" disabled={pending}>
      {pending ? 'Ingresando…' : 'Ingresar'}
    </Button>
  )
}

/**
 * loginEmpleadoAction ya no llama a redirect() (ver comentario en
 * lib/auth/actions.ts) — devuelve el AuthResult y este componente decide qué
 * hacer: en éxito, navega con window.location.href (recarga completa a
 * propósito, no router.push, porque la transición cliente de Next.js tras un
 * redirect() de Server Action se comprobó rota para esta ruta con un
 * navegador real). Un fallo de red genuino (el fetch de la Server Action
 * cortado) no llega acá — lo atrapa app/erp/login/error.tsx.
 */
export function ErpLoginForm() {
  const [resultado, formAction] = useActionState<AuthResult | null, FormData>(loginEmpleadoAction, null)

  useEffect(() => {
    if (resultado?.ok) {
      window.location.href = '/erp/comercial'
    }
  }, [resultado])

  const errorMsg =
    resultado && !resultado.ok ? (ERRORES[resultado.error ?? ''] ?? 'No pudimos iniciar sesión. Intentá de nuevo.') : null

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <InputField label="Email" name="email" type="email" required autoComplete="email" />
      <InputField label="Contraseña" name="password" type="password" required autoComplete="current-password" />
      {errorMsg && (
        <p role="alert" className="text-xs text-error-text">
          {errorMsg}
        </p>
      )}
      <SubmitButton />
    </form>
  )
}
