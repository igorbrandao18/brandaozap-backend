import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignStatus } from '@prisma/client';

describe('CampaignsController', () => {
  let controller: CampaignsController;
  let service: CampaignsService;

  const mockCampaignsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    start: jest.fn(),
    pause: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignsController],
      providers: [
        {
          provide: CampaignsService,
          useValue: mockCampaignsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CampaignsController>(CampaignsController);
    service = module.get<CampaignsService>(CampaignsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a campaign', async () => {
      const user = { userId: '1' };
      const createDto = {
        name: 'Test Campaign',
        message: 'Hello',
        recipients: ['+1234567890'],
        sessionId: 'session-1',
      };

      const campaign = {
        id: '1',
        ...createDto,
        userId: user.userId,
        status: CampaignStatus.DRAFT,
      };

      mockCampaignsService.create.mockResolvedValue(campaign);

      const result = await controller.create(user, createDto);

      expect(result).toEqual(campaign);
    });
  });

  describe('findAll', () => {
    it('should return all campaigns', async () => {
      const user = { userId: '1' };
      const campaigns = [
        {
          id: '1',
          name: 'Campaign 1',
          userId: user.userId,
        },
      ];

      mockCampaignsService.findAll.mockResolvedValue(campaigns);

      const result = await controller.findAll(user);

      expect(result).toEqual(campaigns);
    });
  });

  describe('findOne', () => {
    it('should return a campaign by id', async () => {
      const user = { userId: '1' };
      const campaign = {
        id: '1',
        name: 'Test Campaign',
        userId: user.userId,
      };

      mockCampaignsService.findById.mockResolvedValue(campaign);

      const result = await controller.findOne('1', user);

      expect(result).toEqual(campaign);
    });
  });

  describe('update', () => {
    it('should update a campaign', async () => {
      const user = { userId: '1' };
      const updateData = {
        name: 'Updated Campaign',
      };

      const updatedCampaign = {
        id: '1',
        name: 'Updated Campaign',
        userId: user.userId,
      };

      mockCampaignsService.update.mockResolvedValue(updatedCampaign);

      const result = await controller.update('1', user, updateData);

      expect(result).toEqual(updatedCampaign);
    });
  });

  describe('start', () => {
    it('should start a campaign', async () => {
      const user = { userId: '1' };
      const campaign = {
        id: '1',
        status: CampaignStatus.RUNNING,
      };

      mockCampaignsService.start.mockResolvedValue(campaign);

      const result = await controller.start('1', user);

      expect(result).toEqual(campaign);
    });
  });

  describe('pause', () => {
    it('should pause a campaign', async () => {
      const user = { userId: '1' };
      const campaign = {
        id: '1',
        status: CampaignStatus.PAUSED,
      };

      mockCampaignsService.pause.mockResolvedValue(campaign);

      const result = await controller.pause('1', user);

      expect(result).toEqual(campaign);
    });
  });

  describe('cancel', () => {
    it('should cancel a campaign', async () => {
      const user = { userId: '1' };
      const campaign = {
        id: '1',
        status: CampaignStatus.CANCELLED,
      };

      mockCampaignsService.cancel.mockResolvedValue(campaign);

      const result = await controller.cancel('1', user);

      expect(result).toEqual(campaign);
    });
  });

  describe('remove', () => {
    it('should remove a campaign', async () => {
      const user = { userId: '1' };

      mockCampaignsService.remove.mockResolvedValue(undefined);

      await controller.remove('1', user);

      expect(service.remove).toHaveBeenCalledWith('1', user.userId);
    });
  });
});
