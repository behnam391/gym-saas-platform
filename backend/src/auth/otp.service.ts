import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OtpChannel, OtpPurpose } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationProviderService } from '../queue/notification-provider.service';
import { RequestOtpDto } from './dto/otp.dto';

interface VerificationPayload {
  sub: string;
  typ: 'otp_verification';
  purpose: OtpPurpose;
  channel: OtpChannel;
  destination: string;
}

@Injectable()
export class OtpService {
  private readonly ttlMs = 5 * 60_000;
  private readonly resendDelayMs = 60_000;
  private readonly maxPerHour = 5;
  private readonly maxAttempts = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly provider: NotificationProviderService,
  ) {}

  async request(dto: RequestOtpDto) {
    const db = this.prisma.forPlatform();
    const channel = dto.channel as OtpChannel;
    const purpose = dto.purpose as OtpPurpose;
    const destination = this.normalizeDestination(channel, dto.destination);
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60_000);

    const recent = await db.otpChallenge.findMany({
      where: { destination, purpose, createdAt: { gte: hourAgo } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
      take: this.maxPerHour,
    });
    if (
      recent[0] &&
      now.getTime() - recent[0].createdAt.getTime() < this.resendDelayMs
    ) {
      throw new HttpException(
        'برای ارسال مجدد کد، یک دقیقه صبر کنید.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (recent.length >= this.maxPerHour) {
      throw new HttpException(
        'تعداد درخواست‌ها بیش از حد مجاز است؛ یک ساعت دیگر تلاش کنید.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const targetExists = await this.targetExists(destination);
    const shouldSend =
      purpose === 'REGISTER' || purpose === 'ONBOARDING'
        ? true
        : targetExists;
    const id = crypto.randomUUID();
    const code = crypto.randomInt(100_000, 1_000_000).toString();
    const challenge = await db.otpChallenge.create({
      data: {
        id,
        channel,
        purpose,
        destination,
        codeHash: this.hashCode(id, code),
        expiresAt: new Date(now.getTime() + this.ttlMs),
      },
      select: { id: true, expiresAt: true },
    });

    let delivery: 'SENT' | 'DRY_RUN' | 'BLOCKED' = 'SENT';
    if (shouldSend) {
      delivery =
        channel === 'SMS'
          ? await this.provider.sendSms({
              to: destination,
              text: `کد تأیید گُردیار: ${code}\nاین کد تا ۵ دقیقه معتبر است.`,
              verification: { token: code },
            })
          : await this.provider.sendEmail({
              to: destination,
              subject: 'کد تأیید گُردیار',
              html: `<div dir="rtl"><p>کد تأیید شما:</p><p style="font-size:28px;font-weight:bold;letter-spacing:5px">${code}</p><p>این کد تا ۵ دقیقه معتبر است.</p></div>`,
            });
    }

    if (
      shouldSend &&
      delivery !== 'SENT' &&
      process.env.NODE_ENV === 'production'
    ) {
      throw new ServiceUnavailableException(
        channel === 'SMS'
          ? 'ارسال پیامک برای این شماره هنوز فعال نیست؛ روش ایمیل را انتخاب کنید یا بعداً دوباره تلاش کنید.'
          : 'ارسال ایمیل هنوز فعال نیست؛ روش پیامک را انتخاب کنید یا بعداً دوباره تلاش کنید.',
      );
    }

    return {
      challengeId: challenge.id,
      expiresAt: challenge.expiresAt,
      retryAfterSeconds: 60,
      message: shouldSend
        ? 'کد تأیید ارسال شد.'
        : 'اگر حسابی با این مشخصات وجود داشته باشد، کد تأیید ارسال می‌شود.',
      ...(process.env.NODE_ENV !== 'production' && delivery !== 'SENT'
        ? { debugCode: code }
        : {}),
    };
  }

  async verify(challengeId: string, code: string) {
    const db = this.prisma.forPlatform();
    const challenge = await db.otpChallenge.findUnique({
      where: { id: challengeId },
    });
    const now = new Date();
    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt <= now ||
      challenge.attempts >= this.maxAttempts
    ) {
      throw new BadRequestException('کد تأیید نامعتبر یا منقضی شده است.');
    }

    const expected = Buffer.from(challenge.codeHash, 'hex');
    const actual = Buffer.from(this.hashCode(challenge.id, code), 'hex');
    const valid =
      expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual);
    if (!valid) {
      await db.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('کد تأیید صحیح نیست.');
    }

    await db.otpChallenge.update({
      where: { id: challenge.id },
      data: { verifiedAt: now },
    });
    const payload: VerificationPayload = {
      sub: challenge.id,
      typ: 'otp_verification',
      purpose: challenge.purpose,
      channel: challenge.channel,
      destination: challenge.destination,
    };
    return {
      verificationToken: this.jwt.sign(payload, {
        secret: this.verificationSecret(),
        expiresIn: 10 * 60,
        issuer: 'gordyar-api',
        audience: 'gordyar-otp',
      }),
      channel: challenge.channel,
      destination: challenge.destination,
      message: 'شماره یا ایمیل شما با موفقیت تأیید شد.',
    };
  }

  async consume(
    token: string,
    purpose: OtpPurpose,
    expectedDestination?: string,
  ) {
    let payload: VerificationPayload;
    try {
      payload = await this.jwt.verifyAsync<VerificationPayload>(token, {
        secret: this.verificationSecret(),
        issuer: 'gordyar-api',
        audience: 'gordyar-otp',
      });
    } catch {
      throw new UnauthorizedException(
        'تأیید هویت منقضی یا نامعتبر است؛ کد جدید دریافت کنید.',
      );
    }
    if (payload.typ !== 'otp_verification' || payload.purpose !== purpose) {
      throw new UnauthorizedException('کد تأیید برای این عملیات معتبر نیست.');
    }
    if (
      expectedDestination &&
      payload.destination !==
        this.normalizeDestination(payload.channel, expectedDestination)
    ) {
      throw new UnauthorizedException(
        'شماره یا ایمیل تأییدشده با اطلاعات فرم یکسان نیست.',
      );
    }

    const db = this.prisma.forPlatform();
    const consumed = await db.otpChallenge.updateMany({
      where: {
        id: payload.sub,
        purpose,
        channel: payload.channel,
        destination: payload.destination,
        verifiedAt: { not: null },
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) {
      throw new UnauthorizedException(
        'این کد قبلاً استفاده شده یا اعتبار آن پایان یافته است.',
      );
    }
    return payload;
  }

  private async targetExists(destination: string) {
    return Boolean(
      await this.prisma.forPlatform().user.findFirst({
        where: {
          OR: [{ mobile: destination }, { email: destination }],
          isActive: true,
        },
        select: { id: true },
      }),
    );
  }

  private normalizeDestination(channel: OtpChannel, value: string) {
    const normalized = value.trim().toLowerCase();
    if (channel === 'EMAIL') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        throw new BadRequestException('ایمیل معتبر نیست.');
      }
      return normalized;
    }
    const digits = normalized.replace(/\D/g, '');
    const mobile = digits.startsWith('0098')
      ? `0${digits.slice(4)}`
      : digits.startsWith('98')
        ? `0${digits.slice(2)}`
        : digits;
    if (!/^09\d{9}$/.test(mobile)) {
      throw new BadRequestException('شماره موبایل معتبر نیست.');
    }
    return mobile;
  }

  private hashCode(challengeId: string, code: string) {
    return crypto
      .createHmac('sha256', this.verificationSecret())
      .update(`${challengeId}:${code}`)
      .digest('hex');
  }

  private verificationSecret() {
    return process.env.OTP_SECRET || process.env.JWT_REFRESH_SECRET!;
  }
}
