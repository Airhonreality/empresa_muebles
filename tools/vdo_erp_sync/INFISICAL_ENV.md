# Fase 1 — Infisical: Gestión de Secretos (empresa muebles)

## Estado de la sesión
Al momento de la ejecución, la sesión de Infisical CLI presentaba token expirado:
```
$ infisical login status
x Failed to authenticate as airhonreality@gmail.com
  Reason: session expired (locally skipped)
  Domain: https://app.infisical.com
  Auth method: github
```
Es necesario ejecutar `infisical login` (método `user`/github) para restaurar la sesión antes de cualquier operación de secretos.

## Proyecto Infisical
- **Usuario logueado:** `airhonreality@gmail.com`
- **Dominio:** `https://app.infisical.com/api` (Infisical Cloud US)
- **Usuario ID:** `b3d3e5f4-b7f1-4ef4-9256-bd1198a0fe57`
- **Organización:** `11945324-609c-4ac0-bf71-d0d4520cc164`
- **Config local:** `~/.infisical/infisical-config.json` (sesión identificada)

## Comandos utilizados / a utilizar (Fase 1)

```bash
# 0. Verificar sesión
infisical login status

# 1. Re-autenticar (si expiró)
infisical login

# 2. (Desde la raíz del ERP) Asociación del proyecto local con Infisical
cd /home/javi/Proyectos/DEVs/empresa_muebles_clone_v3_NEW
infisical init
#    → selecciona Infisical Cloud (US Region), proyecto "empresa-muebles" / entorno dev
#    → crea .infisical.json con projectId y environment

# 3. Importar variables del .env.local a Infisical (entorno dev)
infisical secrets set DATABASE_URL         --env dev
infisical secrets set DATABASE_URL_DEV_LOCAL --env dev
infisical secrets set DATABASE_URL_V3_PREVIEW --env dev
infisical secrets set DATABASE_URL_LEGACY  --env dev
infisical secrets set NEON_API_KEY         --env dev
infisical secrets set SESSION_SECRET       --env dev
infisical secrets set VERCEL_OIDC_TOKEN    --env dev
infisical secrets set NOTION_API_KEY       --env dev
infisical secrets set CF_R2_BUCKET_NAME    --env dev
infisical secrets set CF_R2_ACCOUNT_ID     --env dev
infisical secrets set CF_R2_ACCESS_KEY_ID  --env dev
infisical secrets set CF_R2_SECRET_ACCESS_KEY --env dev
infisical secrets set CF_R2_PUBLIC_DOMAIN  --env dev

# 4. Test de verificación: recuperar DATABASE_URL y comparar con el local
infisical secrets get DATABASE_URL --env dev
#    El valor recuperado debe coincidir exactamente con el de .env.local:
#    postgresql://neondb_owner:npg_HcsUFu6rwZ0M@ep-muddy-cherry-at5j2mz7-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require

# 5. Exportar todo el entorno para ejecutar los scripts MCP (nada queda en disco)
infisical export --env dev --format dotenv > .env.local
set -a; . .env.local; set +a

# 6. Ejecutar un script MCP con secretos inyectados (recomendado)
infisical run --env dev -- npx tsx src/sync_pull_catalog.ts
```

## Archivo de asociación local (intentado)
Se buscó `.infisical.json` en la raíz del ERP: no existía. Tras `infisical init` (con sesión válida) se genera automáticamente con:
```json
{
  "projectId": "<uuid-del-proyecto>",
  "environment": "dev",
  "path": "/"
}
```

## Backup de secretos existente
Existe un respaldo cifrado de Infisical en:
`~/.infisical/secrets-backup/project_secrets_1fbd4a51-bd6e-4530-9493-5365500e0ebd_dev_-.json`
(Cuerpo cifrado `CipherText`; requiere sesión activa de Infisical para restaurar/descifrar.)

## Resultado de la prueba de recuperación
**Pendiente** hasta restaurar la sesión de Infisical (`infisical login`). Una vez restaurado, `infisical secrets get DATABASE_URL --env dev` debe devolver la cadena de Neon de `ep-muddy-cherry` idéntica a la de `.env.local` del ERP.

## Cadena de conexión objetivo (DATABASE_URL, entorno dev/v3-preview)
```
postgresql://neondb_owner:npg_HcsUFu6rwZ0M@ep-muddy-cherry-at5j2mz7-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require
```
Nota: apuntar a producción (`ep-round-queen`) está prohibido para escrituras (ver AGENTS.md del ERP).
