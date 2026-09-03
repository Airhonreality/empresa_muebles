#!/bin/bash
# Auto-ejecutado al crear codespace via postCreateCommand

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

if [[ -f .env.local ]]; then
  echo "🔧 Cargando .env.local existente..."
  export $(cat .env.local | xargs)
else
  echo "📥 Descargando secrets de GitHub Codespaces..."
  gh codespace secrets list --repo "$REPO" \
    --json name,value --jq '.[] | "\(.name)=\(.value)"' > .env.local
  export $(cat .env.local | xargs)
fi

# Verificar variables críticas
for var in DATABASE_URL NEON_API_KEY NOTION_API_KEY; do
  if [[ -z "${!var}" ]]; then
    echo "⚠️  FALTA: $var - Configura en: gh codespace secrets set $var --repo $REPO"
  fi
done

echo "✅ Entorno listo para desarrollo"