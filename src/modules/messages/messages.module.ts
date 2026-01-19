import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { ContactsModule } from '../contacts/contacts.module';
import { WahaWebhookController } from './webhooks/waha-webhook.controller';

@Module({
  imports: [WhatsAppModule, ContactsModule],
  controllers: [MessagesController, WahaWebhookController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
