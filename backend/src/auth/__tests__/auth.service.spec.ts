import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GenderDto } from '../dto/register.dto';
import * as bcrypt from 'bcrypt';

function makeService(db: any) {
  const prisma = { forPlatform: () => db } as unknown as PrismaService;
  const jwt = { sign: jest.fn() } as any;
  return new AuthService(prisma, jwt);
}

const baseDto = {
  firstName: 'علی',
  lastName: 'محمدی',
  nationalId: '0012345678',
  mobile: '09120000000',
  password: 'StrongPass123',
  gender: GenderDto.MALE,
  city: 'تهران',
  address: 'خیابان آزادی',
};

describe('AuthService.register', () => {
  it('rejects registration when mobile or nationalId already exists', async () => {
    const db = {
      user: { findFirst: jest.fn().mockResolvedValue({ id: 'existing' }), create: jest.fn() },
    };
    const service = makeService(db);
    await expect(
      service.register({ ...baseDto, dateOfBirth: '1990-01-01' }),
    ).rejects.toThrow(ConflictException);
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it('marks an 17-year-old as minor AND restricted — both flags are server-derived, never trusted from the DTO', async () => {
    const db = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({
          id: 'new-user',
          role: data.role,
          tenantId: data.tenantId,
          isMinor: data.isMinor,
        })),
      },
    };
    const service = makeService(db);

    const seventeenYearsAgo = new Date();
    seventeenYearsAgo.setFullYear(seventeenYearsAgo.getFullYear() - 17);

    const result = await service.register({
      ...baseDto,
      dateOfBirth: seventeenYearsAgo.toISOString().slice(0, 10),
    });

    expect(result.isMinor).toBe(true);
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isMinor: true, isRestricted: true }),
      }),
    );
  });

  it('does NOT restrict an adult account', async () => {
    const db = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'new-user', isMinor: false, role: 'ATHLETE', tenantId: null }),
      },
    };
    const service = makeService(db);

    const thirtyYearsAgo = new Date();
    thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);

    await service.register({ ...baseDto, dateOfBirth: thirtyYearsAgo.toISOString().slice(0, 10) });

    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isMinor: false, isRestricted: false }),
      }),
    );
  });

  it('never stores the plaintext password', async () => {
    const db = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'new-user', isMinor: false, role: 'ATHLETE', tenantId: null }),
      },
    };
    const service = makeService(db);
    await service.register({ ...baseDto, dateOfBirth: '1990-01-01' });

    const createArgs = db.user.create.mock.calls[0][0];
    expect(createArgs.data.passwordHash).not.toBe(baseDto.password);
    expect(createArgs.data.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
  });

  it('rejects a date of birth in the future', async () => {
    const db = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    };
    const service = makeService(db);
    await expect(
      service.register({ ...baseDto, dateOfBirth: '2999-01-01' }),
    ).rejects.toThrow(BadRequestException);
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it('creates a pending-insurance membership when registration starts from a gym plan', async () => {
    const tenantId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
    const membershipPlanId = 'c56a4180-65aa-42ec-a945-5fd21dec0538';
    const db = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'new-user',
          isMinor: false,
          role: 'ATHLETE',
          tenantId,
        }),
      },
      tenant: { findFirst: jest.fn().mockResolvedValue({ id: tenantId }) },
      membershipPlan: {
        findFirst: jest.fn().mockResolvedValue({ id: membershipPlanId }),
      },
    };
    const service = makeService(db);

    const result = await service.register({
      ...baseDto,
      dateOfBirth: '1990-01-01',
      tenantId,
      membershipPlanId,
    });

    expect(result.membershipRequested).toBe(true);
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId,
          memberships: {
            create: {
              tenantId,
              planId: membershipPlanId,
              status: 'PENDING_INSURANCE',
            },
          },
        }),
      }),
    );
  });
});

describe('AuthService.refresh', () => {
  it('rejects a replay that loses the atomic refresh-token rotation race', async () => {
    const db = {
      refreshToken: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'token-1',
          expiresAt: new Date(Date.now() + 60_000),
          user: {
            id: 'user-1',
            role: 'ATHLETE',
            tenantId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          },
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn(),
      },
    };
    const service = makeService(db);

    await expect(service.refresh('already-used-token')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  });
});

describe('AuthService.login', () => {
  it('binds credentials to the selected role portal before issuing tokens', async () => {
    const db = {
      user: { findFirst: jest.fn().mockResolvedValue(null) },
      refreshToken: { create: jest.fn() },
    };
    const service = makeService(db);

    await expect(service.login({
      identifier: '09120000001',
      password: 'StrongPass123',
      expectedRole: 'ATHLETE',
    })).rejects.toThrow(UnauthorizedException);

    expect(db.user.findFirst).toHaveBeenCalledWith({
      where: {
        role: 'ATHLETE',
        OR: [{ mobile: '09120000001' }, { nationalId: '09120000001' }],
      },
    });
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  });
});

describe('AuthService.changePassword', () => {
  it('rejects an incorrect current password without changing sessions', async () => {
    const db = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          passwordHash: await bcrypt.hash('CurrentPass123', 4),
          isActive: true,
        }),
        updateMany: jest.fn(),
      },
      refreshToken: { updateMany: jest.fn() },
      $transaction: jest.fn(),
    };
    const service = makeService(db);

    await expect(
      service.changePassword('user-1', {
        currentPassword: 'WrongPass123',
        newPassword: 'NewSecurePass456',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it('hashes the new password and revokes every active refresh token', async () => {
    const currentHash = await bcrypt.hash('CurrentPass123', 4);
    const db: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          passwordHash: currentHash,
          isActive: true,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      refreshToken: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      $transaction: jest.fn(),
    };
    db.$transaction.mockImplementation((callback: (tx: any) => unknown) =>
      callback(db),
    );
    const service = makeService(db);

    const result = await service.changePassword('user-1', {
      currentPassword: 'CurrentPass123',
      newPassword: 'NewSecurePass456',
    });

    const passwordUpdate = db.user.updateMany.mock.calls[0][0];
    expect(passwordUpdate.data.passwordHash).not.toBe('NewSecurePass456');
    await expect(
      bcrypt.compare('NewSecurePass456', passwordUpdate.data.passwordHash),
    ).resolves.toBe(true);
    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(result.reauthenticationRequired).toBe(true);
  });

  it('does not allow reusing the current password', async () => {
    const db = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          passwordHash: await bcrypt.hash('SamePassword123', 4),
          isActive: true,
        }),
        updateMany: jest.fn(),
      },
      refreshToken: { updateMany: jest.fn() },
      $transaction: jest.fn(),
    };
    const service = makeService(db);

    await expect(
      service.changePassword('user-1', {
        currentPassword: 'SamePassword123',
        newPassword: 'SamePassword123',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
