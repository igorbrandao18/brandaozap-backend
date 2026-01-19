import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KeywordsService } from './keywords.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { KeywordMatchType } from '@prisma/client';

describe('KeywordsService', () => {
  let service: KeywordsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    keyword: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeywordsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<KeywordsService>(KeywordsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a keyword', async () => {
      const userId = '1';
      const keywordData = {
        keyword: 'hello',
        response: 'Hi there!',
        matchType: KeywordMatchType.CONTAINS,
      };

      const createdKeyword = {
        id: '1',
        ...keywordData,
        priority: 0,
        isActive: true,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findById.mockResolvedValue({ id: userId });
      mockPrismaService.keyword.create.mockResolvedValue(createdKeyword);

      const result = await service.create(
        userId,
        keywordData.keyword,
        keywordData.response,
        keywordData.matchType,
      );

      expect(result).toEqual(createdKeyword);
    });
  });

  describe('findAll', () => {
    it('should return all keywords for user', async () => {
      const userId = '1';
      const keywords = [
        {
          id: '1',
          keyword: 'hello',
          response: 'Hi!',
          matchType: KeywordMatchType.CONTAINS,
          priority: 0,
          isActive: true,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.keyword.findMany.mockResolvedValue(keywords);

      const result = await service.findAll(userId);

      expect(result).toEqual(keywords);
      expect(prisma.keyword.findMany).toHaveBeenCalledWith({
        where: { userId, deletedAt: null },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('findById', () => {
    it('should return a keyword by id', async () => {
      const id = '1';
      const userId = '1';
      const keyword = {
        id,
        keyword: 'hello',
        response: 'Hi!',
        matchType: KeywordMatchType.CONTAINS,
        priority: 0,
        isActive: true,
        userId,
        deletedAt: null,
      };

      mockPrismaService.keyword.findFirst.mockResolvedValue(keyword);

      const result = await service.findById(id, userId);

      expect(result).toEqual(keyword);
    });

    it('should throw NotFoundException if keyword not found', async () => {
      mockPrismaService.keyword.findFirst.mockResolvedValue(null);

      await expect(service.findById('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a keyword', async () => {
      const id = '1';
      const userId = '1';
      const keyword = {
        id,
        keyword: 'hello',
        response: 'Hi!',
        matchType: KeywordMatchType.CONTAINS,
        priority: 0,
        isActive: true,
        userId,
        deletedAt: null,
      };

      const updateData = { response: 'Hello there!' };

      mockPrismaService.keyword.findFirst.mockResolvedValue(keyword);
      mockPrismaService.keyword.update.mockResolvedValue({
        ...keyword,
        ...updateData,
      });

      const result = await service.update(id, userId, updateData);

      expect(result.response).toBe('Hello there!');
    });
  });

  describe('remove', () => {
    it('should soft delete a keyword', async () => {
      const id = '1';
      const userId = '1';

      mockPrismaService.keyword.update.mockResolvedValue({ id });

      await service.remove(id, userId);

      expect(prisma.keyword.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('findMatchingKeyword', () => {
    it('should find keyword with CONTAINS match', async () => {
      const userId = '1';
      const message = 'hello world';
      const keywords = [
        {
          id: '1',
          keyword: 'hello',
          matchType: KeywordMatchType.CONTAINS,
          response: 'Hi!',
          priority: 0,
          isActive: true,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.keyword.findMany.mockResolvedValue(keywords);

      const result = await service.findMatchingKeyword(userId, message);

      expect(result).toEqual(keywords[0]);
    });

    it('should find keyword with EXACT match', async () => {
      const userId = '1';
      const message = 'hello';
      const keywords = [
        {
          id: '1',
          keyword: 'hello',
          matchType: KeywordMatchType.EXACT,
          response: 'Hi!',
          priority: 0,
          isActive: true,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.keyword.findMany.mockResolvedValue(keywords);

      const result = await service.findMatchingKeyword(userId, message);

      expect(result).toEqual(keywords[0]);
    });

    it('should find keyword with STARTS_WITH match', async () => {
      const userId = '1';
      const message = 'hello world';
      const keywords = [
        {
          id: '1',
          keyword: 'hello',
          matchType: KeywordMatchType.STARTS_WITH,
          response: 'Hi!',
          priority: 0,
          isActive: true,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.keyword.findMany.mockResolvedValue(keywords);

      const result = await service.findMatchingKeyword(userId, message);

      expect(result).toEqual(keywords[0]);
    });

    it('should find keyword with REGEX match', async () => {
      const userId = '1';
      const message = 'hello123';
      const keywords = [
        {
          id: '1',
          keyword: 'hello\\d+',
          matchType: KeywordMatchType.REGEX,
          response: 'Hi!',
          priority: 0,
          isActive: true,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.keyword.findMany.mockResolvedValue(keywords);

      const result = await service.findMatchingKeyword(userId, message);

      expect(result).toEqual(keywords[0]);
    });

    it('should return null for invalid REGEX', async () => {
      const userId = '1';
      const message = 'hello';
      const keywords = [
        {
          id: '1',
          keyword: '[invalid',
          matchType: KeywordMatchType.REGEX,
          response: 'Hi!',
          priority: 0,
          isActive: true,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.keyword.findMany.mockResolvedValue(keywords);

      const result = await service.findMatchingKeyword(userId, message);

      expect(result).toBeNull();
    });

    it('should return null if no match found', async () => {
      const userId = '1';
      const message = 'unrelated message';
      const keywords = [
        {
          id: '1',
          keyword: 'hello',
          matchType: KeywordMatchType.CONTAINS,
          response: 'Hi!',
          priority: 0,
          isActive: true,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.keyword.findMany.mockResolvedValue(keywords);

      const result = await service.findMatchingKeyword(userId, message);

      expect(result).toBeNull();
    });

    it('should return null if no keywords found', async () => {
      const userId = '1';
      const message = 'hello';

      mockPrismaService.keyword.findMany.mockResolvedValue([]);

      const result = await service.findMatchingKeyword(userId, message);

      expect(result).toBeNull();
    });

    it('should prioritize keywords by priority', async () => {
      const userId = '1';
      const message = 'hello';
      // Keywords are returned ordered by priority desc, so higher priority comes first
      const keywords = [
        {
          id: '1',
          keyword: 'hello',
          matchType: KeywordMatchType.CONTAINS,
          response: 'High priority',
          priority: 10,
          isActive: true,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: '2',
          keyword: 'hello',
          matchType: KeywordMatchType.CONTAINS,
          response: 'Low priority',
          priority: 0,
          isActive: true,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.keyword.findMany.mockResolvedValue(keywords);

      const result = await service.findMatchingKeyword(userId, message);

      expect(result).toEqual(keywords[0]); // Higher priority comes first
      expect(result.response).toBe('High priority');
    });

    it('should handle unknown match type (default case)', async () => {
      const userId = '1';
      const message = 'hello';
      const keywords = [
        {
          id: '1',
          keyword: 'hello',
          matchType: 'UNKNOWN_TYPE' as any, // Force unknown type
          response: 'Hi!',
          priority: 0,
          isActive: true,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.keyword.findMany.mockResolvedValue(keywords);

      const result = await service.findMatchingKeyword(userId, message);

      expect(result).toBeNull();
    });
  });
});
