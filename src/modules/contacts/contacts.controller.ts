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
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateTagDto } from './dto/create-tag.dto';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  async create(
    @CurrentUser() user: { userId: string },
    @Body() createContactDto: CreateContactDto,
  ) {
    return this.contactsService.create(
      user.userId,
      createContactDto.name,
      createContactDto.phoneNumber,
      createContactDto.email,
      createContactDto.customFields,
      createContactDto.notes,
    );
  }

  @Get()
  async findAll(@CurrentUser() user: { userId: string }) {
    return this.contactsService.findAll(user.userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.contactsService.findById(id, user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactsService.update(id, user.userId, updateContactDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.contactsService.remove(id, user.userId);
  }

  @Patch(':id/tags')
  async addTags(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() body: { tagIds: string[] },
  ) {
    return this.contactsService.addTags(id, user.userId, body.tagIds);
  }

  @Delete(':id/tags')
  async removeTags(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() body: { tagIds: string[] },
  ) {
    return this.contactsService.removeTags(id, user.userId, body.tagIds);
  }

  // Tags endpoints
  @Post('tags')
  async createTag(
    @CurrentUser() user: { userId: string },
    @Body() createTagDto: CreateTagDto,
  ) {
    return this.contactsService.createTag(
      user.userId,
      createTagDto.name,
      createTagDto.color || '#3B82F6',
    );
  }

  @Get('tags')
  async getUserTags(@CurrentUser() user: { userId: string }) {
    return this.contactsService.getUserTags(user.userId);
  }

  @Put('tags/:id')
  async updateTag(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() updateData: Partial<CreateTagDto>,
  ) {
    return this.contactsService.updateTag(id, user.userId, updateData);
  }

  @Delete('tags/:id')
  async deleteTag(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.contactsService.deleteTag(id, user.userId);
  }
}
