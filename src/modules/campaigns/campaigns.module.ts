import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { UsersModule } from '../users/users.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [UsersModule, WhatsAppModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
