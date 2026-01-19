import { Test, TestingModule } from '@nestjs/testing';
import { KeywordsController } from './keywords.controller';
import { KeywordsService } from './keywords.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KeywordMatchType } from '@prisma/client';

describe('KeywordsController', () => {
  let controller: KeywordsController;
  let service: KeywordsService;

  const mockKeywordsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KeywordsController],
      providers: [
        {
          provide: KeywordsService,
          useValue: mockKeywordsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<KeywordsController>(KeywordsController);
    service = module.get<KeywordsService>(KeywordsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a keyword', async () => {
      const user = { userId: '1' };
      const createDto = {
        keyword: 'hello',
        response: 'Hi there!',
        matchType: KeywordMatchType.CONTAINS,
      };

      const keyword = {
        id: '1',
        ...createDto,
        userId: user.userId,
        priority: 0,
        isActive: true,
      };

      mockKeywordsService.create.mockResolvedValue(keyword);

      const result = await controller.create(user, createDto);

      expect(result).toEqual(keyword);
      expect(service.create).toHaveBeenCalledWith(
        user.userId,
        createDto.keyword,
        createDto.response,
        createDto.matchType,
        createDto.priority,
      );
    });
  });

  describe('findAll', () => {
    it('should return all keywords', async () => {
      const user = { userId: '1' };
      const keywords = [
        {
          id: '1',
          keyword: 'hello',
          response: 'Hi!',
          matchType: KeywordMatchType.CONTAINS,
          userId: user.userId,
        },
      ];

      mockKeywordsService.findAll.mockResolvedValue(keywords);

      const result = await controller.findAll(user);

      expect(result).toEqual(keywords);
    });
  });

  describe('findOne', () => {
    it('should return a keyword by id', async () => {
      const user = { userId: '1' };
      const keyword = {
        id: '1',
        keyword: 'hello',
        response: 'Hi!',
        matchType: KeywordMatchType.CONTAINS,
        userId: user.userId,
      };

      mockKeywordsService.findById.mockResolvedValue(keyword);

      const result = await controller.findOne('1', user);

      expect(result).toEqual(keyword);
    });
  });

  describe('update', () => {
    it('should update a keyword', async () => {
      const user = { userId: '1' };
      const updateData = {
        response: 'Hello there!',
      };

      const updatedKeyword = {
        id: '1',
        keyword: 'hello',
        response: 'Hello there!',
        matchType: KeywordMatchType.CONTAINS,
        userId: user.userId,
      };

      mockKeywordsService.update.mockResolvedValue(updatedKeyword);

      const result = await controller.update('1', user, updateData);

      expect(result).toEqual(updatedKeyword);
    });
  });

  describe('remove', () => {
    it('should remove a keyword', async () => {
      const user = { userId: '1' };

      mockKeywordsService.remove.mockResolvedValue(undefined);

      await controller.remove('1', user);

      expect(service.remove).toHaveBeenCalledWith('1', user.userId);
    });
  });
});
