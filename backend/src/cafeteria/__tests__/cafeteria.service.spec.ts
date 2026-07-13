import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CafeteriaService } from '../cafeteria.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context';

function makeService(tx: any) {
  const prisma = {
    forTenant: jest.fn((fn: any) => fn(tx)),
  } as unknown as PrismaService;
  const tenantContext = { requireTenantId: () => 'tenant-1' } as unknown as TenantContext;
  return new CafeteriaService(prisma, tenantContext);
}

describe('CafeteriaService.placeOrder', () => {
  it('rejects an empty order before touching the database', async () => {
    const tx = { cafeteriaProduct: { findUnique: jest.fn() } };
    const service = makeService(tx);
    await expect(service.placeOrder('user-1', { items: [] })).rejects.toThrow(
      BadRequestException,
    );
    expect(tx.cafeteriaProduct.findUnique).not.toHaveBeenCalled();
  });

  it('throws NotFoundException for a product that does not exist', async () => {
    const tx = {
      cafeteriaProduct: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = makeService(tx);
    await expect(
      service.placeOrder('user-1', { items: [{ productId: 'missing', quantity: 1 }] }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when the conditional stock decrement matches zero rows (sold out)', async () => {
    // This is the actual race-safety mechanism: `updateMany` with a
    // `WHERE inventory >= quantity` condition. If two concurrent requests
    // both pass the initial findUnique check but only one item is left,
    // exactly one of the two updateMany calls will match 0 rows — that
    // request must fail instead of silently overselling.
    const tx = {
      cafeteriaProduct: {
        findUnique: jest.fn().mockResolvedValue({ id: 'p1', title: 'آب معدنی', price: 10000, isActive: true }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }), // simulates the lost race
      },
      order: { create: jest.fn() },
    };
    const service = makeService(tx);
    await expect(
      service.placeOrder('user-1', { items: [{ productId: 'p1', quantity: 1 }] }),
    ).rejects.toThrow(BadRequestException);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('creates the order with the correct total when stock is available', async () => {
    const tx = {
      cafeteriaProduct: {
        findUnique: jest.fn().mockResolvedValue({ id: 'p1', title: 'آب معدنی', price: 10000, isActive: true }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      order: { create: jest.fn().mockResolvedValue({ id: 'order-1' }) },
    };
    const service = makeService(tx);
    await service.placeOrder('user-1', { items: [{ productId: 'p1', quantity: 3 }] });

    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-1',
          totalAmount: 30000, // 10000 * 3 — verifies total isn't trusted from the client
        }),
      }),
    );
  });
});
