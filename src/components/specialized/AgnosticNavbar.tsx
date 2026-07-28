'use client'
import type { BlockProps } from '@agnostic/core'

export default function AgnosticNavbar({ block = {}, records, api }: Partial<BlockProps>) {
  const config = (block.config || {}) as Record<string, unknown>
  // TODO: Implement Navbar UI
  return (
    <div className="border-b p-4 bg-gray-50">
      <p className="font-bold text-gray-800">Agnostic Navbar (placeholder)</p>
      <p className="text-sm text-gray-500">Nav ID: {String(config.nav_id || '')}</p>
    </div>
  )
}
