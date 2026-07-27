# Routes Sync: Vercel Setup Guide

## Prerequisites

- Your fork is deployed on Vercel
- You have Neon database configured with `DATABASE_URL`
- Your `.env.vercel.local` or Vercel Secrets contain `DATABASE_URL` and `AGNOSTIC_STORAGE_STRATEGY=postgres`

## Setup Steps

### 1. Ensure vercel.json Exists

The seed includes `vercel.json` with the post-deploy hook. Verify it's in your fork root:

```json
{
  "buildCommand": "npm run build",
  "postBuildCommand": "npm run post-deploy",
  "outputDirectory": ".next"
}
```

If missing, add it to your fork root.

### 2. Configure Vercel Secrets

Go to your Vercel project dashboard:

```
Settings → Environment Variables
```

Add or verify these secrets exist:

| Variable | Value | Required |
|----------|-------|----------|
| `AGNOSTIC_STORAGE_STRATEGY` | `postgres` | Yes |
| `DATABASE_URL` | Your Neon connection string | Yes |
| `SESSION_SECRET` | Random string (32+ chars) | Yes (for auth) |
| `API_SECRET_KEY` | Random string (32+ chars) | Yes (for vault API) |

Example Neon connection string:
```
postgresql://user:password@host:5432/dbname?sslmode=require
```

### 3. Test Locally

Before deploying, test the sync locally:

```bash
# Set environment variables
export AGNOSTIC_STORAGE_STRATEGY=postgres
export DATABASE_URL="postgresql://..."

# Run the sync script
npm run post-deploy
```

Expected output:
```
🛣️ Starting Route Synchronizer...
📂 Source: /path/to/storage/db/page_routes.json
--------------------------------------------------
📋 Found X route(s)
✅ Validation passed
📡 Syncing to Postgres/Neon...
✨ All routes synced to Postgres/Neon successfully.
```

### 4. Deploy to Vercel

Push your changes:

```bash
git add vercel.json storage/db/page_routes.json
git commit -m "chore: enable routes sync pipeline"
git push origin main
```

Vercel will:
1. Run `npm run build` (compile schemas + Next.js build)
2. Run `npm run post-deploy` (validate and sync routes)
3. Deploy to production if both succeed
4. Rollback if sync fails

### 5. Monitor Deployment

In your Vercel dashboard:

```
Deployments → [Recent Deploy] → Logs
```

Look for the Routes Sync output:

```
🛣️ Starting Route Synchronizer...
...
✨ Route synchronization completed successfully.
```

If it fails, the entire deployment is rolled back automatically.

## Troubleshooting

### Deployment fails with: "DATABASE_URL not configured"

**Solution**: Add `DATABASE_URL` to Vercel Secrets:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `DATABASE_URL` with your Neon connection string
3. Redeploy

### Deployment fails with: "Validation failed: Duplicate path"

**Solution**: Fix the route in `storage/db/page_routes.json`:
1. Identify the duplicate paths in the error message
2. Edit `storage/db/page_routes.json` locally
3. Ensure all `path` values are unique
4. Commit and push to trigger a new deployment

### Routes not appearing in Neon

**Solution**: Check that routes were synced:
1. Review the Vercel logs for "✅ Synced: /path"
2. Verify `AGNOSTIC_STORAGE_STRATEGY=postgres` is set
3. Verify `DATABASE_URL` is valid

### Manual Sync After Deployment

If you need to re-sync routes without redeploying:

```bash
# In your Vercel deployment environment or locally
npm run post-deploy
```

## What Happens During Sync

For each route in `storage/db/page_routes.json`:

1. **Validation**: Checks context, required fields, types, duplicates
2. **Database Upsert**: Uses `ON CONFLICT DO UPDATE` for idempotent sync
3. **Confirmation**: Logs which routes were synced
4. **Error Handling**: If any route fails, entire sync fails (atomic)

## Reverting Routes

If you need to revert a route after deployment:

1. Delete or revert the route in `storage/db/page_routes.json` locally
2. Commit and push to Vercel
3. The next deploy will sync the deletion to Neon

Or manually:

```bash
# Delete a route record from Neon
DELETE FROM agnostic_records 
WHERE namespace = 'page_routes' 
  AND data->>'path' = '/old-path';
```

## Monitoring Routes in Production

Query routes synced to Neon:

```sql
SELECT 
  id, 
  data->>'path' as path, 
  data->>'title' as title, 
  updated_at
FROM agnostic_records 
WHERE namespace = 'page_routes'
ORDER BY updated_at DESC;
```

## Related Documentation

- [Routes Sync Pipeline](./ROUTES_SYNC_PIPELINE.md) — Architecture and workflow
- [Comandos CLI.md](../../../Comandos%20CLI.md) — Local route management
- [Definition Lifecycle](./DEFINITION_LIFECYCLE.md) — Revision mode considerations

## Support

If routes sync fails:

1. Check Vercel Logs: **Deployments → [Deploy] → Logs**
2. Check error messages for validation issues
3. Test locally: `npm run post-deploy`
4. Review this guide's troubleshooting section
