'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import type { DataItem } from '@agnostic/core'
import { User, Plus, Check } from 'lucide-react'
import { vWrite } from './utils'
import { toast } from 'sonner'
import { fuzzySearch } from '@/lib/utils'
import type { Clientes } from '@/generated/agnostic-schemas'

interface HybridClientSelectorProps {
  value: string // cliente_id
  clientes: DataItem[]
  onChange: (clientId: string) => void
  onClientCreated: (newClient: DataItem) => void
}

export function HybridClientSelector({ value, clientes, onChange, onClientCreated }: HybridClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedClient = useMemo(() => {
    return clientes.find(c => c.id === value)
  }, [clientes, value])

  const displayName = selectedClient ? (selectedClient.data as any).nombre : ''

  // Filter clients using fuzzy search
  const filtered = useMemo(() => {
    if (!search.trim()) return clientes
    return fuzzySearch(clientes, search, c => (c.data as any).nombre || '')
  }, [clientes, search])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreateClient = async () => {
    const name = search.trim()
    if (!name) return
    
    // Check if client name already exists
    const exists = clientes.find(c => (c.data as any).nombre?.toLowerCase() === name.toLowerCase())
    if (exists) {
      onChange(exists.id)
      setSearch('')
      setIsOpen(false)
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
      setSearch('')
      setIsOpen(false)
      toast.success(`Cliente "${name}" creado exitosamente`)
    } catch (e: any) {
      toast.error('Error al crear cliente: ' + e.message)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={isOpen ? search : displayName}
          onChange={e => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            setSearch('')
            setIsOpen(true)
          }}
          placeholder="Buscar o crear cliente…"
          className="w-full text-xs border border-stone-200 rounded-lg pl-2.5 pr-8 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700 placeholder:text-stone-300"
        />
        
        {/* Quick action button inside selector */}
        {isOpen && search.trim() ? (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleCreateClient()
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
            title={`Crear cliente "${search.trim()}"`}
          >
            <Plus size={13} />
          </button>
        ) : (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none">
            <User size={12} />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {filtered.length > 0 ? (
            <div className="p-1">
              {filtered.map(cl => {
                const isSel = cl.id === value
                return (
                  <button
                    key={cl.id}
                    type="button"
                    onClick={() => {
                      onChange(cl.id)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isSel
                        ? 'bg-amber-50 text-amber-800 font-semibold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{(cl.data as any).nombre}</span>
                    {isSel && <Check size={12} className="text-amber-600 shrink-0" />}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-[11px] text-stone-400">No se encontraron clientes</p>
              {search.trim() && (
                <button
                  type="button"
                  onClick={handleCreateClient}
                  className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 mx-auto bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 transition-colors"
                >
                  <Plus size={12} /> Crear "{search.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
