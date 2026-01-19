import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  async create(
    @CurrentUser() user: { userId: string },
    @Body() createCampaignDto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(
      user.userId,
      createCampaignDto.name,
      createCampaignDto.message,
      createCampaignDto.recipients,
      createCampaignDto.sessionId,
      createCampaignDto.description,
      createCampaignDto.scheduledAt ? new Date(createCampaignDto.scheduledAt) : undefined,
    );
  }

  @Get()
  async findAll(@CurrentUser() user: { userId: string }) {
    return this.campaignsService.findAll(user.userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.campaignsService.findById(id, user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() updateData: Partial<CreateCampaignDto>,
  ) {
    return this.campaignsService.update(id, user.userId, updateData);
  }

  @Patch(':id/start')
  async start(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.campaignsService.start(id, user.userId);
  }

  @Patch(':id/pause')
  async pause(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.campaignsService.pause(id, user.userId);
  }

  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.campaignsService.cancel(id, user.userId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.campaignsService.remove(id, user.userId);
  }
}
