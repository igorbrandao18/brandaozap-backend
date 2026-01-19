import { createTestApp } from './test-setup';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
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
    // Clean database before each test
    await prisma.user.deleteMany();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.user.name).toBe('Test User');
          expect(res.body.user).not.toHaveProperty('password');
        });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        })
        .expect(400);
    });

    it('should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '12345',
          name: 'Test User',
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('should fail with duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'First User',
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Second User',
        })
        .expect(400);
    });

  describe('/api/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
          name: 'Login User',
        });

    it('should login successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('login@example.com');
        });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should fail with missing email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });

    it('should fail with missing password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
        })
        .expect(400);
    });

  describe('/api/auth/profile (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'profile@example.com',
          password: 'password123',
          name: 'Profile User',
        });

      accessToken = registerResponse.body.accessToken;
    });

    it('should get user profile', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('profile@example.com');
          expect(res.body.name).toBe('Profile User');
          expect(res.body).not.toHaveProperty('password');
        });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should fail with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
