import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionStatus } from '@prisma/client';

describe('WhatsAppController', () => {
  let controller: WhatsAppController;
  let service: WhatsAppService;

  const mockWhatsAppService = {
    createSession: jest.fn(),
    getUserSessions: jest.fn(),
    getSession: jest.fn(),
    updateSessionStatus: jest.fn(),
    getQrCode: jest.fn(),
    stopSession: jest.fn(),
    deleteSession: jest.fn(),
    sendText: jest.fn(),
    sendImage: jest.fn(),
    sendFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsAppController],
      providers: [
        {
          provide: WhatsAppService,
          useValue: mockWhatsAppService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WhatsAppController>(WhatsAppController);
    service = module.get<WhatsAppService>(WhatsAppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session', async () => {
      const user = { userId: '1' };
      const createDto = {
        name: 'Test Session',
        sessionId: 'test-session',
      };

      const session = {
        id: '1',
        ...createDto,
        status: SessionStatus.STARTING,
        userId: user.userId,
      };

      mockWhatsAppService.createSession.mockResolvedValue(session);

      const result = await controller.createSession(user, createDto);

      expect(result).toEqual(session);
      expect(service.createSession).toHaveBeenCalledWith(
        user.userId,
        createDto.name,
        createDto.sessionId,
      );
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions', async () => {
      const user = { userId: '1' };
      const sessions = [
        {
          id: '1',
          name: 'Session 1',
          sessionId: 'session-1',
          status: SessionStatus.WORKING,
          userId: user.userId,
        },
      ];

      mockWhatsAppService.getUserSessions.mockResolvedValue(sessions);

      const result = await controller.getUserSessions(user);

      expect(result).toEqual(sessions);
    });
  });

  describe('getSession', () => {
    it('should return a session', async () => {
      const sessionId = 'session-1';
      const session = {
        id: '1',
        sessionId,
        name: 'Test Session',
        status: SessionStatus.WORKING,
        userId: '1',
      };

      mockWhatsAppService.getSession.mockResolvedValue(session);

      const result = await controller.getSession(sessionId);

      expect(result).toEqual(session);
      expect(service.getSession).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('getSessionStatus', () => {
    it('should update and return session status', async () => {
      const sessionId = 'session-1';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.WORKING,
      };

      mockWhatsAppService.updateSessionStatus.mockResolvedValue(session);

      const result = await controller.getSessionStatus(sessionId);

      expect(result).toEqual(session);
    });
  });

  describe('getQrCode', () => {
    it('should return QR code', async () => {
      const sessionId = 'session-1';
      const qrCode = 'qr-code-string';

      mockWhatsAppService.getQrCode.mockResolvedValue(qrCode);

      const result = await controller.getQrCode(sessionId);

      expect(result).toEqual({ qrCode });
    });
  });

  describe('stopSession', () => {
    it('should stop a session', async () => {
      const sessionId = 'session-1';

      mockWhatsAppService.stopSession.mockResolvedValue(undefined);

      const result = await controller.stopSession(sessionId);

      expect(result).toEqual({ message: 'Session stopped successfully' });
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      const sessionId = 'session-1';

      mockWhatsAppService.deleteSession.mockResolvedValue(undefined);

      const result = await controller.deleteSession(sessionId);

      expect(result).toEqual({ message: 'Session deleted successfully' });
    });
  });

  describe('sendText', () => {
    it('should send text message', async () => {
      const sessionId = 'session-1';
      const sendDto = {
        to: '+1234567890',
        text: 'Hello',
      };

      mockWhatsAppService.sendText.mockResolvedValue(undefined);

      const result = await controller.sendText(sessionId, sendDto);

      expect(result).toEqual({ message: 'Text sent successfully' });
      expect(service.sendText).toHaveBeenCalledWith(sessionId, sendDto.to, sendDto.text);
    });
  });

  describe('sendImage', () => {
    it('should send image message', async () => {
      const sessionId = 'session-1';
      const sendDto = {
        to: '+1234567890',
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Check this out',
      };

      mockWhatsAppService.sendImage.mockResolvedValue(undefined);

      const result = await controller.sendImage(sessionId, sendDto);

      expect(result).toEqual({ message: 'Image sent successfully' });
      expect(service.sendImage).toHaveBeenCalledWith(
        sessionId,
        sendDto.to,
        sendDto.imageUrl,
        sendDto.caption,
      );
    });
  });

  describe('sendFile', () => {
    it('should send file message', async () => {
      const sessionId = 'session-1';
      const sendDto = {
        to: '+1234567890',
        fileUrl: 'https://example.com/file.pdf',
        filename: 'document.pdf',
      };

      mockWhatsAppService.sendFile.mockResolvedValue(undefined);

      const result = await controller.sendFile(sessionId, sendDto);

      expect(result).toEqual({ message: 'File sent successfully' });
      expect(service.sendFile).toHaveBeenCalledWith(
        sessionId,
        sendDto.to,
        sendDto.fileUrl,
        sendDto.filename,
      );
    });
  });
});
