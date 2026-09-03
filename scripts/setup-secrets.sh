#!/bin/bash
# Auto-ejecutado al crear codespace via postCreateCommand
# Los secrets de Codespaces ya están inyectados como variables de entorno

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

echo "🔧 Verificando entorno Codespaces..."

# Verificar variables críticas (ya inyectadas por Codespaces)
missing=0
for var in DATABASE_URL NEON_API_KEY NOTION_API_KEY; do
  if [[ -z "${!var}" ]]; then
    echo "⚠️  FALTA: $var - Configura en: gh secret set $var --app codespaces --repo $REPO"
    ((missing++))
  fi
done

if [[ $missing -eq 0 ]]; then
  # Guardar snapshot local para uso fuera del codespace
  env | grep -E '^(DATABASE_URL|NEON_API_KEY|NOTION_API_KEY|SESSION_SECRET|CF_R2_|NEXT_PUBLIC_|VERCEL_)' > .env.local 2>/dev/null || true
  echo "✅ Entorno Codespaces verificado y .env.local creado"
else
  echo "❌ Faltan $missing variables críticas en Codespaces"
  exit 1
fi