import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CampaignStatus } from '@prisma/client';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    campaign: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockWhatsAppService = {
    getSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: WhatsAppService,
          useValue: mockWhatsAppService,
        },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a campaign', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const campaignData = {
        name: 'Test Campaign',
        message: 'Hello',
        recipients: ['+1234567890'],
      };

      const campaign = {
        id: '1',
        ...campaignData,
        sessionId,
        userId,
        status: CampaignStatus.DRAFT,
        totalRecipients: 1,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        description: null,
        scheduledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        session: null,
      };

      mockUsersService.findById.mockResolvedValue({ id: userId });
      mockWhatsAppService.getSession.mockResolvedValue({ id: sessionId });
      mockPrismaService.campaign.create.mockResolvedValue(campaign);

      const result = await service.create(
        userId,
        campaignData.name,
        campaignData.message,
        campaignData.recipients,
        sessionId,
      );

      expect(result).toEqual(campaign);
    });

    it('should create a scheduled campaign', async () => {
      const userId = '1';
      const sessionId = 'session-1';
      const scheduledAt = new Date('2024-12-31');
      const campaign = {
        id: '1',
        name: 'Scheduled Campaign',
        message: 'Hello',
        recipients: ['+1234567890'],
        sessionId,
        userId,
        status: CampaignStatus.SCHEDULED,
        scheduledAt,
        totalRecipients: 1,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        session: null,
      };

      mockUsersService.findById.mockResolvedValue({ id: userId });
      mockWhatsAppService.getSession.mockResolvedValue({ id: sessionId });
      mockPrismaService.campaign.create.mockResolvedValue(campaign);

      const result = await service.create(
        userId,
        campaign.name,
        campaign.message,
        campaign.recipients,
        sessionId,
        undefined,
        scheduledAt,
      );

      expect(result.status).toBe(CampaignStatus.SCHEDULED);
    });

    it('should throw BadRequestException if no recipients', async () => {
      const userId = '1';
      mockUsersService.findById.mockResolvedValue({ id: userId });
      mockWhatsAppService.getSession.mockResolvedValue({ id: 'session-1' });

      await expect(
        service.create(userId, 'Test', 'Message', [], 'session-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('start', () => {
    it('should start a campaign', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        userId,
        status: CampaignStatus.DRAFT,
      };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);
      mockPrismaService.campaign.update.mockResolvedValue({
        ...campaign,
        status: CampaignStatus.RUNNING,
        session: null,
      });

      const result = await service.start(id, userId);

      expect(result.status).toBe(CampaignStatus.RUNNING);
    });

    it('should throw BadRequestException if campaign cannot be started', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        userId,
        status: CampaignStatus.RUNNING,
      };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);

      await expect(service.start(id, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all campaigns for user', async () => {
      const userId = '1';
      const campaigns = [
        {
          id: '1',
          name: 'Campaign 1',
          userId,
          deletedAt: null,
          session: null,
        },
      ];

      mockPrismaService.campaign.findMany.mockResolvedValue(campaigns);

      const result = await service.findAll(userId);

      expect(result).toEqual(campaigns);
    });
  });

  describe('findById', () => {
    it('should return a campaign by id', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        name: 'Test Campaign',
        userId,
        deletedAt: null,
        session: null,
      };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);

      const result = await service.findById(id, userId);

      expect(result).toEqual(campaign);
    });

    it('should throw NotFoundException if campaign not found', async () => {
      mockPrismaService.campaign.findFirst.mockResolvedValue(null);

      await expect(service.findById('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a campaign', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        userId,
        status: CampaignStatus.DRAFT,
        recipients: ['+1234567890'],
        totalRecipients: 1,
        session: null,
      };

      const updateData = { name: 'Updated Campaign' };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);
      mockPrismaService.campaign.update.mockResolvedValue({
        ...campaign,
        ...updateData,
      });

      const result = await service.update(id, userId, updateData);

      expect(result.name).toBe('Updated Campaign');
    });

    it('should update totalRecipients when recipients are updated', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        userId,
        status: CampaignStatus.DRAFT,
        recipients: ['+1234567890'],
        totalRecipients: 1,
        session: null,
      };

      const updateData = { recipients: ['+1234567890', '+0987654321'] };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);
      mockPrismaService.campaign.update.mockResolvedValue({
        ...campaign,
        recipients: updateData.recipients,
        totalRecipients: 2,
      });

      await service.update(id, userId, updateData);

      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id },
        data: expect.objectContaining({
          recipients: updateData.recipients,
          totalRecipients: 2,
        }),
        include: { session: true },
      });
    });

    it('should throw BadRequestException if updating running campaign', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        userId,
        status: CampaignStatus.RUNNING,
        session: null,
      };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);

      await expect(service.update(id, userId, { name: 'Updated' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a campaign', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        userId,
        status: CampaignStatus.DRAFT,
        session: null,
      };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);
      mockPrismaService.campaign.update.mockResolvedValue({
        ...campaign,
        deletedAt: new Date(),
      });

      await service.remove(id, userId);

      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw BadRequestException if deleting running campaign', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        userId,
        status: CampaignStatus.RUNNING,
        session: null,
      };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);

      await expect(service.remove(id, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('start', () => {
    it('should start a scheduled campaign', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        userId,
        status: CampaignStatus.SCHEDULED,
        session: null,
      };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);
      mockPrismaService.campaign.update.mockResolvedValue({
        ...campaign,
        status: CampaignStatus.RUNNING,
      });

      const result = await service.start(id, userId);

      expect(result.status).toBe(CampaignStatus.RUNNING);
    });
  });

  describe('pause', () => {
    it('should pause a running campaign', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        userId,
        status: CampaignStatus.RUNNING,
        session: null,
      };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);
      mockPrismaService.campaign.update.mockResolvedValue({
        ...campaign,
        status: CampaignStatus.PAUSED,
      });

      const result = await service.pause(id, userId);

      expect(result.status).toBe(CampaignStatus.PAUSED);
    });

    it('should throw BadRequestException if campaign is not running', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        userId,
        status: CampaignStatus.DRAFT,
        session: null,
      };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);

      await expect(service.pause(id, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel a campaign', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        userId,
        status: CampaignStatus.RUNNING,
        session: null,
      };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);
      mockPrismaService.campaign.update.mockResolvedValue({
        ...campaign,
        status: CampaignStatus.CANCELLED,
      });

      const result = await service.cancel(id, userId);

      expect(result.status).toBe(CampaignStatus.CANCELLED);
    });

    it('should throw BadRequestException if campaign is completed', async () => {
      const id = '1';
      const userId = '1';
      const campaign = {
        id,
        userId,
        status: CampaignStatus.COMPLETED,
        session: null,
      };

      mockPrismaService.campaign.findFirst.mockResolvedValue(campaign);

      await expect(service.cancel(id, userId)).rejects.toThrow(BadRequestException);
    });
  });
});
