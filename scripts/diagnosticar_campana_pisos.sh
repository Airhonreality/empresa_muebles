#!/usr/bin/env bash
# Exporta credenciales de Google Ads desde Infisical a .env.local y ejecuta
# el diagnóstico de solo lectura de la campaña "Pisos de Madera".
#
# Requisitos previos (en tu máquina):
#   - infisical CLI instalado y logueado: infisical login
#   - Acceso al proyecto d99dea9e-3a90-4df5-9e34-a1b117271c3b, entorno dev
#   - Perfil "airhonreality@gmail.com--airhon-fi-ep"
#
# Uso: ./diagnosticar_campana_pisos.sh

set -euo pipefail

PROJECT_ID="d99dea9e-3a90-4df5-9e34-a1b117271c3b"
PROFILE="airhonreality@gmail.com--airhon-fi-ep"
ENV_FILE="/home/airhon/Proyectos/empresa_muebles/.env.local"
PYTHON="/home/airhon/Agentic_Toolbox/google_ads/.venv/bin/python"
SCRIPT="/home/airhon/Proyectos/empresa_muebles/scripts/diagnosticar_campana_pisos.py"

echo "==> Exportando credenciales de Infisical a $ENV_FILE ..."
infisical export --env dev --projectId "$PROJECT_ID" \
  --profile "$PROFILE" --output-file "$ENV_FILE"

echo "==> Verificando variables GOOGLE_ADS_* ..."
grep -q "GOOGLE_ADS_DEVELOPER_TOKEN" "$ENV_FILE" || { echo "ERROR: GOOGLE_ADS_DEVELOPER_TOKEN no encontrada"; exit 1; }
grep -q "GOOGLE_ADS_LOGIN_CUSTOMER_ID" "$ENV_FILE" || { echo "ERROR: GOOGLE_ADS_LOGIN_CUSTOMER_ID no encontrada"; exit 1; }
echo "  OK"

echo "==> Ejecutando diagnóstico de solo lectura con Google Ads SDK ..."
set -a
. "$ENV_FILE"
set +a
"$PYTHON" "$SCRIPT"
