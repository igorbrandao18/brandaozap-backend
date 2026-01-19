import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendTextDto, SendImageDto, SendFileDto } from './dto/send-message.dto';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('sessions')
  async createSession(
    @CurrentUser() user: { userId: string },
    @Body() createSessionDto: CreateSessionDto,
  ) {
    return this.whatsappService.createSession(
      user.userId,
      createSessionDto.name,
      createSessionDto.sessionId,
    );
  }

  @Get('sessions')
  async getUserSessions(@CurrentUser() user: { userId: string }) {
    return this.whatsappService.getUserSessions(user.userId);
  }

  // Rotas específicas devem vir ANTES das genéricas
  @Get('sessions/:sessionId/chats/sync')
  async syncChats(
    @CurrentUser() user: { userId: string },
    @Param('sessionId') sessionId: string,
  ) {
    const conversations = await this.whatsappService.syncChatsFromWAHA(sessionId, user.userId);
    return conversations;
  }

  @Get('sessions/:sessionId/chats/count')
  async getChatsCount(@Param('sessionId') sessionId: string) {
    const count = await this.whatsappService.getChatsCount(sessionId);
    return { count };
  }

  @Get('sessions/:sessionId/status')
  async getSessionStatus(@Param('sessionId') sessionId: string) {
    return this.whatsappService.updateSessionStatus(sessionId);
  }

  @Get('sessions/:sessionId/qr')
  async getQrCode(@Param('sessionId') sessionId: string) {
    const qrCode = await this.whatsappService.getQrCode(sessionId);
    return { qrCode };
  }

  // ========== STATUS ENDPOINTS (deve vir antes da rota genérica) ==========
  @Get('sessions/:sessionId/me')
  async getMe(@Param('sessionId') sessionId: string) {
    return this.whatsappService.getMe(sessionId);
  }

  @Post('sessions/:sessionId/stop')
  async stopSession(@Param('sessionId') sessionId: string) {
    await this.whatsappService.stopSession(sessionId);
    return { message: 'Session stopped successfully' };
  }

  @Post('sessions/:sessionId/send-text')
  async sendText(
    @Param('sessionId') sessionId: string,
    @Body() sendTextDto: SendTextDto,
  ) {
    await this.whatsappService.sendText(
      sessionId,
      sendTextDto.to,
      sendTextDto.text,
    );
    return { message: 'Text sent successfully' };
  }

  @Post('sessions/:sessionId/send-image')
  async sendImage(
    @Param('sessionId') sessionId: string,
    @Body() sendImageDto: SendImageDto,
  ) {
    await this.whatsappService.sendImage(
      sessionId,
      sendImageDto.to,
      sendImageDto.imageUrl,
      sendImageDto.caption,
    );
    return { message: 'Image sent successfully' };
  }

  @Post('sessions/:sessionId/send-file')
  async sendFile(
    @Param('sessionId') sessionId: string,
    @Body() sendFileDto: SendFileDto,
  ) {
    await this.whatsappService.sendFile(
      sessionId,
      sendFileDto.to,
      sendFileDto.fileUrl,
      sendFileDto.filename,
    );
    return { message: 'File sent successfully' };
  }

  @Delete('sessions/:sessionId')
  async deleteSession(@Param('sessionId') sessionId: string) {
    await this.whatsappService.deleteSession(sessionId);
    return { message: 'Session deleted successfully' };
  }

  // ========== CHATS ENDPOINTS ==========
  @Get('sessions/:sessionId/chats')
  async getChats(@Param('sessionId') sessionId: string) {
    return this.whatsappService.getChatsFromWAHA(sessionId);
  }

  @Get('sessions/:sessionId/chats/:chatId/picture')
  async getChatPicture(
    @Param('sessionId') sessionId: string,
    @Param('chatId') chatId: string,
  ) {
    return this.whatsappService.getChatPicture(sessionId, chatId);
  }

  @Post('sessions/:sessionId/chats/:chatId/archive')
  async archiveChat(
    @Param('sessionId') sessionId: string,
    @Param('chatId') chatId: string,
  ) {
    await this.whatsappService.archiveChat(sessionId, chatId);
    return { message: 'Chat archived successfully' };
  }

  @Post('sessions/:sessionId/chats/:chatId/unarchive')
  async unarchiveChat(
    @Param('sessionId') sessionId: string,
    @Param('chatId') chatId: string,
  ) {
    await this.whatsappService.unarchiveChat(sessionId, chatId);
    return { message: 'Chat unarchived successfully' };
  }

  @Delete('sessions/:sessionId/chats/:chatId')
  async deleteChat(
    @Param('sessionId') sessionId: string,
    @Param('chatId') chatId: string,
  ) {
    await this.whatsappService.deleteChat(sessionId, chatId);
    return { message: 'Chat deleted successfully' };
  }

  // ========== MESSAGES ENDPOINTS ==========
  @Get('sessions/:sessionId/chats/:chatId/messages')
  async getChatMessages(
    @Param('sessionId') sessionId: string,
    @Param('chatId') chatId: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.whatsappService.getChatMessages(sessionId, chatId, limit, page);
  }

  @Post('sessions/:sessionId/chats/:chatId/messages/read')
  async markMessagesAsRead(
    @Param('sessionId') sessionId: string,
    @Param('chatId') chatId: string,
  ) {
    await this.whatsappService.markMessagesAsRead(sessionId, chatId);
    return { message: 'Messages marked as read successfully' };
  }

  // ========== CONTACTS ENDPOINTS ==========
  @Get('sessions/:sessionId/contacts')
  async getContacts(@Param('sessionId') sessionId: string) {
    return this.whatsappService.getContacts(sessionId);
  }

  @Get('sessions/:sessionId/contacts/:contactId')
  async getContact(
    @Param('sessionId') sessionId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.whatsappService.getContact(sessionId, contactId);
  }

  // Rota genérica deve vir por último
  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    return this.whatsappService.getSession(sessionId);
  }
}
