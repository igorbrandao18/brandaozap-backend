import { createTestApp } from './test-setup';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

describe('AgentsController (e2e)', () => {
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
    await prisma.agent.deleteMany();
    await prisma.user.deleteMany();

    // Create a user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'agents@example.com',
        password: 'password123',
        name: 'Messages User',
      });

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

   describe('/api/agents (POST)', () => {
    it('should create an agent', () => {
      return request(app.getHttpServer())
        .post('/api/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Agent 1',
          email: 'agent1@example.com',
          password: 'agentpassword123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Agent 1');
          expect(res.body.email).toBe('agent1@example.com');
          expect(res.body.status).toBe('OFFLINE');
          expect(res.body).not.toHaveProperty('password');
        });

    it('should fail with duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Agent 1',
          email: 'duplicate@example.com',
          password: 'password123',
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/api/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Agent 2',
          email: 'duplicate@example.com',
          password: 'password123',
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/agents')
        .send({
          name: 'Agent 1',
          email: 'agent1@example.com',
          password: 'password123',
        })
        .expect(401);
    });

  describe('/api/agents (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Agent 1',
          email: 'agent1@example.com',
          password: 'password123',
        });

      await request(app.getHttpServer())
        .post('/api/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Agent 2',
          email: 'agent2@example.com',
          password: 'password123',
        });

    it('should get all agents', () => {
      return request(app.getHttpServer())
        .get('/api/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });

  describe('/api/agents/:id (GET)', () => {
    let agentId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Agent',
          email: 'testagent@example.com',
          password: 'password123',
        });
      agentId = response.body.id;

    it('should get an agent by id', () => {
      return request(app.getHttpServer())
        .get(`/api/agents/${agentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(agentId);
          expect(res.body.name).toBe('Test Agent');
        });

    it('should fail with non-existent agent', () => {
      return request(app.getHttpServer())
        .get('/api/agents/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

  describe('/api/agents/:id (PUT)', () => {
    let agentId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Original Agent',
          email: 'original@example.com',
          password: 'password123',
        });
      agentId = response.body.id;

    it('should update an agent', () => {
      return request(app.getHttpServer())
        .put(`/api/agents/${agentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Agent',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Agent');
        });

  describe('/api/agents/:id/status (PATCH)', () => {
    let agentId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Agent',
          email: 'statusagent@example.com',
          password: 'password123',
        });
      agentId = response.body.id;

    it('should update agent status to ONLINE', () => {
      return request(app.getHttpServer())
        .patch(`/api/agents/${agentId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'ONLINE',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ONLINE');
        });

    it('should update agent status to BUSY', () => {
      return request(app.getHttpServer())
        .patch(`/api/agents/${agentId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'BUSY',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('BUSY');
        });

  describe('/api/agents/:id (DELETE)', () => {
    let agentId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'To Delete',
          email: 'todelete@example.com',
          password: 'password123',
        });
      agentId = response.body.id;

    it('should delete an agent', () => {
      return request(app.getHttpServer())
        .delete(`/api/agents/${agentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
