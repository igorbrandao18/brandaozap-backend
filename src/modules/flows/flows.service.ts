import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { Flow, Prisma } from '@prisma/client';

@Injectable()
export class FlowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    userId: string,
    name: string,
    nodes: any[],
    edges: any[],
    description?: string,
  ): Promise<Flow> {
    await this.usersService.findById(userId);

    // Validar estrutura do fluxo
    this.validateFlow(nodes, edges);

    return this.prisma.flow.create({
      data: {
        name,
        description,
        nodes,
        edges,
        userId,
        isActive: false,
        version: 1,
      },
    });
  }

  async findAll(userId: string): Promise<Flow[]> {
    return this.prisma.flow.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string): Promise<Flow> {
    const flow = await this.prisma.flow.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    return flow;
  }

  async update(
    id: string,
    userId: string,
    updateData: Prisma.FlowUpdateInput,
  ): Promise<Flow> {
    const flow = await this.findById(id, userId);

    // Se estiver atualizando nodes/edges, validar
    if (updateData.nodes || updateData.edges) {
      const nodes = (updateData.nodes as any) || flow.nodes;
      const edges = (updateData.edges as any) || flow.edges;
      this.validateFlow(nodes, edges);
    }

    // Se estiver atualizando nodes/edges, incrementar versão
    if (updateData.nodes || updateData.edges) {
      updateData.version = { increment: 1 };
    }

    return this.prisma.flow.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.prisma.flow.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async activate(id: string, userId: string): Promise<Flow> {
    await this.findById(id, userId);

    return this.prisma.flow.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(id: string, userId: string): Promise<Flow> {
    await this.findById(id, userId);

    return this.prisma.flow.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private validateFlow(nodes: any[], edges: any[]): void {
    if (!nodes || nodes.length === 0) {
      throw new BadRequestException('Flow must have at least one node');
    }

    // Verificar se há nó inicial
    const startNode = nodes.find((node) => node.type === 'start');
    if (!startNode) {
      throw new BadRequestException('Flow must have a start node');
    }

    // Validar que todas as edges referenciam nós existentes
    const nodeIds = nodes.map((node) => node.id);
    for (const edge of edges) {
      if (!nodeIds.includes(edge.source) || !nodeIds.includes(edge.target)) {
        throw new BadRequestException('Edge references non-existent node');
      }
    }
  }
}
