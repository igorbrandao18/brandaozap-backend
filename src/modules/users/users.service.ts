import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(email: string, password: string, name: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
    });
  }

  async update(id: string, updateData: Prisma.UserUpdateInput): Promise<User> {
    await this.findById(id);
    
    if (updateData.password && typeof updateData.password === 'string') {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}
