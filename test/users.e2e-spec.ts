import { createTestApp } from './test-setup';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

describe('UsersController (e2e)', () => {
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
    await prisma.user.deleteMany();

    // Create a user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        password: 'password123',
        name: 'Test User',
      });

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  describe('/api/users (GET)', () => {
    it('should get all users', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
  });

  describe('/api/users/:id (GET)', () => {
    it('should get a user by id', () => {
      return request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body.id).toBe(userId);
          expect(res.body.email).toBe('user@example.com');
        });

    it('should fail with non-existent user id', () => {
      return request(app.getHttpServer())
        .get('/api/users/non-existent-id')
        .expect(404);
    });

    it('should fail with invalid uuid format', () => {
      return request(app.getHttpServer())
        .get('/api/users/invalid-uuid')
        .expect(500);
    });

  describe('/api/users/:id (PUT)', () => {
    it('should update a user', () => {
      return request(app.getHttpServer())
        .put(`/api/users/${userId}`)
        .send({
          name: 'Updated Name',
          avatar: 'https://example.com/avatar.jpg',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Name');
          expect(res.body.avatar).toBe('https://example.com/avatar.jpg');
        });

    it('should update user email', () => {
      return request(app.getHttpServer())
        .put(`/api/users/${userId}`)
        .send({
          email: 'newemail@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('newemail@example.com');
        });

    it('should fail with non-existent user id', () => {
      return request(app.getHttpServer())
        .put('/api/users/non-existent-id')
        .send({
          name: 'Updated Name',
        })
        .expect(404);
    });

  describe('/api/users/:id (DELETE)', () => {
    it('should delete a user', async () => {
      // Create another user to delete
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'todelete@example.com',
          password: 'password123',
          name: 'To Delete',
        });

      const userToDeleteId = registerResponse.body.user.id;

      await request(app.getHttpServer())
        .delete(`/api/users/${userToDeleteId}`)
        .expect(200);

      // Verify user is deleted
      await request(app.getHttpServer())
        .get(`/api/users/${userToDeleteId}`)
        .expect(404);
    });

    it('should fail with non-existent user id', () => {
      return request(app.getHttpServer())
        .delete('/api/users/non-existent-id')
        .expect(404);
    });
});

  });