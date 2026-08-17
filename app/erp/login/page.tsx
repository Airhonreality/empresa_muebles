import { ErpLoginForm } from '@/components/veta/erp-login-form'

// Login interno del ERP (D-08b, F10 2026-08-15). Vive dentro de app/erp/ (queda
// envuelto por el mismo ErpShell que el resto del ERP — ver components/veta/
// erp-shell.tsx, que oculta el sidebar en esta ruta) pero es la única página
// bajo /erp/** que middleware.ts deja pasar sin sesión.

// Mensajes por código de error (lib/auth/session.ts AuthResult['error']) —
// distinguen sistema/usuario/contraseña en vez de un genérico único (pedido
// de Javier, 2026-08-17, ver lib/auth/session.ts loginEmpleado()).
const ERRORES: Record<string, string> = {
  credenciales_invalidas: 'Email o contraseña incorrectos.',
  usuario_no_encontrado: 'No encontramos una cuenta activa con ese email.',
  password_incorrecta: 'La contraseña no es correcta.',
  error_sistema: 'Hubo un problema del sistema al iniciar sesión. Intentá de nuevo en un momento.',
}

export default async function LoginEmpleadoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const initialError = error ? (ERRORES[error] ?? 'No pudimos iniciar sesión. Intentá de nuevo.') : undefined

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted">ERP interno</p>
        <h1 className="font-display text-3xl font-semibold text-text-heading mt-1">Ingresar</h1>
        <p className="text-sm text-text-muted mt-2">
          Ingresá con el email y la contraseña de tu cuenta de empleado.
        </p>
      </div>

      <ErpLoginForm initialError={initialError} />
    </div>
  )
}
