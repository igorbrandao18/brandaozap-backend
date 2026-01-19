import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '@prisma/client';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users: User[] = [
        { id: '1', email: 'test1@example.com', name: 'User 1', password: 'hash', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        { id: '2', email: 'test2@example.com', name: 'User 2', password: 'hash', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      ];

      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user: User = {
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

      mockUsersService.findById.mockResolvedValue(user);

      const result = await controller.findOne('1');

      expect(service.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(user);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Updated Name',
        password: 'hash',
        isActive: true,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('1', updateData);

      expect(service.update).toHaveBeenCalledWith('1', updateData);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
