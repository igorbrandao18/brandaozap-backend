import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { ContactsService } from '../contacts/contacts.service';
import { Message, MessageType, MessageDirection, MessageStatus, Prisma } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
    private readonly contactsService: ContactsService,
  ) {}

  async create(
    userId: string,
    sessionId: string,
    messageId: string,
    type: MessageType,
    direction: MessageDirection,
    from: string,
    to: string,
    text?: string,
    mediaUrl?: string,
    metadata?: Record<string, any>,
  ): Promise<Message> {
    // Verificar se existe contato
    let contact = await this.contactsService.findByPhoneNumber(
      direction === MessageDirection.INCOMING ? from : to,
      userId,
    );

    const message = await this.prisma.message.create({
      data: {
        messageId,
        type,
        direction,
        status:
          direction === MessageDirection.INCOMING
            ? MessageStatus.DELIVERED
            : MessageStatus.PENDING,
        text,
        mediaUrl,
        metadata,
        from,
        to,
        sessionId,
        contactId: contact?.id,
        userId,
      },
      include: { contact: true, session: true },
    });

    // Atualizar ou criar conversa
    await this.updateOrCreateConversation(
      userId,
      sessionId,
      direction === MessageDirection.INCOMING ? from : to,
      contact?.id,
      text || mediaUrl || '',
      type,
    );

    return message;
  }

  async findAll(
    userId: string,
    sessionId?: string,
    phoneNumber?: string,
  ): Promise<Message[]> {
    const where: Prisma.MessageWhereInput = { userId };
    if (sessionId) where.sessionId = sessionId;
    if (phoneNumber) where.from = phoneNumber;

    return this.prisma.message.findMany({
      where,
      include: { contact: true, session: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string, userId: string): Promise<Message> {
    const message = await this.prisma.message.findFirst({
      where: { id, userId },
      include: { contact: true, session: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async getConversations(
    userId: string,
    sessionId?: string,
  ): Promise<any[]> {
    const where: Prisma.ConversationWhereInput = { userId, isArchived: false };
    if (sessionId) where.sessionId = sessionId;

    return this.prisma.conversation.findMany({
      where,
      include: { contact: true, session: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversationMessages(
    userId: string,
    sessionId: string,
    phoneNumber: string,
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        userId,
        sessionId,
        from: phoneNumber,
      },
      include: { contact: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStatus(
    messageId: string,
    status: MessageStatus,
  ): Promise<Message> {
    const message = await this.prisma.message.findFirst({
      where: { messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return this.prisma.message.update({
      where: { id: message.id },
      data: { status },
    });
  }

  async markConversationAsRead(
    userId: string,
    sessionId: string,
    phoneNumber: string,
  ): Promise<void> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { userId, sessionId, phoneNumber },
    });

    if (conversation) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { unreadCount: 0 },
      });
    }
  }

  private async updateOrCreateConversation(
    userId: string,
    sessionId: string,
    phoneNumber: string,
    contactId: string | undefined,
    lastMessage: string,
    lastMessageType: string,
  ): Promise<void> {
    let conversation = await this.prisma.conversation.findFirst({
      where: { userId, sessionId, phoneNumber },
    });

    if (conversation) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage,
          lastMessageType,
          contactId,
          unreadCount: conversation.contactId !== contactId ? conversation.unreadCount + 1 : conversation.unreadCount,
        },
      });
    } else {
      await this.prisma.conversation.create({
        data: {
          userId,
          sessionId,
          phoneNumber,
          contactId,
          lastMessage,
          lastMessageType,
          unreadCount: 1,
        },
      });
    }
  }
}
