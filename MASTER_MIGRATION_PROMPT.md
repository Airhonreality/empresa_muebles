# MASTER MIGRATION PROMPT: Agnostic Seed v2

## CONTEXT
You are migrating the "Agnostic Seed" project from Vite + React (JavaScript) to 
Next.js 15 + TypeScript. This is a complete rewrite. The goal is NOT to just 
translate syntax, but to evolve the architecture to:

1. Move all data persistence logic to the server (Vercel API Routes / Server Actions)
   so that API keys and tokens are NEVER exposed to the browser.
2. Replace the local Express server (vault-server.js) with native Next.js API routes.
3. Type everything strictly with TypeScript to make the system robust at scale.
4. Keep the framework 100% agnostic: ZERO business logic in the seed. All data,
   logic, and styles must come from an external `data-silo/` directory (ignored by git).

---

## NOMENCLATURE STANDARDS
Rename all "mystical" or non-standard names to industry-standard terms:

| Old (Poetic) Name         | New (Standard) Name        |
|---------------------------|----------------------------|
| `Silo` / `matter-silo`    | `data-silo`                |
| `Forja` (Forge)           | `Schema Builder` → route `/schema` |
| `materia.json`            | `db.json`                  |
| `SovereignContext`        | `AppContext`               |
| `AgnosticBridge`          | `DataBridge`               |
| `SovereignLogicHost`      | `DynamicModuleHost`        |
| `SovereignRouter`         | `DynamicRouter`            |
| `MateriaComposer`         | `PageComposer`             |
| `META_CLASSES`            | `schema_definitions`       |
| `VIEW_PROJECTIONS`        | `page_routes`              |
| `SYSTEM_CONFIG`           | `system_config`            |
| `cristalizar` / `sintonizar` | `save` / `load`         |

---

## TASKS

### 1. SCAFFOLDING & CLEANUP
- Initialize Next.js 15 with App Router and TypeScript (strict mode).
- Use Vanilla CSS Modules for styling (NO Tailwind, NO CSS-in-JS libraries).
- Delete all Vite-related files: `vite.config.js`, `index.html`, `vault-server.js`.
- Delete all old `.js` source files once their `.ts`/`.tsx` equivalents are created.
- The `data-silo/` directory must remain in `.gitignore` (it holds business data, not framework code).
- The `data-silo/` directory must contain:
  - `data-silo/db.json` → the main database (formerly `materia.json`)
  - `data-silo/assets/` → uploaded files
  - `data-silo/modules/` → injectable JS modules (formerly `logic/`)
  - `data-silo/styles/` → injectable CSS files (formerly N/A)

### 2. TYPE DEFINITIONS (The Contract)
Create `src/core/types.ts` with these interfaces:

```typescript
// The universal query object - sent from client to server
export interface UnifiedQuery {
  action: 'READ' | 'WRITE' | 'DELETE';
  context: string; // e.g., 'schema_definitions', 'page_routes', 'Materials'
  payload?: Record<string, unknown>;
}

// A single item stored in the database
export interface DataItem {
  id: string;
  context: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// A schema definition (formerly MetaClass / Archetype)
export interface SchemaDefinition {
  id: string;
  name: string;
  fields: FieldDefinition[];
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'image' | 'boolean';
  options?: string[]; // for type 'select'
  required?: boolean;
}

// The global application state
export interface AppState {
  system: {
    config: Record<string, string>;
    schemas: SchemaDefinition[];
    isLoading: boolean;
  };
  data: Record<string, DataItem[]>; // keyed by context name
}
```

### 3. SERVER-SIDE DATA LAYER (The Secure Bridge)
Create `src/app/api/vault/route.ts` as the SINGLE server endpoint for all data operations.

**Logic:**
- If `process.env.GITHUB_TOKEN` is set → use `GitHubStrategy` (reads/writes to a GitHub repo).
- If not → use `LocalStrategy` (reads/writes to `data-silo/db.json` on disk).
- The client NEVER knows which strategy is active. It only calls `/api/vault`.

Create strategy files:
- `src/server/strategies/LocalStrategy.ts`
- `src/server/strategies/GitHubStrategy.ts`

Both must implement this interface:
```typescript
interface DataStrategy {
  read(context?: string): Promise<Record<string, DataItem[]>>;
  write(fullDatabase: Record<string, DataItem[]>): Promise<void>;
}
```

### 4. CLIENT-SIDE CONTEXT (AppContext)
Create `src/context/AppContext.tsx`:
- It must be a React Client Component (`'use client'`).
- On mount, it calls `GET /api/vault` to load the full database into state.
- It exposes: `{ state, dispatch, saveItem, deleteItem }` via React Context.
- `saveItem` and `deleteItem` must call `POST /api/vault` with the updated database.
- IMPORTANT: This replaces the old `SovereignContext.jsx` and `AppState.js`.

### 5. DYNAMIC MODULE HOST (formerly SovereignLogicHost)
Create `src/components/DynamicModuleHost.tsx`:
- Uses `next/dynamic` to load JavaScript modules from `http://localhost:3000/modules/[name]`.
- The server (`vault-server` is now gone) must serve the `data-silo/modules/` directory 
  via a new Next.js API route: `src/app/api/modules/[name]/route.ts`.
- Passes to the loaded module: `{ state, dispatch, React }`.
- The loaded module must export a `render` function following this contract:
  ```javascript
  export const render = ({ state, dispatch, React }) => {
    // Return a React element using React.createElement (NO JSX - browser native)
    return React.createElement('div', null, 'Hello from module');
  }
  ```
- Implements an Error Boundary so a failing module does NOT crash the whole app.

### 6. STYLE INJECTOR
Create `src/components/StyleInjector.tsx`:
- On app load, call `GET /api/silo-styles` to check if `data-silo/styles/theme.css` exists.
- If it does, inject it as a `<style>` tag into the document `<head>`.
- This allows any project to define its visual identity in `data-silo/styles/theme.css`
  without touching framework code.

### 7. DYNAMIC ROUTER & PAGE BUILDER
Create `src/app/[...slug]/page.tsx`:
- This is the catch-all route for all dynamic pages.
- It reads `page_routes` from the app state.
- If a `page_route` entry matches the current URL, it renders its composition blocks 
  using `PageComposer`.
- If a `page_route` entry has a `module` field (e.g., `"module": "Quoter.js"`), it 
  renders `DynamicModuleHost` instead.
- If no match is found, render a 404 page with a link to `/schema`.

Create `src/components/PageComposer.tsx`:
- Takes an array of block definitions and renders them as a page layout.
- Block types: `text`, `image`, `grid`, `data-table` (for listing DataItems by context).

### 8. SCHEMA BUILDER (formerly /forge)
Create `src/app/schema/page.tsx`:
- This is the system admin page. 
- It allows the system operator (developer/owner) to:
  1. Define `SchemaDefinitions` (what entity types exist and what fields they have).
  2. Define `page_routes` (what URL maps to what content).
  3. Configure `system_config` (app title, etc.).
- It renders dynamic forms based on the existing schema definitions.
- This route is NOT meant for end-users of the ERP; it is a developer tool.

### 9. SECURITY & ENVIRONMENT SETUP
Create `.env.example` with:
```
# Required for production (Vercel). If not set, uses local file system.
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
GITHUB_FILE_PATH=db.json
GITHUB_BRANCH=main

# Set to 'local' or 'github'
DATA_STRATEGY=local
```

Create `docs/INFRASTRUCTURE.md` documenting:
- How to deploy to Vercel.
- What environment variables to set.
- How the LocalStrategy vs GitHubStrategy auto-detection works.
- How to create and connect a `data-silo/` for a new project.

### 10. FINAL VALIDATION
After all files are created:
- Run `npm run build` and fix any TypeScript errors.
- Ensure `npm run dev` starts the app on port 3000 with no errors.
- Verify that navigating to `/schema` shows the Schema Builder UI.
- Verify that the app loads `data-silo/db.json` (if it exists) and displays data.

---

## GOLDEN RULES
1. **ZERO business logic in the seed.** No references to "furniture", "materials", 
   "quotes", or any specific domain.
2. **Every `.js` file in `src/` must become `.ts` or `.tsx`.**
3. **No hardcoded styles or colors** in the framework code. All visual identity 
   comes from `data-silo/styles/theme.css`.
4. **The `data-silo/` directory is always in `.gitignore`.** It belongs to the 
   project (business), not to the seed (framework).
5. **The seed must work with ZERO configuration.** Clone the repo, run `npm install`,
   run `npm run dev`, and it should boot to the Schema Builder page instantly.
