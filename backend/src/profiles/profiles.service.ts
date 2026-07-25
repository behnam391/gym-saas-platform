import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { UpdateMyProfileDto } from './dto/profile.dto';

const PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  mobile: true,
  email: true,
  role: true,
  city: true,
  address: true,
  profileImageUrl: true,
  tenant: { select: { id: true, name: true, logoUrl: true } },
} as const;

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(user: AuthenticatedUser) {
    const profile = user.role === 'SUPER_ADMIN'
      ? await this.prisma.forPlatform().user.findUnique({ where: { id: user.userId }, select: PROFILE_SELECT })
      : await this.prisma.forTenant((tx) => tx.user.findUnique({ where: { id: user.userId }, select: PROFILE_SELECT }));
    if (!profile) throw new NotFoundException('پروفایل کاربر یافت نشد.');
    return profile;
  }

  async updateMe(user: AuthenticatedUser, dto: UpdateMyProfileDto) {
    if (user.role === 'SUPER_ADMIN') {
      return this.prisma.forPlatform().user.update({ where: { id: user.userId }, data: dto, select: PROFILE_SELECT });
    }
    return this.prisma.forTenant((tx) => tx.user.update({ where: { id: user.userId }, data: dto, select: PROFILE_SELECT }));
  }
}
