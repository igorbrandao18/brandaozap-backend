import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { Keyword, KeywordMatchType, Prisma } from '@prisma/client';

@Injectable()
export class KeywordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    userId: string,
    keyword: string,
    response: string,
    matchType: KeywordMatchType = KeywordMatchType.CONTAINS,
    priority: number = 0,
  ): Promise<Keyword> {
    await this.usersService.findById(userId);

    return this.prisma.keyword.create({
      data: {
        keyword,
        response,
        matchType,
        priority,
        userId,
        isActive: true,
      },
    });
  }

  async findAll(userId: string): Promise<Keyword[]> {
    return this.prisma.keyword.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string, userId: string): Promise<Keyword> {
    const keyword = await this.prisma.keyword.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!keyword) {
      throw new NotFoundException('Keyword not found');
    }

    return keyword;
  }

  async update(
    id: string,
    userId: string,
    updateData: Prisma.KeywordUpdateInput,
  ): Promise<Keyword> {
    await this.findById(id, userId);

    return this.prisma.keyword.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.prisma.keyword.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findMatchingKeyword(
    userId: string,
    message: string,
  ): Promise<Keyword | null> {
    const keywords = await this.prisma.keyword.findMany({
      where: { userId, isActive: true, deletedAt: null },
      orderBy: { priority: 'desc' },
    });

    const normalizedMessage = message.toLowerCase().trim();

    for (const keyword of keywords) {
      if (this.matches(keyword, normalizedMessage)) {
        return keyword;
      }
    }

    return null;
  }

  private matches(keyword: Keyword, message: string): boolean {
    const normalizedKeyword = keyword.keyword.toLowerCase().trim();

    switch (keyword.matchType) {
      case KeywordMatchType.EXACT:
        return message === normalizedKeyword;

      case KeywordMatchType.CONTAINS:
        return message.includes(normalizedKeyword);

      case KeywordMatchType.STARTS_WITH:
        return message.startsWith(normalizedKeyword);

      case KeywordMatchType.REGEX:
        try {
          const regex = new RegExp(normalizedKeyword, 'i');
          return regex.test(message);
        } catch (error) {
          return false;
        }

      default:
        return false;
    }
  }
}
