import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageType, MessageDirection } from '@prisma/client';

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: MessagesService;

  const mockMessagesService = {
    findAll: jest.fn(),
    getConversations: jest.fn(),
    getConversationMessages: jest.fn(),
    markConversationAsRead: jest.fn(),
    create: jest.fn(),
  };

  const mockWhatsAppService = {
    sendText: jest.fn(),
    sendImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
        {
          provide: WhatsAppService,
          useValue: mockWhatsAppService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return messages', async () => {
      const user = { userId: '1' };
      const messages = [
        {
          id: '1',
          messageId: 'msg-1',
          type: MessageType.TEXT,
          direction: MessageDirection.INCOMING,
          userId: user.userId,
        },
      ];

      mockMessagesService.findAll.mockResolvedValue(messages);

      const result = await controller.findAll(user, 'session-1', '+1234567890');

      expect(result).toEqual(messages);
    });
  });

  describe('getConversations', () => {
    it('should return conversations', async () => {
      const user = { userId: '1' };
      const conversations = [
        {
          id: '1',
          userId: user.userId,
          sessionId: 'session-1',
          phoneNumber: '+1234567890',
        },
      ];

      mockMessagesService.getConversations.mockResolvedValue(conversations);

      const result = await controller.getConversations(user, 'session-1');

      expect(result).toEqual(conversations);
    });
  });

  describe('getConversationMessages', () => {
    it('should return conversation messages', async () => {
      const user = { userId: '1' };
      const phoneNumber = '+1234567890';
      const sessionId = 'session-1';
      const messages = [
        {
          id: '1',
          messageId: 'msg-1',
          type: MessageType.TEXT,
          direction: MessageDirection.INCOMING,
        },
      ];

      mockMessagesService.getConversationMessages.mockResolvedValue(messages);

      const result = await controller.getConversationMessages(user, phoneNumber, sessionId);

      expect(result).toEqual(messages);
    });
  });

  describe('markAsRead', () => {
    it('should mark conversation as read', async () => {
      const user = { userId: '1' };
      const phoneNumber = '+1234567890';
      const sessionId = 'session-1';

      mockMessagesService.markConversationAsRead.mockResolvedValue(undefined);

      const result = await controller.markAsRead(user, phoneNumber, sessionId);

      expect(result).toEqual({ message: 'Conversation marked as read' });
    });
  });

  describe('sendMessage', () => {
    it('should send text message', async () => {
      const user = { userId: '1' };
      const sendDto = {
        to: '+1234567890',
        type: MessageType.TEXT,
        text: 'Hello',
      };
      const sessionId = 'session-1';

      mockWhatsAppService.sendText.mockResolvedValue(undefined);
      mockMessagesService.create.mockResolvedValue({
        id: '1',
        messageId: 'msg-1',
        ...sendDto,
      });

      const result = await controller.sendMessage(user, sendDto, sessionId);

      expect(mockWhatsAppService.sendText).toHaveBeenCalledWith(
        sessionId,
        sendDto.to,
        sendDto.text,
      );
      expect(result).toBeDefined();
    });

    it('should send text message with empty text', async () => {
      const user = { userId: '1' };
      const sendDto = {
        to: '+1234567890',
        type: MessageType.TEXT,
        text: undefined,
      };
      const sessionId = 'session-1';

      mockWhatsAppService.sendText.mockResolvedValue(undefined);
      mockMessagesService.create.mockResolvedValue({
        id: '1',
        messageId: 'msg-1',
        ...sendDto,
      });

      await controller.sendMessage(user, sendDto, sessionId);

      expect(mockWhatsAppService.sendText).toHaveBeenCalledWith(
        sessionId,
        sendDto.to,
        '',
      );
    });

    it('should send image message', async () => {
      const user = { userId: '1' };
      const sendDto = {
        to: '+1234567890',
        type: MessageType.IMAGE,
        mediaUrl: 'https://example.com/image.jpg',
        caption: 'Check this out',
      };
      const sessionId = 'session-1';

      mockWhatsAppService.sendImage.mockResolvedValue(undefined);
      mockMessagesService.create.mockResolvedValue({
        id: '1',
        messageId: 'msg-1',
        ...sendDto,
      });

      const result = await controller.sendMessage(user, sendDto, sessionId);

      expect(mockWhatsAppService.sendImage).toHaveBeenCalledWith(
        sessionId,
        sendDto.to,
        sendDto.mediaUrl,
        sendDto.caption,
      );
      expect(result).toBeDefined();
    });

    it('should send image message with empty mediaUrl', async () => {
      const user = { userId: '1' };
      const sendDto = {
        to: '+1234567890',
        type: MessageType.IMAGE,
        mediaUrl: undefined,
        caption: 'Check this out',
      };
      const sessionId = 'session-1';

      mockWhatsAppService.sendImage.mockResolvedValue(undefined);
      mockMessagesService.create.mockResolvedValue({
        id: '1',
        messageId: 'msg-1',
        ...sendDto,
      });

      await controller.sendMessage(user, sendDto, sessionId);

      expect(mockWhatsAppService.sendImage).toHaveBeenCalledWith(
        sessionId,
        sendDto.to,
        '',
        sendDto.caption,
      );
    });

    it('should send message with other type (not TEXT or IMAGE)', async () => {
      const user = { userId: '1' };
      const sendDto = {
        to: '+1234567890',
        type: MessageType.FILE,
        text: 'File message',
      };
      const sessionId = 'session-1';

      mockMessagesService.create.mockResolvedValue({
        id: '1',
        messageId: 'msg-1',
        ...sendDto,
      });

      const result = await controller.sendMessage(user, sendDto, sessionId);

      expect(mockWhatsAppService.sendText).not.toHaveBeenCalled();
      expect(mockWhatsAppService.sendImage).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
