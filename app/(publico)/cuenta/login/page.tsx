import { InputField } from '@/components/veta/input-field'
import { Button } from '@/components/veta/button'
import { loginAction } from './actions'

// F-07 Portal cliente (disenio_F07_portal_cliente.md) — login mínimo.
// Esta entrega es solo infra de sesión (login/logout/guard); la pantalla de
// negocio (/cuenta/proyectos, etc.) la construye otro agente sobre
// requireSesionCliente() de lib/auth/session.ts.

export default async function LoginClientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted">Portal cliente</p>
        <h1 className="font-display text-3xl font-semibold text-text-heading mt-1">Ingresar</h1>
        <p className="text-sm text-text-muted mt-2">
          Ingresá con el email y el documento registrados en tu proyecto.
        </p>
      </div>

      <form action={loginAction} className="flex flex-col gap-4">
        <InputField label="Email" name="email" type="email" required autoComplete="email" />
        <InputField label="Documento" name="documento" type="text" required autoComplete="off" />
        {error && (
          <p role="alert" className="text-xs text-error-text">
            No encontramos un cliente con esos datos. Verificá el email y el documento.
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="mt-2">
          Ingresar
        </Button>
      </form>
    </div>
  )
}
