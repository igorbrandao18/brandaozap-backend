import { createTestApp } from './test-setup';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

describe('FlowsController (e2e)', () => {
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
    await prisma.flow.deleteMany();
    await prisma.user.deleteMany();

    // Create a user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'flows@example.com',
        password: 'password123',
        name: 'Messages User',
      });

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

   describe('/api/flows (POST)', () => {
    it('should create a flow', () => {
      return request(app.getHttpServer())
        .post('/api/flows')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Flow',
          nodes: [{ id: '1', type: 'start', data: {} }],
          edges: [],
          description: 'Test flow description',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Flow');
          expect(res.body.isActive).toBe(false);
        });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/flows')
        .send({
          name: 'Test Flow',
          nodes: [],
          edges: [],
        })
        .expect(401);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/flows')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Flow',
        })
        .expect(400);
    });

  describe('/api/flows (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/flows')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Flow 1',
          nodes: [],
          edges: [],
        });

      await request(app.getHttpServer())
        .post('/api/flows')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Flow 2',
          nodes: [],
          edges: [],
        });

    it('should get all flows', () => {
      return request(app.getHttpServer())
        .get('/api/flows')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });

  describe('/api/flows/:id (GET)', () => {
    let flowId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/flows')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Flow',
          nodes: [],
          edges: [],
        });
      flowId = response.body.id;

    it('should get a flow by id', () => {
      return request(app.getHttpServer())
        .get(`/api/flows/${flowId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(flowId);
          expect(res.body.name).toBe('Test Flow');
        });

  describe('/api/flows/:id (PUT)', () => {
    let flowId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/flows')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Original Flow',
          nodes: [],
          edges: [],
        });
      flowId = response.body.id;

    it('should update a flow', () => {
      return request(app.getHttpServer())
        .put(`/api/flows/${flowId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Flow',
          description: 'Updated description',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Flow');
          expect(res.body.description).toBe('Updated description');
        });

  describe('/api/flows/:id/activate (PATCH)', () => {
    let flowId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/flows')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Flow',
          nodes: [],
          edges: [],
        });
      flowId = response.body.id;

    it('should activate a flow', () => {
      return request(app.getHttpServer())
        .patch(`/api/flows/${flowId}/activate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.isActive).toBe(true);
        });

  describe('/api/flows/:id/deactivate (PATCH)', () => {
    let flowId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/flows')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Flow',
          nodes: [],
          edges: [],
        });
      flowId = response.body.id;

      // Activate first
      await request(app.getHttpServer())
        .patch(`/api/flows/${flowId}/activate`)
        .set('Authorization', `Bearer ${accessToken}`);

    it('should deactivate a flow', () => {
      return request(app.getHttpServer())
        .patch(`/api/flows/${flowId}/deactivate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.isActive).toBe(false);
        });

  describe('/api/flows/:id (DELETE)', () => {
    let flowId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/flows')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'To Delete',
          nodes: [],
          edges: [],
        });
      flowId = response.body.id;

    it('should delete a flow', () => {
      return request(app.getHttpServer())
        .delete(`/api/flows/${flowId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
