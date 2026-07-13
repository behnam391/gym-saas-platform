import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.forTenant((tx) =>
      tx.ticket.create({
        data: {
          tenantId: this.tenantContext.requireTenantId(),
          createdById: userId,
          targetType: dto.targetType as any,
          targetId: dto.targetId,
          subject: dto.subject,
          description: dto.description,
          priority: (dto.priority ?? 'MEDIUM') as any,
        },
      }),
    );
  }

  listMine(userId: string) {
    return this.prisma.forTenant((tx) =>
      tx.ticket.findMany({ where: { createdById: userId }, orderBy: { createdAt: 'desc' } }),
    );
  }

  listForGym() {
    return this.prisma.forTenant((tx) =>
      tx.ticket.findMany({ orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }] }),
    );
  }

  async update(ticketId: string, dto: UpdateTicketDto) {
    return this.prisma.forTenant(async (tx) => {
      const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new NotFoundException('تیکت یافت نشد.');

      return tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: dto.status as any,
          assignedToId: dto.assignedToId,
          resolvedAt: dto.status === 'RESOLVED' || dto.status === 'CLOSED' ? new Date() : undefined,
        },
      });
    });
  }
}
