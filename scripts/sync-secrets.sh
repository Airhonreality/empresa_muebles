#!/bin/bash
# Uso: ./scripts/sync-secrets.sh [push|list] [owner/repo]
# NOTA: pull no expone valores por seguridad; usa `gh codespace create` y los secrets están en el entorno

REPO="${2:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
ACTION="${1:-list}"

case $ACTION in
  push)
    echo "📤 Subiendo .env.local a Codespaces de $REPO..."
    [[ ! -f .env.local ]] && { echo "❌ .env.local no existe"; exit 1; }
    while IFS='=' read -r key value; do
      [[ -z "$key" || "$key" =~ ^# ]] && continue
      gh secret set "$key" --app codespaces --repo "$REPO" --body "$value"
      echo "  ✓ $key"
    done < .env.local
    echo "✅ Secrets subidos a Codespaces"
    ;;
  list)
    gh secret list --app codespaces --repo "$REPO"
    ;;
  *)
    echo "Uso: $0 [push|list] [owner/repo]"
    echo "  pull: no disponible via API (secretos no se exponen). Usa 'gh codespace create' y estarán en el entorno."
    ;;
esac