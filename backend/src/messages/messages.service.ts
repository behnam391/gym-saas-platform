import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { SendMessageDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  listConversations(userId: string) {
    return this.prisma.forTenant(async (tx) => {
      const messages = await tx.message.findMany({
        where: { OR: [{ senderId: userId }, { recipientId: userId }] },
        include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });

      const latestByConversation = new Map<string, (typeof messages)[number]>();
      for (const message of messages) {
        if (!latestByConversation.has(message.conversationId)) {
          latestByConversation.set(message.conversationId, message);
        }
      }
      const latest = [...latestByConversation.values()];
      const otherIds = [...new Set(latest.map((message) => message.senderId === userId ? message.recipientId : message.senderId))];
      const otherUsers = await tx.user.findMany({
        where: { id: { in: otherIds } },
        select: { id: true, firstName: true, lastName: true, role: true },
      });
      const userMap = new Map(otherUsers.map((user) => [user.id, user]));

      return latest.map((message) => {
        const otherUserId = message.senderId === userId ? message.recipientId : message.senderId;
        return {
          conversationId: message.conversationId,
          otherUser: userMap.get(otherUserId) ?? null,
          lastMessage: message,
          unreadCount: messages.filter(
            (item) => item.conversationId === message.conversationId && item.recipientId === userId && !item.isRead,
          ).length,
        };
      });
    });
  }

  getConversation(userId: string, conversationId: string) {
    return this.prisma.forTenant(async (tx) => {
      const messages = await tx.message.findMany({
        where: {
          conversationId,
          OR: [{ senderId: userId }, { recipientId: userId }],
        },
        include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
        orderBy: { createdAt: 'asc' },
        take: 500,
      });
      if (!messages.length) throw new NotFoundException('گفت‌وگو یافت نشد.');
      return messages;
    });
  }

  async send(userId: string, dto: SendMessageDto) {
    if (dto.recipientId === userId) throw new BadRequestException('ارسال پیام به خودتان امکان‌پذیر نیست.');
    return this.prisma.forTenant(async (tx) => {
      const recipient = await tx.user.findUnique({ where: { id: dto.recipientId }, select: { id: true, isActive: true } });
      if (!recipient?.isActive) throw new NotFoundException('گیرنده پیام یافت نشد.');
      const conversationId = [userId, dto.recipientId].sort().join('--');
      return tx.message.create({
        data: {
          tenantId: this.tenantContext.requireTenantId(),
          senderId: userId,
          recipientId: dto.recipientId,
          conversationId,
          body: dto.body.trim(),
        },
        include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
      });
    });
  }

  markRead(userId: string, conversationId: string) {
    return this.prisma.forTenant(async (tx) => {
      const result = await tx.message.updateMany({
        where: { conversationId, recipientId: userId, isRead: false },
        data: { isRead: true },
      });
      return { updated: result.count };
    });
  }
}
