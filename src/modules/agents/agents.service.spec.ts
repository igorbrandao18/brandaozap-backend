import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AgentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AgentsService', () => {
  let service: AgentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    agent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an agent', async () => {
      const userId = '1';
      const agentData = {
        name: 'Agent 1',
        email: 'agent@example.com',
        password: 'password123',
      };

      const agent = {
        id: '1',
        ...agentData,
        password: 'hashed_password',
        userId,
        status: AgentStatus.OFFLINE,
        isActive: true,
        activeConversations: 0,
        totalConversations: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findById.mockResolvedValue({ id: userId });
      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.agent.create.mockResolvedValue(agent);

      const result = await service.create(
        userId,
        agentData.name,
        agentData.email,
        agentData.password,
      );

      expect(result).toEqual(agent);
      expect(bcrypt.hash).toHaveBeenCalledWith(agentData.password, 10);
    });

    it('should throw ConflictException if email exists', async () => {
      const userId = '1';
      const agentData = {
        name: 'Agent 1',
        email: 'existing@example.com',
        password: 'password123',
      };

      mockUsersService.findById.mockResolvedValue({ id: userId });
      mockPrismaService.agent.findFirst.mockResolvedValue({ id: '1', email: agentData.email });

      await expect(
        service.create(userId, agentData.name, agentData.email, agentData.password),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should update agent status', async () => {
      const id = '1';
      const userId = '1';
      const agent = {
        id,
        userId,
        status: AgentStatus.OFFLINE,
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(agent);
      mockPrismaService.agent.update.mockResolvedValue({
        ...agent,
        status: AgentStatus.ONLINE,
      });

      const result = await service.updateStatus(id, userId, AgentStatus.ONLINE);

      expect(result.status).toBe(AgentStatus.ONLINE);
    });
  });

  describe('findAll', () => {
    it('should return all agents for user', async () => {
      const userId = '1';
      const agents = [
        {
          id: '1',
          name: 'Agent 1',
          email: 'agent1@example.com',
          userId,
          deletedAt: null,
        },
      ];

      mockPrismaService.agent.findMany.mockResolvedValue(agents);

      const result = await service.findAll(userId);

      expect(result).toEqual(agents);
    });
  });

  describe('findById', () => {
    it('should return an agent by id', async () => {
      const id = '1';
      const userId = '1';
      const agent = {
        id,
        name: 'Agent 1',
        email: 'agent@example.com',
        userId,
        deletedAt: null,
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(agent);

      const result = await service.findById(id, userId);

      expect(result).toEqual(agent);
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(service.findById('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return an agent by email', async () => {
      const email = 'agent@example.com';
      const agent = {
        id: '1',
        name: 'Agent 1',
        email,
        deletedAt: null,
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(agent);

      const result = await service.findByEmail(email);

      expect(result).toEqual(agent);
    });

    it('should return null if agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an agent', async () => {
      const id = '1';
      const userId = '1';
      const agent = {
        id,
        name: 'Agent 1',
        email: 'agent@example.com',
        userId,
        deletedAt: null,
      };

      const updateData = { name: 'Updated Agent' };

      mockPrismaService.agent.findFirst.mockResolvedValue(agent);
      mockPrismaService.agent.update.mockResolvedValue({
        ...agent,
        ...updateData,
      });

      const result = await service.update(id, userId, updateData);

      expect(result.name).toBe('Updated Agent');
    });

    it('should hash password when updating', async () => {
      const id = '1';
      const userId = '1';
      const agent = {
        id,
        name: 'Agent 1',
        email: 'agent@example.com',
        password: 'old_hash',
        userId,
        deletedAt: null,
      };

      const updateData = { password: 'newpassword123' };

      mockPrismaService.agent.findFirst.mockResolvedValue(agent);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
      mockPrismaService.agent.update.mockResolvedValue({
        ...agent,
        password: 'new_hashed_password',
      });

      await service.update(id, userId, updateData);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id },
        data: { password: 'new_hashed_password' },
      });
    });
  });

  describe('remove', () => {
    it('should soft delete an agent', async () => {
      const id = '1';
      const userId = '1';

      mockPrismaService.agent.update.mockResolvedValue({ id });

      await service.remove(id, userId);

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('validatePassword', () => {
    it('should return true if password matches', async () => {
      const agent = {
        id: '1',
        password: 'hashed_password',
      };
      const password = 'password123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword(agent, password);

      expect(result).toBe(true);
    });

    it('should return false if password does not match', async () => {
      const agent = {
        id: '1',
        password: 'hashed_password',
      };
      const password = 'wrongpassword';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword(agent, password);

      expect(result).toBe(false);
    });
  });
});
