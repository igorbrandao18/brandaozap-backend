import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const name = 'Test User';
      const hashedPassword = 'hashed_password';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        email,
        password: hashedPassword,
        name,
      });

      const result = await service.create(email, password, name);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });
      expect(result).toEqual({
        id: '1',
        email,
        password: hashedPassword,
        name,
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      const user = { id: '1', email, name: 'Test User', deletedAt: null };

      mockPrismaService.user.findFirst.mockResolvedValue(user);

      const result = await service.findByEmail(email);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email, deletedAt: null },
      });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const id = '1';
      const user = { id, email: 'test@example.com', name: 'Test User', deletedAt: null };

      mockPrismaService.user.findFirst.mockResolvedValue(user);

      const result = await service.findById(id);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id, deletedAt: null },
      });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        { id: '1', email: 'test1@example.com', name: 'User 1', deletedAt: null },
        { id: '2', email: 'test2@example.com', name: 'User 2', deletedAt: null },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
      expect(result).toEqual(users);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const id = '1';
      const updateData = { name: 'Updated Name' };
      const existingUser = { id, email: 'test@example.com', name: 'Test User', deletedAt: null };
      const updatedUser = { ...existingUser, ...updateData };

      mockPrismaService.user.findFirst.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(id, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id },
        data: updateData,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should hash password if provided', async () => {
      const id = '1';
      const password = 'newpassword';
      const hashedPassword = 'hashed_new_password';
      const updateData = { password };
      const existingUser = { id, email: 'test@example.com', name: 'Test User', deletedAt: null };

      mockPrismaService.user.findFirst.mockResolvedValue(existingUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.update.mockResolvedValue({ ...existingUser, password: hashedPassword });

      await service.update(id, updateData);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id },
        data: { password: hashedPassword },
      });
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      const id = '1';

      await service.remove(id);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('validatePassword', () => {
    it('should return true if password matches', async () => {
      const user = { id: '1', password: 'hashed_password' };
      const password = 'password123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword(user, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
      expect(result).toBe(true);
    });

    it('should return false if password does not match', async () => {
      const user = { id: '1', password: 'hashed_password' };
      const password = 'wrongpassword';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword(user, password);

      expect(result).toBe(false);
    });
  });
});
