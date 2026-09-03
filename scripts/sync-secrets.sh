#!/bin/bash
# Uso: ./scripts/sync-secrets.sh [pull|push|list] [owner/repo]

REPO="${2:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
ACTION="${1:-pull}"

case $ACTION in
  pull)
    echo "📥 Descargando secrets de $REPO..."
    gh codespace secrets list --repo "$REPO" --json name,value \
      --jq '.[] | "\(.name)=\(.value)"' > .env.local
    echo "✅ Guardado en .env.local"
    ;;
  push)
    echo "📤 Subiendo .env.local a $REPO..."
    while IFS='=' read -r key value; do
      [[ -z "$key" || "$key" =~ ^# ]] && continue
      gh codespace secrets set "$key" --repo "$REPO" --body "$value"
      echo "  ✓ $key"
    done < .env.local
    echo "✅ Secrets subidos a Codespaces"
    ;;
  list)
    gh codespace secrets list --repo "$REPO"
    ;;
  *)
    echo "Uso: $0 [pull|push|list] [owner/repo]"
    ;;
esac