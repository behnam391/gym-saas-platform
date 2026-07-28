import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TrainersModule } from './trainers/trainers.module';
import { NutritionistsModule } from './nutritionists/nutritionists.module';
import { AiEngineModule } from './ai-engine/ai-engine.module';
import { CafeteriaModule } from './cafeteria/cafeteria.module';
import { TicketsModule } from './tickets/tickets.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProgramsModule } from './programs/programs.module';
import { DietModule } from './diet/diet.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { validateEnv } from './config/env.validation';
import { AthletesModule } from './athletes/athletes.module';
import { PaymentsModule } from './payments/payments.module';
import { MessagesModule } from './messages/messages.module';
import { ProfilesModule } from './profiles/profiles.module';
import { FinancialAccountsModule } from './financial-accounts/financial-accounts.module';
import { AttendanceDevicesModule } from './attendance-devices/attendance-devices.module';
import { AdvertisementsModule } from './advertisements/advertisements.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { TenantStaffModule } from './tenant-staff/tenant-staff.module';
import { PlatformProfessionalsModule } from './platform-professionals/platform-professionals.module';
import { SiteContentModule } from './site-content/site-content.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]), // global default; tighter per-route via @Throttle
    JwtModule.register({}),
    PrismaModule,
    AuthModule,
    AttendanceModule,
    TrainersModule,
    NutritionistsModule,
    AiEngineModule,
    CafeteriaModule,
    TicketsModule,
    ReviewsModule,
    NotificationsModule,
    TenantsModule,
    ProgramsModule,
    DietModule,
    SuperAdminModule,
    UploadsModule,
    AthletesModule,
    PaymentsModule,
    MessagesModule,
    ProfilesModule,
    FinancialAccountsModule,
    AttendanceDevicesModule,
    AdvertisementsModule,
    OnboardingModule,
    TenantStaffModule,
    PlatformProfessionalsModule,
    SiteContentModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*splat');
  }
}
