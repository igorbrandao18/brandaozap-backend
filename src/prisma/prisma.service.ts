import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor(private configService?: ConfigService) {
    const databaseUrl = process.env.DATABASE_URL || configService?.get<string>('DATABASE_URL');
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    // Create PostgreSQL connection pool before calling super()
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    // Assign pool after super() call
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma Client connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Prisma Client disconnected');
  }
}
