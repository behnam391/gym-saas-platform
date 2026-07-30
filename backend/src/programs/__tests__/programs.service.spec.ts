import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
          athlete: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          sessions: {
            include: { exercises: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { dayOfWeek: 'asc' },
          },
        },
      }),
    );
  });

  it('rejects creating a program for an athlete not assigned to the trainer', async () => {
    const tx = {
      trainerProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'trainer-1', status: 'APPROVED' }),
      },
      athleteProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'athlete-1' }),
      },
      trainerStudent: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const prisma = {
      forTenant: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
    } as unknown as PrismaService;
    const service = new ProgramsService(prisma, {} as TenantContext);

    await expect(
      service.create('trainer-user-1', {
        athleteUserId: 'athlete-user-1',
        title: 'برنامه قدرتی',
        sessions: [],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('does not let a trainer change another trainer program', async () => {
    const tx = {
      trainingProgram: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const prisma = {
      forTenant: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
    } as unknown as PrismaService;
    const service = new ProgramsService(prisma, {} as TenantContext);

    await expect(
      service.updateStatus('trainer-user-1', 'program-2', { status: 'ARCHIVED' }),
    ).rejects.toThrow(NotFoundException);
  });
});
