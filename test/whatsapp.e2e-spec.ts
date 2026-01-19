import { createTestApp } from './test-setup';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

describe('WhatsAppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

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
    await prisma.whatsAppSession.deleteMany();
    await prisma.user.deleteMany();

    // Create a user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'whatsapp@example.com',
        password: 'password123',
        name: 'Messages User',
      });

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

   describe('/api/whatsapp/sessions (POST)', () => {
    it('should create a new session', () => {
      return request(app.getHttpServer())
        .post('/api/whatsapp/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Session',
          sessionId: 'test-session-1',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('sessionId');
          expect(res.body).toHaveProperty('status');
          expect(res.body.name).toBe('Test Session');
          expect(res.body.sessionId).toBe('test-session-1');
        });

    it('should create session without sessionId (auto-generated)', () => {
      return request(app.getHttpServer())
        .post('/api/whatsapp/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Auto Session',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessionId');
          expect(res.body.sessionId).toBeTruthy();
        });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/whatsapp/sessions')
        .send({
          name: 'Test Session',
        })
        .expect(401);
    });

    it('should fail with missing name', () => {
      return request(app.getHttpServer())
        .post('/api/whatsapp/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          sessionId: 'test-session',
        })
        .expect(400);
    });

  describe('/api/whatsapp/sessions (GET)', () => {
    beforeEach(async () => {
      // Create a session
      await request(app.getHttpServer())
        .post('/api/whatsapp/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Session',
          sessionId: 'test-session-list',
        });

    it('should get user sessions', () => {
      return request(app.getHttpServer())
        .get('/api/whatsapp/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/whatsapp/sessions')
        .expect(401);
    });

  describe('/api/whatsapp/sessions/:sessionId (GET)', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/whatsapp/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Session',
          sessionId: 'test-session-get',
        });
      sessionId = response.body.sessionId;
    });

    it('should get a session by id', () => {
      return request(app.getHttpServer())
        .get(`/api/whatsapp/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.sessionId).toBe(sessionId);
          expect(res.body).toHaveProperty('status');
        });

    it('should fail with non-existent session', () => {
      return request(app.getHttpServer())
        .get('/api/whatsapp/sessions/non-existent')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

  describe('/api/whatsapp/sessions/:sessionId/status (GET)', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/whatsapp/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Session',
          sessionId: 'test-session-status',
        });
      sessionId = response.body.sessionId;

    it('should get session status', () => {
      return request(app.getHttpServer())
        .get(`/api/whatsapp/sessions/${sessionId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('sessionId');
        });

  describe('/api/whatsapp/sessions/:sessionId/qr (GET)', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/whatsapp/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Session',
          sessionId: 'test-session-qr',
        });
      sessionId = response.body.sessionId;

    it('should get QR code', () => {
      return request(app.getHttpServer())
        .get(`/api/whatsapp/sessions/${sessionId}/qr`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('qrCode');
        });

  describe('/api/whatsapp/sessions/:sessionId/stop (POST)', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/whatsapp/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Session',
          sessionId: 'test-session-stop',
        });
      sessionId = response.body.sessionId;

    it('should stop a session', () => {
      return request(app.getHttpServer())
        .post(`/api/whatsapp/sessions/${sessionId}/stop`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });

  describe('/api/whatsapp/sessions/:sessionId (DELETE)', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/whatsapp/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Session',
          sessionId: 'test-session-delete',
        });
      sessionId = response.body.sessionId;

    it('should delete a session', () => {
      return request(app.getHttpServer())
        .delete(`/api/whatsapp/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });

  describe('/api/whatsapp/sessions/:sessionId/send-text (POST)', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/whatsapp/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Session',
          sessionId: 'test-session-send',
        });
      sessionId = response.body.sessionId;
    });

    it('should fail to send text if session is not working', () => {
      return request(app.getHttpServer())
        .post(`/api/whatsapp/sessions/${sessionId}/send-text`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          to: '5511999999999',
          text: 'Test message',
        })
        .expect(400);
    });
  });
});
