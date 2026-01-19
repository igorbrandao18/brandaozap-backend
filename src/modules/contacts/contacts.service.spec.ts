import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';

describe('ContactsService', () => {
  let service: ContactsService;
  let prisma: PrismaService;
  let usersService: UsersService;

  const mockPrismaService = {
    contact: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    contactTag: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
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

    service = module.get<ContactsService>(ContactsService);
    prisma = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a contact', async () => {
      const userId = '1';
      const contactData = {
        name: 'John Doe',
        phoneNumber: '+1234567890',
        email: 'john@example.com',
      };

      const createdContact = {
        id: '1',
        ...contactData,
        userId,
        customFields: null,
        notes: null,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        tags: [],
      };

      mockUsersService.findById.mockResolvedValue({ id: userId });
      mockPrismaService.contact.create.mockResolvedValue(createdContact);

      const result = await service.create(
        userId,
        contactData.name,
        contactData.phoneNumber,
        contactData.email,
      );

      expect(usersService.findById).toHaveBeenCalledWith(userId);
      expect(prisma.contact.create).toHaveBeenCalled();
      expect(result).toEqual(createdContact);
    });
  });

  describe('findById', () => {
    it('should return a contact by id', async () => {
      const id = '1';
      const userId = '1';
      const contact = {
        id,
        name: 'John Doe',
        phoneNumber: '+1234567890',
        userId,
        deletedAt: null,
        tags: [],
      };

      mockPrismaService.contact.findFirst.mockResolvedValue(contact);

      const result = await service.findById(id, userId);

      expect(result).toEqual(contact);
    });

    it('should throw NotFoundException if contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(service.findById('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a contact', async () => {
      const id = '1';
      const userId = '1';
      const contact = {
        id,
        name: 'John Doe',
        phoneNumber: '+1234567890',
        userId,
        deletedAt: null,
        tags: [],
      };

      mockPrismaService.contact.findFirst.mockResolvedValue(contact);
      mockPrismaService.contact.update.mockResolvedValue({ ...contact, deletedAt: new Date() });

      await service.remove(id, userId);

      expect(prisma.contact.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('findAll', () => {
    it('should return all contacts for user', async () => {
      const userId = '1';
      const contacts = [
        {
          id: '1',
          name: 'John Doe',
          phoneNumber: '+1234567890',
          userId,
          deletedAt: null,
          tags: [],
        },
      ];

      mockPrismaService.contact.findMany.mockResolvedValue(contacts);

      const result = await service.findAll(userId);

      expect(result).toEqual(contacts);
      expect(prisma.contact.findMany).toHaveBeenCalledWith({
        where: { userId, deletedAt: null },
        include: { tags: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findByPhoneNumber', () => {
    it('should return contact by phone number', async () => {
      const phoneNumber = '+1234567890';
      const userId = '1';
      const contact = {
        id: '1',
        name: 'John Doe',
        phoneNumber,
        userId,
        deletedAt: null,
        tags: [],
      };

      mockPrismaService.contact.findFirst.mockResolvedValue(contact);

      const result = await service.findByPhoneNumber(phoneNumber, userId);

      expect(result).toEqual(contact);
    });

    it('should return null if contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      const result = await service.findByPhoneNumber('+9999999999', '1');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a contact', async () => {
      const id = '1';
      const userId = '1';
      const contact = {
        id,
        name: 'John Doe',
        phoneNumber: '+1234567890',
        userId,
        deletedAt: null,
        tags: [],
      };

      const updateData = { name: 'Jane Doe' };

      mockPrismaService.contact.findFirst.mockResolvedValue(contact);
      mockPrismaService.contact.update.mockResolvedValue({
        ...contact,
        ...updateData,
      });

      const result = await service.update(id, userId, updateData);

      expect(result.name).toBe('Jane Doe');
      expect(prisma.contact.update).toHaveBeenCalledWith({
        where: { id },
        data: updateData,
        include: { tags: true },
      });
    });
  });

  describe('addTags', () => {
    it('should add tags to contact', async () => {
      const id = '1';
      const userId = '1';
      const tagIds = ['tag-1', 'tag-2'];
      const contact = {
        id,
        userId,
        deletedAt: null,
        tags: [],
      };

      mockPrismaService.contact.findFirst.mockResolvedValue(contact);
      mockPrismaService.contact.update.mockResolvedValue({
        ...contact,
        tags: [{ id: 'tag-1' }, { id: 'tag-2' }],
      });

      const result = await service.addTags(id, userId, tagIds);

      expect(prisma.contact.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          tags: {
            connect: [{ id: 'tag-1' }, { id: 'tag-2' }],
          },
        },
        include: { tags: true },
      });
    });
  });

  describe('removeTags', () => {
    it('should remove tags from contact', async () => {
      const id = '1';
      const userId = '1';
      const tagIds = ['tag-1'];
      const contact = {
        id,
        userId,
        deletedAt: null,
        tags: [],
      };

      mockPrismaService.contact.findFirst.mockResolvedValue(contact);
      mockPrismaService.contact.update.mockResolvedValue({
        ...contact,
        tags: [],
      });

      const result = await service.removeTags(id, userId, tagIds);

      expect(prisma.contact.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          tags: {
            disconnect: [{ id: 'tag-1' }],
          },
        },
        include: { tags: true },
      });
    });
  });

  describe('createTag', () => {
    it('should create a tag', async () => {
      const userId = '1';
      const tagData = {
        name: 'VIP',
        color: '#FF0000',
      };

      const createdTag = {
        id: '1',
        ...tagData,
        userId,
        createdAt: new Date(),
      };

      mockUsersService.findById.mockResolvedValue({ id: userId });
      mockPrismaService.contactTag.create.mockResolvedValue(createdTag);

      const result = await service.createTag(userId, tagData.name, tagData.color);

      expect(result).toEqual(createdTag);
    });
  });

  describe('getUserTags', () => {
    it('should return all tags for user', async () => {
      const userId = '1';
      const tags = [
        {
          id: '1',
          name: 'VIP',
          color: '#FF0000',
          userId,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.contactTag.findMany.mockResolvedValue(tags);

      const result = await service.getUserTags(userId);

      expect(result).toEqual(tags);
      expect(prisma.contactTag.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateTag', () => {
    it('should update a tag', async () => {
      const id = '1';
      const userId = '1';
      const tag = {
        id,
        name: 'VIP',
        color: '#FF0000',
        userId,
      };

      const updateData = { name: 'Premium' };

      mockPrismaService.contactTag.findFirst.mockResolvedValue(tag);
      mockPrismaService.contactTag.update.mockResolvedValue({
        ...tag,
        ...updateData,
      });

      const result = await service.updateTag(id, userId, updateData);

      expect(result.name).toBe('Premium');
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockPrismaService.contactTag.findFirst.mockResolvedValue(null);

      await expect(service.updateTag('1', '1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag', async () => {
      const id = '1';
      const userId = '1';
      const tag = {
        id,
        name: 'VIP',
        color: '#FF0000',
        userId,
      };

      mockPrismaService.contactTag.findFirst.mockResolvedValue(tag);
      mockPrismaService.contactTag.delete.mockResolvedValue(tag);

      await service.deleteTag(id, userId);

      expect(prisma.contactTag.delete).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockPrismaService.contactTag.findFirst.mockResolvedValue(null);

      await expect(service.deleteTag('1', '1')).rejects.toThrow(NotFoundException);
    });
  });
});
