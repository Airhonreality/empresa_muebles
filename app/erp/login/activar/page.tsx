import { InputField } from '@/components/veta/input-field'
import { Button } from '@/components/veta/button'
import { activarInvitacionAction } from '@/lib/auth/actions'

// Destino del enlace de autoregistro generado en /erp/equipo (D-08b, F10
// 2026-08-15). El token viaja por query string; middleware.ts deja pasar esta
// ruta sin sesión (empieza con /erp/login/).

const ERRORES: Record<string, string> = {
  token_invalido: 'Este enlace de invitación no es válido. Pedile a un administrador que te genere uno nuevo.',
  token_vencido: 'Este enlace de invitación venció. Pedile a un administrador que te genere uno nuevo.',
  password_corta: 'La contraseña debe tener al menos 8 caracteres.',
  password_no_coincide: 'Las contraseñas no coinciden.',
}

export default async function ActivarInvitacionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams

  if (!token) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-6 py-16">
        <h1 className="font-display text-2xl font-semibold text-text-heading">Enlace incompleto</h1>
        <p className="text-sm text-text-muted">
          Falta el token de invitación en el enlace. Pedile a un administrador que te lo vuelva a enviar.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted">ERP interno</p>
        <h1 className="font-display text-3xl font-semibold text-text-heading mt-1">Activar tu cuenta</h1>
        <p className="text-sm text-text-muted mt-2">
          Elegí una contraseña para poder ingresar al ERP.
        </p>
      </div>

      <form action={activarInvitacionAction} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <InputField
          label="Contraseña"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <InputField
          label="Confirmar contraseña"
          name="passwordConfirmacion"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        {error && (
          <p role="alert" className="text-xs text-error-text">
            {ERRORES[error] ?? 'No pudimos activar tu cuenta. Intentá de nuevo.'}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="mt-2">
          Activar cuenta
        </Button>
      </form>
    </div>
  )
}
