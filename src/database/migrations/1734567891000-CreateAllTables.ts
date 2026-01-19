import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAllTables1734567891000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // WhatsApp Sessions
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar' },
          { name: 'sessionId', type: 'varchar', isUnique: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['starting', 'qrcode', 'working', 'failed', 'stopped'],
            default: "'starting'",
          },
          { name: 'qrCode', type: 'text', isNullable: true },
          { name: 'phoneNumber', type: 'varchar', isNullable: true },
          { name: 'profileName', type: 'varchar', isNullable: true },
          { name: 'profilePicture', type: 'varchar', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'userId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Contacts
    await queryRunner.createTable(
      new Table({
        name: 'contacts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar' },
          { name: 'phoneNumber', type: 'varchar', isUnique: true },
          { name: 'email', type: 'varchar', isNullable: true },
          { name: 'avatar', type: 'varchar', isNullable: true },
          { name: 'customFields', type: 'jsonb', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'userId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Contact Tags
    await queryRunner.createTable(
      new Table({
        name: 'contact_tags',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar' },
          { name: 'color', type: 'varchar' },
          { name: 'userId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Contact Tags Junction Table (many-to-many)
    await queryRunner.createTable(
      new Table({
        name: 'contact_tags_contact_tags',
        columns: [
          { name: 'contactId', type: 'uuid', isPrimary: true },
          { name: 'tagId', type: 'uuid', isPrimary: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'contact_tags_contact_tags',
      new TableForeignKey({
        columnNames: ['contactId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contacts',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'contact_tags_contact_tags',
      new TableForeignKey({
        columnNames: ['tagId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contact_tags',
        onDelete: 'CASCADE',
      }),
    );

    // Messages
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'messageId', type: 'varchar' },
          {
            name: 'type',
            type: 'enum',
            enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'contact'],
            default: "'text'",
          },
          {
            name: 'direction',
            type: 'enum',
            enum: ['incoming', 'outgoing'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
            default: "'pending'",
          },
          { name: 'text', type: 'text', isNullable: true },
          { name: 'mediaUrl', type: 'varchar', isNullable: true },
          { name: 'fileName', type: 'varchar', isNullable: true },
          { name: 'mimeType', type: 'varchar', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'from', type: 'varchar' },
          { name: 'to', type: 'varchar' },
          { name: 'quotedMessageId', type: 'varchar', isNullable: true },
          { name: 'sessionId', type: 'uuid' },
          { name: 'contactId', type: 'uuid', isNullable: true },
          { name: 'userId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Conversations
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'phoneNumber', type: 'varchar' },
          { name: 'lastMessage', type: 'text', isNullable: true },
          { name: 'lastMessageType', type: 'varchar', isNullable: true },
          { name: 'unreadCount', type: 'int', default: 0 },
          { name: 'isArchived', type: 'boolean', default: false },
          { name: 'sessionId', type: 'uuid' },
          { name: 'contactId', type: 'uuid', isNullable: true },
          { name: 'userId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Keywords
    await queryRunner.createTable(
      new Table({
        name: 'keywords',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'keyword', type: 'varchar' },
          {
            name: 'matchType',
            type: 'enum',
            enum: ['exact', 'contains', 'starts_with', 'regex'],
            default: "'contains'",
          },
          { name: 'response', type: 'text' },
          { name: 'priority', type: 'int', default: 0 },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'userId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Flows
    await queryRunner.createTable(
      new Table({
        name: 'flows',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'nodes', type: 'jsonb' },
          { name: 'edges', type: 'jsonb' },
          { name: 'isActive', type: 'boolean', default: false },
          { name: 'version', type: 'int', default: 1 },
          { name: 'userId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Campaigns
    await queryRunner.createTable(
      new Table({
        name: 'campaigns',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'message', type: 'text' },
          { name: 'recipients', type: 'jsonb' },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'],
            default: "'draft'",
          },
          { name: 'scheduledAt', type: 'timestamp', isNullable: true },
          { name: 'totalRecipients', type: 'int', default: 0 },
          { name: 'sentCount', type: 'int', default: 0 },
          { name: 'deliveredCount', type: 'int', default: 0 },
          { name: 'readCount', type: 'int', default: 0 },
          { name: 'failedCount', type: 'int', default: 0 },
          { name: 'sessionId', type: 'uuid' },
          { name: 'userId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Templates
    await queryRunner.createTable(
      new Table({
        name: 'templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          {
            name: 'category',
            type: 'enum',
            enum: ['agendamento', 'orcamento', 'indicacao', 'ebook', 'faq', 'outros'],
            default: "'outros'",
          },
          { name: 'flowData', type: 'jsonb' },
          { name: 'isPublic', type: 'boolean', default: false },
          { name: 'userId', type: 'uuid', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Agents
    await queryRunner.createTable(
      new Table({
        name: 'agents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar' },
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'password', type: 'varchar' },
          {
            name: 'status',
            type: 'enum',
            enum: ['online', 'offline', 'busy', 'away'],
            default: "'offline'",
          },
          { name: 'activeConversations', type: 'int', default: 0 },
          { name: 'totalConversations', type: 'int', default: 0 },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'userId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Foreign Keys
    await queryRunner.createForeignKey(
      'whatsapp_sessions',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'contacts',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'contact_tags',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['sessionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'whatsapp_sessions',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['contactId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contacts',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['sessionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'whatsapp_sessions',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['contactId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contacts',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'keywords',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'flows',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'campaigns',
      new TableForeignKey({
        columnNames: ['sessionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'whatsapp_sessions',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'campaigns',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'templates',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'agents',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Indexes
    await queryRunner.createIndex('messages', {
      name: 'IDX_MESSAGES_SESSION_FROM',
      columnNames: ['sessionId', 'from', 'createdAt'],
    });

    await queryRunner.createIndex('messages', {
      name: 'IDX_MESSAGES_SESSION_TO',
      columnNames: ['sessionId', 'to', 'createdAt'],
    });

    await queryRunner.createIndex('conversations', {
      name: 'IDX_CONVERSATIONS_USER_PHONE',
      columnNames: ['userId', 'phoneNumber'],
    });

    await queryRunner.createIndex('conversations', {
      name: 'IDX_CONVERSATIONS_SESSION_PHONE',
      columnNames: ['sessionId', 'phoneNumber'],
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('agents');
    await queryRunner.dropTable('templates');
    await queryRunner.dropTable('campaigns');
    await queryRunner.dropTable('flows');
    await queryRunner.dropTable('keywords');
    await queryRunner.dropTable('conversations');
    await queryRunner.dropTable('messages');
    await queryRunner.dropTable('contact_tags_contact_tags');
    await queryRunner.dropTable('contact_tags');
    await queryRunner.dropTable('contacts');
    await queryRunner.dropTable('whatsapp_sessions');
  }
}
