import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TemplateCategory } from '@prisma/client';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    template: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a template', async () => {
      const templateData = {
        name: 'Test Template',
        flowData: { nodes: [], edges: [] },
        category: TemplateCategory.AGENDAMENTO,
      };

      const template = {
        id: '1',
        ...templateData,
        userId: null,
        description: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.template.create.mockResolvedValue(template);

      const result = await service.create(
        templateData.name,
        templateData.flowData,
        templateData.category,
      );

      expect(result).toEqual(template);
    });
  });

  describe('findById', () => {
    it('should return a template by id', async () => {
      const id = '1';
      const template = {
        id,
        name: 'Test Template',
        flowData: {},
        category: TemplateCategory.AGENDAMENTO,
        deletedAt: null,
      };

      mockPrismaService.template.findFirst.mockResolvedValue(template);

      const result = await service.findById(id);

      expect(result).toEqual(template);
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.template.findFirst.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return public templates when no userId', async () => {
      const templates = [
        {
          id: '1',
          name: 'Public Template',
          isPublic: true,
          deletedAt: null,
        },
      ];

      mockPrismaService.template.findMany.mockResolvedValue(templates);

      const result = await service.findAll();

      expect(result).toEqual(templates);
      expect(prisma.template.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null, isPublic: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return user templates when userId provided', async () => {
      const userId = '1';
      const templates = [
        {
          id: '1',
          name: 'User Template',
          userId,
          deletedAt: null,
        },
      ];

      mockPrismaService.template.findMany.mockResolvedValue(templates);

      const result = await service.findAll(userId);

      expect(result).toEqual(templates);
      expect(prisma.template.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null, userId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findByCategory', () => {
    it('should return public templates by category when no userId', async () => {
      const category = TemplateCategory.AGENDAMENTO;
      const templates = [
        {
          id: '1',
          name: 'Public Template',
          category,
          isPublic: true,
          deletedAt: null,
        },
      ];

      mockPrismaService.template.findMany.mockResolvedValue(templates);

      const result = await service.findByCategory(category);

      expect(result).toEqual(templates);
      expect(prisma.template.findMany).toHaveBeenCalledWith({
        where: { category, deletedAt: null, isPublic: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return user templates by category when userId provided', async () => {
      const category = TemplateCategory.AGENDAMENTO;
      const userId = '1';
      const templates = [
        {
          id: '1',
          name: 'User Template',
          category,
          userId,
          deletedAt: null,
        },
      ];

      mockPrismaService.template.findMany.mockResolvedValue(templates);

      const result = await service.findByCategory(category, userId);

      expect(result).toEqual(templates);
      expect(prisma.template.findMany).toHaveBeenCalledWith({
        where: { category, deletedAt: null, userId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      const id = '1';
      const userId = '1';
      const template = {
        id,
        name: 'Test Template',
        userId,
        deletedAt: null,
      };

      const updateData = { name: 'Updated Template' };

      mockPrismaService.template.findFirst.mockResolvedValue(template);
      mockPrismaService.template.update.mockResolvedValue({
        ...template,
        ...updateData,
      });

      const result = await service.update(id, userId, updateData);

      expect(result.name).toBe('Updated Template');
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.template.findFirst.mockResolvedValue(null);

      await expect(service.update('1', '1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a template', async () => {
      const id = '1';
      const userId = '1';
      const template = {
        id,
        name: 'Test Template',
        userId,
        deletedAt: null,
      };

      mockPrismaService.template.findFirst.mockResolvedValue(template);
      mockPrismaService.template.update.mockResolvedValue({
        ...template,
        deletedAt: new Date(),
      });

      await service.remove(id, userId);

      expect(prisma.template.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.template.findFirst.mockResolvedValue(null);

      await expect(service.remove('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('duplicate', () => {
    it('should duplicate a template', async () => {
      const id = '1';
      const userId = '1';
      const originalTemplate = {
        id,
        name: 'Original',
        flowData: { nodes: [] },
        category: TemplateCategory.AGENDAMENTO,
        description: 'Original description',
        deletedAt: null,
      };

      const duplicatedTemplate = {
        id: '2',
        name: 'Original (Copy)',
        flowData: originalTemplate.flowData,
        category: originalTemplate.category,
        description: originalTemplate.description,
        userId,
        isPublic: false,
      };

      mockPrismaService.template.findFirst.mockResolvedValue(originalTemplate);
      mockPrismaService.template.create.mockResolvedValue(duplicatedTemplate);

      const result = await service.duplicate(id, userId);

      expect(result.name).toBe('Original (Copy)');
      expect(result.flowData).toEqual(originalTemplate.flowData);
    });

    it('should duplicate with custom name', async () => {
      const id = '1';
      const userId = '1';
      const customName = 'Custom Copy';
      const originalTemplate = {
        id,
        name: 'Original',
        flowData: { nodes: [] },
        category: TemplateCategory.AGENDAMENTO,
        description: 'Original description',
        deletedAt: null,
      };

      const duplicatedTemplate = {
        id: '2',
        name: customName,
        flowData: originalTemplate.flowData,
        category: originalTemplate.category,
        description: originalTemplate.description,
        userId,
        isPublic: false,
      };

      mockPrismaService.template.findFirst.mockResolvedValue(originalTemplate);
      mockPrismaService.template.create.mockResolvedValue(duplicatedTemplate);

      const result = await service.duplicate(id, userId, customName);

      expect(result.name).toBe(customName);
    });
  });
});
