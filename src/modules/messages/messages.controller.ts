import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageType, MessageDirection, MessageStatus } from '@prisma/client';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: { userId: string },
    @Query('sessionId') sessionId?: string,
    @Query('phoneNumber') phoneNumber?: string,
  ) {
    return this.messagesService.findAll(user.userId, sessionId, phoneNumber);
  }

  @Get('conversations')
  async getConversations(
    @CurrentUser() user: { userId: string },
    @Query('sessionId') sessionId?: string,
  ) {
    return this.messagesService.getConversations(user.userId, sessionId);
  }

  @Get('conversations/:phoneNumber')
  async getConversationMessages(
    @CurrentUser() user: { userId: string },
    @Param('phoneNumber') phoneNumber: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.messagesService.getConversationMessages(
      user.userId,
      sessionId,
      phoneNumber,
    );
  }

  @Post('conversations/:phoneNumber/read')
  async markAsRead(
    @CurrentUser() user: { userId: string },
    @Param('phoneNumber') phoneNumber: string,
    @Query('sessionId') sessionId: string,
  ) {
    await this.messagesService.markConversationAsRead(
      user.userId,
      sessionId,
      phoneNumber,
    );
    return { message: 'Conversation marked as read' };
  }

  @Post('send')
  async sendMessage(
    @CurrentUser() user: { userId: string },
    @Body() sendMessageDto: SendMessageDto,
    @Query('sessionId') sessionId: string,
  ) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Enviar mensagem via WhatsApp
    if (sendMessageDto.type === MessageType.TEXT) {
      await this.whatsappService.sendText(
        sessionId,
        sendMessageDto.to,
        sendMessageDto.text || '',
      );
    } else if (sendMessageDto.type === MessageType.IMAGE) {
      await this.whatsappService.sendImage(
        sessionId,
        sendMessageDto.to,
        sendMessageDto.mediaUrl || '',
        sendMessageDto.caption,
      );
    }

    // Salvar mensagem no banco
    return this.messagesService.create(
      user.userId,
      sessionId,
      messageId,
      sendMessageDto.type,
      MessageDirection.OUTGOING,
      '', // from será preenchido pelo WhatsApp
      sendMessageDto.to,
      sendMessageDto.text,
      sendMessageDto.mediaUrl,
    );
  }
}
