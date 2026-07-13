# Backend — NestJS API (اسکلت)

## ساختار

```
src/
  common/
    decorators/   Roles, CurrentUser
    guards/       JwtAuthGuard, RolesGuard
    middleware/   TenantContextMiddleware (JWT -> request-scoped tenant)
    tenant-context.ts
  prisma/
    prisma.service.ts   forTenant() / forPlatform() wrapper (RLS-aware)
    prisma.module.ts
  auth/           register (با منطق محاسبه سن/minor)، login، refresh، logout
  attendance/     نمونه کامل یک ماژول tenant-scoped: check-in/out + crowd status + WebSocket gateway
  app.module.ts
  main.ts
prisma/
  schema.prisma       اسکیمای کامل (از مرحله قبل)
  rls-policies.sql     سیاست‌های Row-Level Security — بعد از migrate اجرا شود
```

## اجرا

```bash
cp .env.example .env   # و مقادیر را پر کنید
npm install
npx prisma migrate dev --name init
psql "$DATABASE_URL" -f prisma/rls-policies.sql
npm run start:dev
```

## الگوی افزودن ماژول جدید (tenant-scoped)

هر ماژول جدید (Trainers، Nutritionists، Programs، Diet، Cafeteria، Tickets، Reviews، Notifications، AI Engine، Marketplace، SuperAdmin) باید همین الگوی `attendance/` را دنبال کند:

1. **DTO** با اعتبارسنجی فارسی (`class-validator`).
2. **Service** که هر کوئری را داخل `this.prisma.forTenant(tx => ...)` اجرا می‌کند — هرگز مستقیم از `PrismaClient` استفاده نشود.
3. **Controller** با `@UseGuards(JwtAuthGuard, RolesGuard)` در سطح کلاس و `@Roles(...)` روی هر route برای RBAC دقیق.
4. ثبت ماژول در `AppModule.imports`.

برای endpoint های سطح پلتفرم (Super Admin) از `this.prisma.forPlatform()` به‌همراه `@Roles('SUPER_ADMIN')` استفاده شود — این دو همیشه باید با هم بیایند، چون `forPlatform()` خودش نقش را بررسی نمی‌کند (مسئولیت guard است).

## ماژول‌های تکمیل‌شده در این مرحله

| ماژول | نکته کلیدی طراحی |
|---|---|
| `trainers/` | self-apply توسط کاربر TRAINER → تایید توسط `GYM_OWNER`؛ assign به athlete از طریق `TrainerStudent` |
| `nutritionists/` | self-apply tenant-scoped؛ تایید *فقط* توسط `SUPER_ADMIN` از طریق `forPlatform()` (cross-tenant) |
| `ai-engine/` | فراخوانی Anthropic API با پرامپت‌های JSON-only فارسی؛ هر خروجی با `status: GENERATED` شروع می‌شود و تا `APPROVED` توسط مربی/متخصص تغذیه به athlete نمایش داده نمی‌شود؛ بازبینی بر اساس نوع پیشنهاد به نقش بازبین محدود شده (مربی فقط workout/trainer-summary، متخصص تغذیه فقط nutrition/nutritionist-summary) |
| `cafeteria/` | دسته‌بندی + محصول + سفارش با کاهش موجودی atomic (`updateMany` شرطی به‌جای read-then-write، برای جلوگیری از overselling در شرایط همزمانی) |
| `tickets/` | ایجاد توسط هر کاربر، مدیریت توسط `GYM_OWNER`/`RECEPTION`، اولویت و وضعیت مطابق اسپک |
| `reviews/` | ثبت نظر + بازمحاسبه ساده Trust Score باشگاه (۷۰٪ میانگین امتیاز، ۳۰٪ نسبت معکوس شکایات) — نقطه توسعه آینده: افزودن response-time |
| `notifications/` | `create()` می‌نویسد در دیتابیس (برای زنگ اعلان داخل اپ) و — اگر کانال SMS/EMAIL باشد — یک job در صف BullMQ (`queue/`) قرار می‌دهد؛ ارسال واقعی در یک پراسس جدا (`worker`) اتفاق می‌افتد |
| `queue/` | `QueueModule` (فقط producer، در پراسس API) + `WorkerProcessorModule` (consumer واقعی، فقط در پراسس `worker`) — جدا نگه‌داشتن این دو یعنی API هیچ‌وقت برای ارسال SMS کند نمی‌شود و یک گیت‌وی قطع، API را down نمی‌کند |
| `uploads/` | تولید presigned PUT URL برای آپلود مستقیم کلاینت→S3 (نه از طریق API)؛ اعتبارسنجی نوع فایل بر اساس `purpose` (مثلاً فقط PDF/تصویر برای اسناد بیمه) |

## ماژول‌های نهایی این بسته

| ماژول | نکته کلیدی طراحی |
|---|---|
| `tenants/` | جستجوی عمومی مارکت‌پلیس (فیلتر شهر/قیمت/امتیاز/امکانات/جنسیت/فاصله با فرمول Haversine) بدون auth؛ + مدیریت پروفایل/پلن عضویت/اعضا توسط Gym Owner؛ + تایید بیمه و رضایت‌نامه والدین (تنها نقطه‌ای که `isRestricted` کاربر خردسال پاک می‌شود) |
| `programs/` | ساخت برنامه تمرینی از صفر یا از یک `AISuggestion` که `status: APPROVED` دارد — اگر تایید نشده باشد، تبدیل به برنامه فعال رد می‌شود |
| `diet/` | همان الگوی `programs/` برای متخصص تغذیه و `DietPlan` |
| `super-admin/` | تمام متدها `forPlatform()` هستند (cross-tenant by nature)؛ کنترلر یک‌بار در سطح کلاس با `@Roles('SUPER_ADMIN')` محافظت شده تا هیچ route ای سهوا بدون آن نماند |

این آخرین دسته بود — **تمام ماژول‌های اصلی اسپک اولیه اکنون در بک‌اند پوشش داده شده‌اند**: Auth، Tenants/Marketplace، Trainers، Nutritionists، AI Engine، Programs، Diet، Attendance/Crowd، Cafeteria، Tickets، Reviews، Notifications، Super Admin.

## نکته مهم درباره استفاده از `forPlatform()`

سه (و فقط سه) مورد مجاز برای استفاده از اتصال cross-tenant در کل کدبیس وجود دارد؛ هر استفاده جدید باید یکی از این‌ها باشد، نه یک میانبر موردی:

1. **Auth pre-login** (`auth.service.ts`) — قبل از احراز هویت، tenant مشخص نیست.
2. **Super Admin** (`super-admin.service.ts`, تایید نهایی نقش نوتریشنیست) — همیشه پشت `@Roles('SUPER_ADMIN')`.
3. **مارکت‌پلیس عمومی، فقط خواندن** (`tenants.service.ts: search/getPublicProfile`) — هیچ نوشتنی در این مسیر وجود ندارد.

## چیزی که در این بسته نیست (به‌صورت آگاهانه)

- اتصال واقعی به یک گیت‌وی SMS/SMTP (Kavenegar، Melipayamak، یا یک SMTP relay) — `NotificationProviderService` در حالت dry-run لاگ می‌کند تا پیکربندی شود؛ ساختار صف و worker کامل و واقعی است.
- Migration واقعی Prisma (نیاز به اتصال شبکه برای دانلود schema-engine که در این محیط مسدود بود) — باید لوکال اجرا شود.

## تست‌ها

```bash
npm test          # تست‌های واحد (Jest) — سریع، بدون نیاز به دیتابیس واقعی
npm run test:cov  # با گزارش پوشش
npm run test:e2e  # نیاز به TEST_DATABASE_URL با schema + RLS اعمال‌شده
```

### تست‌های واحد (`src/**/__tests__/*.spec.ts`)

| فایل | چرا این مورد انتخاب شد |
|---|---|
| `common/age.util.spec.ts` | محاسبه سن/تشخیص خردسال حساس‌ترین منطق امنیتی-کاربری پروژه است؛ پوشش موارد لبه (روز قبل/بعد تولد، سال کبیسه) |
| `common/roles.guard.spec.ts` | تنها نقطه اجرای RBAC در کل پروژه؛ شامل تست صریح که SUPER_ADMIN **بدون** ذکر در `@Roles()` به مسیرهای دیگر دسترسی ندارد |
| `common/uuid.util.spec.ts` | لایه دفاعی قبل از تزریق tenantId به SQL خام؛ شامل تست با payload شبه‌SQL-Injection |
| `common/tenant-context.spec.ts` | اطمینان از این‌که `forTenant()` بدون tenantId معتبر هرگز اجرا نمی‌شود |
| `auth/auth.service.spec.ts` | اطمینان از این‌که `isMinor`/`isRestricted` همیشه سمت سرور محاسبه می‌شوند، نه از ورودی کاربر؛ + هرگز رمز عبور خام ذخیره نمی‌شود |
| `cafeteria/cafeteria.service.spec.ts` | تست مستقیم مکانیزم race-safety کاهش موجودی (شبیه‌سازی باخت race با `count: 0`) |
| `ai-engine/ai-engine.service.spec.ts` | اطمینان از این‌که مربی نمی‌تواند پیشنهاد رژیم غذایی را تایید کند و برعکس |

### تست e2e (`test/rls-isolation.e2e-spec.ts`)

مهم‌ترین تست کل پروژه: علیه یک Postgres واقعی (نه mock) ثابت می‌کند که Row-Level Security واقعاً جلوی دیدن/نوشتن داده تننت دیگر را می‌گیرد — حتی وقتی کوئری اپلیکیشن عمداً `WHERE tenantId` اشتباه یا بدون فیلتر باشد. این تضمین مستقل از صحت کد اپلیکیشن است؛ دقیقاً همان چیزی که در `database-design.md` به‌عنوان «دفاع لایه دوم» وعده داده شده. در صورت نبود `TEST_DATABASE_URL` به‌صورت خودکار skip می‌شود (نه fail) تا CI سریع/lint بدون دیتابیس واقعی کار کند.
