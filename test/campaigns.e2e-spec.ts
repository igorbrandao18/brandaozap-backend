import { createTestApp } from './test-setup';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

describe('CampaignsController (e2e)', () => {
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
    await prisma.campaign.deleteMany();
    await prisma.whatsAppSession.deleteMany();
    await prisma.user.deleteMany();

    // Create a user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'campaigns@example.com',
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
        sessionId: 'test-campaigns-session',
    sessionId = sessionResponse.body.sessionId;
  });

   describe('/api/campaigns (POST)', () => {
    it('should create a campaign', () => {
      return request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Campaign',
          message: 'Test message',
          recipients: ['5511999999999', '5511888888888'],
          sessionId,
          description: 'Test campaign description',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Campaign');
          expect(res.body.status).toBe('DRAFT');
        });

    it('should create campaign with scheduled date', () => {
      const scheduledAt = new Date(Date.now() + 86400000).toISOString();
      return request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Scheduled Campaign',
          message: 'Scheduled message',
          recipients: ['5511999999999'],
          sessionId,
          scheduledAt,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('SCHEDULED');
        });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/campaigns')
        .send({
          name: 'Test Campaign',
          message: 'Test message',
          recipients: [],
          sessionId,
        })
        .expect(401);
    });

  describe('/api/campaigns (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Campaign 1',
          message: 'Message 1',
          recipients: ['5511999999999'],
          sessionId,
        });

      await request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Campaign 2',
          message: 'Message 2',
          recipients: ['5511888888888'],
          sessionId,
        });

    it('should get all campaigns', () => {
      return request(app.getHttpServer())
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });

  describe('/api/campaigns/:id (GET)', () => {
    let campaignId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Campaign',
          message: 'Test message',
          recipients: ['5511999999999'],
          sessionId,
        });
      campaignId = response.body.id;

    it('should get a campaign by id', () => {
      return request(app.getHttpServer())
        .get(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(campaignId);
          expect(res.body.name).toBe('Test Campaign');
        });

  describe('/api/campaigns/:id (PUT)', () => {
    let campaignId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Original Campaign',
          message: 'Original message',
          recipients: ['5511999999999'],
          sessionId,
        });
      campaignId = response.body.id;

    it('should update a campaign', () => {
      return request(app.getHttpServer())
        .put(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Campaign',
          message: 'Updated message',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Campaign');
          expect(res.body.message).toBe('Updated message');
        });

  describe('/api/campaigns/:id/start (PATCH)', () => {
    let campaignId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Campaign',
          message: 'Test message',
          recipients: ['5511999999999'],
          sessionId,
        });
      campaignId = response.body.id;

    it('should start a campaign', () => {
      return request(app.getHttpServer())
        .patch(`/api/campaigns/${campaignId}/start`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('RUNNING');
        });

  describe('/api/campaigns/:id/pause (PATCH)', () => {
    let campaignId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Campaign',
          message: 'Test message',
          recipients: ['5511999999999'],
          sessionId,
        });
      campaignId = response.body.id;

      // Start first
      await request(app.getHttpServer())
        .patch(`/api/campaigns/${campaignId}/start`)
        .set('Authorization', `Bearer ${accessToken}`);

    it('should pause a campaign', () => {
      return request(app.getHttpServer())
        .patch(`/api/campaigns/${campaignId}/pause`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('PAUSED');
        });

  describe('/api/campaigns/:id/cancel (PATCH)', () => {
    let campaignId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Campaign',
          message: 'Test message',
          recipients: ['5511999999999'],
          sessionId,
        });
      campaignId = response.body.id;

    it('should cancel a campaign', () => {
      return request(app.getHttpServer())
        .patch(`/api/campaigns/${campaignId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('CANCELLED');
        });

  describe('/api/campaigns/:id (DELETE)', () => {
    let campaignId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'To Delete',
          message: 'To delete',
          recipients: ['5511999999999'],
          sessionId,
        });
      campaignId = response.body.id;

    it('should delete a campaign', () => {
      return request(app.getHttpServer())
        .delete(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
