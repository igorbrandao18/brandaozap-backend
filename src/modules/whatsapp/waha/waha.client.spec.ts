import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WahaClient } from './waha.client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WahaClient', () => {
  let client: WahaClient;
  let configService: ConfigService;

  const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'waha.baseUrl') return 'http://localhost:3000';
      if (key === 'waha.timeout') return 30000;
      return null;
    }),
  };

  beforeEach(async () => {
    mockedAxios.create = jest.fn(() => mockAxiosInstance as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WahaClient,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    client = module.get<WahaClient>(WahaClient);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session', async () => {
      const sessionId = 'test-session';
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      await client.createSession(sessionId);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/api/sessions/${sessionId}/start`);
    });
  });

  describe('getSessionStatus', () => {
    it('should get session status', async () => {
      const sessionId = 'test-session';
      const status = { status: 'WORKING' };
      mockAxiosInstance.get.mockResolvedValue({ data: status });

      const result = await client.getSessionStatus(sessionId);

      expect(result).toEqual(status);
    });
  });

  describe('getQrCode', () => {
    it('should get QR code', async () => {
      const sessionId = 'test-session';
      const qrCode = 'qr-code-string';
      mockAxiosInstance.get.mockResolvedValue({ data: { qr: qrCode } });

      const result = await client.getQrCode(sessionId);

      expect(result).toBe(qrCode);
    });
  });

  describe('stopSession', () => {
    it('should stop a session', async () => {
      const sessionId = 'test-session';
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await client.stopSession(sessionId);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/api/sessions/${sessionId}`);
    });

    it('should handle error when stopping session', async () => {
      const sessionId = 'test-session';
      const error = new Error('Network error');
      mockAxiosInstance.delete.mockRejectedValue(error);

      await expect(client.stopSession(sessionId)).rejects.toThrow('Network error');
    });
  });

  describe('sendText', () => {
    it('should send text message', async () => {
      const sessionId = 'test-session';
      const to = '+1234567890';
      const text = 'Hello';
      mockAxiosInstance.post.mockResolvedValue({
        data: { sent: true, id: 'msg-1' },
      });

      const result = await client.sendText(sessionId, to, text);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/sendText', {
        session: sessionId,
        to,
        text,
      });
      expect(result.sent).toBe(true);
    });

    it('should handle error when sending text', async () => {
      const sessionId = 'test-session';
      const error = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(client.sendText(sessionId, '+1234567890', 'Hello')).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('sendImage', () => {
    it('should send image message', async () => {
      const sessionId = 'test-session';
      const to = '+1234567890';
      const imageUrl = 'https://example.com/image.jpg';
      const caption = 'Check this out';
      mockAxiosInstance.post.mockResolvedValue({
        data: { sent: true, id: 'msg-1' },
      });

      const result = await client.sendImage(sessionId, to, imageUrl, caption);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/sendImage', {
        session: sessionId,
        to,
        image: imageUrl,
        caption,
      });
      expect(result.sent).toBe(true);
    });

    it('should send image without caption', async () => {
      const sessionId = 'test-session';
      const to = '+1234567890';
      const imageUrl = 'https://example.com/image.jpg';
      mockAxiosInstance.post.mockResolvedValue({
        data: { sent: true, id: 'msg-1' },
      });

      await client.sendImage(sessionId, to, imageUrl);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/sendImage', {
        session: sessionId,
        to,
        image: imageUrl,
        caption: undefined,
      });
    });

    it('should handle error when sending image', async () => {
      const sessionId = 'test-session';
      const error = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(
        client.sendImage(sessionId, '+1234567890', 'https://example.com/image.jpg'),
      ).rejects.toThrow('Network error');
    });
  });

  describe('sendFile', () => {
    it('should send file message', async () => {
      const sessionId = 'test-session';
      const to = '+1234567890';
      const fileUrl = 'https://example.com/file.pdf';
      const filename = 'document.pdf';
      mockAxiosInstance.post.mockResolvedValue({
        data: { sent: true, id: 'msg-1' },
      });

      const result = await client.sendFile(sessionId, to, fileUrl, filename);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/sendFile', {
        session: sessionId,
        to,
        file: fileUrl,
        filename,
      });
      expect(result.sent).toBe(true);
    });

    it('should handle error when sending file', async () => {
      const sessionId = 'test-session';
      const error = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(
        client.sendFile(sessionId, '+1234567890', 'https://example.com/file.pdf', 'file.pdf'),
      ).rejects.toThrow('Network error');
    });
  });

  describe('error handling', () => {
    it('should handle error when creating session', async () => {
      const sessionId = 'test-session';
      const error = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(client.createSession(sessionId)).rejects.toThrow('Network error');
    });

    it('should handle error when getting session status', async () => {
      const sessionId = 'test-session';
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.getSessionStatus(sessionId)).rejects.toThrow('Network error');
    });

    it('should handle error when getting QR code', async () => {
      const sessionId = 'test-session';
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.getQrCode(sessionId)).rejects.toThrow('Network error');
    });
  });
});
