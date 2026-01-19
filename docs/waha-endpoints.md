# 📋 Endpoints WAHA - Documentação

Baseado na documentação oficial do WAHA e testes na porta 3002.

## 🔐 Autenticação

Todas as requisições devem incluir o header:
```
X-Api-Key: 042cfecc277d4d029c65a630c593ff0f
```

## 📱 Sessions (Sessões)

### Criar/Iniciar Sessão
```
POST /api/sessions
Body: { "name": "default" }
```

### Listar Sessões
```
GET /api/sessions
```

### Obter Status de Sessão
```
GET /api/sessions/{name}
```

### Parar Sessão
```
POST /api/sessions/{name}/stop
```

### Deletar Sessão
```
DELETE /api/sessions/{name}
```

## 💬 Chats (Conversas)

### Listar Todos os Chats
```
GET /api/{session}/chats
```

### Listar Chats (Overview - Resumido)
```
GET /api/{session}/chats/overview
```
Retorna informações resumidas dos chats (ideal para lista de conversas).

### Obter Foto do Chat
```
GET /api/{session}/chats/{chatId}/picture
```

### Arquivar Chat
```
POST /api/{session}/chats/{chatId}/archive
```

### Desarquivar Chat
```
POST /api/{session}/chats/{chatId}/unarchive
```

### Deletar Chat
```
DELETE /api/{session}/chats/{chatId}
```

## 📨 Messages (Mensagens)

### Listar Mensagens de um Chat
```
GET /api/{session}/chats/{chatId}/messages?limit=50&page=1
```

### Marcar Mensagens como Lidas
```
POST /api/{session}/chats/{chatId}/messages/read
```

### Enviar Mensagem de Texto
```
POST /api/{session}/sendText
Body: {
  "chatId": "5511999999999@c.us",
  "text": "Mensagem"
}
```

### Enviar Imagem
```
POST /api/{session}/sendImage
Body: {
  "chatId": "5511999999999@c.us",
  "image": "https://example.com/image.jpg",
  "caption": "Legenda opcional"
}
```

### Enviar Arquivo
```
POST /api/{session}/sendFile
Body: {
  "chatId": "5511999999999@c.us",
  "file": "https://example.com/file.pdf",
  "filename": "documento.pdf"
}
```

## 🔐 Auth/QR Code

### Obter QR Code
```
GET /api/{session}/auth/qr
```
Retorna QR code em formato PNG ou JSON com base64.

## 👥 Contacts (Contatos)

### Listar Contatos
```
GET /api/{session}/contacts
```

### Obter Contato Específico
```
GET /api/{session}/contacts/{contactId}
```

## 📊 Status

### Obter Status do WhatsApp
```
GET /api/{session}/me
```
Retorna informações do usuário conectado (nome, número, etc).

## 🔔 Webhooks

O WAHA pode enviar webhooks para:
- Novas mensagens recebidas
- Status de mensagens enviadas
- Mudanças de status da sessão
- Etc.

Configurar via variável de ambiente:
```
WAHA_WEBHOOK_URL=http://seu-backend/api/webhooks/waha
```

## 📝 Notas Importantes

1. **Session Name**: No WAHA Core, geralmente usa-se `"default"` como nome da sessão.

2. **Chat ID Format**: 
   - Contatos: `5511999999999@c.us`
   - Grupos: `grupo@g.us`
   - Sempre usar URL encoding para IDs com `@`

3. **Rate Limiting**: O WAHA pode ter limites de requisições por segundo.

4. **Webhooks**: Configure o webhook URL para receber eventos em tempo real.

5. **API Key**: A API Key é necessária para todas as requisições (exceto ping/health).

## 🔗 Links Úteis

- Documentação oficial: https://waha.devlike.pro/docs/
- GitHub: https://github.com/devlikeapro/waha
- Swagger UI: http://localhost:3002 (com autenticação admin/admin123)
