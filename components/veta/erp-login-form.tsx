'use client'

import { useFormStatus } from 'react-dom'
import { InputField } from './input-field'
import { Button } from './button'
import { loginEmpleadoAction } from '@/lib/auth/actions'

/**
 * useFormStatus() solo lee el estado del <form> más cercano si el componente
 * que lo llama es DESCENDIENTE del form, no el mismo que lo renderiza — de ahí
 * el split. Mantener <form action={loginEmpleadoAction}> con la Server Action
 * ligada directo (no una función cliente intermedia) es a propósito: Next.js
 * necesita esa referencia directa para manejar redirect() correctamente. Un
 * intento anterior envolvía la llamada en un handler cliente propio para
 * atrapar fallos de red — reproducido con Playwright, eso rompía el redirect
 * nativo y dejaba el botón en "Ingresando…" para siempre. El fallo de red real
 * (fetch de la Server Action cortado) lo atrapa app/erp/login/error.tsx.
 */
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="primary" size="lg" className="mt-2" disabled={pending}>
      {pending ? 'Ingresando…' : 'Ingresar'}
    </Button>
  )
}

export function ErpLoginForm({ initialError }: { initialError?: string }) {
  return (
    <form action={loginEmpleadoAction} className="flex flex-col gap-4">
      <InputField label="Email" name="email" type="email" required autoComplete="email" />
      <InputField label="Contraseña" name="password" type="password" required autoComplete="current-password" />
      {initialError && (
        <p role="alert" className="text-xs text-error-text">
          {initialError}
        </p>
      )}
      <SubmitButton />
    </form>
  )
}
