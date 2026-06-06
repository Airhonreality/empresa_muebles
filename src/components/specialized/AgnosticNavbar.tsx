'use client'
import type { BlockProps } from 'packages/core/src/types'

export default function AgnosticNavbar({ block = {}, records, api }: Partial<BlockProps>) {
  // TODO: Implement Navbar UI
  return (
    <div className="border-b p-4 bg-gray-50">
      <p className="font-bold text-gray-800">Agnostic Navbar (placeholder)</p>
      <p className="text-sm text-gray-500">Nav ID: {block.config?.nav_id}</p>
    </div>
  )
}
