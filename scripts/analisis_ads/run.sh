#!/usr/bin/env bash
# Seguimiento de Ads a dos semanas: extrae datos (solo lectura) e invoca Claude Code para el reporte.
# Lo ejecuta un timer de systemd de usuario en la fecha programada. No aplica cambios en Google Ads.
set -euo pipefail

REPO="/home/airhon/Proyectos/empresa_muebles"
PY="/home/airhon/Agentic_Toolbox/google_ads/.venv/bin/python"
CLAUDE="/home/airhon/.local/bin/claude"
FECHA_FIN="$(date +%F)"
FECHA_INI="2026-11-25"
OUT="$REPO/arnes/lineas/demanda/01_analisis_campanas/2026-08-22_a_2026-11-25_Veta_Carp/seguimiento_${FECHA_FIN}"

mkdir -p "$OUT"
cd "$REPO"

# Variables de .env.local (no se imprimen)
set -a
. "$REPO/.env.local"
set +a

"$PY" -I "$REPO/scripts/analisis_ads/extraer.py" "$OUT" "$FECHA_INI" "$FECHA_FIN" >> "$OUT/log.txt" 2>&1
node "$REPO/scripts/analisis_ads/extraer_db.mjs" "$OUT" "$FECHA_INI" "$FECHA_FIN" >> "$OUT/log.txt" 2>&1

# Interpretación: Claude Code en modo no interactivo, sin permisos más allá de escribir el reporte
"$CLAUDE" -p "$(cat "$REPO/scripts/analisis_ads/prompt_interpretacion.md")

Carpeta de trabajo para esta ejecución: $OUT" \
  --add-dir "$OUT" \
  --permission-mode acceptEdits \
  --allowedTools "Read" "Write" "Edit" >> "$OUT/log_claude.txt" 2>&1

echo "Terminado $(date -Is)" >> "$OUT/log.txt"
