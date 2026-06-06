'use client'
import type { BlockProps } from '@agnostic/core'
import { Button } from '@/components/ui/button'
import type { RegistroLogisticaRecord } from '@/generated/agnostic-schemas'

export default function YangoDispatcher({ block = {}, records = [], api }: Partial<BlockProps>) {
  const logistica = records as RegistroLogisticaRecord[]

  const handlePedir = async () => {
    const cfg = block.config as Record<string, unknown> | undefined
    const address =
      (cfg?.address as string) ||
      (logistica[0]?.data?.direccion_destino as string) ||
      'Dirección no especificada'

    try {
      await navigator.clipboard.writeText(address)
      api?.notify?.success(`Dirección copiada: ${address}`)
    } catch {
      api?.notify?.error('No se pudo copiar la dirección al portapapeles.')
    }
  }

  return (
    <div className="p-4">
      <Button onClick={handlePedir}>Pedir Yango</Button>
    </div>
  )
}
