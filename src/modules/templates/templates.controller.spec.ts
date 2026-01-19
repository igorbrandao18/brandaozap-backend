import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TemplateCategory } from '@prisma/client';

describe('TemplatesController', () => {
  let controller: TemplatesController;
  let service: TemplatesService;

  const mockTemplatesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByCategory: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    duplicate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        {
          provide: TemplatesService,
          useValue: mockTemplatesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TemplatesController>(TemplatesController);
    service = module.get<TemplatesService>(TemplatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a template', async () => {
      const user = { userId: '1' };
      const createDto = {
        name: 'Test Template',
        flowData: { nodes: [], edges: [] },
        category: TemplateCategory.AGENDAMENTO,
      };

      const template = {
        id: '1',
        ...createDto,
        userId: user.userId,
        isPublic: false,
      };

      mockTemplatesService.create.mockResolvedValue(template);

      const result = await controller.create(user, createDto);

      expect(result).toEqual(template);
    });
  });

  describe('findAll', () => {
    it('should return templates without category filter', async () => {
      const user = { userId: '1' };
      const templates = [
        {
          id: '1',
          name: 'Template 1',
          userId: user.userId,
        },
      ];

      mockTemplatesService.findAll.mockResolvedValue(templates);

      const result = await controller.findAll(undefined, user);

      expect(result).toEqual(templates);
    });

    it('should return templates by category', async () => {
      const user = { userId: '1' };
      const category = TemplateCategory.AGENDAMENTO;
      const templates = [
        {
          id: '1',
          name: 'Template 1',
          category,
          userId: user.userId,
        },
      ];

      mockTemplatesService.findByCategory.mockResolvedValue(templates);

      const result = await controller.findAll(category, user);

      expect(result).toEqual(templates);
      expect(service.findByCategory).toHaveBeenCalledWith(category, user.userId);
    });
  });

  describe('findOne', () => {
    it('should return a template by id', async () => {
      const template = {
        id: '1',
        name: 'Test Template',
        category: TemplateCategory.AGENDAMENTO,
      };

      mockTemplatesService.findById.mockResolvedValue(template);

      const result = await controller.findOne('1');

      expect(result).toEqual(template);
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      const user = { userId: '1' };
      const updateData = {
        name: 'Updated Template',
      };

      const updatedTemplate = {
        id: '1',
        name: 'Updated Template',
        userId: user.userId,
      };

      mockTemplatesService.update.mockResolvedValue(updatedTemplate);

      const result = await controller.update('1', user, updateData);

      expect(result).toEqual(updatedTemplate);
    });
  });

  describe('duplicate', () => {
    it('should duplicate a template', async () => {
      const user = { userId: '1' };
      const duplicatedTemplate = {
        id: '2',
        name: 'Original (Copy)',
        flowData: {},
        category: TemplateCategory.AGENDAMENTO,
      };

      mockTemplatesService.duplicate.mockResolvedValue(duplicatedTemplate);

      const result = await controller.duplicate('1', user, {});

      expect(result).toEqual(duplicatedTemplate);
    });

    it('should duplicate with custom name', async () => {
      const user = { userId: '1' };
      const duplicatedTemplate = {
        id: '2',
        name: 'Custom Copy',
        flowData: {},
        category: TemplateCategory.AGENDAMENTO,
      };

      mockTemplatesService.duplicate.mockResolvedValue(duplicatedTemplate);

      const result = await controller.duplicate('1', user, { name: 'Custom Copy' });

      expect(result).toEqual(duplicatedTemplate);
      expect(service.duplicate).toHaveBeenCalledWith('1', user.userId, 'Custom Copy');
    });
  });

  describe('remove', () => {
    it('should remove a template', async () => {
      const user = { userId: '1' };

      mockTemplatesService.remove.mockResolvedValue(undefined);

      await controller.remove('1', user);

      expect(service.remove).toHaveBeenCalledWith('1', user.userId);
    });
  });
});
