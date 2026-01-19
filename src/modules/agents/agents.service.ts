import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { Agent, AgentStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    userId: string,
    name: string,
    email: string,
    password: string,
  ): Promise<Agent> {
    await this.usersService.findById(userId);

    const existingAgent = await this.prisma.agent.findFirst({
      where: { email, deletedAt: null },
    });

    if (existingAgent) {
      throw new ConflictException('Agent with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.agent.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userId,
        status: AgentStatus.OFFLINE,
        isActive: true,
      },
    });
  }

  async findAll(userId: string): Promise<Agent[]> {
    return this.prisma.agent.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string): Promise<Agent> {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  async findByEmail(email: string): Promise<Agent | null> {
    return this.prisma.agent.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async update(
    id: string,
    userId: string,
    updateData: Prisma.AgentUpdateInput,
  ): Promise<Agent> {
    await this.findById(id, userId);

    if (updateData.password && typeof updateData.password === 'string') {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return this.prisma.agent.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.prisma.agent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatus(
    id: string,
    userId: string,
    status: AgentStatus,
  ): Promise<Agent> {
    await this.findById(id, userId);

    return this.prisma.agent.update({
      where: { id },
      data: { status },
    });
  }

  async validatePassword(agent: Agent, password: string): Promise<boolean> {
    return bcrypt.compare(password, agent.password);
  }
}
