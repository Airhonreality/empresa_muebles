'use client'
// Harness de pruebas: monta SlotImagen con el contrato real del cotizador y expone el valor
// persistido en un <pre> para que la prueba lo lea sin depender de la base.
import { useState } from 'react'
import { SlotImagen } from '@/components/imagen/slot-imagen'
import { SLOT_ESPACIO_FOTOS } from '@/lib/imagen/slots/cotizador'
import type { ImagenGuardada } from '@/lib/imagen/tipos'

export function SlotHarness({ valorInicial }: { valorInicial: ImagenGuardada[] }) {
  const [valor, setValor] = useState<ImagenGuardada[]>(valorInicial)
  return (
    <div style={{ padding: 16, background: '#f5f1ea' }}>
      <SlotImagen slot={SLOT_ESPACIO_FOTOS} value={valor} onChange={setValor} r2Prefix="prueba" />
      <pre data-testid="valor" style={{ fontSize: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxWidth: '100%', overflow: 'hidden' }}>{JSON.stringify(valor)}</pre>
    </div>
  )
}
