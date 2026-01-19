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
import { FlowsService } from './flows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateFlowDto } from './dto/create-flow.dto';

@Controller('flows')
@UseGuards(JwtAuthGuard)
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Post()
  async create(
    @CurrentUser() user: { userId: string },
    @Body() createFlowDto: CreateFlowDto,
  ) {
    return this.flowsService.create(
      user.userId,
      createFlowDto.name,
      createFlowDto.nodes,
      createFlowDto.edges,
      createFlowDto.description,
    );
  }

  @Get()
  async findAll(@CurrentUser() user: { userId: string }) {
    return this.flowsService.findAll(user.userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.flowsService.findById(id, user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() updateData: Partial<CreateFlowDto>,
  ) {
    return this.flowsService.update(id, user.userId, updateData);
  }

  @Patch(':id/activate')
  async activate(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.flowsService.activate(id, user.userId);
  }

  @Patch(':id/deactivate')
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.flowsService.deactivate(id, user.userId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.flowsService.remove(id, user.userId);
  }
}
