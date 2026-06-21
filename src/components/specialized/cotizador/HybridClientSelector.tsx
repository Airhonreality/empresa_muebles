'use client'

import React, { useMemo } from 'react'
import type { DataItem } from '@agnostic/core'
import { vWrite } from './utils'
import { toast } from 'sonner'
import type { Clientes } from '@/generated/agnostic-schemas'
import { Combobox } from '@/components/ui/combobox'

interface HybridClientSelectorProps {
  value: string // cliente_id
  clientes: DataItem[]
  onChange: (clientId: string) => void
  onClientCreated: (newClient: DataItem) => void
}

export function HybridClientSelector({ value, clientes, onChange, onClientCreated }: HybridClientSelectorProps) {
  // Map clients to the options format expected by the Combobox component
  const options = useMemo(() => {
    return clientes.map(c => ({
      value: c.id,
      label: (c.data as any).nombre || 'Sin nombre'
    }))
  }, [clientes])

  const handleCreateClient = async (name: string) => {
    // Check if client name already exists
    const exists = clientes.find(c => (c.data as any).nombre?.toLowerCase() === name.toLowerCase())
    if (exists) {
      onChange(exists.id)
      toast.info(`Cliente "${name}" ya existe y fue seleccionado`)
      return
    }

    try {
      const id = crypto.randomUUID()
      const newClientData: Clientes = {
        nombre: name,
      }
      
      await vWrite('clientes', id, newClientData)
      const newItem: DataItem = {
        id,
        context: 'clientes',
        data: newClientData as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      onClientCreated(newItem)
      onChange(id)
      toast.success(`Cliente "${name}" creado exitosamente`)
    } catch (e: any) {
      toast.error('Error al crear cliente: ' + e.message)
    }
  }

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onChange}
      placeholder="Buscar o seleccionar cliente…"
      searchPlaceholder="Buscar cliente…"
      emptyMessage="No se encontraron clientes."
      onCreateOption={handleCreateClient}
      createLabel="Crear cliente"
    />
  )
}
