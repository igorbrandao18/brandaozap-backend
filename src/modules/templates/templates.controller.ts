import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Post as PostMethod,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTemplateDto } from './dto/create-template.dto';
import { TemplateCategory } from '@prisma/client';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: { userId: string },
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    return this.templatesService.create(
      createTemplateDto.name,
      createTemplateDto.flowData,
      createTemplateDto.category,
      user.userId,
      createTemplateDto.description,
      createTemplateDto.isPublic,
    );
  }

  @Get()
  async findAll(
    @Query('category') category?: TemplateCategory,
    @CurrentUser() user?: { userId: string },
  ) {
    if (category) {
      return this.templatesService.findByCategory(category, user?.userId);
    }
    return this.templatesService.findAll(user?.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() updateData: Partial<CreateTemplateDto>,
  ) {
    return this.templatesService.update(id, user.userId, updateData);
  }

  @PostMethod(':id/duplicate')
  @UseGuards(JwtAuthGuard)
  async duplicate(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() body?: { name?: string },
  ) {
    return this.templatesService.duplicate(id, user.userId, body?.name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.templatesService.remove(id, user.userId);
  }
}
