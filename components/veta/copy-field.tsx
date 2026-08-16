'use client'

import { useState } from 'react'
import { Button } from '@/components/veta/button'

/** Input readonly + botón "Copiar" (D-08b, F10 2026-08-15) — usado para mostrar
 * enlaces de invitación de autoregistro en app/erp/equipo/page.tsx. */
export function CopyField({ value, label }: { value: string; label?: string }) {
  const [copiado, setCopiado] = useState(false)

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs font-semibold text-text-heading">{label}</span>}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          readOnly
          onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 rounded border border-border-subtle bg-bg-paper px-3 py-2 text-xs text-text-heading font-mono"
        />
        <Button type="button" variant="secondary" size="md" onClick={handleCopiar}>
          {copiado ? 'Copiado ✓' : 'Copiar'}
        </Button>
      </div>
    </div>
  )
}
