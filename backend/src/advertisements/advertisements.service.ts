import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { CreateAdvertisementDto, AdvertisementQueryDto, ReviewAdvertisementDto } from './dto/advertisement.dto';

@Injectable()
export class AdvertisementsService {
  constructor(private readonly prisma: PrismaService, private readonly tenantContext: TenantContext) {}

  listPublic(query: AdvertisementQueryDto) {
    const now = new Date();
    return this.prisma.forPlatform().advertisement.findMany({
      where: {
        status: 'APPROVED',
        ...(query.province ? { province: query.province } : {}),
        ...(query.city ? { OR: [{ city: query.city }, { city: null }] } : {}),
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      include: { tenant: { select: { slug: true, name: true, logoUrl: true, city: true, province: true } } },
      orderBy: [{ dailyBudget: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    });
  }

  listMine() {
    return this.prisma.forTenant((tx) => tx.advertisement.findMany({ orderBy: { createdAt: 'desc' } }));
  }

  create(dto: CreateAdvertisementDto) {
    return this.prisma.forTenant((tx) => tx.advertisement.create({
      data: { ...dto, tenantId: this.tenantContext.requireTenantId(), status: 'PENDING' },
    }));
  }

  listForReview() {
    return this.prisma.forPlatform().advertisement.findMany({
      include: { tenant: { select: { name: true, slug: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async review(id: string, reviewerId: string, dto: ReviewAdvertisementDto) {
    const db = this.prisma.forPlatform();
    const advertisement = await db.advertisement.findUnique({ where: { id } });
    if (!advertisement) throw new NotFoundException('تبلیغ یافت نشد.');
    return db.advertisement.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason : null,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        startsAt: dto.status === 'APPROVED' ? (advertisement.startsAt ?? new Date()) : advertisement.startsAt,
      },
    });
  }
}
