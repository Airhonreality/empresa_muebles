'use client'
/**
 * _TEMPLATE.tsx — Base pattern for AI-generated specialized components
 *
 * ──────────────────────────────────────────────────────────────────
 * HOW TO CREATE A NEW COMPONENT WITH AI
 * ──────────────────────────────────────────────────────────────────
 * 1. Give the AI these files as context:
 *    - src/generated/agnostic-schemas.ts   (typed schema contracts)
 *    - agnostic.config.ts                  (how to register the block)
 *    - src/components/specialized/_TEMPLATE.tsx  (this file)
 *
 * 2. Write a prompt like:
 *    "Create a CotizadorDashboard component for the 'cotizaciones' schema.
 *     Show a table with cotizacion records, a 'Nueva Cotización' button that
 *     opens a form, and an 'Exportar PDF' action button that runs the zap
 *     'exportar_cotizacion'. Use the pattern from _TEMPLATE.tsx."
 *
 * 3. Save the generated file as src/components/specialized/YourComponent.tsx
 *
 * 4. Register in agnostic.config.ts:
 *    blocks: { your_block_type: () => import('./src/components/specialized/YourComponent') }
 *
 * 5. Set in storage/db/page_routes.json:
 *    { "type": "your_block_type", "context": "your_schema_name" }
 * ──────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from 'react'
// Import your schema types from the generated contract — never type manually
// import type { MySchema, MySchemaRecord } from '@/generated/agnostic-schemas'
import type { BlockProps } from '@agnostic/core'

// ─── Types ───────────────────────────────────────────────────────────────────

// Replace MySchema with the actual interface from agnostic-schemas.ts
interface MySchema {
  [key: string]: unknown
}

interface MyRecord {
  id: string
  context: string
  data: MySchema
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MyComponent({ block }: BlockProps) {
  const context = (block.context as string) ?? ''

  // ── Data fetching — always this pattern ───────────────────────────────────
  const [records, setRecords] = useState<MyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchRecords = useCallback(async () => {
    if (!context) return
    try {
      setLoading(true)
      const res  = await fetch(`/api/vault?namespace=${context}`)
      const json = await res.json()
      setRecords(json.data ?? [])
    } catch (e) {
      setError('Error loading data')
      console.error('[MyComponent] fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [context])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  // ── Write — always through /api/vault ────────────────────────────────────
  const saveRecord = async (id: string | undefined, data: MySchema) => {
    const res = await fetch('/api/vault', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ namespace: context, id, data }),
    })
    if (res.ok) fetchRecords()
  }

  // ── Zap execution — for action buttons with backend logic ─────────────────
  const runZap = async (zapName: string, record: MyRecord) => {
    await fetch('/api/engine', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ zap: zapName, payload: { record, context } }),
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="p-8 text-center text-muted-foreground text-sm">
      Loading {context}…
    </div>
  )

  if (error) return (
    <div className="p-8 text-center text-destructive text-sm">{error}</div>
  )

  // Replace everything below with your custom UI.
  // You have full freedom here — use shadcn/ui, recharts, or anything in the project.
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">{context}</h2>

      <ul className="space-y-2">
        {records.map(r => (
          <li key={r.id} className="border rounded p-3 text-sm">
            <pre className="text-xs text-muted-foreground overflow-auto">
              {JSON.stringify(r.data, null, 2)}
            </pre>
          </li>
        ))}
      </ul>

      {records.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">
          No records in {context} yet.
        </p>
      )}
    </div>
  )
}
