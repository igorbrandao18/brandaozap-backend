import { createTestApp } from './test-setup';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

describe('ContactsController (e2e)', () => {
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
    await prisma.contactTag.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.user.deleteMany();

    // Create a user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'contacts@example.com',
        password: 'password123',
        name: 'Messages User',
      });

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

   describe('/api/contacts (POST)', () => {
    it('should create a contact', () => {
      return request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'John Doe',
          phoneNumber: '5511999999999',
          email: 'john@example.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('John Doe');
          expect(res.body.phoneNumber).toBe('5511999999999');
          expect(res.body.email).toBe('john@example.com');
        });

    it('should create contact with custom fields', () => {
      return request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Jane Doe',
          phoneNumber: '5511888888888',
          customFields: {
            company: 'Acme Corp',
            position: 'Manager',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.customFields).toEqual({
            company: 'Acme Corp',
            position: 'Manager',
          });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/contacts')
        .send({
          name: 'John Doe',
          phoneNumber: '5511999999999',
        })
        .expect(401);
    });

    it('should fail with duplicate phone number', async () => {
      await request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'First Contact',
          phoneNumber: '5511999999999',
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Second Contact',
          phoneNumber: '5511999999999',
        })
        .expect(400);
    });

  describe('/api/contacts (GET)', () => {
    beforeEach(async () => {
      // Create contacts
      await request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Contact 1',
          phoneNumber: '5511111111111',
        });

      await request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Contact 2',
          phoneNumber: '5511222222222',

    it('should get all contacts', () => {
      return request(app.getHttpServer())
        .get('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });

  describe('/api/contacts/:id (GET)', () => {
    let contactId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Contact',
          phoneNumber: '5511999999999',
        });
      contactId = response.body.id;

    it('should get a contact by id', () => {
      return request(app.getHttpServer())
        .get(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(contactId);
          expect(res.body.name).toBe('Test Contact');
        });

    it('should fail with non-existent contact', () => {
      return request(app.getHttpServer())
        .get('/api/contacts/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

  describe('/api/contacts/:id (PUT)', () => {
    let contactId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Original Name',
          phoneNumber: '5511999999999',
        });
      contactId = response.body.id;

    it('should update a contact', () => {
      return request(app.getHttpServer())
        .put(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Name');
          expect(res.body.email).toBe('updated@example.com');
        });

  describe('/api/contacts/:id (DELETE)', () => {
    let contactId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'To Delete',
          phoneNumber: '5511999999999',
        });
      contactId = response.body.id;

    it('should delete a contact', () => {
      return request(app.getHttpServer())
        .delete(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

  describe('/api/contacts/tags (POST)', () => {
    it('should create a tag', () => {
      return request(app.getHttpServer())
        .post('/api/contacts/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'VIP',
          color: '#FF0000',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('VIP');
          expect(res.body.color).toBe('#FF0000');
        });

    it('should create tag with default color', () => {
      return request(app.getHttpServer())
        .post('/api/contacts/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Default Tag',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.color).toBe('#3B82F6');
        });
  });

  describe('/api/contacts/tags (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/contacts/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Tag 1',
          color: '#FF0000',
        });

      await request(app.getHttpServer())
        .post('/api/contacts/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Tag 2',
          color: '#00FF00',

    it('should get all tags', () => {
      return request(app.getHttpServer())
        .get('/api/contacts/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });

  describe('/api/contacts/:id/tags (PATCH)', () => {
    let contactId: string;
    let tagId: string;

    beforeEach(async () => {
      const contactResponse = await request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Contact',
          phoneNumber: '5511999999999',
        });
      contactId = contactResponse.body.id;

      const tagResponse = await request(app.getHttpServer())
        .post('/api/contacts/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'VIP',
          color: '#FF0000',
      tagId = tagResponse.body.id;

    it('should add tags to contact', () => {
      return request(app.getHttpServer())
        .patch(`/api/contacts/${contactId}/tags`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          tagIds: [tagId],
        })
        .expect(200);
    });
