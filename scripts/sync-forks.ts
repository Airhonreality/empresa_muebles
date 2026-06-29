/**
 * sync-forks.ts
 *
 * Deprecated copy-based fork sync.
 *
 * Engine updates must travel through Git history so project forks can review
 * conflicts and preserve their project-owned layers.
 */

console.error(`
[DEPRECATED] scripts/sync-forks.ts no longer copies engine folders into forks.

Use the Git-based workspace sync instead:

  powershell -ExecutionPolicy Bypass -File scripts/admin/sync-workspaces.ps1

Or update a single fork manually:

  git fetch upstream
  git merge upstream/main

Why:
- storage/ is project-owned.
- src/components/specialized/ is project-owned.
- direct folder copy bypasses merge history and can reintroduce legacy contracts.
`)

process.exit(1)
