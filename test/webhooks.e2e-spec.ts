import { createTestApp } from './test-setup';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

describe('WahaWebhookController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.message.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('/api/webhooks/waha/message (POST)', () => {
    it('should handle incoming message webhook', () => {
      return request(app.getHttpServer())
        .post('/api/webhooks/waha/message')
        .set('x-session-id', 'test-session-id')
        .send({
          id: 'msg_123',
          from: '5511999999999',
          to: '5511888888888',
          text: 'Hello from webhook',
          type: 'text',
          timestamp: Date.now(),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body.success).toBe(true);
        });
    });

    it('should handle message with media', () => {
      return request(app.getHttpServer())
        .post('/api/webhooks/waha/message')
        .set('x-session-id', 'test-session-id')
        .send({
          id: 'msg_456',
          from: '5511999999999',
          to: '5511888888888',
          type: 'image',
          mediaUrl: 'https://example.com/image.jpg',
          timestamp: Date.now(),
        })
        .expect(200);
    });

    it('should handle message without session header', () => {
      return request(app.getHttpServer())
        .post('/api/webhooks/waha/message')
        .send({
          id: 'msg_789',
          from: '5511999999999',
          to: '5511888888888',
          text: 'Test',
          type: 'text',
        })
        .expect(200);
    });
  });
});
