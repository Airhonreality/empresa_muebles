'use client'
// Harness del ImagePicker ANTIGUO (línea base del diagnóstico, t-200 P0).
import { useState } from 'react'
import { ImagePicker } from '@/components/veta/image-picker'

export function PickerAntiguoHarness({ valorInicial }: { valorInicial: string[] }) {
  const [valor, setValor] = useState<string[]>(valorInicial)
  return (
    <div style={{ padding: 16, background: '#f5f1ea' }}>
      <ImagePicker label="Fotos del espacio" value={valor} onChange={setValor} uploadToR2 r2Prefix="prueba" />
    </div>
  )
}
