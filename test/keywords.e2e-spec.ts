import { createTestApp } from './test-setup';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

describe('KeywordsController (e2e)', () => {
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
    await prisma.keyword.deleteMany();
    await prisma.user.deleteMany();

    // Create a user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'keywords@example.com',
        password: 'password123',
        name: 'Keywords User',
      });

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  describe('/api/keywords (POST)', () => {
    it('should create a keyword', () => {
      return request(app.getHttpServer())
        .post('/api/keywords')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          keyword: 'hello',
          response: 'Hello! How can I help you?',
          matchType: 'EXACT',
          priority: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.keyword).toBe('hello');
          expect(res.body.response).toBe('Hello! How can I help you?');
          expect(res.body.matchType).toBe('EXACT');
        });

    it('should create keyword with default values', () => {
      return request(app.getHttpServer())
        .post('/api/keywords')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          keyword: 'help',
          response: 'Help response',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.matchType).toBe('CONTAINS');
          expect(res.body.priority).toBe(0);
          expect(res.body.isActive).toBe(true);
        });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/keywords')
        .send({
          keyword: 'test',
          response: 'Test response',
        })
        .expect(401);
    });

  describe('/api/keywords (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/keywords')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          keyword: 'keyword1',
          response: 'Response 1',
        });

      await request(app.getHttpServer())
        .post('/api/keywords')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          keyword: 'keyword2',
          response: 'Response 2',
        });

    it('should get all keywords', () => {
      return request(app.getHttpServer())
        .get('/api/keywords')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });

  describe('/api/keywords/:id (GET)', () => {
    let keywordId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/keywords')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          keyword: 'test-keyword',
          response: 'Test response',
        });
      keywordId = response.body.id;

    it('should get a keyword by id', () => {
      return request(app.getHttpServer())
        .get(`/api/keywords/${keywordId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(keywordId);
          expect(res.body.keyword).toBe('test-keyword');
        });

    it('should fail with non-existent keyword', () => {
      return request(app.getHttpServer())
        .get('/api/keywords/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

  describe('/api/keywords/:id (PUT)', () => {
    let keywordId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/keywords')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          keyword: 'original',
          response: 'Original response',
        });
      keywordId = response.body.id;

    it('should update a keyword', () => {
      return request(app.getHttpServer())
        .put(`/api/keywords/${keywordId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          response: 'Updated response',
          matchType: 'STARTS_WITH',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.response).toBe('Updated response');
          expect(res.body.matchType).toBe('STARTS_WITH');
        });

  describe('/api/keywords/:id (DELETE)', () => {
    let keywordId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/keywords')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          keyword: 'to-delete',
          response: 'To delete',
        });
      keywordId = response.body.id;

    it('should delete a keyword', () => {
      return request(app.getHttpServer())
        .delete(`/api/keywords/${keywordId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
