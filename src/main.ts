import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // API Prefix
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix);

  // CORS
  const corsConfig = configService.get('app.cors');
  app.enableCors(corsConfig);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Port
  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
