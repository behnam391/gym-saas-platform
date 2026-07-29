import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { ProfessionalFinanceService } from './professional-finance.service';

function createService(tx: any) {
  const prisma = {
    forTenant: jest.fn((callback: any) => callback(tx)),
  } as unknown as PrismaService;
  const tenantContext = {
    requireTenantId: () => '11111111-1111-4111-8111-111111111111',
  } as unknown as TenantContext;
  return new ProfessionalFinanceService(prisma, tenantContext);
}

describe('ProfessionalFinanceService', () => {
  it('rejects a fixed contract without a fixed amount', async () => {
    const service = createService({});

    await expect(
      service.createContract('owner-1', {
        professionalId: '22222222-2222-4222-8222-222222222222',
        type: 'FIXED',
        billingCycle: 'MONTHLY',
        startDate: '2026-07-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('calculates fixed, revenue share, per-client amount, deductions and net pay', async () => {
    const tx = {
      professionalContract: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'contract-1',
          status: 'ACTIVE',
          fixedAmount: 100,
          sharePercent: 10,
          perClientAmount: 20,
          professional: { id: 'trainer-user-1', role: 'TRAINER' },
        }),
      },
      professionalSettlement: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 'settlement-1',
          ...data,
        })),
      },
      trainerProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'trainer-profile-1' }),
      },
      trainerStudent: {
        count: jest.fn().mockResolvedValue(3),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const service = createService(tx);

    const result = await service.createSettlement('owner-1', 'contract-1', {
      periodStart: '2026-07-01T00:00:00.000Z',
      periodEnd: '2026-07-31T23:59:59.999Z',
      baseRevenue: 200,
      deductions: 10,
    });

    expect(tx.professionalSettlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        baseRevenue: 200,
        clientCount: 3,
        grossAmount: 180,
        deductions: 10,
        netAmount: 170,
      }),
    });
    expect(result.netAmount).toBe(170);
  });
});
