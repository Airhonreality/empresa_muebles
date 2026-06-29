/**
 * indra-sync.ts
 *
 * Deprecated legacy sync command.
 *
 * The current distribution model is seed + project forks, not runtime tenancy.
 * Local JSON data lives in storage/db and cloud persistence is selected by
 * environment variables through getStrategy().
 */

console.error(`
[DEPRECATED] scripts/indra-sync.ts is no longer part of the active contract.

Why it stopped:
- ACTIVE_TENANT was removed from the runtime model.
- storage/{tenant}/db is obsolete for forks.
- Supabase REST table sync bypasses the current strategy layer.

Use the current paths instead:
- Local fork data: storage/db/*.json
- Runtime persistence: getStrategy() via GITHUB_REPO, DATABASE_URL, or SUPABASE_URL
- Safe semantic edits: npm run mcp:bridge or npx tsx scripts/agno.ts
- Production data pushes: npm run push-data <namespace> <record-name>
`)

process.exit(1)
