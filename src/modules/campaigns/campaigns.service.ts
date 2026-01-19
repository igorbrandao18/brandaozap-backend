import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { Campaign, CampaignStatus, Prisma } from '@prisma/client';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async create(
    userId: string,
    name: string,
    message: string,
    recipients: string[],
    sessionId: string,
    description?: string,
    scheduledAt?: Date,
  ): Promise<Campaign> {
    await this.usersService.findById(userId);
    await this.whatsappService.getSession(sessionId);

    if (recipients.length === 0) {
      throw new BadRequestException('Campaign must have at least one recipient');
    }

    return this.prisma.campaign.create({
      data: {
        name,
        description,
        message,
        recipients,
        sessionId,
        userId,
        totalRecipients: recipients.length,
        scheduledAt,
        status: scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
      },
      include: { session: true },
    });
  }

  async findAll(userId: string): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: { userId, deletedAt: null },
      include: { session: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId, deletedAt: null },
      include: { session: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async update(
    id: string,
    userId: string,
    updateData: Prisma.CampaignUpdateInput,
  ): Promise<Campaign> {
    const campaign = await this.findById(id, userId);

    if (campaign.status === CampaignStatus.RUNNING) {
      throw new BadRequestException('Cannot update running campaign');
    }

    if (updateData.recipients) {
      const recipients = updateData.recipients as string[];
      updateData.totalRecipients = recipients.length;
    }

    return this.prisma.campaign.update({
      where: { id },
      data: updateData,
      include: { session: true },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const campaign = await this.findById(id, userId);

    if (campaign.status === CampaignStatus.RUNNING) {
      throw new BadRequestException('Cannot delete running campaign');
    }

    await this.prisma.campaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async start(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.findById(id, userId);

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new BadRequestException('Campaign cannot be started');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.RUNNING },
      include: { session: true },
    });
  }

  async pause(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.findById(id, userId);

    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new BadRequestException('Only running campaigns can be paused');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.PAUSED },
      include: { session: true },
    });
  }

  async cancel(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.findById(id, userId);

    if (campaign.status === CampaignStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed campaign');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.CANCELLED },
      include: { session: true },
    });
  }
}
