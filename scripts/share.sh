#!/usr/bin/env bash
# Sobe o servidor local e abre um túnel ngrok exclusivo deste projeto.
#
# IMPORTANTE: o ngrok sempre lê o arquivo de config global
# (~/Library/Application Support/ngrok/ngrok.yml) e, se esse arquivo já tiver
# um authtoken salvo (de outro projeto seu), ele tem prioridade sobre a
# variável de ambiente NGROK_AUTHTOKEN — passar o token só por env var NÃO
# é suficiente para isolar a conta. Por isso este script gera um arquivo de
# config PRÓPRIO deste projeto (.ngrok/config.yml, fora do Git, recriado a
# cada execução) e usa `ngrok http --config <arquivo>`, sem nunca tocar no
# arquivo global nem rodar `ngrok config add-authtoken`.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

PORT="${PORT:-3001}"

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

NGROK_CONFIG_DIR=".ngrok"
NGROK_CONFIG_FILE="$NGROK_CONFIG_DIR/config.yml"
mkdir -p "$NGROK_CONFIG_DIR"
umask 077
{
  echo 'version: "3"'
  echo 'agent:'
  echo "    authtoken: $NGROK_AUTHTOKEN"
} > "$NGROK_CONFIG_FILE"

cleanup() {
  echo ""
  echo "Encerrando servidor e túnel..."
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null || true
  [ -n "${NGROK_PID:-}" ] && kill "$NGROK_PID" 2>/dev/null || true
  rm -f "$NGROK_CONFIG_FILE"
}
trap cleanup EXIT INT TERM

echo "Iniciando servidor em http://localhost:$PORT ..."
node server.js &
SERVER_PID=$!

sleep 1

# ngrok roda em primeiro plano: se ele cair ou falhar, o script encerra o
# servidor logo em seguida (o trap cleanup cuida disso), em vez de ficar
# preso esperando o servidor pra sempre.
if [ -n "${NGROK_DOMAIN:-}" ]; then
  echo "Abrindo túnel ngrok com domínio fixo: $NGROK_DOMAIN (config própria deste projeto)"
  ngrok http --config "$NGROK_CONFIG_FILE" --url="$NGROK_DOMAIN" "$PORT"
else
  echo "Abrindo túnel ngrok (domínio temporário, config própria deste projeto)..."
  ngrok http --config "$NGROK_CONFIG_FILE" "$PORT"
fi
