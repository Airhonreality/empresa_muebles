import { ActivarCuentaForm } from '@/components/veta/activar-cuenta-form'
import { obtenerInvitacionPorToken } from '@/lib/auth/session'

// Destino del enlace de autoregistro generado en /erp/equipo (D-08b, F10
// 2026-08-15). El token viaja por query string; middleware.ts deja pasar esta
// ruta sin sesión (empieza con /erp/login/).

export default async function ActivarInvitacionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

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

  // F10 (2026-08-17): antes esta pantalla no mostraba a quién pertenecía la cuenta
  // que se estaba activando — lectura sin efectos secundarios, no consume el token.
  const invitacion = await obtenerInvitacionPorToken(token)

  if (!invitacion) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-6 py-16">
        <h1 className="font-display text-2xl font-semibold text-text-heading">Enlace inválido</h1>
        <p className="text-sm text-text-muted">
          Este enlace de invitación no es válido. Pedile a un administrador que te genere uno nuevo.
        </p>
      </div>
    )
  }

  if (invitacion.expirada) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-6 py-16">
        <h1 className="font-display text-2xl font-semibold text-text-heading">Enlace vencido</h1>
        <p className="text-sm text-text-muted">
          Este enlace de invitación venció. Pedile a un administrador que te genere uno nuevo desde su tarjeta en Equipo.
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
          Estás activando la cuenta de <strong className="text-text-heading">{invitacion.nombre}</strong>
          {' '}({invitacion.email}). Elegí una contraseña para poder ingresar al ERP.
        </p>
      </div>

      <ActivarCuentaForm token={token} />
    </div>
  )
}
