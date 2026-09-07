#!/usr/bin/env bash
# Test real de clonado URL->R2 (replica clonarUrlAR2: fetch browser-UA -> PUT S3 sigv4 -> GET publico)
set -uo pipefail
cd /home/javi/Proyectos/DEVs/empresa_muebles_clone_v3_NEW

SRC_URL="${1:?uso: $0 <url-imagen> <prefijo>}"
PREF="${2:-general}"

readenv() { grep "^$1=" .env.local | cut -d= -f2- | tr -d '"'; }
ACCT=$(readenv CF_R2_ACCOUNT_ID)
AK=$(readenv CF_R2_ACCESS_KEY_ID)
SK=$(readenv CF_R2_SECRET_ACCESS_KEY)
BKT=$(readenv CF_R2_BUCKET_NAME)
PUB=$(readenv CF_R2_PUBLIC_DOMAIN)

UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
ACCEPT='image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
ENDPOINT="https://${ACCT}.r2.cloudflarestorage.com"

TMPD=$(mktemp -d); trap 'rm -rf "$TMPD"' EXIT

echo "== 1) GET $SRC_URL"
code=$(curl -sS -L -o "$TMPD/src" -w '%{http_code}' -A "$UA" -H "Accept: $ACCEPT" "$SRC_URL")
ctype=$(curl -sSI -L -A "$UA" "$SRC_URL" | grep -i '^content-type:' | tr -d '\r' | tail -1)
echo "   http=$code size=$(wc -c < "$TMPD/src") ctype=$ctype"
[ "$code" = "200" ] || { echo "   FAIL: origen no responde 200"; exit 1; }
case "$ctype" in *image/*) echo "   OK es imagen";; *) echo "   FAIL: no es imagen ($ctype)"; exit 1;; esac

KEY="${PREF}/$(date +%s)-test-clone.jpg"
echo "== 2) PUT s3://$BKT/$KEY"
code=$(curl -sS -o "$TMPD/putresp" -w '%{http_code}' \
  --aws-sigv4 "aws:amz:auto:s3" \
  -u "$AK:$SK" \
  --user-agent "$UA" \
  -H "Content-Type: $ctype" \
  -H "Cache-Control: public, max-age=31536000, immutable" \
  --data-binary @"$TMPD/src" \
  "$ENDPOINT/$BKT/$KEY")
echo "   http=$code resp=$(head -c 200 "$TMPD/putresp" | tr '\n' ' ')"
[ "$code" = "200" ] || { echo "   FAIL: PUT fallo"; exit 1; }

echo "== 3) GET publico ${PUB}/${KEY}"
code=$(curl -sS -o "$TMPD/pub" -w '%{http_code}' "${PUB}/${KEY}")
echo "   http=$code size=$(wc -c < "$TMPD/pub")"
[ "$code" = "200" ] || { echo "   FAIL: URL publica no responde"; exit 1; }

echo "== RESULTADO: COMPLETO OK -> ${PUB}/${KEY}"