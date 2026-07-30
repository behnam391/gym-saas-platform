import { BadRequestException, ConflictException } from '@nestjs/common';
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

  it('rejects a second insurance document while one is pending', async () => {
    const tx = {
      insuranceDocument: {
        findFirst: jest.fn().mockResolvedValue({ status: 'PENDING' }),
        create: jest.fn(),
      },
    };
    const prisma = { forTenant: jest.fn((fn: any) => fn(tx)) } as unknown as PrismaService;
    const service = new AthletesService(prisma);

    await expect(
      service.submitInsurance('user-1', { documentUrl: 'https://files.test/insurance.pdf' }),
    ).rejects.toThrow(ConflictException);
    expect(tx.insuranceDocument.create).not.toHaveBeenCalled();
  });

  it('rejects replacing a parental consent while it is pending', async () => {
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          isMinor: true,
          parentalConsent: { status: 'PENDING' },
        }),
      },
      parentalConsent: { upsert: jest.fn() },
    };
    const prisma = { forTenant: jest.fn((fn: any) => fn(tx)) } as unknown as PrismaService;
    const service = new AthletesService(prisma);

    await expect(
      service.submitParentalConsent('user-1', {
        guardianName: 'علی رضایی',
        guardianNationalId: '0012345678',
        guardianMobile: '09121234567',
        documentUrl: 'https://files.test/consent.pdf',
      }),
    ).rejects.toThrow(ConflictException);
    expect(tx.parentalConsent.upsert).not.toHaveBeenCalled();
  });
});
