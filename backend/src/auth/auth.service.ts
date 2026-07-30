import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto, LoginDto } from './dto/login.dto';
import { isMinor as checkIsMinor } from '../common/age.util';
import { OtpService } from './otp.service';
import {
  OtpLoginDto,
  RequestOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly otp: OtpService,
  ) {}

  requestOtp(dto: RequestOtpDto) {
    return this.otp.request(dto);
  }

  verifyOtp(dto: VerifyOtpDto) {
    return this.otp.verify(dto.challengeId, dto.code);
  }

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

    if (dto.membershipPlanId && !dto.tenantId) {
      throw new BadRequestException('انتخاب پلن عضویت بدون باشگاه امکان‌پذیر نیست.');
    }

    let selectedPlan: { id: string } | null = null;
    if (dto.tenantId) {
      const tenant = await db.tenant.findFirst({
        where: { id: dto.tenantId, isActive: true, isVerified: true },
        select: { id: true },
      });
      if (!tenant) {
        throw new BadRequestException('باشگاه انتخاب‌شده فعال یا تاییدشده نیست.');
      }

      if (dto.membershipPlanId) {
        selectedPlan = await db.membershipPlan.findFirst({
          where: {
            id: dto.membershipPlanId,
            tenantId: dto.tenantId,
            isActive: true,
          },
          select: { id: true },
        });
        if (!selectedPlan) {
          throw new BadRequestException('پلن عضویت انتخاب‌شده معتبر نیست.');
        }
      }
    }

    const dob = new Date(dto.dateOfBirth);
    if (Number.isNaN(dob.getTime()) || dob > new Date()) {
      throw new BadRequestException('تاریخ تولد نمی‌تواند در آینده باشد.');
    }
    const isMinor = checkIsMinor(dob);

    const verification = await this.otp.consume(
      dto.verificationToken,
      'REGISTER',
      dto.mobile === dto.email
        ? dto.mobile
        : undefined,
    );
    if (
      verification.destination !== dto.mobile &&
      verification.destination !== dto.email?.trim().toLowerCase()
    ) {
      throw new BadRequestException(
        'شماره موبایل یا ایمیل تأییدشده با اطلاعات فرم یکسان نیست.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await db.user.create({
      data: {
        tenantId: dto.tenantId ?? null,
        role: 'ATHLETE',
        firstName: dto.firstName,
        lastName: dto.lastName,
        nationalId: dto.nationalId,
        mobile: dto.mobile,
        email: dto.email?.trim().toLowerCase(),
        passwordHash,
        gender: dto.gender as any,
        dateOfBirth: dob,
        isMinor,
        // A minor's account stays restricted until a gym admin approves
        // their uploaded ParentalConsent — enforced again at the service
        // layer for every gated action, not just at signup.
        isRestricted: isMinor,
        mobileVerifiedAt:
          verification.channel === 'SMS' ? new Date() : undefined,
        emailVerifiedAt:
          verification.channel === 'EMAIL' ? new Date() : undefined,
        city: dto.city,
        address: dto.address,
        athleteProfile: { create: {} },
        ...(selectedPlan && dto.tenantId
          ? {
              memberships: {
                create: {
                  tenantId: dto.tenantId,
                  planId: selectedPlan.id,
                  status: 'PENDING_INSURANCE',
                },
              },
            }
          : {}),
      },
      select: { id: true, role: true, tenantId: true, isMinor: true },
    });

    return {
      userId: user.id,
      isMinor: user.isMinor,
      membershipRequested: Boolean(selectedPlan),
      message: user.isMinor
        ? selectedPlan
          ? 'ثبت‌نام و درخواست عضویت انجام شد. حساب تا تایید رضایت‌نامه والدین و بیمه ورزشی محدود است.'
          : 'ثبت‌نام انجام شد. حساب کاربری تا تایید رضایت‌نامه والدین محدود است.'
        : selectedPlan
          ? 'ثبت‌نام و درخواست عضویت با موفقیت انجام شد. برای فعال‌سازی، بیمه ورزشی را بارگذاری کنید.'
          : 'ثبت‌نام با موفقیت انجام شد.',
    };
  }

  async login(dto: LoginDto) {
    const db = this.prisma.forPlatform();
    const user = await db.user.findFirst({
      where: {
        role: dto.expectedRole,
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

  async loginWithOtp(dto: OtpLoginDto) {
    const verification = await this.otp.consume(
      dto.verificationToken,
      'LOGIN',
    );
    const db = this.prisma.forPlatform();
    const user = await db.user.findFirst({
      where: {
        role: dto.expectedRole,
        isActive: true,
        OR: [
          { mobile: verification.destination },
          { email: verification.destination },
        ],
      },
    });
    if (!user) {
      throw new UnauthorizedException(
        'حساب فعالی برای این درگاه ورود پیدا نشد.',
      );
    }
    await db.user.update({
      where: { id: user.id },
      data:
        verification.channel === 'SMS'
          ? { mobileVerifiedAt: user.mobileVerifiedAt ?? new Date() }
          : { emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
    });
    return this.issueTokens(db, user.id, user.role, user.tenantId);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const verification = await this.otp.consume(
      dto.verificationToken,
      'RESET_PASSWORD',
    );
    const db = this.prisma.forPlatform();
    const user = await db.user.findFirst({
      where: {
        isActive: true,
        OR: [
          { mobile: verification.destination },
          { email: verification.destination },
        ],
      },
      select: { id: true, passwordHash: true },
    });
    if (!user) {
      throw new UnauthorizedException(
        'حساب فعالی با این مشخصات پیدا نشد.',
      );
    }
    const samePassword = await bcrypt.compare(
      dto.newPassword,
      user.passwordHash,
    );
    if (samePassword) {
      throw new BadRequestException(
        'رمز عبور جدید باید با رمز قبلی متفاوت باشد.',
      );
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          ...(verification.channel === 'SMS'
            ? { mobileVerifiedAt: new Date() }
            : { emailVerifiedAt: new Date() }),
        },
      }),
      db.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return {
      message: 'رمز عبور با موفقیت تغییر کرد. اکنون وارد حساب شوید.',
    };
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

    // Rotate with a compare-and-set so two concurrent refresh requests cannot
    // both reuse the same token. Exactly one request may change revokedAt from
    // null; every replay loses the race and is rejected.
    const revoked = await db.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (revoked.count !== 1) {
      throw new UnauthorizedException('نشست منقضی شده است. دوباره وارد شوید.');
    }

    return this.issueTokens(
      db,
      stored.user.id,
      stored.user.role,
      stored.user.tenantId,
    );
  }

  async logout(refreshToken: string, expoPushToken?: string) {
    const db = this.prisma.forPlatform();
    const tokenHash = this.hashToken(refreshToken);
    const stored = await db.refreshToken.findFirst({
      where: { tokenHash },
      select: { userId: true },
    });
    await db.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (stored && expoPushToken) {
      await db.pushDevice.updateMany({
        where: { userId: stored.userId, expoPushToken },
        data: { isActive: false },
      });
    }
    return { message: 'خروج با موفقیت انجام شد.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const db = this.prisma.forPlatform();
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('حساب کاربری فعال نیست.');
    }

    const currentPasswordIsValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!currentPasswordIsValid) {
      throw new UnauthorizedException('رمز عبور فعلی صحیح نیست.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('رمز عبور جدید باید با رمز فعلی متفاوت باشد.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await db.$transaction(async (tx) => {
      const changed = await tx.user.updateMany({
        where: { id: user.id, passwordHash: user.passwordHash, isActive: true },
        data: { passwordHash: newPasswordHash },
      });
      if (changed.count !== 1) {
        throw new UnauthorizedException(
          'اطلاعات حساب تغییر کرده است؛ دوباره وارد شوید.',
        );
      }

      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return {
      message: 'رمز عبور تغییر کرد. برای امنیت، همه نشست‌ها بسته شدند.',
      reauthenticationRequired: true,
    };
  }

  private async issueTokens(
    db: ReturnType<PrismaService['forPlatform']>,
    userId: string,
    role: string,
    tenantId: string | null,
  ) {
    const payload = { sub: userId, role, tenantId };

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
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
