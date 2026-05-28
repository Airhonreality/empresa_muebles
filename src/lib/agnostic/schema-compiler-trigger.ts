/**
 * schema-compiler-trigger.ts
 *
 * Spawns the schema compiler in the background whenever schema_definitions
 * are written or removed via /api/vault.
 *
 * Transparent to the user — they use the Config Manager normally.
 * The TypeScript contracts in src/generated/agnostic-schemas.ts update silently.
 *
 * In Next.js dev mode: HMR picks up the changed file and hot-reloads
 * any component that imports from agnostic-schemas.ts automatically.
 *
 * In production (deployed): this function is a no-op.
 * The generated file is committed and built into the bundle at deploy time.
 * Schema changes at runtime don't need TypeScript updates — the engine
 * reads schema_definitions.json directly at runtime regardless.
 */

import { spawn } from 'child_process'
import path from 'path'

let compileQueued = false

/**
 * Trigger a background schema compile.
 * Debounced — multiple rapid schema edits produce a single compile.
 * Never throws, never awaits, never blocks the HTTP response.
 */
export function triggerSchemaCompile(): void {
  // Production deployments: TypeScript types are static build artifacts.
  // No filesystem write access to src/ — skip silently.
  if (process.env.NODE_ENV !== 'development') return

  // Debounce: if already queued, skip — the pending run will catch the latest state
  if (compileQueued) return
  compileQueued = true

  // Defer 300ms so rapid consecutive saves (e.g. field-by-field edits) batch into one compile
  setTimeout(() => {
    compileQueued = false

    const cwd = process.cwd()
    const tsxBin = path.join(cwd, 'node_modules', '.bin', 'tsx')
    const script = path.join(cwd, 'scripts', 'compile-schemas.ts')

    const child = spawn(tsxBin, [script], {
      cwd,
      stdio: 'pipe',    // capture output, don't inherit (no console noise in dev server)
      detached: false,
    })

    child.stdout?.on('data', (d: Buffer) => {
      // Surface compile summary to dev server console — helpful feedback
      const lines = d.toString().trim().split('\n')
      for (const line of lines) {
        if (line.trim()) console.log(`[schema:compile] ${line}`)
      }
    })

    child.stderr?.on('data', (d: Buffer) => {
      console.error(`[schema:compile ERROR] ${d.toString().trim()}`)
    })

    child.on('error', (err: Error) => {
      console.error('[schema:compile] Failed to spawn compiler:', err.message)
    })
  }, 300)
}
