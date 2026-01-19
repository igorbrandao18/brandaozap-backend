# 🧪 Guia de Testes - BrandaoZap Backend

## 📋 Estrutura de Testes

O projeto usa Jest para testes unitários e E2E, com objetivo de **100% de cobertura**.

### Configuração

- **Jest** configurado no `package.json`
- **Coverage threshold**: 100% para branches, functions, lines e statements
- **Testes unitários**: `*.spec.ts` em cada módulo
- **Testes E2E**: `*.e2e-spec.ts` na pasta `test/`

## 🚀 Executando Testes

```bash
# Todos os testes
pnpm test

# Com cobertura
pnpm test:cov

# Watch mode
pnpm test:watch

# Testes E2E
pnpm test:e2e

# Coverage com threshold (CI)
pnpm test:cov:ci
```

## 📊 Status Atual

### ✅ Testes Criados

- ✅ `UsersService` - 100% cobertura
- ✅ `UsersController` - 100% cobertura
- ✅ `AuthService` - Cobertura completa
- ✅ `AuthController` - Cobertura completa
- ✅ `ContactsService` - Cobertura completa
- ✅ `WhatsAppService` - Cobertura parcial
- ✅ `KeywordsService` - Cobertura completa

### ⏳ Testes Pendentes

Para alcançar 100% de cobertura, ainda precisam ser criados testes para:

1. **Messages Module**
   - `messages.service.spec.ts`
   - `messages.controller.spec.ts`
   - `waha-webhook.controller.spec.ts`

2. **Flows Module**
   - `flows.service.spec.ts`
   - `flows.controller.spec.ts`

3. **Campaigns Module**
   - `campaigns.service.spec.ts`
   - `campaigns.controller.spec.ts`

4. **Templates Module**
   - `templates.service.spec.ts`
   - `templates.controller.spec.ts`

5. **Agents Module**
   - `agents.service.spec.ts`
   - `agents.controller.spec.ts`

6. **WhatsApp Module** (completar)
   - `whatsapp.controller.spec.ts`
   - `waha.client.spec.ts`

7. **Prisma Service**
   - `prisma.service.spec.ts`

## 📝 Padrão de Testes

### Service Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceName } from './service-name.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ServiceName', () => {
  let service: ServiceName;
  let prisma: PrismaService;

  const mockPrismaService = {
    model: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test cases...
});
```

### Controller Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ControllerName } from './controller-name.controller';
import { ServiceName } from './service-name.service';

describe('ControllerName', () => {
  let controller: ControllerName;
  let service: ServiceName;

  const mockService = {
    method: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControllerName],
      providers: [
        {
          provide: ServiceName,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ControllerName>(ControllerName);
    service = module.get<ServiceName>(ServiceName);
  });

  // Test cases...
});
```

## 🎯 Objetivo: 100% Coverage

Para alcançar 100% de cobertura, cada arquivo deve ter:

1. ✅ Testes para todos os métodos públicos
2. ✅ Testes para casos de sucesso
3. ✅ Testes para casos de erro (exceptions)
4. ✅ Testes para edge cases
5. ✅ Testes para validações

## 🔧 Próximos Passos

1. Criar testes para módulos pendentes seguindo o padrão acima
2. Executar `pnpm test:cov` para verificar cobertura
3. Corrigir qualquer teste que falhe
4. Garantir que todos os testes passem com 100% de cobertura

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)
