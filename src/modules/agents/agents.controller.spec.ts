import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentStatus } from '@prisma/client';

describe('AgentsController', () => {
  let controller: AgentsController;
  let service: AgentsService;

  const mockAgentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        {
          provide: AgentsService,
          useValue: mockAgentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AgentsController>(AgentsController);
    service = module.get<AgentsService>(AgentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an agent', async () => {
      const user = { userId: '1' };
      const createDto = {
        name: 'Agent 1',
        email: 'agent@example.com',
        password: 'password123',
      };

      const agent = {
        id: '1',
        ...createDto,
        password: 'hashed',
        userId: user.userId,
        status: AgentStatus.OFFLINE,
      };

      mockAgentsService.create.mockResolvedValue(agent);

      const result = await controller.create(user, createDto);

      expect(result).toEqual(agent);
    });
  });

  describe('findAll', () => {
    it('should return all agents', async () => {
      const user = { userId: '1' };
      const agents = [
        {
          id: '1',
          name: 'Agent 1',
          email: 'agent1@example.com',
          userId: user.userId,
        },
      ];

      mockAgentsService.findAll.mockResolvedValue(agents);

      const result = await controller.findAll(user);

      expect(result).toEqual(agents);
    });
  });

  describe('findOne', () => {
    it('should return an agent by id', async () => {
      const user = { userId: '1' };
      const agent = {
        id: '1',
        name: 'Agent 1',
        email: 'agent@example.com',
        userId: user.userId,
      };

      mockAgentsService.findById.mockResolvedValue(agent);

      const result = await controller.findOne('1', user);

      expect(result).toEqual(agent);
    });
  });

  describe('update', () => {
    it('should update an agent', async () => {
      const user = { userId: '1' };
      const updateData = {
        name: 'Updated Agent',
      };

      const updatedAgent = {
        id: '1',
        name: 'Updated Agent',
        email: 'agent@example.com',
        userId: user.userId,
      };

      mockAgentsService.update.mockResolvedValue(updatedAgent);

      const result = await controller.update('1', user, updateData);

      expect(result).toEqual(updatedAgent);
    });
  });

  describe('updateStatus', () => {
    it('should update agent status', async () => {
      const user = { userId: '1' };
      const agent = {
        id: '1',
        status: AgentStatus.ONLINE,
      };

      mockAgentsService.updateStatus.mockResolvedValue(agent);

      const result = await controller.updateStatus('1', user, { status: AgentStatus.ONLINE });

      expect(result).toEqual(agent);
    });
  });

  describe('remove', () => {
    it('should remove an agent', async () => {
      const user = { userId: '1' };

      mockAgentsService.remove.mockResolvedValue(undefined);

      await controller.remove('1', user);

      expect(service.remove).toHaveBeenCalledWith('1', user.userId);
    });
  });
});
