import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WahaClient } from './waha/waha.client';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WahaClient],
  exports: [WhatsAppService, WahaClient],
})
export class WhatsAppModule {}
