import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationProviderService } from '../queue/notification-provider.service';
import { OtpService } from './otp.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // secrets/ttl passed per-sign in AuthService
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    NotificationProviderService,
    JwtStrategy,
  ],
  exports: [AuthService, OtpService],
})
export class AuthModule {}
