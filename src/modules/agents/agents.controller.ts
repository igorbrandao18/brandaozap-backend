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
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAgentDto } from './dto/create-agent.dto';
import { AgentStatus } from '@prisma/client';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  async create(
    @CurrentUser() user: { userId: string },
    @Body() createAgentDto: CreateAgentDto,
  ) {
    return this.agentsService.create(
      user.userId,
      createAgentDto.name,
      createAgentDto.email,
      createAgentDto.password,
    );
  }

  @Get()
  async findAll(@CurrentUser() user: { userId: string }) {
    return this.agentsService.findAll(user.userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.agentsService.findById(id, user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() updateData: Partial<CreateAgentDto>,
  ) {
    return this.agentsService.update(id, user.userId, updateData);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() body: { status: AgentStatus },
  ) {
    return this.agentsService.updateStatus(id, user.userId, body.status);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.agentsService.remove(id, user.userId);
  }
}
