import { Test, TestingModule } from '@nestjs/testing';
import { FlowsController } from './flows.controller';
import { FlowsService } from './flows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('FlowsController', () => {
  let controller: FlowsController;
  let service: FlowsService;

  const mockFlowsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlowsController],
      providers: [
        {
          provide: FlowsService,
          useValue: mockFlowsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FlowsController>(FlowsController);
    service = module.get<FlowsService>(FlowsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a flow', async () => {
      const user = { userId: '1' };
      const createDto = {
        name: 'Test Flow',
        nodes: [{ id: '1', type: 'start' }],
        edges: [],
      };

      const flow = {
        id: '1',
        ...createDto,
        userId: user.userId,
        isActive: false,
        version: 1,
      };

      mockFlowsService.create.mockResolvedValue(flow);

      const result = await controller.create(user, createDto);

      expect(result).toEqual(flow);
    });
  });

  describe('findAll', () => {
    it('should return all flows', async () => {
      const user = { userId: '1' };
      const flows = [
        {
          id: '1',
          name: 'Flow 1',
          userId: user.userId,
        },
      ];

      mockFlowsService.findAll.mockResolvedValue(flows);

      const result = await controller.findAll(user);

      expect(result).toEqual(flows);
    });
  });

  describe('findOne', () => {
    it('should return a flow by id', async () => {
      const user = { userId: '1' };
      const flow = {
        id: '1',
        name: 'Test Flow',
        userId: user.userId,
      };

      mockFlowsService.findById.mockResolvedValue(flow);

      const result = await controller.findOne('1', user);

      expect(result).toEqual(flow);
    });
  });

  describe('update', () => {
    it('should update a flow', async () => {
      const user = { userId: '1' };
      const updateData = {
        name: 'Updated Flow',
      };

      const updatedFlow = {
        id: '1',
        name: 'Updated Flow',
        userId: user.userId,
      };

      mockFlowsService.update.mockResolvedValue(updatedFlow);

      const result = await controller.update('1', user, updateData);

      expect(result).toEqual(updatedFlow);
    });
  });

  describe('activate', () => {
    it('should activate a flow', async () => {
      const user = { userId: '1' };
      const flow = {
        id: '1',
        isActive: true,
      };

      mockFlowsService.activate.mockResolvedValue(flow);

      const result = await controller.activate('1', user);

      expect(result).toEqual(flow);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a flow', async () => {
      const user = { userId: '1' };
      const flow = {
        id: '1',
        isActive: false,
      };

      mockFlowsService.deactivate.mockResolvedValue(flow);

      const result = await controller.deactivate('1', user);

      expect(result).toEqual(flow);
    });
  });

  describe('remove', () => {
    it('should remove a flow', async () => {
      const user = { userId: '1' };

      mockFlowsService.remove.mockResolvedValue(undefined);

      await controller.remove('1', user);

      expect(service.remove).toHaveBeenCalledWith('1', user.userId);
    });
  });
});
