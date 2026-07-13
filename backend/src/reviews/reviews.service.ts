import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  async create(authorId: string, dto: CreateReviewDto) {
    return this.prisma.forTenant(async (tx) => {
      const review = await tx.review.create({
        data: {
          tenantId: this.tenantContext.requireTenantId(),
          authorId,
          targetType: dto.targetType as any,
          targetId: dto.targetId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      if (dto.targetType === 'GYM') {
        await this.recalculateTrustScore(tx, this.tenantContext.requireTenantId());
      }

      return review;
    });
  }

  listForTarget(targetType: string, targetId: string) {
    return this.prisma.forTenant((tx) =>
      tx.review.findMany({
        where: { targetType: targetType as any, targetId },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { firstName: true, lastName: true } } },
      }),
    );
  }

  /**
   * Trust Score (0-100), a simplified blend of:
   *   - average star rating (0-100 scale)            weight 0.7
   *   - inverse complaint ratio (tickets vs reviews)  weight 0.3
   * A full implementation would also factor response time and resolution
   * rate from Ticket.resolvedAt — left as a documented extension point.
   */
  private async recalculateTrustScore(tx: any, tenantId: string) {
    const reviews = await tx.review.findMany({ where: { targetType: 'GYM', targetId: tenantId } });
    const avgRating =
      reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / (reviews.length || 1);
    const ratingScore = (avgRating / 5) * 100;

    const ticketCount = await tx.ticket.count({ where: { targetType: 'GYM', targetId: tenantId } });
    const complaintRatio = ticketCount / ((reviews.length || 0) + ticketCount || 1);
    const complaintScore = (1 - complaintRatio) * 100;

    const trustScore = ratingScore * 0.7 + complaintScore * 0.3;

    await tx.tenant.update({ where: { id: tenantId }, data: { trustScore } });
  }
}
