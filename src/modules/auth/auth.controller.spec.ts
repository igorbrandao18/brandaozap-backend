import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
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

      const result = {
        accessToken: 'token',
        user: {
          id: '1',
          email: registerDto.email,
          name: registerDto.name,
        },
      };

      mockAuthService.register.mockResolvedValue(result);

      expect(await controller.register(registerDto)).toEqual(result);
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = {
        accessToken: 'token',
        user: {
          id: '1',
          email: loginDto.email,
          name: 'Test User',
        },
      };

      mockAuthService.login.mockResolvedValue(result);

      expect(await controller.login(loginDto)).toEqual(result);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const user = { userId: '1' };
      const profile = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hash',
        isActive: true,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockAuthService.validateUser.mockResolvedValue(profile);

      expect(await controller.getProfile(user)).toEqual(profile);
      expect(service.validateUser).toHaveBeenCalledWith(user.userId);
    });
  });
});
