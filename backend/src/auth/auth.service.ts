import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { calculateAge, isMinor as checkIsMinor } from '../common/age.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Registration is a pre-authentication, cross-tenant-by-necessity flow
   * (we don't yet know which tenant context to scope to — a user can sign
   * up at the platform level and later request membership at any gym), so
   * it intentionally uses the platform connection rather than
   * `prisma.forTenant()`. This is the ONE legitimate place in the codebase
   * outside of true Super-Admin endpoints where that's appropriate; every
   * other service must go through `forTenant()`.
   */
  async register(dto: RegisterDto) {
    const db = this.prisma.forPlatform();

    const existing = await db.user.findFirst({
      where: { OR: [{ mobile: dto.mobile }, { nationalId: dto.nationalId }] },
    });
    if (existing) {
      throw new ConflictException(
        'کاربری با این شماره موبایل یا کد ملی قبلاً ثبت‌نام کرده است.',
      );
    }

    const dob = new Date(dto.dateOfBirth);
    const age = calculateAge(dob);
    const isMinor = checkIsMinor(dob);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await db.user.create({
      data: {
        tenantId: dto.tenantId ?? null,
        role: 'ATHLETE',
        firstName: dto.firstName,
        lastName: dto.lastName,
        nationalId: dto.nationalId,
        mobile: dto.mobile,
        email: dto.email,
        passwordHash,
        gender: dto.gender as any,
        dateOfBirth: dob,
        isMinor,
        // A minor's account stays restricted until a gym admin approves
        // their uploaded ParentalConsent — enforced again at the service
        // layer for every gated action, not just at signup.
        isRestricted: isMinor,
        city: dto.city,
        address: dto.address,
        athleteProfile: { create: {} },
      },
      select: { id: true, role: true, tenantId: true, isMinor: true },
    });

    return {
      userId: user.id,
      isMinor: user.isMinor,
      message: user.isMinor
        ? 'ثبت‌نام انجام شد. حساب کاربری تا تایید رضایت‌نامه والدین محدود است.'
        : 'ثبت‌نام با موفقیت انجام شد.',
    };
  }

  async login(dto: LoginDto) {
    const db = this.prisma.forPlatform();
    const user = await db.user.findFirst({
      where: {
        OR: [{ mobile: dto.identifier }, { nationalId: dto.identifier }],
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('اطلاعات ورود نامعتبر است.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('اطلاعات ورود نامعتبر است.');
    }

    return this.issueTokens(db, user.id, user.role, user.tenantId);
  }

  async refresh(refreshToken: string) {
    const db = this.prisma.forPlatform();
    const tokenHash = this.hashToken(refreshToken);

    const stored = await db.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('نشست منقضی شده است. دوباره وارد شوید.');
    }

    // Rotate: revoke the used refresh token, issue a brand new pair.
    await db.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(
      db,
      stored.user.id,
      stored.user.role,
      stored.user.tenantId,
    );
  }

  async logout(refreshToken: string) {
    const db = this.prisma.forPlatform();
    const tokenHash = this.hashToken(refreshToken);
    await db.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'خروج با موفقیت انجام شد.' };
  }

  private async issueTokens(
    db: ReturnType<PrismaService['forPlatform']>,
    userId: string,
    role: string,
    tenantId: string | null,
  ) {
    const payload = { sub: userId, role, tenantId };

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_TTL ?? '15m',
    });

    const refreshTokenRaw = crypto.randomBytes(48).toString('hex');
    const refreshTtlMs = 30 * 24 * 60 * 60 * 1000; // 30d fallback

    await db.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshTokenRaw),
        expiresAt: new Date(Date.now() + refreshTtlMs),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      role,
      tenantId,
    };
  }

  // Refresh tokens are stored hashed (never plaintext), same principle as passwords.
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
