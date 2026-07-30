import { ProgramsService } from '../programs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context';

describe('ProgramsService', () => {
  it('hides draft programs and orders their contents for an athlete read', async () => {
    const tx = {
      athleteProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'athlete-1' }),
      },
      trainingProgram: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      forTenant: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
    } as unknown as PrismaService;
    const service = new ProgramsService(prisma, {} as TenantContext);

    await service.listForAthlete('user-1', true);

    expect(tx.trainingProgram.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          athleteId: 'athlete-1',
          status: { not: 'DRAFT' },
        },
        include: {
          trainer: { include: { user: { select: { firstName: true, lastName: true } } } },
          sessions: {
            include: { exercises: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { dayOfWeek: 'asc' },
          },
        },
      }),
    );
  });
});
