import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Template, TemplateCategory, Prisma } from '@prisma/client';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    name: string,
    flowData: any,
    category: TemplateCategory,
    userId?: string,
    description?: string,
    isPublic: boolean = false,
  ): Promise<Template> {
    return this.prisma.template.create({
      data: {
        name,
        description,
        flowData,
        category,
        userId,
        isPublic,
      },
    });
  }

  async findAll(userId?: string): Promise<Template[]> {
    const where: Prisma.TemplateWhereInput = { deletedAt: null };
    
    if (userId) {
      where.userId = userId;
    } else {
      where.isPublic = true;
    }

    return this.prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCategory(
    category: TemplateCategory,
    userId?: string,
  ): Promise<Template[]> {
    const where: Prisma.TemplateWhereInput = { category, deletedAt: null };
    
    if (userId) {
      where.userId = userId;
    } else {
      where.isPublic = true;
    }

    return this.prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Template> {
    const template = await this.prisma.template.findFirst({
      where: { id, deletedAt: null },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async update(
    id: string,
    userId: string,
    updateData: Prisma.TemplateUpdateInput,
  ): Promise<Template> {
    const template = await this.prisma.template.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.prisma.template.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const template = await this.prisma.template.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await this.prisma.template.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(id: string, userId: string, name?: string): Promise<Template> {
    const template = await this.findById(id);
    
    return this.prisma.template.create({
      data: {
        name: name || `${template.name} (Copy)`,
        description: template.description,
        flowData: template.flowData as any,
        category: template.category,
        userId,
        isPublic: false,
      },
    });
  }
}
