#!/bin/bash

# Script para criar sessão automática no WAHA
WAHA_URL="http://localhost:3002"
SESSION_ID="default"
SESSION_NAME="Sessão Principal"

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

# Criar sessão
echo "📱 Criando sessão WhatsApp..."
curl -X POST "${WAHA_URL}/api/sessions/${SESSION_ID}/start" \
  -H "Content-Type: application/json" \
  -w "\n" \
  -s || echo "⚠️  Erro ao criar sessão (pode já existir)"

echo "✅ Sessão inicializada!"
