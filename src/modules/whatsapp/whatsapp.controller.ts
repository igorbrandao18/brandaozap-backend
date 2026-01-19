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

  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    return this.whatsappService.getSession(sessionId);
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

  @Post('sessions/:sessionId/stop')
  async stopSession(@Param('sessionId') sessionId: string) {
    await this.whatsappService.stopSession(sessionId);
    return { message: 'Session stopped successfully' };
  }

  @Delete('sessions/:sessionId')
  async deleteSession(@Param('sessionId') sessionId: string) {
    await this.whatsappService.deleteSession(sessionId);
    return { message: 'Session deleted successfully' };
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

  @Get('sessions/:sessionId/chats/count')
  async getChatsCount(@Param('sessionId') sessionId: string) {
    const count = await this.whatsappService.getChatsCount(sessionId);
    return { count };
  }
}
