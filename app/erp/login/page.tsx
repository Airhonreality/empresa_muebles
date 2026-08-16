import { InputField } from '@/components/veta/input-field'
import { Button } from '@/components/veta/button'
import { loginEmpleadoAction } from '@/lib/auth/actions'

// Login interno del ERP (D-08b, F10 2026-08-15). Vive dentro de app/erp/ (queda
// envuelto por el mismo ErpShell que el resto del ERP — ver components/veta/
// erp-shell.tsx, que oculta el sidebar en esta ruta) pero es la única página
// bajo /erp/** que middleware.ts deja pasar sin sesión.

const ERRORES: Record<string, string> = {
  credenciales_invalidas: 'Email o contraseña incorrectos.',
}

export default async function LoginEmpleadoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted">ERP interno</p>
        <h1 className="font-display text-3xl font-semibold text-text-heading mt-1">Ingresar</h1>
        <p className="text-sm text-text-muted mt-2">
          Ingresá con el email y la contraseña de tu cuenta de empleado.
        </p>
      </div>

      <form action={loginEmpleadoAction} className="flex flex-col gap-4">
        <InputField label="Email" name="email" type="email" required autoComplete="email" />
        <InputField label="Contraseña" name="password" type="password" required autoComplete="current-password" />
        {error && (
          <p role="alert" className="text-xs text-error-text">
            {ERRORES[error] ?? 'No pudimos iniciar sesión. Intentá de nuevo.'}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="mt-2">
          Ingresar
        </Button>
      </form>
    </div>
  )
}
