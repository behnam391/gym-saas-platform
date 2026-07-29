import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context';
import { ZarinpalService } from '../zarinpal.service';
import { Queue } from 'bullmq';

function createService(
  tx: any,
  zarinpalOverrides: Partial<ZarinpalService> = {},
) {
  const prisma = { forTenant: jest.fn((fn: any) => fn(tx)) } as unknown as PrismaService;
  const context = { requireTenantId: () => 'tenant-1' } as unknown as TenantContext;
  const zarinpal = {
    requestPayment: jest.fn(),
    getRedirectUrl: jest.fn(),
    verifyPayment: jest.fn(),
    ...zarinpalOverrides,
  } as unknown as ZarinpalService;
  const queue = { add: jest.fn() } as unknown as Queue;
  return new PaymentsService(prisma, context, zarinpal, queue);
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

describe('PaymentsService.startZarinpalPayment', () => {
  it('uses the trusted membership price instead of a client supplied amount', async () => {
    process.env.ZARINPAL_CALLBACK_URL =
      'https://api.example.test/api/v1/payments/zarinpal/callback';
    const membership = {
      id: 'membership-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      status: 'PENDING_PAYMENT',
      plan: { title: 'پلن ماهانه', price: 850000, durationDays: 30 },
      tenant: { name: 'باشگاه نمونه' },
      user: {
        mobile: '09120000000',
        insuranceDocs: [{ id: 'insurance-1', validUntil: null }],
      },
      payments: [],
    };
    const tx = {
      membership: { findFirst: jest.fn().mockResolvedValue(membership) },
      payment: {
        create: jest.fn().mockResolvedValue({ id: 'payment-1' }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const requestPayment = jest.fn().mockResolvedValue({
      authority: 'A000000000000000000000000000000000001',
      redirectUrl: 'https://payment.zarinpal.com/pg/StartPay/example',
    });
    const service = createService(tx, { requestPayment } as Partial<ZarinpalService>);

    const result = await service.startZarinpalPayment('membership-1', 'user-1');

    expect(tx.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amount: 850000, status: 'PENDING' }),
    });
    expect(requestPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amountToman: 850000, mobile: '09120000000' }),
    );
    expect(result.redirectUrl).toContain('payment.zarinpal.com');
    delete process.env.ZARINPAL_CALLBACK_URL;
  });
});

describe('PaymentsService.dashboard', () => {
  it('rejects an invalid date range before querying the database', async () => {
    const tx = {};
    const service = createService(tx);

    await expect(
      service.dashboard({
        from: '2026-08-01T00:00:00.000Z',
        to: '2026-07-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('separates membership, cafeteria, and other successful revenue', async () => {
    const transactions = [
      { id: 'payment-1', amount: 100, status: 'SUCCEEDED', method: 'POS', membershipId: 'membership-1', orderId: null },
      { id: 'payment-2', amount: 50, status: 'SUCCEEDED', method: 'CASH', membershipId: null, orderId: 'order-1' },
      { id: 'payment-3', amount: 25, status: 'SUCCEEDED', method: 'CASH', membershipId: null, orderId: null },
      { id: 'payment-4', amount: 10, status: 'PENDING', method: 'POS', membershipId: null, orderId: null },
    ];
    const tx = {
      payment: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce(transactions)
          .mockResolvedValueOnce([]),
      },
      membership: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      order: {
        aggregate: jest.fn().mockResolvedValue({
          _count: 0,
          _sum: { totalAmount: null },
        }),
      },
    };
    const service = createService(tx);

    const result = await service.dashboard({
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-08-01T00:00:00.000Z',
    });

    expect(result.summary).toEqual(
      expect.objectContaining({
        collected: 175,
        membershipRevenue: 100,
        cafeteriaRevenue: 50,
        otherRevenue: 25,
        pendingAmount: 10,
      }),
    );
    expect(result.methodBreakdown).toEqual(
      expect.arrayContaining([
        { method: 'POS', amount: 100, count: 1 },
        { method: 'CASH', amount: 75, count: 2 },
      ]),
    );
  });
});
