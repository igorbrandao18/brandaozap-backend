import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: ContactsService;

  const mockContactsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addTags: jest.fn(),
    removeTags: jest.fn(),
    createTag: jest.fn(),
    getUserTags: jest.fn(),
    updateTag: jest.fn(),
    deleteTag: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
          useValue: mockContactsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ContactsController>(ContactsController);
    service = module.get<ContactsService>(ContactsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a contact', async () => {
      const user = { userId: '1' };
      const createDto = {
        name: 'John Doe',
        phoneNumber: '+1234567890',
        email: 'john@example.com',
      };

      const contact = {
        id: '1',
        ...createDto,
        userId: user.userId,
      };

      mockContactsService.create.mockResolvedValue(contact);

      const result = await controller.create(user, createDto);

      expect(result).toEqual(contact);
    });
  });

  describe('findAll', () => {
    it('should return all contacts', async () => {
      const user = { userId: '1' };
      const contacts = [
        {
          id: '1',
          name: 'John Doe',
          phoneNumber: '+1234567890',
          userId: user.userId,
        },
      ];

      mockContactsService.findAll.mockResolvedValue(contacts);

      const result = await controller.findAll(user);

      expect(result).toEqual(contacts);
    });
  });

  describe('findOne', () => {
    it('should return a contact by id', async () => {
      const user = { userId: '1' };
      const contact = {
        id: '1',
        name: 'John Doe',
        phoneNumber: '+1234567890',
        userId: user.userId,
      };

      mockContactsService.findById.mockResolvedValue(contact);

      const result = await controller.findOne('1', user);

      expect(result).toEqual(contact);
    });
  });

  describe('update', () => {
    it('should update a contact', async () => {
      const user = { userId: '1' };
      const updateDto = {
        name: 'Jane Doe',
      };

      const updatedContact = {
        id: '1',
        name: 'Jane Doe',
        phoneNumber: '+1234567890',
        userId: user.userId,
      };

      mockContactsService.update.mockResolvedValue(updatedContact);

      const result = await controller.update('1', user, updateDto);

      expect(result).toEqual(updatedContact);
    });
  });

  describe('remove', () => {
    it('should remove a contact', async () => {
      const user = { userId: '1' };

      mockContactsService.remove.mockResolvedValue(undefined);

      await controller.remove('1', user);

      expect(service.remove).toHaveBeenCalledWith('1', user.userId);
    });
  });

  describe('addTags', () => {
    it('should add tags to contact', async () => {
      const user = { userId: '1' };
      const body = { tagIds: ['tag-1', 'tag-2'] };
      const contact = {
        id: '1',
        name: 'John Doe',
        tags: [{ id: 'tag-1' }, { id: 'tag-2' }],
      };

      mockContactsService.addTags.mockResolvedValue(contact);

      const result = await controller.addTags('1', user, body);

      expect(result).toEqual(contact);
    });
  });

  describe('removeTags', () => {
    it('should remove tags from contact', async () => {
      const user = { userId: '1' };
      const body = { tagIds: ['tag-1'] };
      const contact = {
        id: '1',
        name: 'John Doe',
        tags: [],
      };

      mockContactsService.removeTags.mockResolvedValue(contact);

      const result = await controller.removeTags('1', user, body);

      expect(result).toEqual(contact);
    });
  });

  describe('createTag', () => {
    it('should create a tag', async () => {
      const user = { userId: '1' };
      const createTagDto = {
        name: 'VIP',
        color: '#FF0000',
      };

      const tag = {
        id: '1',
        ...createTagDto,
        userId: user.userId,
      };

      mockContactsService.createTag.mockResolvedValue(tag);

      const result = await controller.createTag(user, createTagDto);

      expect(result).toEqual(tag);
    });

    it('should use default color if not provided', async () => {
      const user = { userId: '1' };
      const createTagDto = {
        name: 'VIP',
      };

      const tag = {
        id: '1',
        name: 'VIP',
        color: '#3B82F6',
        userId: user.userId,
      };

      mockContactsService.createTag.mockResolvedValue(tag);

      const result = await controller.createTag(user, createTagDto);

      expect(service.createTag).toHaveBeenCalledWith(user.userId, 'VIP', '#3B82F6');
    });
  });

  describe('getUserTags', () => {
    it('should return all tags for user', async () => {
      const user = { userId: '1' };
      const tags = [
        {
          id: '1',
          name: 'VIP',
          color: '#FF0000',
          userId: user.userId,
        },
      ];

      mockContactsService.getUserTags.mockResolvedValue(tags);

      const result = await controller.getUserTags(user);

      expect(result).toEqual(tags);
    });
  });

  describe('updateTag', () => {
    it('should update a tag', async () => {
      const user = { userId: '1' };
      const updateData = {
        name: 'Premium',
      };

      const updatedTag = {
        id: '1',
        name: 'Premium',
        color: '#FF0000',
        userId: user.userId,
      };

      mockContactsService.updateTag.mockResolvedValue(updatedTag);

      const result = await controller.updateTag('1', user, updateData);

      expect(result).toEqual(updatedTag);
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag', async () => {
      const user = { userId: '1' };

      mockContactsService.deleteTag.mockResolvedValue(undefined);

      await controller.deleteTag('1', user);

      expect(service.deleteTag).toHaveBeenCalledWith('1', user.userId);
    });
  });
});
