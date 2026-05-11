# Subsystem: Core — State & Persistence

This document describes the data flow from a user action to persistent storage and back to the UI.

---

## Data Flow Diagram

```
User Action
    │
    ▼
Component (AgnosticForm / AgnosticCollection / custom module)
    │  calls saveItem(context, item)
    ▼
AppContext.saveItem()                    src/context/AppContext.tsx
    │  POST /api/vault { action: 'WRITE', context, payload }
    ▼
/api/vault (route handler)              src/app/api/vault/route.ts
    │  1. Validates shape (Zod)
    │  2. Assigns UUID if absent
    │  3. Generates _slug from schema.slug_source
    │  4. Reads current items from strategy
    │  5. Upserts the item
    │  6. Writes via strategy.writeContext()
    │  7. Returns { success: true, record }
    ▼
AppContext receives record
    │  dispatch(SET_DATA) → updates state.data[context]
    │  fires agnostic-state-change event
    ▼
All subscribed components re-render
```

---

## The Vault (`/api/vault`)

The only mutation entry point. Handles both `WRITE` and `DELETE` operations.

```typescript
// WRITE flow (simplified)
if (!payload.id) payload.id = crypto.randomUUID();
await tryGenerateSlug(query);                          // derives _slug
const existing = await strategy.read(query.context);   // read current
const next = upsert(existing, payload);                // merge
await strategy.writeContext(query.context, next);      // atomic write
return { success: true, record: payload };
```

The vault returns the saved record — including its assigned UUID — to the client.

---

## AppContext (`src/context/AppContext.tsx`)

Manages the global React state. Three distinct sub-stores:

| Store | Key | Description |
|---|---|---|
| `state.data` | `Record<string, DataItem[]>` | All entity collections, indexed by context name |
| `state.system` | `{ activeRecord, activeContext, isLoading, ... }` | Engine runtime state |
| `state.auth` | `{ isAuthenticated, user }` | Auth state |

**`state.system.activeRecord`** is the async record reference set by `MasterRoute` via `useEffect`. It is kept in sync with `PageRecordContext` (the synchronous source).

---

## PageRecordContext (`src/context/AppContext.tsx`)

Provides the current page's active record **synchronously** — no render-cycle delay.

```typescript
// In MasterRoute (src/app/[...slug]/page.tsx)
const pageRecord = useMemo(() => {
  const records = state.data[routeContext] ?? [];
  const record  = records.find(r => r.data._slug === activeSlug);
  return record ? { id: record.id, context: routeContext } : null;
}, [state.data, routeContext, activeSlug]);

// Usage in any child block
const pageRecord = usePageRecord(); // from src/context/AppContext.tsx
```

`AgnosticCollection` reads this to filter children by parent UUID without waiting for the reducer.

---

## Bootstrapping Sequence

On every request, the engine executes this initialization sequence:

```
1. src/core/server/vault.ts — getVaultData()
        Calls strategy.read() with no context → returns all collections

2. src/app/layout.tsx — RootLayout
        Injects CSS tokens inline (prevents FOUC)
        Passes vaultData to AppProvider as initialData

3. src/context/AppContext.tsx — AppProvider
        Initializes reducer with full data pre-populated
        state.system.isLoading = false immediately (no client fetch needed)

4. src/app/[...slug]/page.tsx — MasterRoute
        Resolves route from state.data.page_routes
        Computes pageRecord via useMemo
        Provides PageRecordContext to all child blocks
        Renders AgnosticRenderer for each block in the route
```

---

## Strategy Interface

All strategies implement `DataStrategy` from `packages/core/src/indra.ts`:

```typescript
interface DataStrategy {
  read(context?: string): Promise<Record<string, DataItem[]>>;
  write(data: Record<string, DataItem[]>): Promise<void>;
  delete?(context: string, id: string): Promise<void>;
  writeContext?(context: string, items: DataItem[]): Promise<void>;
}
```

`writeContext` is the preferred method for single-context writes (all strategies implement it). `write` is the full-database fallback.
