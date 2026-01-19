#!/bin/bash

# Script para inicializar sessão WAHA automaticamente
WAHA_URL="${WAHA_BASE_URL:-http://localhost:3002}"
WAHA_API_KEY="${WAHA_API_KEY:-042cfecc277d4d029c65a630c593ff0f}"
SESSION_ID="default"

echo "🔄 Aguardando WAHA estar pronto..."
sleep 10

# Aguardar WAHA estar disponível
for i in {1..30}; do
  if curl -s -f "${WAHA_URL}/api/health" > /dev/null 2>&1; then
    echo "✅ WAHA está pronto!"
    break
  fi
  echo "⏳ Tentativa $i/30..."
  sleep 2
done

# Criar sessão com API Key
echo "📱 Criando sessão WhatsApp automática..."
curl -X POST "${WAHA_URL}/api/sessions/${SESSION_ID}/start" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: ${WAHA_API_KEY}" \
  -w "\n" \
  -s || echo "⚠️  Sessão pode já existir ou erro ao criar"

echo "✅ Inicialização concluída!"
