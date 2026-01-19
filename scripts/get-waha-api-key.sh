#!/bin/bash

# Script para extrair a API Key do WAHA dos logs do Docker
CONTAINER_NAME="brandaozap-waha-dev"

# Tentar extrair API Key dos logs (compatível com macOS)
API_KEY=$(docker logs "$CONTAINER_NAME" 2>&1 | grep "WAHA_API_KEY=" | tail -1 | sed -E 's/.*WAHA_API_KEY=([0-9a-f]+).*/\1/')

if [ -z "$API_KEY" ]; then
  echo "⚠️  Não foi possível encontrar API Key nos logs do WAHA"
  echo "💡 Verifique se o container está rodando: docker ps | grep waha"
  exit 1
fi

echo "$API_KEY"
