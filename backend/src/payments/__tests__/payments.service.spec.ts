import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context';

function createService(tx: any) {
  const prisma = { forTenant: jest.fn((fn: any) => fn(tx)) } as unknown as PrismaService;
  const context = { requireTenantId: () => 'tenant-1' } as unknown as TenantContext;
  return new PaymentsService(prisma, context);
}

describe('PaymentsService.recordManualPayment', () => {
  const membership = {
    id: 'membership-1',
    userId: 'user-1',
    status: 'PENDING_PAYMENT',
    plan: { price: 1000000, durationDays: 30 },
    user: { insuranceDocs: [{ id: 'insurance-1', validUntil: null }] },
  };

  it('rejects payment without approved insurance', async () => {
    const tx = { membership: { findUnique: jest.fn().mockResolvedValue({ ...membership, user: { insuranceDocs: [] } }) } };
    const service = createService(tx);
    await expect(service.recordManualPayment('membership-1', { amount: 1000000, method: 'POS' })).rejects.toThrow(BadRequestException);
  });

  it('rejects a payment below the plan price', async () => {
    const tx = { membership: { findUnique: jest.fn().mockResolvedValue(membership) } };
    const service = createService(tx);
    await expect(service.recordManualPayment('membership-1', { amount: 500000, method: 'CASH' })).rejects.toThrow(BadRequestException);
  });

  it('creates a successful payment and activates the membership', async () => {
    const tx = {
      membership: {
        findUnique: jest.fn().mockResolvedValue(membership),
        update: jest.fn().mockResolvedValue({}),
      },
      payment: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'payment-1' }),
      },
    };
    const service = createService(tx);
    await service.recordManualPayment('membership-1', { amount: 1000000, method: 'POS' });
    expect(tx.payment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantId: 'tenant-1', userId: 'user-1', status: 'SUCCEEDED' }),
    }));
    expect(tx.membership.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'membership-1' },
      data: expect.objectContaining({ status: 'ACTIVE' }),
    }));
  });
});

