import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DietService } from '../diet.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context';

describe('DietService', () => {
  it('hides draft diets and orders meals for an athlete read', async () => {
    const tx = {
      athleteProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'athlete-1' }),
      },
      dietPlan: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      forTenant: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
    } as unknown as PrismaService;
    const service = new DietService(prisma, {} as TenantContext);

    await service.listForAthlete('user-1', true);

    expect(tx.dietPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          athleteId: 'athlete-1',
          status: { not: 'DRAFT' },
        },
        include: {
          nutritionist: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          athlete: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          meals: { orderBy: { sortOrder: 'asc' } },
        },
      }),
    );
  });

  it('rejects creating a diet for an athlete not assigned to the nutritionist', async () => {
    const tx = {
      nutritionistProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'nutritionist-1',
          status: 'APPROVED',
        }),
      },
      athleteProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'athlete-1' }),
      },
      nutritionistClient: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const prisma = {
      forTenant: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
    } as unknown as PrismaService;
    const service = new DietService(prisma, {} as TenantContext);

    await expect(
      service.create('nutritionist-user-1', {
        athleteUserId: 'athlete-user-1',
        title: 'رژیم افزایش وزن',
        meals: [],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('does not let a nutritionist change another nutritionist diet', async () => {
    const tx = {
      dietPlan: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const prisma = {
      forTenant: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
    } as unknown as PrismaService;
    const service = new DietService(prisma, {} as TenantContext);

    await expect(
      service.updateStatus('nutritionist-user-1', 'diet-2', { status: 'ARCHIVED' }),
    ).rejects.toThrow(NotFoundException);
  });
});
