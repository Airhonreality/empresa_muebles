# UQO Protocol — UnifiedQuery Object

The UQO is the single language spoken between guest modules, blocks, and the engine core. It is defined in `packages/core/src/indra.ts` as `UnifiedQuery`.

All interactions travel through `api.dispatch(query)`. No direct fetch calls, no direct state mutations.

---

## Query Shape

```typescript
type UnifiedQuery =
  | { action: 'READ';     context: string;    filters?: Record<string, unknown> }
  | { action: 'WRITE';    context: string;    payload: Record<string, unknown> }
  | { action: 'DELETE';   context: string;    payload: { id: string } }
  | { action: 'NAVIGATE'; payload: { path: string } }
  | { action: 'INTENT';   context: string;    payload?: Record<string, unknown> };
```

---

## Actions

### `READ`

Requests data from a context. The bridge returns the current state from `AppState.data`.

```javascript
api.dispatch({ action: 'READ', context: 'projects' });
// Returns: DataItem[] via onUpdate subscription
```

For reactive updates, use `api.onUpdate()` rather than dispatching READ manually.

---

### `WRITE`

Persists a record to the vault. Triggers a server-side upsert.

```javascript
// Create
api.dispatch({
  action: 'WRITE',
  context: 'projects',
  payload: { name: 'Alpha Project', status: 'active' }
});

// Update (include the record id)
api.dispatch({
  action: 'WRITE',
  context: 'projects',
  payload: { id: 'uuid-xxx', name: 'Alpha Project v2', status: 'active' }
});
```

The vault assigns a UUID to new records automatically. Never include a client-generated `id` for new records.

---

### `DELETE`

Removes a record by its UUID.

```javascript
api.dispatch({
  action: 'DELETE',
  context: 'projects',
  payload: { id: 'uuid-xxx' }
});
```

---

### `NAVIGATE`

Requests a URL change from the host. Keeps the module decoupled from Next.js routing.

```javascript
api.dispatch({
  action: 'NAVIGATE',
  payload: { path: '/project/alpha-project' }
});
```

---

### `INTENT`

Dispatches a named intent to the workflow engine or other subscribers. Use for complex multi-step operations.

```javascript
api.dispatch({
  action: 'INTENT',
  context: 'projects',
  payload: { intent: 'archive', targetId: 'uuid-xxx' }
});
```

---

## Context Naming

The `context` field must match the exact entity name in `schema_definitions.json` — plain name, no prefix.

| Correct | Incorrect |
|---|---|
| `"projects"` | `"schema_projects"` |
| `"environments"` | `"schema_environments_def"` |
| `"schema_definitions"` | — (this context is reserved) |

---

## State Resonance

After every `WRITE` or `DELETE` dispatch, the engine:

1. Writes to the vault (atomic upsert)
2. Dispatches `SET_DATA` to the AppContext reducer
3. Fires `agnostic-state-change` custom event
4. Triggers all `api.onUpdate()` subscribers for the affected context

All subscribed blocks re-render with the updated data automatically.

---

## Reactive Pattern in Modules

```javascript
export function setup(container, api) {
  const render = () => {
    const projects = api.getGlobalData('projects');
    container.innerHTML = projects.map(p => `<div>${p.data.name}</div>`).join('');
  };

  // Initial render
  render();

  // Subscribe to changes — re-render on every write to 'projects'
  const unsubscribe = api.onUpdate('projects', render);

  return () => unsubscribe();
}
```
