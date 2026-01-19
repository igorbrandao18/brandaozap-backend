import { createTestApp } from './test-setup';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

describe('MessagesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let sessionId: string;

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
    await prisma.conversation.deleteMany();
    await prisma.whatsAppSession.deleteMany();
    await prisma.user.deleteMany();

    // Create a user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'messages@example.com',
        password: 'password123',
        name: 'Messages User',
      });

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Create a session
    const sessionResponse = await request(app.getHttpServer())
      .post('/api/whatsapp/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test Session',
        sessionId: 'test-messages-session',
      });
    sessionId = sessionResponse.body.sessionId;
  });

  describe('/api/messages (GET)', () => {
    it('should get all messages', () => {
      return request(app.getHttpServer())
        .get('/api/messages')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should filter messages by sessionId', () => {
      return request(app.getHttpServer())
        .get('/api/messages')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ sessionId })
        .expect(200);
    });

    it('should filter messages by phoneNumber', () => {
      return request(app.getHttpServer())
        .get('/api/messages')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ phoneNumber: '5511999999999' })
        .expect(200);
    });
  });

  describe('/api/messages/conversations (GET)', () => {
    it('should get all conversations', () => {
      return request(app.getHttpServer())
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should filter conversations by sessionId', () => {
      return request(app.getHttpServer())
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ sessionId })
        .expect(200);
    });
  });

  describe('/api/messages/conversations/:phoneNumber (GET)', () => {
    it('should get conversation messages', () => {
      return request(app.getHttpServer())
        .get('/api/messages/conversations/5511999999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ sessionId })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should fail without sessionId query param', () => {
      return request(app.getHttpServer())
        .get('/api/messages/conversations/5511999999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });

  describe('/api/messages/conversations/:phoneNumber/read (POST)', () => {
    it('should mark conversation as read', () => {
      return request(app.getHttpServer())
        .post('/api/messages/conversations/5511999999999/read')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ sessionId })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('/api/messages/send (POST)', () => {
    it('should fail to send message if session is not working', () => {
      return request(app.getHttpServer())
        .post('/api/messages/send')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ sessionId })
        .send({
          type: 'TEXT',
          to: '5511999999999',
          text: 'Test message',
        })
        .expect(400);
    });
  });
});