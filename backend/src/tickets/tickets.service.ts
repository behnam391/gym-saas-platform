import { Injectable, NotFoundException } from '@nestjs/common';
import {
  TicketPriority,
  TicketStatus,
  TicketTargetType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { CreateTicketDto, UpdateTicketDto } from './dto/ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  create(userId: string, dto: CreateTicketDto) {
    const data = {
      createdById: userId,
      targetType: dto.targetType as TicketTargetType,
      targetId: dto.targetId,
      subject: dto.subject.trim(),
      description: dto.description.trim(),
      priority: (dto.priority ?? 'MEDIUM') as TicketPriority,
    };

    if (dto.targetType === 'PLATFORM') {
      return this.prisma.forPlatform().ticket.create({
        data: { ...data, tenantId: null },
      });
    }

    return this.prisma.forTenant((tx) =>
      tx.ticket.create({
        data: { ...data, tenantId: this.tenantContext.requireTenantId() },
      }),
    );
  }

  listMine(userId: string) {
    return this.prisma.forPlatform().ticket.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listForGym() {
    return this.prisma.forTenant((tx) =>
      tx.ticket.findMany({ orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }] }),
    );
  }

  listForPlatform() {
    return this.prisma.forPlatform().ticket.findMany({
      where: { targetType: 'PLATFORM' },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mobile: true,
            email: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: 500,
    });
  }

  async update(ticketId: string, dto: UpdateTicketDto, platform = false) {
    const updateWith = async (tx: ReturnType<PrismaService['forPlatform']>) => {
      const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket || (platform && ticket.targetType !== 'PLATFORM')) {
        throw new NotFoundException('تیکت یافت نشد.');
      }

      return tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: dto.status as TicketStatus,
          assignedToId: dto.assignedToId,
          resolvedAt: dto.status === 'RESOLVED' || dto.status === 'CLOSED' ? new Date() : undefined,
        },
      });
    };

    if (platform) {
      return updateWith(this.prisma.forPlatform());
    }
    return this.prisma.forTenant(updateWith);
  }
}
