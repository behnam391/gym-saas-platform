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
          meals: { orderBy: { sortOrder: 'asc' } },
        },
      }),
    );
  });
});
