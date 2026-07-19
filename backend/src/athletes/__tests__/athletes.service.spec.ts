import { BadRequestException } from '@nestjs/common';
import { AthletesService } from '../athletes.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AthletesService', () => {
  it('rejects an empty body measurement before touching the database', async () => {
    const prisma = { forTenant: jest.fn() } as unknown as PrismaService;
    const service = new AthletesService(prisma);
    await expect(service.addMeasurement('user-1', {})).rejects.toThrow(BadRequestException);
    expect(prisma.forTenant).not.toHaveBeenCalled();
  });

  it('updates the current athlete weight when a new weight is recorded', async () => {
    const tx = {
      athleteProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'athlete-1' }),
        update: jest.fn().mockResolvedValue({}),
      },
      bodyMeasurement: { create: jest.fn().mockResolvedValue({ id: 'measurement-1' }) },
    };
    const prisma = { forTenant: jest.fn((fn: any) => fn(tx)) } as unknown as PrismaService;
    const service = new AthletesService(prisma);
    await service.addMeasurement('user-1', { weightKg: 74.2 });
    expect(tx.athleteProfile.update).toHaveBeenCalledWith({
      where: { id: 'athlete-1' },
      data: { weightKg: 74.2 },
    });
  });
});

