#!/usr/bin/env bash
# Sobe o servidor local e abre um túnel ngrok exclusivo deste projeto.
# NUNCA chama `ngrok config add-authtoken` nem toca na config global do ngrok —
# o token é passado só para este processo via --authtoken.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

PORT="${PORT:-3000}"

if [ -z "${NGROK_AUTHTOKEN:-}" ]; then
  echo "Erro: NGROK_AUTHTOKEN não está definido no .env deste projeto." >&2
  echo "" >&2
  echo "Como resolver:" >&2
  echo "  1. Acesse https://dashboard.ngrok.com/authtokens" >&2
  echo "  2. Clique em 'Add Authtoken' e crie um token novo, exclusivo para este app." >&2
  echo "  3. Copie o token e adicione a linha no arquivo .env desta pasta:" >&2
  echo "     NGROK_AUTHTOKEN=seu_token_aqui" >&2
  exit 1
fi

if ! command -v ngrok >/dev/null 2>&1; then
  echo "Erro: ngrok não está instalado. Instale com: brew install ngrok" >&2
  exit 1
fi

cleanup() {
  echo ""
  echo "Encerrando servidor e túnel..."
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null || true
  [ -n "${NGROK_PID:-}" ] && kill "$NGROK_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Iniciando servidor em http://localhost:$PORT ..."
node server.js &
SERVER_PID=$!

sleep 1

if [ -n "${NGROK_DOMAIN:-}" ]; then
  echo "Abrindo túnel ngrok com domínio fixo: $NGROK_DOMAIN"
  NGROK_AUTHTOKEN="$NGROK_AUTHTOKEN" ngrok http --url="$NGROK_DOMAIN" "$PORT" &
else
  echo "Abrindo túnel ngrok (domínio temporário)..."
  NGROK_AUTHTOKEN="$NGROK_AUTHTOKEN" ngrok http "$PORT" &
fi
NGROK_PID=$!

wait "$SERVER_PID" "$NGROK_PID"
