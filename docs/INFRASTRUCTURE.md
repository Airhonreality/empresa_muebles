# Infrastructure Guide — Agnostic Seed

## Architecture Overview

The engine (`src/`) is a blind renderer that projects the business defined in `storage/{tenant}/`. It communicates with storage exclusively through the **strategy layer** — it never reads files directly.

```
                    ┌─────────────────────────────────────┐
                    │              src/ (Engine)           │
                    │                                      │
                    │  /api/vault ──► getStrategy()        │
                    │                     │                │
                    └─────────────────────┼────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────────┐
              │                           │ strategy interface             │
              │                           ▼                               │
              │  LocalStrategy   SupabaseStrategy   HybridStrategy        │
              │  (JSON files)    (Postgres/RLS)     (GitHub + Supabase)   │
              └───────────────────────────────────────────────────────────┘
```

Strategy selection is determined by `storage/{tenant}/manifest.json` at startup.

---

## Storage Strategies

### LOCAL (default)

Data lives in `storage/{tenant}/db/*.json`. One file per context (entity collection).

```json
{ "strategy": "local" }
```

Writes use atomic temp-rename: writes to `{file}.tmp` first, then renames to guarantee no partial writes.

### SUPABASE

Data lives in a Supabase Postgres database. Each context maps to a table.

```json
{
  "strategy": "supabase",
  "supabase_url": "https://xxx.supabase.co",
  "supabase_anon_key": "your-anon-key"
}
```

Writes use native Supabase `upsert()` with ACID guarantees.

### HYBRID

Schema DNA (schemas, routes) on GitHub; operational data on Supabase.

```json
{
  "strategy": "hybrid",
  "github_owner": "org",
  "github_repo": "storage",
  "github_branch": "main",
  "supabase_url": "...",
  "supabase_anon_key": "..."
}
```

### GITHUB (read-only)

Remote storage for DNA versioning. No write capability.

```
STORAGE_URL=https://raw.githubusercontent.com/org/storage/main/storage/tenant
```

---

## Storage Structure

```
storage/{tenant}/
├── manifest.json                   # Strategy config and tenant metadata
├── db/
│   ├── schema_definitions.json     # Entity schemas (append-only, versioned)
│   ├── page_routes.json            # Route → block map
│   └── {context}.json              # One file per entity context
├── modules/                        # Guest UI modules (Vanilla JS)
├── styles/
│   └── tokens.css                  # CSS variable overrides
└── assets/                         # Static resources
```

---

## Guest Module Contract

Modules in `storage/{tenant}/modules/` must be pure Vanilla JS. They export a `setup` function that returns a teardown function.

```javascript
// storage/default/modules/my_block.js

/**
 * @param {HTMLElement} container   - The DOM element to render into
 * @param {AgnosticAPI} api         - The bridge to the host engine
 * @returns {() => void}            - Teardown function called on unmount
 */
export function setup(container, api) {
  // 1. Read current data
  const items = api.getGlobalData('projects');

  // 2. Initial render
  container.innerHTML = `<ul>${items.map(i => `<li>${i.data.name}</li>`).join('')}</ul>`;

  // 3. React to state changes
  const unsubscribe = api.onUpdate('projects', (updatedData) => {
    container.innerHTML = `<ul>${updatedData['projects'].map(i => `<li>${i.data.name}</li>`).join('')}</ul>`;
  });

  // 4. Dispatch mutations
  container.querySelector('#add-btn')?.addEventListener('click', () => {
    api.dispatch({ action: 'WRITE', context: 'projects', payload: { name: 'New Project' } });
  });

  // 5. Return teardown
  return () => unsubscribe();
}
```

**AgnosticAPI reference:**

| Method | Signature | Description |
|---|---|---|
| `getGlobalData` | `(context: string) => DataItem[]` | Read current state for a context |
| `onUpdate` | `(context: string, cb) => unsubscribe` | Subscribe to state changes |
| `dispatch` | `(query: UnifiedQuery) => Promise<void>` | Send a mutation or navigation intent |
| `getActiveRecord` | `() => DataItem \| null` | Current page's active record |
| `getSchema` | `(context?: string) => object \| null` | Schema definition for a context |
| `notify.success` | `(msg: string) => void` | Toast notification |
| `notify.error` | `(msg: string) => void` | Error toast |

---

## Deploying to Vercel

### 1. Set environment variables

```
ACTIVE_TENANT=my_company
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 2. Remote DNA (optional)

To read schemas from a GitHub repository instead of the local `storage/` folder:

```
STORAGE_URL=https://raw.githubusercontent.com/org/storage/main/storage/my_company
GITHUB_TOKEN=ghp_...
```

### 3. Build command

```bash
npm run build
```

Standard Next.js build. No additional configuration required.

---

## Golden Rules

1. Never add business logic to `src/` — it belongs in `storage/{tenant}/`.
2. Never write to `storage/` directly from components — all mutations go through `POST /api/vault`.
3. The engine boots with zero configuration if `storage/default/` is present.
4. Every record mutation goes through the vault's read-upsert-write cycle. Never overwrite.
