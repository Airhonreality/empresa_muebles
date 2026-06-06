'use client'
import type { BlockProps } from 'packages/core/src/types'

export default function AgnosticHeader({ block = {}, records, api }: Partial<BlockProps>) {
  // TODO: Implement Header UI
  return (
    <div className="p-4 bg-gray-100">
      <h1 className="text-xl font-bold text-gray-800">{block.config?.title || 'Header'}</h1>
    </div>
  )
}
