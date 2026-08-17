import { ErpLoginForm } from '@/components/veta/erp-login-form'

// Login interno del ERP (D-08b, F10 2026-08-15). Vive dentro de app/erp/ (queda
// envuelto por el mismo ErpShell que el resto del ERP — ver components/veta/
// erp-shell.tsx, que oculta el sidebar en esta ruta) pero es la única página
// bajo /erp/** que middleware.ts deja pasar sin sesión.
//
// Los mensajes de error viven en ErpLoginForm (useActionState) — ya no hay
// query param ?error= ni redirect() server-side (ver lib/auth/actions.ts).

export default function LoginEmpleadoPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted">ERP interno</p>
        <h1 className="font-display text-3xl font-semibold text-text-heading mt-1">Ingresar</h1>
        <p className="text-sm text-text-muted mt-2">
          Ingresá con el email y la contraseña de tu cuenta de empleado.
        </p>
      </div>

      <ErpLoginForm />
    </div>
  )
}
