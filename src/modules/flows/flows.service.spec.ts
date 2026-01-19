import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FlowsService } from './flows.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';

describe('FlowsService', () => {
  let service: FlowsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    flow: {
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
        FlowsService,
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

    service = module.get<FlowsService>(FlowsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a flow', async () => {
      const userId = '1';
      const name = 'Test Flow';
      const nodes = [{ id: '1', type: 'start' }];
      const edges = [];

      const flow = {
        id: '1',
        name,
        nodes,
        edges,
        userId,
        isActive: false,
        version: 1,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findById.mockResolvedValue({ id: userId });
      mockPrismaService.flow.create.mockResolvedValue(flow);

      const result = await service.create(userId, name, nodes, edges);

      expect(result).toEqual(flow);
    });

    it('should throw BadRequestException if no nodes', async () => {
      const userId = '1';
      mockUsersService.findById.mockResolvedValue({ id: userId });

      await expect(service.create(userId, 'Test', [], [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if no start node', async () => {
      const userId = '1';
      const nodes = [{ id: '1', type: 'message' }];
      mockUsersService.findById.mockResolvedValue({ id: userId });

      await expect(service.create(userId, 'Test', nodes, [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if edge references non-existent node', async () => {
      const userId = '1';
      const nodes = [{ id: '1', type: 'start' }];
      const edges = [{ source: '1', target: 'non-existent' }];
      mockUsersService.findById.mockResolvedValue({ id: userId });

      await expect(service.create(userId, 'Test', nodes, edges)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all flows for user', async () => {
      const userId = '1';
      const flows = [
        {
          id: '1',
          name: 'Flow 1',
          userId,
          deletedAt: null,
        },
      ];

      mockPrismaService.flow.findMany.mockResolvedValue(flows);

      const result = await service.findAll(userId);

      expect(result).toEqual(flows);
    });
  });

  describe('findById', () => {
    it('should return a flow by id', async () => {
      const id = '1';
      const userId = '1';
      const flow = {
        id,
        name: 'Test Flow',
        userId,
        deletedAt: null,
      };

      mockPrismaService.flow.findFirst.mockResolvedValue(flow);

      const result = await service.findById(id, userId);

      expect(result).toEqual(flow);
    });

    it('should throw NotFoundException if flow not found', async () => {
      mockPrismaService.flow.findFirst.mockResolvedValue(null);

      await expect(service.findById('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a flow', async () => {
      const id = '1';
      const userId = '1';
      const flow = {
        id,
        name: 'Test Flow',
        nodes: [{ id: '1', type: 'start' }],
        edges: [],
        version: 1,
        userId,
        deletedAt: null,
      };

      const updateData = { name: 'Updated Flow' };

      mockPrismaService.flow.findFirst.mockResolvedValue(flow);
      mockPrismaService.flow.update.mockResolvedValue({
        ...flow,
        ...updateData,
      });

      const result = await service.update(id, userId, updateData);

      expect(result.name).toBe('Updated Flow');
    });

    it('should validate and increment version when updating nodes', async () => {
      const id = '1';
      const userId = '1';
      const flow = {
        id,
        name: 'Test Flow',
        nodes: [{ id: '1', type: 'start' }],
        edges: [],
        version: 1,
        userId,
        deletedAt: null,
      };

      const newNodes = [{ id: '1', type: 'start' }, { id: '2', type: 'message' }];
      const updateData = { nodes: newNodes };

      mockPrismaService.flow.findFirst.mockResolvedValue(flow);
      mockPrismaService.flow.update.mockResolvedValue({
        ...flow,
        nodes: newNodes,
        version: 2,
      });

      const result = await service.update(id, userId, updateData);

      expect(prisma.flow.update).toHaveBeenCalledWith({
        where: { id },
        data: expect.objectContaining({
          nodes: newNodes,
          version: { increment: 1 },
        }),
      });
    });

    it('should validate edges when updating', async () => {
      const id = '1';
      const userId = '1';
      const flow = {
        id,
        name: 'Test Flow',
        nodes: [{ id: '1', type: 'start' }, { id: '2', type: 'message' }],
        edges: [],
        version: 1,
        userId,
        deletedAt: null,
      };

      const newEdges = [{ source: '1', target: '2' }];
      const updateData = { edges: newEdges };

      mockPrismaService.flow.findFirst.mockResolvedValue(flow);
      mockPrismaService.flow.update.mockResolvedValue({
        ...flow,
        edges: newEdges,
        version: 2,
      });

      await service.update(id, userId, updateData);

      expect(prisma.flow.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if edge references non-existent node', async () => {
      const id = '1';
      const userId = '1';
      const flow = {
        id,
        name: 'Test Flow',
        nodes: [{ id: '1', type: 'start' }],
        edges: [],
        version: 1,
        userId,
        deletedAt: null,
      };

      const newEdges = [{ source: '1', target: 'non-existent' }];
      const updateData = { edges: newEdges };

      mockPrismaService.flow.findFirst.mockResolvedValue(flow);

      await expect(service.update(id, userId, updateData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a flow', async () => {
      const id = '1';
      const userId = '1';

      mockPrismaService.flow.update.mockResolvedValue({ id });

      await service.remove(id, userId);

      expect(prisma.flow.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('activate', () => {
    it('should activate a flow', async () => {
      const id = '1';
      const userId = '1';
      const flow = {
        id,
        userId,
        isActive: false,
      };

      mockPrismaService.flow.findFirst.mockResolvedValue(flow);
      mockPrismaService.flow.update.mockResolvedValue({ ...flow, isActive: true });

      const result = await service.activate(id, userId);

      expect(result.isActive).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a flow', async () => {
      const id = '1';
      const userId = '1';
      const flow = {
        id,
        userId,
        isActive: true,
      };

      mockPrismaService.flow.findFirst.mockResolvedValue(flow);
      mockPrismaService.flow.update.mockResolvedValue({ ...flow, isActive: false });

      const result = await service.deactivate(id, userId);

      expect(result.isActive).toBe(false);
    });
  });
});
