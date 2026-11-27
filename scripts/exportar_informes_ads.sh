#!/usr/bin/env bash
# Wrapper para exportar informes de Google Ads de una cuenta específica.
# Exporta credenciales de Infisical a .env.local y ejecuta el script de Python.
#
# Uso: ./exportar_informes_ads.sh <customer_id> [fecha]
# Ejemplo: ./exportar_informes_ads.sh 9399973984 2026-11-24

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Uso: $0 <customer_id> [fecha]"
    echo "Ejemplo: $0 9399973984 2026-11-24"
    exit 1
fi

CUSTOMER_ID="$1"
FECHA="${2:-}"
PROJECT_ID="d99dea9e-3a90-4df5-9e34-a1b117271c3b"
PROFILE="airhonreality@gmail.com--airhon-fi-ep"
ENV_FILE="/home/airhon/Proyectos/empresa_muebles/.env.local"
PYTHON="/home/airhon/Agentic_Toolbox/google_ads/.venv/bin/python"
SCRIPT="/home/airhon/Proyectos/empresa_muebles/scripts/exportar_informes_ads.py"

echo "==> Exportando credenciales de Infisical a $ENV_FILE ..."
infisical export --env dev --projectId "$PROJECT_ID" \
  --profile "$PROFILE" --output-file "$ENV_FILE"

echo "==> Verificando variables GOOGLE_ADS_* ..."
grep -q "GOOGLE_ADS_DEVELOPER_TOKEN" "$ENV_FILE" || { echo "ERROR: GOOGLE_ADS_DEVELOPER_TOKEN no encontrada"; exit 1; }
grep -q "GOOGLE_ADS_LOGIN_CUSTOMER_ID" "$ENV_FILE" || { echo "ERROR: GOOGLE_ADS_LOGIN_CUSTOMER_ID no encontrada"; exit 1; }
echo "  OK"

echo "==> Ejecutando exportación de informes para cuenta $CUSTOMER_ID ..."
set -a
. "$ENV_FILE"
set +a

if [ -n "$FECHA" ]; then
    "$PYTHON" "$SCRIPT" "$CUSTOMER_ID" "$FECHA"
else
    "$PYTHON" "$SCRIPT" "$CUSTOMER_ID"
fi
