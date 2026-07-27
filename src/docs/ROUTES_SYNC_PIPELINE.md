# Routes Synchronization Pipeline

## Overview

The routes synchronization pipeline ensures that page routes defined in `storage/db/page_routes.json` are automatically synchronized to the active persistence layer (Postgres/Neon) during deployment.

## Architecture

```
Local Development
├─ storage/db/page_routes.json
└─ Edit, test, validate locally

npm run build
├─ npm run agnostic:compile      # Generate TypeScript types
└─ next build                    # Build Next.js app

npm run post-deploy (automatic on Vercel)
└─ npx tsx scripts/sync-routes-on-deploy.ts
   ├─ Read storage/db/page_routes.json
   ├─ Validate consistency
   │  ├─ Check context === "page_routes"
   │  ├─ Check required fields (path, title, blocks)
   │  ├─ Check for duplicates
   │  └─ Check type correctness
   ├─ If AGNOSTIC_STORAGE_STRATEGY=postgres:
   │  └─ Sync to Neon via PostgresStrategy
   └─ Exit with error code if validation fails (triggers deploy rollback)
```

## Environment Variables

The sync pipeline respects these environment variables:

```env
AGNOSTIC_STORAGE_STRATEGY=postgres  # or: local, github, supabase
DATABASE_URL=postgresql://...        # Neon connection string (required if strategy=postgres)
```

## Workflow

### 1. Local Development

Edit routes directly in `storage/db/page_routes.json`:

```json
[
  {
    "id": "route-id-uuid",
    "context": "page_routes",
    "data": {
      "path": "/my-page",
      "title": "My Page",
      "system_group": "my_module",
      "isPrivate": false,
      "blocks": [
        {
          "id": "block-id",
          "type": "my_block",
          "context": "my_context",
          "blocks": []
        }
      ],
      "order": 0
    },
    "updated_at": "2026-07-22T10:00:00.000Z",
    "_meta": {}
  }
]
```

### 2. Validation Rules

The sync script validates:

- ✅ **Context Check**: All records must have `context: "page_routes"`
- ✅ **Required Fields**: `path` and `title` must exist and be strings
- ✅ **Duplicate Paths**: No two routes can have the same `path`
- ✅ **Type Safety**: `blocks` must be an array, `isPrivate` a boolean, `order` a number
- ✅ **Valid JSON**: The file must be valid UTF-8 encoded JSON

### 3. On Deployment (Vercel)

When you push to production:

```bash
1. vercel.json triggers buildCommand: npm run build
   ├─ Compiles schemas
   └─ Builds Next.js
   
2. vercel.json triggers postBuildCommand: npm run post-deploy
   ├─ Validates routes
   ├─ Syncs to Neon (if configured)
   └─ Exits with error if validation fails
   
3. If sync fails → deployment rolls back
   If sync succeeds → routes are live in Neon
```

## Sync Pipeline Outputs

### Success Case

```
🛣️ Starting Route Synchronizer...
📂 Source: /path/to/storage/db/page_routes.json
--------------------------------------------------
📋 Found 1 route(s)
✅ Validation passed
📡 Syncing to Postgres/Neon...
📦 Routes to sync: 1
  ✅ Synced: /my-page
✨ All routes synced to Postgres/Neon successfully.

✨ Route synchronization completed successfully.
```

### Validation Error Case

```
🛣️ Starting Route Synchronizer...
📂 Source: /path/to/storage/db/page_routes.json
--------------------------------------------------
📋 Found 2 route(s)
❌ Validation failed:
   • [Row 0] Duplicate path detected: "/my-page"
   • [Row 1] Invalid isPrivate type: expected boolean, got string
```

### Local Strategy (no DB sync)

```
🛣️ Starting Route Synchronizer...
📂 Source: /path/to/storage/db/page_routes.json
--------------------------------------------------
📋 Found 1 route(s)
✅ Validation passed
[sync-routes] Strategy is not postgres or DATABASE_URL not configured. Skipping DB sync.

✨ Route synchronization completed successfully.
```

## Manual Route Sync

You can manually trigger the sync without deploying:

```bash
npm run post-deploy
```

This is useful for:
- Testing the sync pipeline
- Fixing routes in production after a failed deployment
- Bulk importing routes from development to staging

## Troubleshooting

### Routes not syncing to Neon

**Check 1: Is DATABASE_URL set?**
```bash
echo $DATABASE_URL  # Should output your Neon connection string
```

**Check 2: Is AGNOSTIC_STORAGE_STRATEGY=postgres?**
```bash
echo $AGNOSTIC_STORAGE_STRATEGY  # Should output: postgres
```

**Check 3: Is page_routes.json valid JSON?**
```bash
npm run post-deploy  # Check error output
```

**Check 4: Does the route pass validation?**
Look for context, required fields, and type mismatches in the error output.

### Deployment rollback

If the sync script exits with code 1, Vercel will automatically roll back the deployment. Common reasons:

- Invalid JSON in `storage/db/page_routes.json`
- Duplicate paths detected
- Missing required fields
- Type mismatches
- Database connection failure

To fix:

1. Correct the routes locally
2. Commit and push again
3. Vercel will retry the deployment

## Integration with Other Pipelines

### Zaps Sync

Routes sync runs **after** Zaps sync (part of the build process). Zaps are synced via `npm run agnostic:compile`, which happens before routes.

### Schema Compilation

Schema types are generated before routes are synced. If a schema changes, routes referencing it may fail during sync.

### Definition Revisions

In `revision` mode, routes are treated as immutable content-addressed bundles. The sync pipeline validates routes against the active revision snapshot.

## Security Considerations

1. **DATABASE_URL is sensitive**: Include it only in Vercel Secrets, never in git
2. **Validation is strict**: Malformed routes will block deployment
3. **No partial syncs**: Either all routes sync or none do (atomic)
4. **Error messages are sanitized**: Connection errors don't leak credentials
