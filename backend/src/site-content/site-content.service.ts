import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHeroSlideDto, UpdateHeroSlideDto } from './dto/hero-slide.dto';

@Injectable()
export class SiteContentService {
  constructor(private readonly prisma: PrismaService) {}

  publicHeroSlides() {
    return this.prisma.forPlatform().heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  adminHeroSlides() {
    return this.prisma.forPlatform().heroSlide.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  createHeroSlide(dto: CreateHeroSlideDto) {
    return this.prisma.forPlatform().heroSlide.create({ data: dto });
  }

  async updateHeroSlide(slideId: string, dto: UpdateHeroSlideDto) {
    const db = this.prisma.forPlatform();
    const slide = await db.heroSlide.findUnique({ where: { id: slideId }, select: { id: true } });
    if (!slide) throw new NotFoundException('اسلاید یافت نشد.');
    return db.heroSlide.update({ where: { id: slideId }, data: dto });
  }

  async removeHeroSlide(slideId: string) {
    const db = this.prisma.forPlatform();
    const slide = await db.heroSlide.findUnique({ where: { id: slideId }, select: { id: true } });
    if (!slide) throw new NotFoundException('اسلاید یافت نشد.');
    await db.heroSlide.delete({ where: { id: slideId } });
    return { deleted: true };
  }
}
