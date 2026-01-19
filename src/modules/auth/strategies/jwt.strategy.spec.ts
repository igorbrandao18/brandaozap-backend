import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;
  let configService: ConfigService;

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.secret') return 'test-secret';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user data when user exists and is active', async () => {
      const payload = { sub: 'user-id-1' };
      const user = {
        id: 'user-id-1',
        email: 'test@example.com',
        isActive: true,
        name: 'Test User',
        password: 'hash',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findById.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: user.id,
        email: user.email,
      });
      expect(usersService.findById).toHaveBeenCalledWith(payload.sub);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = { sub: 'non-existent' };

      mockUsersService.findById.mockRejectedValue(new Error('User not found'));

      await expect(strategy.validate(payload)).rejects.toThrow();
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const payload = { sub: 'user-id-1' };
      const user = {
        id: 'user-id-1',
        email: 'test@example.com',
        isActive: false,
        name: 'Test User',
        password: 'hash',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findById.mockResolvedValue(user);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is null', async () => {
      const payload = { sub: 'user-id-1' };

      mockUsersService.findById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
