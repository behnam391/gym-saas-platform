import { BadRequestException } from '@nestjs/common';
import { GenderDto } from '../auth/dto/register.dto';
import { TenantStaffService } from './tenant-staff.service';

describe('TenantStaffService', () => {
  const db = { user: { findFirst: jest.fn() } };
  const prisma = {
    forPlatform: () => db,
    forTenant: jest.fn(),
  };
  const tenantContext = { requireTenantId: () => 'tenant-1' };
  const subscriptionAccess = { assertCapacity: jest.fn() };
  const service = new TenantStaffService(
    prisma as never,
    tenantContext as never,
    subscriptionAccess as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('does not let a gym owner create privileged platform roles', async () => {
    await expect(service.create('owner-1', {
      role: 'SUPER_ADMIN' as never,
      firstName: 'مدیر',
      lastName: 'جعلی',
      nationalId: '0012345678',
      mobile: '09120000001',
      gender: GenderDto.MALE,
      dateOfBirth: '1990-01-01',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(db.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a future birth date before creating an account', async () => {
    await expect(service.create('owner-1', {
      role: 'RECEPTION',
      firstName: 'نگین',
      lastName: 'پذیرش',
      nationalId: '0012345678',
      mobile: '09120000001',
      gender: GenderDto.FEMALE,
      dateOfBirth: '2999-01-01',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(db.user.findFirst).not.toHaveBeenCalled();
  });
});
