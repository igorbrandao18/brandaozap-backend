import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { Contact, ContactTag, Prisma } from '@prisma/client';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    userId: string,
    name: string,
    phoneNumber: string,
    email?: string,
    customFields?: Record<string, any>,
    notes?: string,
  ): Promise<Contact> {
    await this.usersService.findById(userId);

    return this.prisma.contact.create({
      data: {
        name,
        phoneNumber,
        email,
        customFields,
        notes,
        userId,
      },
      include: { tags: true },
    });
  }

  async findAll(userId: string): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: { userId, deletedAt: null },
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string): Promise<Contact> {
    const contact = await this.prisma.contact.findFirst({
      where: { id, userId, deletedAt: null },
      include: { tags: true },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async findByPhoneNumber(
    phoneNumber: string,
    userId: string,
  ): Promise<Contact | null> {
    return this.prisma.contact.findFirst({
      where: { phoneNumber, userId, deletedAt: null },
      include: { tags: true },
    });
  }

  async update(
    id: string,
    userId: string,
    updateData: Prisma.ContactUpdateInput,
  ): Promise<Contact> {
    await this.findById(id, userId);

    return this.prisma.contact.update({
      where: { id },
      data: updateData,
      include: { tags: true },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addTags(
    id: string,
    userId: string,
    tagIds: string[],
  ): Promise<Contact> {
    await this.findById(id, userId);

    return this.prisma.contact.update({
      where: { id },
      data: {
        tags: {
          connect: tagIds.map((tagId) => ({ id: tagId })),
        },
      },
      include: { tags: true },
    });
  }

  async removeTags(
    id: string,
    userId: string,
    tagIds: string[],
  ): Promise<Contact> {
    await this.findById(id, userId);

    return this.prisma.contact.update({
      where: { id },
      data: {
        tags: {
          disconnect: tagIds.map((tagId) => ({ id: tagId })),
        },
      },
      include: { tags: true },
    });
  }

  // Tags Management
  async createTag(
    userId: string,
    name: string,
    color: string,
  ): Promise<ContactTag> {
    await this.usersService.findById(userId);

    return this.prisma.contactTag.create({
      data: {
        name,
        color,
        userId,
      },
    });
  }

  async getUserTags(userId: string): Promise<ContactTag[]> {
    return this.prisma.contactTag.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTag(
    id: string,
    userId: string,
    updateData: Prisma.ContactTagUpdateInput,
  ): Promise<ContactTag> {
    const tag = await this.prisma.contactTag.findFirst({
      where: { id, userId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return this.prisma.contactTag.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteTag(id: string, userId: string): Promise<void> {
    const tag = await this.prisma.contactTag.findFirst({
      where: { id, userId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.prisma.contactTag.delete({
      where: { id },
    });
  }
}
