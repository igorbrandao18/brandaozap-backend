import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, Prisma } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: Prisma.UserUpdateInput,
  ): Promise<User> {
    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
