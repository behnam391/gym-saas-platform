import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MessagesService } from '../messages.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context';

function createService(tx: any) {
  const prisma = { forTenant: jest.fn((fn: any) => fn(tx)) } as unknown as PrismaService;
  const context = { requireTenantId: () => 'tenant-1' } as unknown as TenantContext;
  return new MessagesService(prisma, context);
}

describe('MessagesService', () => {
  it('rejects sending a message to the same user', async () => {
    const service = createService({});
    await expect(service.send('user-1', { recipientId: 'user-1', body: 'سلام' })).rejects.toThrow(BadRequestException);
  });

  it('rejects a missing or inactive recipient', async () => {
    const service = createService({ user: { findUnique: jest.fn().mockResolvedValue(null) } });
    await expect(service.send('user-1', { recipientId: 'user-2', body: 'سلام' })).rejects.toThrow(NotFoundException);
  });

  it('uses a stable conversation id regardless of sender order', async () => {
    const tx = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-2', isActive: true }) },
      message: { create: jest.fn().mockResolvedValue({ id: 'message-1' }) },
    };
    const service = createService(tx);
    await service.send('user-1', { recipientId: 'user-2', body: ' سلام ' });
    expect(tx.message.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ conversationId: 'user-1--user-2', body: 'سلام' }),
    }));
  });
});

