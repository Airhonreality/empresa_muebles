import { Button } from './button'
import { logoutAction } from '@/lib/auth/actions'

interface LogoutButtonProps {
  className?: string
}

/* Botón de logout del portal cliente (F-07). Reutilizable: el agente que
   construya /cuenta/** lo coloca donde corresponda (header, sidebar, etc.). */
export function LogoutButton({ className = '' }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="md" className={className}>
        Cerrar sesión
      </Button>
    </form>
  )
}
