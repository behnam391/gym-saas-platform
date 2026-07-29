import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationProviderService } from '../../queue/notification-provider.service';
import { OtpService } from '../otp.service';

describe('OtpService', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousRefreshSecret = process.env.JWT_REFRESH_SECRET;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_REFRESH_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';
  });

  afterAll(() => {
    process.env.NODE_ENV = previousNodeEnv;
    process.env.JWT_REFRESH_SECRET = previousRefreshSecret;
  });

  function setup() {
    let stored: any;
    const db = {
      otpChallenge: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }: any) => {
          stored = { ...data, attempts: 0, verifiedAt: null, consumedAt: null };
          return { id: data.id, expiresAt: data.expiresAt };
        }),
        findUnique: jest.fn().mockImplementation(() => stored),
        update: jest.fn().mockImplementation(({ data }: any) => {
          stored = {
            ...stored,
            ...data,
            attempts:
              data.attempts?.increment != null
                ? stored.attempts + data.attempts.increment
                : stored.attempts,
          };
          return stored;
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const prisma = { forPlatform: () => db } as unknown as PrismaService;
    const jwt = {
      sign: jest.fn().mockReturnValue('signed-verification-token'),
      verifyAsync: jest.fn(),
    } as unknown as JwtService;
    const provider = {
      sendSms: jest.fn().mockResolvedValue('DRY_RUN'),
      sendEmail: jest.fn().mockResolvedValue('DRY_RUN'),
    } as unknown as NotificationProviderService;
    return {
      service: new OtpService(prisma, jwt, provider),
      db,
      provider,
      getStored: () => stored,
    };
  }

  it('stores only a keyed hash and never the plaintext six-digit code', async () => {
    const { service, db, getStored } = setup();
    const result = await service.request({
      channel: 'SMS',
      purpose: 'REGISTER',
      destination: '09120000000',
    } as any);

    expect(result.debugCode).toMatch(/^\d{6}$/);
    expect(getStored().codeHash).toMatch(/^[a-f0-9]{64}$/);
    expect(getStored().codeHash).not.toBe(result.debugCode);
    expect(db.otpChallenge.create).toHaveBeenCalledTimes(1);
  });

  it('verifies the correct code and returns a short-lived operation token', async () => {
    const { service, db } = setup();
    const requested = await service.request({
      channel: 'SMS',
      purpose: 'REGISTER',
      destination: '09120000000',
    } as any);

    const result = await service.verify(
      requested.challengeId,
      requested.debugCode!,
    );

    expect(result.verificationToken).toBe('signed-verification-token');
    expect(db.otpChallenge.update).toHaveBeenCalledWith({
      where: { id: requested.challengeId },
      data: { verifiedAt: expect.any(Date) },
    });
  });

  it('increments attempts and rejects an incorrect code', async () => {
    const { service, db } = setup();
    const requested = await service.request({
      channel: 'SMS',
      purpose: 'REGISTER',
      destination: '09120000000',
    } as any);

    await expect(
      service.verify(requested.challengeId, '000000'),
    ).rejects.toThrow(BadRequestException);
    expect(db.otpChallenge.update).toHaveBeenCalledWith({
      where: { id: requested.challengeId },
      data: { attempts: { increment: 1 } },
    });
  });
});
