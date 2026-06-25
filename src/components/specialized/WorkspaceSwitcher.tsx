'use client'

import { useState } from 'react'
import type { BlockProps } from '@agnostic/core'
import type { UsuariosEquipoRecord } from '@/generated/agnostic-schemas'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Wallet, Hammer, ShoppingCart, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function WorkspaceSwitcher({ records }: BlockProps) {
  const router = useRouter()
  // Login mockeado temporal para probar la Matrushka
  const [activeUserId, setActiveUserId] = useState<string | null>(null)

  const usuarios = (records as UsuariosEquipoRecord[]) || []
  const activeUser = usuarios.find(u => u.id === activeUserId)

  const workspaces = [
    { id: 'comercial', label: 'Cotizaciones y Ventas', icon: ShoppingCart, roles: ['Admin', 'Comercial'], path: '/app/proyectos' },
    { id: 'produccion', label: 'Taller y Producción', icon: Hammer, roles: ['Admin', 'Producci'], path: '/app/production' },
    { id: 'finanzas', label: 'Ledger Financiero', icon: Wallet, roles: ['Admin', 'Finanzas'], path: '/app/finanzas' }
  ]

  if (!activeUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 w-full animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Veta Dorada ERP</h1>
          <p className="text-muted-foreground">Selecciona tu usuario operativo</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
          {usuarios.map(u => (
            <Card key={u.id} className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md" onClick={() => setActiveUserId(u.id)}>
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{u.data.nombre}</CardTitle>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
                    {String(u.data.rol || 'Produccion')}
                  </p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Filtrado estricto por Matrushka (Rol)
  const rolUsuario = String(activeUser.data.rol || 'Produccion')
  const allowedWorkspaces = workspaces.filter(ws => 
    ws.roles.some(r => rolUsuario.includes(r)) || rolUsuario === 'Admin'
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex items-center justify-between w-full max-w-4xl border-b pb-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Hola, {activeUser.data.nombre.split(' ')[0]}</h2>
          <p className="text-muted-foreground mt-1">Tu rol actual es <strong className="text-foreground">{rolUsuario}</strong></p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setActiveUserId(null)}>
          <LogOut className="mr-2 h-4 w-4" /> Cambiar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
        {allowedWorkspaces.length === 0 ? (
          <div className="col-span-3 text-center p-12 border rounded-xl bg-muted/20">
            <p className="text-muted-foreground">Tu rol no tiene accesos asignados a Workspaces.</p>
          </div>
        ) : (
          allowedWorkspaces.map(ws => (
            <Card 
              key={ws.id} 
              className="hover:bg-accent/50 cursor-pointer transition-all border-2 border-transparent hover:border-primary hover:shadow-lg group" 
              onClick={() => router.push(ws.path)}
            >
              <CardHeader className="flex flex-col items-center justify-center space-y-6 py-12">
                <div className="p-4 bg-background rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                  <ws.icon className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl">{ws.label}</CardTitle>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
