import { BadRequestException, ConflictException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

describe('OnboardingService', () => {
  const db = {
    onboardingApplication: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
  const otp = {
    consume: jest.fn().mockImplementation((token: string) =>
      Promise.resolve({ destination: token, channel: 'SMS' }),
    ),
  };
  const service = new OnboardingService(
    { forPlatform: () => db } as never,
    otp as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('requires organization details for gym-owner applications', async () => {
    await expect(service.create({
      verificationToken: '09120000001',
      type: 'GYM_OWNER',
      firstName: 'رضا',
      lastName: 'مدیری',
      nationalId: '0012345678',
      mobile: '09120000001',
      city: 'تهران',
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks duplicate pending applications for the same role and mobile', async () => {
    db.onboardingApplication.findFirst.mockResolvedValue({ id: 'pending-1' });
    await expect(service.create({
      verificationToken: '09120000003',
      type: 'TRAINER',
      firstName: 'علی',
      lastName: 'رضایی',
      nationalId: '0012345678',
      mobile: '09120000003',
      city: 'تهران',
      specialty: 'بدنسازی',
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('stores a professional request without creating a login account', async () => {
    db.onboardingApplication.findFirst.mockResolvedValue(null);
    db.onboardingApplication.create.mockResolvedValue({
      id: 'application-1',
      type: 'NUTRITIONIST',
      status: 'PENDING',
      createdAt: new Date(),
    });

    const result = await service.create({
      verificationToken: '09120000004',
      type: 'NUTRITIONIST',
      firstName: ' سارا ',
      lastName: ' احمدی ',
      nationalId: '0012345678',
      mobile: '09120000004',
      city: ' تهران ',
      specialty: ' تغذیه ورزشی ',
    });

    expect(result.status).toBe('PENDING');
    expect(db.onboardingApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: 'سارا',
          lastName: 'احمدی',
          city: 'تهران',
          specialty: 'تغذیه ورزشی',
        }),
      }),
    );
  });
});
