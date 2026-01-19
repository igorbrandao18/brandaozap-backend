import { Test, TestingModule } from '@nestjs/testing';
import { WahaWebhookController } from './waha-webhook.controller';
import { MessagesService } from '../messages.service';
import { MessageType, MessageDirection } from '@prisma/client';

describe('WahaWebhookController', () => {
  let controller: WahaWebhookController;
  let messagesService: MessagesService;

  const mockMessagesService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WahaWebhookController],
      providers: [
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
      ],
    }).compile();

    controller = module.get<WahaWebhookController>(WahaWebhookController);
    messagesService = module.get<MessagesService>(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMessage', () => {
    it('should handle incoming text message', async () => {
      const sessionId = 'session-1';
      const payload = {
        id: 'msg-1',
        from: '+1234567890',
        to: '+0987654321',
        text: 'Hello',
        type: 'text',
        timestamp: Date.now(),
      };

      mockMessagesService.create.mockResolvedValue({
        id: '1',
        messageId: payload.id,
        type: MessageType.TEXT,
        direction: MessageDirection.INCOMING,
      });

      const result = await controller.handleMessage(payload, sessionId);

      expect(result).toEqual({ success: true });
      expect(messagesService.create).toHaveBeenCalledWith(
        'temp-user-id',
        sessionId,
        payload.id,
        MessageType.TEXT,
        MessageDirection.INCOMING,
        payload.from,
        payload.to,
        payload.text,
        undefined,
        expect.objectContaining({
          timestamp: payload.timestamp,
        }),
      );
    });

    it('should handle incoming image message', async () => {
      const sessionId = 'session-1';
      const payload = {
        id: 'msg-2',
        from: '+1234567890',
        to: '+0987654321',
        type: 'image',
        mediaUrl: 'https://example.com/image.jpg',
        timestamp: Date.now(),
      };

      mockMessagesService.create.mockResolvedValue({
        id: '2',
        messageId: payload.id,
        type: MessageType.IMAGE,
      });

      const result = await controller.handleMessage(payload, sessionId);

      expect(result).toEqual({ success: true });
      expect(messagesService.create).toHaveBeenCalledWith(
        'temp-user-id',
        sessionId,
        payload.id,
        MessageType.IMAGE,
        MessageDirection.INCOMING,
        payload.from,
        payload.to,
        undefined,
        payload.mediaUrl,
        expect.any(Object),
      );
    });

    it('should handle message with alternative field names', async () => {
      const sessionId = 'session-1';
      const payload = {
        messageId: 'msg-3',
        fromNumber: '+1234567890',
        toNumber: '+0987654321',
        body: 'Hello world',
        type: 'text',
      };

      mockMessagesService.create.mockResolvedValue({
        id: '3',
        messageId: payload.messageId,
      });

      const result = await controller.handleMessage(payload, sessionId);

      expect(result).toEqual({ success: true });
      expect(messagesService.create).toHaveBeenCalledWith(
        'temp-user-id',
        sessionId,
        payload.messageId,
        MessageType.TEXT,
        MessageDirection.INCOMING,
        payload.fromNumber,
        payload.toNumber,
        payload.body,
        undefined,
        expect.any(Object),
      );
    });

    it('should handle group message', async () => {
      const sessionId = 'session-1';
      const payload = {
        id: 'msg-4',
        from: '+1234567890',
        to: '+0987654321',
        text: 'Group message',
        type: 'text',
        isGroup: true,
        groupId: 'group-123',
      };

      mockMessagesService.create.mockResolvedValue({
        id: '4',
        messageId: payload.id,
      });

      const result = await controller.handleMessage(payload, sessionId);

      expect(result).toEqual({ success: true });
      expect(messagesService.create).toHaveBeenCalledWith(
        'temp-user-id',
        sessionId,
        payload.id,
        MessageType.TEXT,
        MessageDirection.INCOMING,
        payload.from,
        payload.to,
        payload.text,
        undefined,
        expect.objectContaining({
          isGroup: true,
          groupId: payload.groupId,
        }),
      );
    });

    it('should handle error gracefully', async () => {
      const sessionId = 'session-1';
      const payload = {
        id: 'msg-5',
        from: '+1234567890',
        to: '+0987654321',
        text: 'Error test',
        type: 'text',
      };

      const error = new Error('Database error');
      mockMessagesService.create.mockRejectedValue(error);

      const result = await controller.handleMessage(payload, sessionId);

      expect(result).toEqual({
        success: false,
        error: error.message,
      });
    });

    it('should map different message types correctly', async () => {
      const sessionId = 'session-1';
      const typeMap = [
        { input: 'video', expected: MessageType.VIDEO },
        { input: 'audio', expected: MessageType.AUDIO },
        { input: 'document', expected: MessageType.DOCUMENT },
        { input: 'location', expected: MessageType.LOCATION },
        { input: 'contact', expected: MessageType.CONTACT },
        { input: 'unknown', expected: MessageType.TEXT },
      ];

      for (const { input, expected } of typeMap) {
        const payload = {
          id: `msg-${input}`,
          from: '+1234567890',
          to: '+0987654321',
          type: input,
        };

        mockMessagesService.create.mockResolvedValue({
          id: `1-${input}`,
          type: expected,
        });

        await controller.handleMessage(payload, sessionId);

        expect(messagesService.create).toHaveBeenCalledWith(
          'temp-user-id',
          sessionId,
          payload.id,
          expected,
          MessageDirection.INCOMING,
          payload.from,
          payload.to,
          undefined,
          undefined,
          expect.any(Object),
        );
      }
    });
  });
});
