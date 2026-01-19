import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { ContactsService } from '../contacts/contacts.service';
import { MessageType, MessageDirection, MessageStatus } from '@prisma/client';

describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockWhatsAppService = {
    getSession: jest.fn(),
  };

  const mockContactsService = {
    findByPhoneNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WhatsAppService,
          useValue: mockWhatsAppService,
        },
        {
          provide: ContactsService,
          useValue: mockContactsService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a message', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const messageId = 'msg-1';
      const from = '+1234567890';
      const to = '+0987654321';
      const text = 'Hello';

      const message = {
        id: '1',
        messageId,
        type: MessageType.TEXT,
        direction: MessageDirection.INCOMING,
        status: MessageStatus.DELIVERED,
        text,
        from,
        to,
        sessionId,
        userId,
        contactId: null,
        mediaUrl: null,
        fileName: null,
        mimeType: null,
        metadata: null,
        quotedMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        contact: null,
        session: null,
      };

      mockContactsService.findByPhoneNumber.mockResolvedValue(null);
      mockPrismaService.message.create.mockResolvedValue(message);
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.conversation.create.mockResolvedValue({});

      const result = await service.create(
        userId,
        sessionId,
        messageId,
        MessageType.TEXT,
        MessageDirection.INCOMING,
        from,
        to,
        text,
      );

      expect(result).toEqual(message);
    });

    it('should create message with existing contact', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const messageId = 'msg-1';
      const from = '+1234567890';
      const to = '+0987654321';
      const text = 'Hello';
      const contact = {
        id: 'contact-1',
        phoneNumber: from,
        userId,
      };

      const message = {
        id: '1',
        messageId,
        type: MessageType.TEXT,
        direction: MessageDirection.INCOMING,
        status: MessageStatus.DELIVERED,
        text,
        from,
        to,
        sessionId,
        userId,
        contactId: contact.id,
        mediaUrl: null,
        fileName: null,
        mimeType: null,
        metadata: null,
        quotedMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        contact: null,
        session: null,
      };

      mockContactsService.findByPhoneNumber.mockResolvedValue(contact);
      mockPrismaService.message.create.mockResolvedValue(message);
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.conversation.create.mockResolvedValue({});

      const result = await service.create(
        userId,
        sessionId,
        messageId,
        MessageType.TEXT,
        MessageDirection.INCOMING,
        from,
        to,
        text,
      );

      expect(result.contactId).toBe(contact.id);
    });

    it('should create message with mediaUrl', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const messageId = 'msg-1';
      const from = '+1234567890';
      const to = '+0987654321';
      const mediaUrl = 'https://example.com/image.jpg';

      const message = {
        id: '1',
        messageId,
        type: MessageType.IMAGE,
        direction: MessageDirection.INCOMING,
        status: MessageStatus.DELIVERED,
        text: null,
        from,
        to,
        sessionId,
        userId,
        contactId: null,
        mediaUrl,
        fileName: null,
        mimeType: null,
        metadata: null,
        quotedMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        contact: null,
        session: null,
      };

      mockContactsService.findByPhoneNumber.mockResolvedValue(null);
      mockPrismaService.message.create.mockResolvedValue(message);
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.conversation.create.mockResolvedValue({});

      const result = await service.create(
        userId,
        sessionId,
        messageId,
        MessageType.IMAGE,
        MessageDirection.INCOMING,
        from,
        to,
        undefined,
        mediaUrl,
      );

      expect(result.mediaUrl).toBe(mediaUrl);
      expect(result.type).toBe(MessageType.IMAGE);
    });

    it('should create message with metadata', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const messageId = 'msg-1';
      const from = '+1234567890';
      const to = '+0987654321';
      const text = 'Hello';
      const metadata = { isGroup: true, groupId: 'group-123' };

      const message = {
        id: '1',
        messageId,
        type: MessageType.TEXT,
        direction: MessageDirection.INCOMING,
        status: MessageStatus.DELIVERED,
        text,
        from,
        to,
        sessionId,
        userId,
        contactId: null,
        mediaUrl: null,
        fileName: null,
        mimeType: null,
        metadata,
        quotedMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        contact: null,
        session: null,
      };

      mockContactsService.findByPhoneNumber.mockResolvedValue(null);
      mockPrismaService.message.create.mockResolvedValue(message);
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.conversation.create.mockResolvedValue({});

      const result = await service.create(
        userId,
        sessionId,
        messageId,
        MessageType.TEXT,
        MessageDirection.INCOMING,
        from,
        to,
        text,
        undefined,
        metadata,
      );

      expect(result.metadata).toEqual(metadata);
    });

    it('should update existing conversation', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const messageId = 'msg-1';
      const from = '+1234567890';
      const to = '+0987654321';
      const text = 'Hello';

      const message = {
        id: '1',
        messageId,
        type: MessageType.TEXT,
        direction: MessageDirection.INCOMING,
        status: MessageStatus.DELIVERED,
        text,
        from,
        to,
        sessionId,
        userId,
        contactId: null,
        mediaUrl: null,
        fileName: null,
        mimeType: null,
        metadata: null,
        quotedMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        contact: null,
        session: null,
      };

      const conversation = {
        id: 'conv-1',
        userId,
        sessionId,
        phoneNumber: from,
        contactId: null,
        unreadCount: 2,
      };

      mockContactsService.findByPhoneNumber.mockResolvedValue(null);
      mockPrismaService.message.create.mockResolvedValue(message);
      mockPrismaService.conversation.findFirst.mockResolvedValue(conversation);
      mockPrismaService.conversation.update.mockResolvedValue({
        ...conversation,
        lastMessage: text,
        unreadCount: 3,
      });

      await service.create(
        userId,
        sessionId,
        messageId,
        MessageType.TEXT,
        MessageDirection.INCOMING,
        from,
        to,
        text,
      );

      expect(prisma.conversation.update).toHaveBeenCalled();
    });

    it('should update conversation with different contactId and increment unreadCount', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const messageId = 'msg-1';
      const from = '+1234567890';
      const to = '+0987654321';
      const text = 'Hello';
      const contact = {
        id: 'contact-1',
        phoneNumber: from,
        userId,
      };

      const message = {
        id: '1',
        messageId,
        type: MessageType.TEXT,
        direction: MessageDirection.INCOMING,
        status: MessageStatus.DELIVERED,
        text,
        from,
        to,
        sessionId,
        userId,
        contactId: contact.id,
        mediaUrl: null,
        fileName: null,
        mimeType: null,
        metadata: null,
        quotedMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        contact: null,
        session: null,
      };

      const conversation = {
        id: 'conv-1',
        userId,
        sessionId,
        phoneNumber: from,
        contactId: 'old-contact-id',
        unreadCount: 2,
      };

      mockContactsService.findByPhoneNumber.mockResolvedValue(contact);
      mockPrismaService.message.create.mockResolvedValue(message);
      mockPrismaService.conversation.findFirst.mockResolvedValue(conversation);
      mockPrismaService.conversation.update.mockResolvedValue({
        ...conversation,
        contactId: contact.id,
        unreadCount: 3,
      });

      await service.create(
        userId,
        sessionId,
        messageId,
        MessageType.TEXT,
        MessageDirection.INCOMING,
        from,
        to,
        text,
      );

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: conversation.id },
        data: expect.objectContaining({
          contactId: contact.id,
          unreadCount: 3,
        }),
      });
    });

    it('should update conversation with same contactId and keep unreadCount', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const messageId = 'msg-1';
      const from = '+1234567890';
      const to = '+0987654321';
      const text = 'Hello';
      const contact = {
        id: 'contact-1',
        phoneNumber: from,
        userId,
      };

      const message = {
        id: '1',
        messageId,
        type: MessageType.TEXT,
        direction: MessageDirection.INCOMING,
        status: MessageStatus.DELIVERED,
        text,
        from,
        to,
        sessionId,
        userId,
        contactId: contact.id,
        mediaUrl: null,
        fileName: null,
        mimeType: null,
        metadata: null,
        quotedMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        contact: null,
        session: null,
      };

      const conversation = {
        id: 'conv-1',
        userId,
        sessionId,
        phoneNumber: from,
        contactId: contact.id,
        unreadCount: 2,
      };

      mockContactsService.findByPhoneNumber.mockResolvedValue(contact);
      mockPrismaService.message.create.mockResolvedValue(message);
      mockPrismaService.conversation.findFirst.mockResolvedValue(conversation);
      mockPrismaService.conversation.update.mockResolvedValue({
        ...conversation,
        unreadCount: 2,
      });

      await service.create(
        userId,
        sessionId,
        messageId,
        MessageType.TEXT,
        MessageDirection.INCOMING,
        from,
        to,
        text,
      );

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: conversation.id },
        data: expect.objectContaining({
          contactId: contact.id,
          unreadCount: 2,
        }),
      });
    });

    it('should create outgoing message', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const messageId = 'msg-1';
      const from = '';
      const to = '+1234567890';
      const text = 'Hello';

      const message = {
        id: '1',
        messageId,
        type: MessageType.TEXT,
        direction: MessageDirection.OUTGOING,
        status: MessageStatus.PENDING,
        text,
        from,
        to,
        sessionId,
        userId,
        contactId: null,
        mediaUrl: null,
        fileName: null,
        mimeType: null,
        metadata: null,
        quotedMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        contact: null,
        session: null,
      };

      mockContactsService.findByPhoneNumber.mockResolvedValue(null);
      mockPrismaService.message.create.mockResolvedValue(message);
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.conversation.create.mockResolvedValue({});

      const result = await service.create(
        userId,
        sessionId,
        messageId,
        MessageType.TEXT,
        MessageDirection.OUTGOING,
        from,
        to,
        text,
      );

      expect(result.direction).toBe(MessageDirection.OUTGOING);
      expect(result.status).toBe(MessageStatus.PENDING);
    });

    it('should use mediaUrl as lastMessage when text is not provided', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const messageId = 'msg-1';
      const from = '+1234567890';
      const to = '+0987654321';
      const mediaUrl = 'https://example.com/image.jpg';

      const message = {
        id: '1',
        messageId,
        type: MessageType.IMAGE,
        direction: MessageDirection.INCOMING,
        status: MessageStatus.DELIVERED,
        text: null,
        from,
        to,
        sessionId,
        userId,
        contactId: null,
        mediaUrl,
        fileName: null,
        mimeType: null,
        metadata: null,
        quotedMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        contact: null,
        session: null,
      };

      mockContactsService.findByPhoneNumber.mockResolvedValue(null);
      mockPrismaService.message.create.mockResolvedValue(message);
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.conversation.create.mockResolvedValue({});

      await service.create(
        userId,
        sessionId,
        messageId,
        MessageType.IMAGE,
        MessageDirection.INCOMING,
        from,
        to,
        undefined,
        mediaUrl,
      );

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          lastMessage: mediaUrl,
        }),
      });
    });

    it('should use empty string when neither text nor mediaUrl is provided', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const messageId = 'msg-1';
      const from = '+1234567890';
      const to = '+0987654321';

      const message = {
        id: '1',
        messageId,
        type: MessageType.LOCATION,
        direction: MessageDirection.INCOMING,
        status: MessageStatus.DELIVERED,
        text: null,
        from,
        to,
        sessionId,
        userId,
        contactId: null,
        mediaUrl: null,
        fileName: null,
        mimeType: null,
        metadata: null,
        quotedMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        contact: null,
        session: null,
      };

      mockContactsService.findByPhoneNumber.mockResolvedValue(null);
      mockPrismaService.message.create.mockResolvedValue(message);
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.conversation.create.mockResolvedValue({});

      await service.create(
        userId,
        sessionId,
        messageId,
        MessageType.LOCATION,
        MessageDirection.INCOMING,
        from,
        to,
      );

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          lastMessage: '',
        }),
      });
    });
  });

  describe('findById', () => {
    it('should return a message by id', async () => {
      const id = '1';
      const userId = '1';
      const message = {
        id,
        messageId: 'msg-1',
        type: MessageType.TEXT,
        direction: MessageDirection.INCOMING,
        status: MessageStatus.DELIVERED,
        userId,
        contact: null,
        session: null,
      };

      mockPrismaService.message.findFirst.mockResolvedValue(message);

      const result = await service.findById(id, userId);

      expect(result).toEqual(message);
    });

    it('should throw NotFoundException if message not found', async () => {
      mockPrismaService.message.findFirst.mockResolvedValue(null);

      await expect(service.findById('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update message status', async () => {
      const messageId = 'msg-1';
      const message = {
        id: '1',
        messageId,
        status: MessageStatus.PENDING,
      };

      mockPrismaService.message.findFirst.mockResolvedValue(message);
      mockPrismaService.message.update.mockResolvedValue({
        ...message,
        status: MessageStatus.SENT,
      });

      const result = await service.updateStatus(messageId, MessageStatus.SENT);

      expect(result.status).toBe(MessageStatus.SENT);
    });
  });

  describe('findAll', () => {
    it('should return all messages for user', async () => {
      const userId = '1';
      const messages = [
        {
          id: '1',
          messageId: 'msg-1',
          type: MessageType.TEXT,
          direction: MessageDirection.INCOMING,
          userId,
        },
      ];

      mockPrismaService.message.findMany.mockResolvedValue(messages);

      const result = await service.findAll(userId);

      expect(result).toEqual(messages);
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { contact: true, session: true },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should filter messages by sessionId', async () => {
      const userId = '1';
      const sessionId = 'session-1';

      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.findAll(userId, sessionId);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { userId, sessionId },
        include: { contact: true, session: true },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should filter messages by phoneNumber', async () => {
      const userId = '1';
      const phoneNumber = '+1234567890';

      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.findAll(userId, undefined, phoneNumber);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { userId, from: phoneNumber },
        include: { contact: true, session: true },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return messages with filters', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const phoneNumber = '+1234567890';

      const messages = [
        {
          id: '1',
          messageId: 'msg-1',
          type: MessageType.TEXT,
          direction: MessageDirection.INCOMING,
          userId,
          sessionId,
          from: phoneNumber,
        },
      ];

      mockPrismaService.message.findMany.mockResolvedValue(messages);

      const result = await service.findAll(userId, sessionId, phoneNumber);

      expect(result).toEqual(messages);
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { userId, sessionId, from: phoneNumber },
        include: { contact: true, session: true },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('getConversations', () => {
    it('should return conversations', async () => {
      const userId = '1';
      const conversations = [
        {
          id: '1',
          userId,
          sessionId: 'session-1',
          phoneNumber: '+1234567890',
          lastMessage: 'Hello',
          unreadCount: 2,
        },
      ];

      mockPrismaService.conversation.findMany.mockResolvedValue(conversations);

      const result = await service.getConversations(userId);

      expect(result).toEqual(conversations);
    });

    it('should filter conversations by sessionId', async () => {
      const userId = '1';
      const sessionId = 'session-1';

      mockPrismaService.conversation.findMany.mockResolvedValue([]);

      await service.getConversations(userId, sessionId);

      expect(prisma.conversation.findMany).toHaveBeenCalledWith({
        where: { userId, sessionId, isArchived: false },
        include: { contact: true, session: true },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('getConversationMessages', () => {
    it('should return conversation messages', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const phoneNumber = '+1234567890';

      const messages = [
        {
          id: '1',
          messageId: 'msg-1',
          type: MessageType.TEXT,
          direction: MessageDirection.INCOMING,
          userId,
          sessionId,
          from: phoneNumber,
        },
      ];

      mockPrismaService.message.findMany.mockResolvedValue(messages);

      const result = await service.getConversationMessages(userId, sessionId, phoneNumber);

      expect(result).toEqual(messages);
    });
  });

  describe('markConversationAsRead', () => {
    it('should mark conversation as read', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const phoneNumber = '+1234567890';

      const conversation = {
        id: '1',
        userId,
        sessionId,
        phoneNumber,
        unreadCount: 5,
      };

      mockPrismaService.conversation.findFirst.mockResolvedValue(conversation);
      mockPrismaService.conversation.update.mockResolvedValue({
        ...conversation,
        unreadCount: 0,
      });

      await service.markConversationAsRead(userId, sessionId, phoneNumber);

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: conversation.id },
        data: { unreadCount: 0 },
      });
    });

    it('should handle conversation not found gracefully', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const phoneNumber = '+1234567890';

      mockPrismaService.conversation.findFirst.mockResolvedValue(null);

      await service.markConversationAsRead(userId, sessionId, phoneNumber);

      expect(prisma.conversation.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update message status', async () => {
      const messageId = 'msg-1';
      const status = MessageStatus.DELIVERED;
      const message = {
        id: '1',
        messageId,
        status: MessageStatus.PENDING,
      };

      mockPrismaService.message.findFirst.mockResolvedValue(message);
      mockPrismaService.message.update.mockResolvedValue({
        ...message,
        status,
      });

      const result = await service.updateStatus(messageId, status);

      expect(result.status).toBe(status);
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: message.id },
        data: { status },
      });
    });

    it('should throw NotFoundException if message not found', async () => {
      mockPrismaService.message.findFirst.mockResolvedValue(null);

      await expect(service.updateStatus('non-existent', MessageStatus.DELIVERED)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
