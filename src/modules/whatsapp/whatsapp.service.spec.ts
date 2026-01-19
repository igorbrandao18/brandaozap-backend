import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WahaClient } from './waha/waha.client';
import { UsersService } from '../users/users.service';
import { SessionStatus } from '@prisma/client';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let prisma: PrismaService;
  let wahaClient: WahaClient;

  const mockPrismaService = {
    whatsAppSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockWahaClient = {
    createSession: jest.fn(),
    getSessionStatus: jest.fn(),
    getQrCode: jest.fn(),
    stopSession: jest.fn(),
    sendText: jest.fn(),
    sendImage: jest.fn(),
    sendFile: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WahaClient,
          useValue: mockWahaClient,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<WhatsAppService>(WhatsAppService);
    prisma = module.get<PrismaService>(PrismaService);
    wahaClient = module.get<WahaClient>(WahaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const userId = '1';
      const name = 'Test Session';
      const sessionId = 'test-session';

      const session = {
        id: '1',
        name,
        sessionId,
        status: SessionStatus.STARTING,
        userId,
        isActive: true,
        qrCode: null,
        phoneNumber: null,
        profileName: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findById.mockResolvedValue({ id: userId });
      // First call: check if session exists (should return null)
      // Second call: get session after creation (for updateSessionStatus)
      mockPrismaService.whatsAppSession.findFirst
        .mockResolvedValueOnce(null) // Check existing
        .mockResolvedValueOnce({ ...session, user: { id: userId, name: 'User' } }); // Get after create
      mockPrismaService.whatsAppSession.create.mockResolvedValue(session);
      mockWahaClient.createSession.mockResolvedValue(undefined);
      mockWahaClient.getSessionStatus.mockResolvedValue({ status: 'QRCODE', qr: 'qr-code' });
      mockPrismaService.whatsAppSession.update.mockResolvedValue({ ...session, qrCode: 'qr-code' });

      const result = await service.createSession(userId, name, sessionId);

      expect(result).toBeDefined();
      expect(wahaClient.createSession).toHaveBeenCalledWith(sessionId);
    });

    it('should throw BadRequestException if session ID exists', async () => {
      const userId = '1';
      const name = 'Test Session';
      const sessionId = 'existing-session';

      mockUsersService.findById.mockResolvedValue({ id: userId });
      mockPrismaService.whatsAppSession.findFirst.mockResolvedValue({ id: '1', sessionId });

      await expect(service.createSession(userId, name, sessionId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getSession', () => {
    it('should return a session', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        name: 'Test Session',
        status: SessionStatus.WORKING,
        userId: '1',
        user: { id: '1', name: 'User' },
      };

      mockPrismaService.whatsAppSession.findFirst.mockResolvedValue(session);

      const result = await service.getSession(sessionId);

      expect(result).toEqual(session);
    });

    it('should throw NotFoundException if session not found', async () => {
      mockPrismaService.whatsAppSession.findFirst.mockResolvedValue(null);

      await expect(service.getSession('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions', async () => {
      const userId = '1';
      const sessions = [
        {
          id: '1',
          sessionId: 'session-1',
          name: 'Session 1',
          status: SessionStatus.WORKING,
          userId,
        },
        {
          id: '2',
          sessionId: 'session-2',
          name: 'Session 2',
          status: SessionStatus.QRCODE,
          userId,
        },
      ];

      mockPrismaService.whatsAppSession.findMany.mockResolvedValue(sessions);

      const result = await service.getUserSessions(userId);

      expect(result).toEqual(sessions);
      expect(prisma.whatsAppSession.findMany).toHaveBeenCalledWith({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createSession', () => {
    it('should handle error and update status to FAILED', async () => {
      const userId = '1';
      const name = 'Test Session';
      const sessionId = 'test-session';

      const session = {
        id: '1',
        name,
        sessionId,
        status: SessionStatus.STARTING,
        userId,
        isActive: true,
        qrCode: null,
        phoneNumber: null,
        profileName: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findById.mockResolvedValue({ id: userId });
      mockPrismaService.whatsAppSession.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(session);
      mockPrismaService.whatsAppSession.create.mockResolvedValue(session);
      mockWahaClient.createSession.mockRejectedValue(new Error('WAHA error'));
      mockPrismaService.whatsAppSession.update.mockResolvedValue({
        ...session,
        status: SessionStatus.FAILED,
      });

      await expect(service.createSession(userId, name, sessionId)).rejects.toThrow();

      expect(prisma.whatsAppSession.update).toHaveBeenCalledWith({
        where: { id: session.id },
        data: { status: SessionStatus.FAILED },
      });
    });
  });

  describe('updateSessionStatus', () => {
    it('should update status to WORKING', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.STARTING,
        userId: '1',
        user: { id: '1', name: 'User' },
      };

      const wahaStatus = {
        status: 'WORKING',
        me: {
          id: '+1234567890',
          name: 'Test User',
          pushname: 'Test',
        },
      };

      mockPrismaService.whatsAppSession.findFirst
        .mockResolvedValueOnce(session)
        .mockResolvedValueOnce(session);
      mockWahaClient.getSessionStatus.mockResolvedValue(wahaStatus);
      mockPrismaService.whatsAppSession.update.mockResolvedValue({
        ...session,
        status: SessionStatus.WORKING,
        phoneNumber: wahaStatus.me.id,
        profileName: wahaStatus.me.name,
      });

      const result = await service.updateSessionStatus(sessionId);

      expect(result.status).toBe(SessionStatus.WORKING);
    });

    it('should update status to WORKING with pushname if name not available', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.STARTING,
        userId: '1',
        user: { id: '1', name: 'User' },
      };

      const wahaStatus = {
        status: 'WORKING',
        me: {
          id: '+1234567890',
          name: undefined,
          pushname: 'Push Name',
        },
      };

      mockPrismaService.whatsAppSession.findFirst
        .mockResolvedValueOnce(session)
        .mockResolvedValueOnce(session);
      mockWahaClient.getSessionStatus.mockResolvedValue(wahaStatus);
      mockPrismaService.whatsAppSession.update.mockResolvedValue({
        ...session,
        status: SessionStatus.WORKING,
        phoneNumber: wahaStatus.me.id,
        profileName: wahaStatus.me.pushname,
      });

      const result = await service.updateSessionStatus(sessionId);

      expect(result.profileName).toBe('Push Name');
    });

    it('should update status to QRCODE', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.STARTING,
        userId: '1',
        user: { id: '1', name: 'User' },
      };

      const wahaStatus = {
        status: 'QRCODE',
        qr: 'qr-code-string',
      };

      mockPrismaService.whatsAppSession.findFirst
        .mockResolvedValueOnce(session)
        .mockResolvedValueOnce(session);
      mockWahaClient.getSessionStatus.mockResolvedValue(wahaStatus);
      mockPrismaService.whatsAppSession.update.mockResolvedValue({
        ...session,
        status: SessionStatus.QRCODE,
        qrCode: wahaStatus.qr,
      });

      const result = await service.updateSessionStatus(sessionId);

      expect(result.status).toBe(SessionStatus.QRCODE);
    });

    it('should update status to FAILED', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.STARTING,
        userId: '1',
        user: { id: '1', name: 'User' },
      };

      const wahaStatus = {
        status: 'FAILED',
      };

      mockPrismaService.whatsAppSession.findFirst
        .mockResolvedValueOnce(session)
        .mockResolvedValueOnce(session);
      mockWahaClient.getSessionStatus.mockResolvedValue(wahaStatus);
      mockPrismaService.whatsAppSession.update.mockResolvedValue({
        ...session,
        status: SessionStatus.FAILED,
      });

      const result = await service.updateSessionStatus(sessionId);

      expect(result.status).toBe(SessionStatus.FAILED);
    });

    it('should update status to STOPPED', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.WORKING,
        userId: '1',
        user: { id: '1', name: 'User' },
      };

      const wahaStatus = {
        status: 'STOPPED',
      };

      mockPrismaService.whatsAppSession.findFirst
        .mockResolvedValueOnce(session)
        .mockResolvedValueOnce(session);
      mockWahaClient.getSessionStatus.mockResolvedValue(wahaStatus);
      mockPrismaService.whatsAppSession.update.mockResolvedValue({
        ...session,
        status: SessionStatus.STOPPED,
      });

      const result = await service.updateSessionStatus(sessionId);

      expect(result.status).toBe(SessionStatus.STOPPED);
    });
  });

  describe('getQrCode', () => {
    // Skipping this test temporarily due to mock complexity with getSession
    // The functionality is tested in the "should fetch and update QR code if not cached" test
    it.skip('should return cached QR code if available', async () => {
      const sessionId = 'test-session';
      const sessionWithUser = {
        id: '1',
        sessionId,
        status: SessionStatus.QRCODE,
        qrCode: 'cached-qr-code',
        userId: '1',
        name: 'Test Session',
        isActive: true,
        phoneNumber: null,
        profileName: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: '1', name: 'User', email: 'user@example.com', password: 'hash', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      };

      mockPrismaService.whatsAppSession.findFirst.mockResolvedValue(sessionWithUser);

      const result = await service.getQrCode(sessionId);

      expect(result).toBe('cached-qr-code');
      expect(wahaClient.getQrCode).not.toHaveBeenCalled();
    });

    it('should fetch and update QR code if not cached', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.STARTING,
        qrCode: null,
        userId: '1',
        name: 'Test Session',
        isActive: true,
        phoneNumber: null,
        profileName: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: '1', name: 'User', email: 'user@example.com', password: 'hash', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      };

      const qrCode = 'new-qr-code';

      mockPrismaService.whatsAppSession.findFirst.mockResolvedValue(session);
      mockWahaClient.getQrCode.mockResolvedValue(qrCode);
      mockPrismaService.whatsAppSession.update.mockResolvedValue({
        ...session,
        qrCode,
        status: SessionStatus.QRCODE,
      });

      const result = await service.getQrCode(sessionId);

      expect(result).toBe(qrCode);
      expect(wahaClient.getQrCode).toHaveBeenCalledWith(sessionId);
    });

    it('should return cached QR code when status is QRCODE and qrCode exists', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.QRCODE,
        qrCode: 'cached-qr-code',
        userId: '1',
        name: 'Test Session',
        isActive: true,
        phoneNumber: null,
        profileName: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: '1', name: 'User', email: 'user@example.com', password: 'hash', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      };

      // Reset mocks to ensure clean state
      mockPrismaService.whatsAppSession.findFirst.mockReset();
      mockWahaClient.getQrCode.mockReset();
      mockPrismaService.whatsAppSession.update.mockReset();
      
      mockPrismaService.whatsAppSession.findFirst.mockResolvedValueOnce(session);

      const result = await service.getQrCode(sessionId);

      expect(result).toBe('cached-qr-code');
      expect(wahaClient.getQrCode).not.toHaveBeenCalled();
      expect(prisma.whatsAppSession.update).not.toHaveBeenCalled();
    });
  });

  describe('stopSession', () => {
    it('should stop a session', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.WORKING,
        userId: '1',
        name: 'Test Session',
        isActive: true,
        qrCode: null,
        phoneNumber: null,
        profileName: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: '1', name: 'User', email: 'user@example.com', password: 'hash', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      };

      mockPrismaService.whatsAppSession.findFirst.mockResolvedValue(session);
      mockWahaClient.stopSession.mockResolvedValue(undefined);
      mockPrismaService.whatsAppSession.update.mockResolvedValue({
        ...session,
        status: SessionStatus.STOPPED,
        isActive: false,
      });

      await service.stopSession(sessionId);

      expect(wahaClient.stopSession).toHaveBeenCalledWith(sessionId);
      expect(prisma.whatsAppSession.update).toHaveBeenCalledWith({
        where: { id: session.id },
        data: { status: SessionStatus.STOPPED, isActive: false },
      });
    });

    it('should handle error when stopping session', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.WORKING,
        userId: '1',
        name: 'Test Session',
        isActive: true,
        qrCode: null,
        phoneNumber: null,
        profileName: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: '1', name: 'User', email: 'user@example.com', password: 'hash', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      };

      const error = new Error('WAHA error');
      mockPrismaService.whatsAppSession.findFirst.mockResolvedValue(session);
      mockWahaClient.stopSession.mockRejectedValue(error);

      await expect(service.stopSession(sessionId)).rejects.toThrow('WAHA error');
    });
  });

  describe('deleteSession', () => {
    it('should delete a working session after stopping it', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.WORKING,
        userId: '1',
        name: 'Test Session',
        isActive: true,
        qrCode: null,
        phoneNumber: null,
        profileName: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: '1', name: 'User', email: 'user@example.com', password: 'hash', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      };

      // Reset mocks to ensure clean state
      mockPrismaService.whatsAppSession.findFirst.mockReset();
      mockWahaClient.stopSession.mockReset();
      mockPrismaService.whatsAppSession.update.mockReset();
      
      // deleteSession calls getSession, then stopSession which also calls getSession
      mockPrismaService.whatsAppSession.findFirst
        .mockResolvedValueOnce(session) // deleteSession.getSession
        .mockResolvedValueOnce(session); // stopSession.getSession (inside deleteSession)
      mockWahaClient.stopSession.mockResolvedValue(undefined);
      mockPrismaService.whatsAppSession.update
        .mockResolvedValueOnce({ ...session, status: SessionStatus.STOPPED, isActive: false }) // stopSession.update
        .mockResolvedValueOnce({ ...session, deletedAt: new Date() }); // deleteSession.update

      await service.deleteSession(sessionId);

      expect(wahaClient.stopSession).toHaveBeenCalledWith(sessionId);
      expect(prisma.whatsAppSession.update).toHaveBeenCalledTimes(2);
    });

    it('should delete a non-working session directly', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.STOPPED,
        userId: '1',
        user: { id: '1', name: 'User' },
      };

      mockPrismaService.whatsAppSession.findFirst.mockResolvedValue(session);
      mockPrismaService.whatsAppSession.update.mockResolvedValue({
        ...session,
        deletedAt: new Date(),
      });

      await service.deleteSession(sessionId);

      expect(wahaClient.stopSession).not.toHaveBeenCalled();
    });
  });

  describe('sendText', () => {
    it('should send text message', async () => {
      const sessionId = 'test-session';
      const to = '+1234567890';
      const text = 'Hello';

      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.WORKING,
        userId: '1',
        name: 'Test Session',
        isActive: true,
        qrCode: null,
        phoneNumber: null,
        profileName: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: '1', name: 'User', email: 'user@example.com', password: 'hash', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      };

      mockPrismaService.whatsAppSession.findFirst.mockResolvedValueOnce(session);
      mockWahaClient.sendText.mockResolvedValue(undefined);

      await service.sendText(sessionId, to, text);

      expect(wahaClient.sendText).toHaveBeenCalledWith(sessionId, to, text);
    });

    it('should throw BadRequestException if session is not working', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.STARTING,
        userId: '1',
        name: 'Test Session',
        isActive: true,
        qrCode: null,
        phoneNumber: null,
        profileName: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: '1', name: 'User', email: 'user@example.com', password: 'hash', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      };

      // Reset mocks to ensure clean state
      mockPrismaService.whatsAppSession.findFirst.mockReset();
      mockWahaClient.sendText.mockReset();
      
      // getSession is called in sendText
      mockPrismaService.whatsAppSession.findFirst.mockResolvedValueOnce(session);

      await expect(service.sendText(sessionId, '+1234567890', 'Hello')).rejects.toThrow(
        BadRequestException,
      );
      expect(wahaClient.sendText).not.toHaveBeenCalled();
    });
  });

  describe('sendImage', () => {
    it('should send image message', async () => {
      const sessionId = 'test-session';
      const to = '+1234567890';
      const imageUrl = 'https://example.com/image.jpg';
      const caption = 'Check this out';

      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.WORKING,
        userId: '1',
        name: 'Test Session',
        isActive: true,
        qrCode: null,
        phoneNumber: null,
        profileName: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: '1', name: 'User', email: 'user@example.com', password: 'hash', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      };

      mockPrismaService.whatsAppSession.findFirst.mockResolvedValueOnce(session);
      mockWahaClient.sendImage.mockResolvedValue(undefined);

      await service.sendImage(sessionId, to, imageUrl, caption);

      expect(wahaClient.sendImage).toHaveBeenCalledWith(sessionId, to, imageUrl, caption);
    });

    it('should throw BadRequestException if session is not working', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.STARTING,
        userId: '1',
        name: 'Test Session',
        isActive: true,
        qrCode: null,
        phoneNumber: null,
        profileName: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: '1', name: 'User', email: 'user@example.com', password: 'hash', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      };

      // Reset mocks to ensure clean state
      mockPrismaService.whatsAppSession.findFirst.mockReset();
      mockWahaClient.sendImage.mockReset();
      
      // getSession is called in sendImage
      mockPrismaService.whatsAppSession.findFirst.mockResolvedValueOnce(session);

      await expect(
        service.sendImage(sessionId, '+1234567890', 'https://example.com/image.jpg'),
      ).rejects.toThrow(BadRequestException);
      expect(wahaClient.sendImage).not.toHaveBeenCalled();
    });
  });

  describe('sendFile', () => {
    it('should send file message', async () => {
      const sessionId = 'test-session';
      const to = '+1234567890';
      const fileUrl = 'https://example.com/file.pdf';
      const filename = 'document.pdf';

      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.WORKING,
        userId: '1',
        user: { id: '1', name: 'User' },
      };

      mockPrismaService.whatsAppSession.findFirst.mockResolvedValue(session);
      mockWahaClient.sendFile.mockResolvedValue(undefined);

      await service.sendFile(sessionId, to, fileUrl, filename);

      expect(wahaClient.sendFile).toHaveBeenCalledWith(sessionId, to, fileUrl, filename);
    });

    it('should throw BadRequestException if session is not working', async () => {
      const sessionId = 'test-session';
      const session = {
        id: '1',
        sessionId,
        status: SessionStatus.STARTING,
        userId: '1',
        user: { id: '1', name: 'User' },
      };

      mockPrismaService.whatsAppSession.findFirst.mockResolvedValue(session);

      await expect(
        service.sendFile(sessionId, '+1234567890', 'https://example.com/file.pdf', 'file.pdf'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
