# 🚀 BrandaoZap Backend

Backend do sistema BrandaoZap - Automação WhatsApp usando NestJS, Prisma e PostgreSQL.

## 📋 Pré-requisitos

- Node.js 18+
- pnpm
- Docker e Docker Compose (recomendado)
- PostgreSQL 14+ (ou use Docker)

## 🚀 Instalação

```bash
# Instalar dependências
pnpm install

# Copiar arquivo de ambiente
cp .env.example .env

# Configurar variáveis de ambiente no arquivo .env
```

## ⚙️ Configuração

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/brandaozap?schema=public

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1d

# WAHA (WhatsApp HTTP API)
WAHA_BASE_URL=http://localhost:3001
WAHA_API_KEY=
WAHA_WEBHOOK_URL=http://localhost:3000/api/webhooks/waha
```

## 🐳 Usando Docker (Recomendado)

### Desenvolvimento

```bash
# Subir PostgreSQL, Redis e WAHA
docker-compose -f docker-compose.dev.yml up -d

# Gerar Prisma Client
pnpm prisma generate

# Executar migrations
pnpm prisma migrate dev

# Iniciar aplicação
pnpm start:dev
```

**Serviços Docker em desenvolvimento:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- WAHA: `localhost:3001` (Dashboard: http://localhost:3001)

### Produção

```bash
# Subir todos os serviços (backend + postgres + redis + waha)
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f waha
```

**Serviços Docker em produção:**
- Backend: `localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- WAHA: `localhost:3001` (Dashboard: http://localhost:3001)

## 🗄️ Banco de Dados

```bash
# Criar migration
pnpm prisma migrate dev --name init

# Aplicar migrations em produção
pnpm prisma migrate deploy

# Abrir Prisma Studio (interface visual)
pnpm prisma studio

# Resetar banco (CUIDADO: apaga todos os dados)
pnpm prisma migrate reset
```

## 🏃 Executar

```bash
# Desenvolvimento
pnpm start:dev

# Produção
pnpm build
pnpm start:prod
```

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm start:dev          # Inicia em modo watch
pnpm start:debug         # Inicia em modo debug

# Prisma
pnpm prisma generate     # Gera Prisma Client
pnpm prisma migrate      # Cria e aplica migration
pnpm prisma migrate deploy # Aplica migrations em produção
pnpm prisma studio       # Abre Prisma Studio
pnpm prisma seed         # Executa seeders

# Testes
pnpm test                # Executa testes unitários
pnpm test:watch          # Executa testes em modo watch
pnpm test:cov            # Executa testes com cobertura
pnpm test:e2e            # Executa testes E2E

# Qualidade de código
pnpm lint                # Executa ESLint
pnpm format              # Formata código com Prettier
```

## 📁 Estrutura do Projeto

```
src/
├── config/              # Configurações (app, jwt, etc.)
├── common/              # Utilitários compartilhados
│   ├── decorators/      # Decorators customizados
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth guards
│   ├── interceptors/    # Interceptors
│   └── pipes/           # Validation pipes
├── modules/             # Módulos da aplicação
│   ├── auth/            # Autenticação
│   ├── users/           # Usuários
│   ├── whatsapp/        # Integração WAHA
│   └── ...
├── prisma/              # Prisma
│   ├── schema.prisma    # Schema do banco
│   └── migrations/      # Migrations
└── database/
    └── seeds/           # Seeders
```

## 🔌 Endpoints Principais

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil do usuário (requer autenticação)

### Usuários
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Buscar usuário por ID
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Para acessar rotas protegidas, inclua o token no header:

```
Authorization: Bearer <token>
```

## 📚 Documentação

- [Regras e Boas Práticas](./docs/rules.mdc)
- [Estrutura do Projeto](../STRUCTURE.md)
- [Roadmap](../brandaozap-roadmap.md)

## 🛠️ Tecnologias

- **NestJS** - Framework Node.js
- **Prisma** - ORM para TypeScript
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Redis** - Cache (opcional)
- **WAHA** - WhatsApp HTTP API ([devlikeapro/waha](https://waha.devlike.pro))
- **Socket.io** - WebSockets
- **Docker** - Containerização

## 📝 Licença

Proprietário - BrandaoZap
