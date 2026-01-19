import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUsersService = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    validatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'jwt.secret') return 'test-secret';
      if (key === 'jwt.expiresIn') return '1d';
      if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
      if (key === 'jwt.refreshExpiresIn') return '7d';
      return null;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const user = {
        id: '1',
        ...registerDto,
        password: 'hashed_password',
        isActive: true,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('access_token');

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name,
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: registerDto.email });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        email: loginDto.email,
        password: 'hashed_password',
        name: 'Test User',
        isActive: true,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('access_token');

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(usersService.validatePassword).toHaveBeenCalledWith(user, loginDto.password);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = {
        id: '1',
        email: loginDto.email,
        password: 'hashed_password',
        name: 'Test User',
        isActive: true,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        email: loginDto.email,
        password: 'hashed_password',
        name: 'Test User',
        isActive: false,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.validatePassword.mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user by id', async () => {
      const userId = '1';
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hash',
        isActive: true,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findById.mockResolvedValue(user);

      const result = await service.validateUser(userId);

      expect(usersService.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });
  });
});
