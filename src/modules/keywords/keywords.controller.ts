import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { KeywordsService } from './keywords.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateKeywordDto } from './dto/create-keyword.dto';

@Controller('keywords')
@UseGuards(JwtAuthGuard)
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  @Post()
  async create(
    @CurrentUser() user: { userId: string },
    @Body() createKeywordDto: CreateKeywordDto,
  ) {
    return this.keywordsService.create(
      user.userId,
      createKeywordDto.keyword,
      createKeywordDto.response,
      createKeywordDto.matchType,
      createKeywordDto.priority,
    );
  }

  @Get()
  async findAll(@CurrentUser() user: { userId: string }) {
    return this.keywordsService.findAll(user.userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.keywordsService.findById(id, user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() updateData: Partial<CreateKeywordDto>,
  ) {
    return this.keywordsService.update(id, user.userId, updateData);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.keywordsService.remove(id, user.userId);
  }
}
