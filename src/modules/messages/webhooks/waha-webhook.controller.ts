import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { MessagesService } from '../messages.service';
import { MessageType, MessageDirection } from '@prisma/client';

@Controller('webhooks/waha')
export class WahaWebhookController {
  private readonly logger = new Logger(WahaWebhookController.name);

  constructor(private readonly messagesService: MessagesService) {}

  @Post('message')
  async handleMessage(@Body() payload: any, @Headers('x-session-id') sessionId: string) {
    this.logger.log(`Received message webhook for session: ${sessionId}`);

    try {
      // Extrair informações da mensagem do WAHA
      const messageId = payload.id || payload.messageId;
      const from = payload.from || payload.fromNumber;
      const to = payload.to || payload.toNumber;
      const text = payload.text || payload.body;
      const type = this.mapMessageType(payload.type || 'text');
      const mediaUrl = payload.mediaUrl || payload.media?.url;
      const metadata = {
        timestamp: payload.timestamp,
        isGroup: payload.isGroup || false,
        groupId: payload.groupId,
        ...payload,
      };

      // TODO: Obter userId da sessão
      // Por enquanto, vamos precisar passar o userId de alguma forma
      // Isso pode ser feito através de um mapeamento de sessionId -> userId
      const userId = 'temp-user-id'; // Precisa ser implementado

      await this.messagesService.create(
        userId,
        sessionId,
        messageId,
        type,
        MessageDirection.INCOMING,
        from,
        to,
        text,
        mediaUrl,
        metadata,
      );

      return { success: true };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      return { success: false, error: error.message };
    }
  }

  private mapMessageType(wahaType: string): MessageType {
    const typeMap: Record<string, MessageType> = {
      text: MessageType.TEXT,
      image: MessageType.IMAGE,
      video: MessageType.VIDEO,
      audio: MessageType.AUDIO,
      document: MessageType.DOCUMENT,
      location: MessageType.LOCATION,
      contact: MessageType.CONTACT,
    };

    return typeMap[wahaType] || MessageType.TEXT;
  }
}
