import { ConflictException, NotFoundException } from '@nestjs/common';
import { PlatformProfessionalsService } from './platform-professionals.service';

describe('PlatformProfessionalsService', () => {
  const db = {
    user: { findFirst: jest.fn() },
    platformProfessional: { findMany: jest.fn(), findFirst: jest.fn() },
    consultationRequest: { findFirst: jest.fn(), create: jest.fn() },
  };
  const service = new PlatformProfessionalsService({ forPlatform: () => db } as never);

  beforeEach(() => jest.clearAllMocks());

  it('only exposes active professionals in the public directory', async () => {
    db.platformProfessional.findMany.mockResolvedValue([]);
    await service.publicList('TRAINER');
    expect(db.platformProfessional.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isActive: true, type: 'TRAINER' },
    }));
  });

  it('blocks a second open consultation with the same professional', async () => {
    db.user.findFirst.mockResolvedValue({ id: 'athlete-1' });
    db.platformProfessional.findFirst.mockResolvedValue({ id: 'pro-1', fullName: 'متخصص تست' });
    db.consultationRequest.findFirst.mockResolvedValue({ id: 'open-request' });

    await expect(service.requestConsultation('athlete-1', 'pro-1', {}))
      .rejects.toBeInstanceOf(ConflictException);
    expect(db.consultationRequest.create).not.toHaveBeenCalled();
  });

  it('rejects consultation requests for inactive professionals', async () => {
    db.user.findFirst.mockResolvedValue({ id: 'athlete-1' });
    db.platformProfessional.findFirst.mockResolvedValue(null);
    db.consultationRequest.findFirst.mockResolvedValue(null);

    await expect(service.requestConsultation('athlete-1', 'pro-1', {}))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
