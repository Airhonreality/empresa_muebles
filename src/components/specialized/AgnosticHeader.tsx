'use client'
import type { BlockProps } from '@agnostic/core'

export default function AgnosticHeader({ block = {}, records, api }: Partial<BlockProps>) {
  const config = (block.config || {}) as Record<string, unknown>
  // TODO: Implement Header UI
  return (
    <div className="p-4 bg-gray-100">
      <h1 className="text-xl font-bold text-gray-800">{String(config.title || 'Header')}</h1>
    </div>
  )
}
