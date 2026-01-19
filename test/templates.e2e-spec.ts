import { createTestApp } from './test-setup';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

describe('TemplatesController (e2e)', () => {
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
    await prisma.template.deleteMany();
    await prisma.user.deleteMany();

    // Create a user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'templates@example.com',
        password: 'password123',
        name: 'Messages User',
      });

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

   describe('/api/templates (POST)', () => {
    it('should create a template', () => {
      return request(app.getHttpServer())
        .post('/api/templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Template',
          flowData: { nodes: [], edges: [] },
          category: 'AGENDAMENTO',
          description: 'Test template description',
          isPublic: false,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Template');
          expect(res.body.category).toBe('AGENDAMENTO');
        });

    it('should create public template', () => {
      return request(app.getHttpServer())
        .post('/api/templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Public Template',
          flowData: { nodes: [], edges: [] },
          category: 'FAQ',
          isPublic: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.isPublic).toBe(true);
        });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/templates')
        .send({
          name: 'Test Template',
          flowData: {},
        })
        .expect(401);
    });

  describe('/api/templates (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Template 1',
          flowData: {},
          category: 'AGENDAMENTO',
          isPublic: true,
        });

      await request(app.getHttpServer())
        .post('/api/templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Template 2',
          flowData: {},
          category: 'FAQ',
          isPublic: false,
        });

    it('should get all templates', () => {
      return request(app.getHttpServer())
        .get('/api/templates')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
        });

    it('should filter templates by category', () => {
      return request(app.getHttpServer())
        .get('/api/templates')
        .query({ category: 'AGENDAMENTO' })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((template: any) => {
            expect(template.category).toBe('AGENDAMENTO');
          });

  describe('/api/templates/:id (GET)', () => {
    let templateId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Template',
          flowData: { nodes: [], edges: [] },
          category: 'AGENDAMENTO',
        });
      templateId = response.body.id;

    it('should get a template by id', () => {
      return request(app.getHttpServer())
        .get(`/api/templates/${templateId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(templateId);
          expect(res.body.name).toBe('Test Template');
        });

    it('should fail with non-existent template', () => {
      return request(app.getHttpServer())
        .get('/api/templates/non-existent-id')
        .expect(404);
    });

  describe('/api/templates/:id (PUT)', () => {
    let templateId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Original Template',
          flowData: {},
          category: 'AGENDAMENTO',
        });
      templateId = response.body.id;

    it('should update a template', () => {
      return request(app.getHttpServer())
        .put(`/api/templates/${templateId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Template',
          description: 'Updated description',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Template');
          expect(res.body.description).toBe('Updated description');
        });

  describe('/api/templates/:id/duplicate (POST)', () => {
    let templateId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Original Template',
          flowData: { nodes: [], edges: [] },
          category: 'AGENDAMENTO',
        });
      templateId = response.body.id;

    it('should duplicate a template', () => {
      return request(app.getHttpServer())
        .post(`/api/templates/${templateId}/duplicate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Duplicated Template',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('Duplicated Template');
          expect(res.body.id).not.toBe(templateId);
        });

    it('should duplicate with default name', () => {
      return request(app.getHttpServer())
        .post(`/api/templates/${templateId}/duplicate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toContain('Copy');
        });

  describe('/api/templates/:id (DELETE)', () => {
    let templateId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'To Delete',
          flowData: {},
          category: 'AGENDAMENTO',
        });
      templateId = response.body.id;

    it('should delete a template', () => {
      return request(app.getHttpServer())
        .delete(`/api/templates/${templateId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });
});
