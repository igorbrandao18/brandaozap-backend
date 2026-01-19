# 🔄 Endpoints Proxy WAHA

Todos os endpoints do WAHA agora passam pelo backend NestJS, garantindo segurança, controle e rastreabilidade.

## 📋 Arquitetura

```
Frontend → Backend NestJS → WAHA API
```

**Benefícios:**
- ✅ Autenticação centralizada (JWT)
- ✅ Controle de acesso por usuário
- ✅ Logging e monitoramento
- ✅ Validação de dados
- ✅ Tratamento de erros padronizado
- ✅ Rate limiting (futuro)
- ✅ Cache (futuro)

## 🔐 Autenticação

Todos os endpoints requerem autenticação JWT:
```
Authorization: Bearer <token>
```

## 📱 Sessions (Sessões)

### Listar Sessões do Usuário
```http
GET /api/whatsapp/sessions
Authorization: Bearer <token>
```

### Criar Sessão
```http
POST /api/whatsapp/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Minha Sessão",
  "sessionId": "opcional"
}
```

### Obter Sessão Específica
```http
GET /api/whatsapp/sessions/:sessionId
Authorization: Bearer <token>
```

### Obter Status da Sessão
```http
GET /api/whatsapp/sessions/:sessionId/status
Authorization: Bearer <token>
```

### Obter QR Code
```http
GET /api/whatsapp/sessions/:sessionId/qr
Authorization: Bearer <token>
```

### Parar Sessão
```http
POST /api/whatsapp/sessions/:sessionId/stop
Authorization: Bearer <token>
```

### Deletar Sessão
```http
DELETE /api/whatsapp/sessions/:sessionId
Authorization: Bearer <token>
```

## 💬 Chats (Conversas)

### Listar Chats
```http
GET /api/whatsapp/sessions/:sessionId/chats
Authorization: Bearer <token>
```

### Obter Foto do Chat
```http
GET /api/whatsapp/sessions/:sessionId/chats/:chatId/picture
Authorization: Bearer <token>
```

### Arquivar Chat
```http
POST /api/whatsapp/sessions/:sessionId/chats/:chatId/archive
Authorization: Bearer <token>
```

### Desarquivar Chat
```http
POST /api/whatsapp/sessions/:sessionId/chats/:chatId/unarchive
Authorization: Bearer <token>
```

### Deletar Chat
```http
DELETE /api/whatsapp/sessions/:sessionId/chats/:chatId
Authorization: Bearer <token>
```

### Sincronizar Chats do WAHA
```http
GET /api/whatsapp/sessions/:sessionId/chats/sync
Authorization: Bearer <token>
```

### Contar Chats
```http
GET /api/whatsapp/sessions/:sessionId/chats/count
Authorization: Bearer <token>
```

## 📨 Messages (Mensagens)

### Listar Mensagens de um Chat
```http
GET /api/whatsapp/sessions/:sessionId/chats/:chatId/messages?limit=50&page=1
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (opcional): Número de mensagens por página (padrão: 50)
- `page` (opcional): Número da página (padrão: 1)

### Marcar Mensagens como Lidas
```http
POST /api/whatsapp/sessions/:sessionId/chats/:chatId/messages/read
Authorization: Bearer <token>
```

### Enviar Mensagem de Texto
```http
POST /api/whatsapp/sessions/:sessionId/send-text
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "5511999999999@c.us",
  "text": "Mensagem"
}
```

### Enviar Imagem
```http
POST /api/whatsapp/sessions/:sessionId/send-image
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "5511999999999@c.us",
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Legenda opcional"
}
```

### Enviar Arquivo
```http
POST /api/whatsapp/sessions/:sessionId/send-file
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "5511999999999@c.us",
  "fileUrl": "https://example.com/file.pdf",
  "filename": "documento.pdf"
}
```

## 👥 Contacts (Contatos)

### Listar Contatos
```http
GET /api/whatsapp/sessions/:sessionId/contacts
Authorization: Bearer <token>
```

### Obter Contato Específico
```http
GET /api/whatsapp/sessions/:sessionId/contacts/:contactId
Authorization: Bearer <token>
```

## 📊 Status

### Obter Informações do Usuário Conectado
```http
GET /api/whatsapp/sessions/:sessionId/me
Authorization: Bearer <token>
```

Retorna informações do WhatsApp conectado (nome, número, etc).

## 🔄 Fluxo de Proxy

1. **Frontend** faz requisição para `/api/whatsapp/...`
2. **Backend** valida autenticação JWT
3. **Backend** valida se o usuário tem acesso à sessão
4. **Backend** faz requisição para WAHA com API Key
5. **Backend** processa e retorna resposta para Frontend

## 📝 Notas Importantes

1. **Session ID**: O `sessionId` no backend é único por usuário, mas internamente o WAHA usa `"default"` (limitação do WAHA Core).

2. **Chat ID Format**: 
   - Contatos: `5511999999999@c.us`
   - Grupos: `grupo@g.us`
   - Sempre usar URL encoding para IDs com `@`

3. **Error Handling**: Todos os erros do WAHA são capturados e retornados com status HTTP apropriado.

4. **Logging**: Todas as requisições são logadas no backend para auditoria.

## 🧪 Testes

### Testes Unitários
- `waha.client.spec.ts` - Testa métodos do WahaClient
- `whatsapp.service.spec.ts` - Testa lógica de negócio

### Testes de Integração
- `whatsapp.e2e-spec.ts` - Testa endpoints completos

### Testes E2E
- Fluxo completo de criação de sessão
- Envio e recebimento de mensagens
- Sincronização de chats

## 🔗 Links Relacionados

- [Endpoints WAHA Originais](./waha-endpoints.md)
- [Documentação WAHA](https://waha.devlike.pro/docs/)
