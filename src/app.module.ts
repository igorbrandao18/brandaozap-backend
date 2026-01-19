import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import wahaConfig from './config/waha.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { MessagesModule } from './modules/messages/messages.module';
import { KeywordsModule } from './modules/keywords/keywords.module';
import { FlowsModule } from './modules/flows/flows.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { AgentsModule } from './modules/agents/agents.module';

@Module({
  imports: [
    // Config Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig, wahaConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    // Prisma Module (Global)
    PrismaModule,
    // Feature Modules
    AuthModule,
    UsersModule,
    WhatsAppModule,
    ContactsModule,
    MessagesModule,
    KeywordsModule,
    FlowsModule,
    CampaignsModule,
    TemplatesModule,
    AgentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
