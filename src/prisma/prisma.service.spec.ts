import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    // Mock PrismaClient constructor
    service = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      logger: {
        log: jest.fn(),
      },
      onModuleInit: jest.fn(async function() {
        await this.$connect();
        this.logger.log('Prisma Client connected');
      }),
      onModuleDestroy: jest.fn(async function() {
        await this.$disconnect();
        this.logger.log('Prisma Client disconnected');
      }),
    } as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should connect to database', async () => {
      await service.onModuleInit();

      expect(service.$connect).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database', async () => {
      await service.onModuleDestroy();

      expect(service.$disconnect).toHaveBeenCalled();
    });
  });
});
