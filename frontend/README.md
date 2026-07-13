# فرانت‌اند — Next.js + RTL فارسی

## سیستم طراحی (خلاصه)

این پروژه از یک پالت و الگوی بصری مشخص پیروی می‌کند، نه پیش‌فرض‌های عمومی ابزارهای طراحی AI:

- **پس‌زمینه:** سبز-ساج تیره (`#0E1815`) — حس باشگاه پریمیوم با متریال چوب/فلز، نه فضای دیجیتال صرف یا سیاه خام.
- **لهجه رنگی:** برنجی (`#C9A227`) — اشاره مستقیم به مدال و کارت‌های فلزی باشگاه‌های قدیمی.
- **تایپوگرافی:** فونت Vazirmatn (متغیر) برای تمام نقش‌ها — طراحی‌شده برای فارسی، x-height مناسب برای خوانایی در دیتاهای عددی داشبورد.
- **عنصر امضا (signature element):** `MembershipCard` — کارت با لبه نور برنجی و سایه داخلی، الهام‌گرفته از کارت عضویت لمینت‌شده فیزیکی باشگاه. در سراسر اپ (کارت باشگاه در مارکت‌پلیس، کارت پلن عضویت، کارت عضویت دیجیتال ورزشکار) به‌صورت یکدست تکرار می‌شود — نه یک پنل flat عمومی.

تمام توکن‌ها در `app/globals.css` به‌صورت CSS variable تعریف شده و در `tailwind.config.js` map شده‌اند؛ هیچ رنگ hardcoded در کامپوننت‌ها وجود ندارد.

## ساختار

```
app/
  layout.tsx              RTL + فونت Vazirmatn + متادیتا
  globals.css              توکن‌های طراحی + استایل پایه MembershipCard
  page.tsx                 صفحه اصلی مارکت‌پلیس (سرچ + گرید باشگاه‌ها)
  gyms/[slug]/page.tsx      پروفایل عمومی باشگاه + پلن‌های عضویت
  auth/login, register      فرم‌های ورود/ثبت‌نام (با تمام فیلدهای اسپک)
  dashboard/athlete/
    layout.tsx              shell سایدبار مشترک بین تمام داشبوردهای نقش‌محور
    page.tsx                نمای کلی: کارت عضویت دیجیتال + وضعیت شلوغی زنده
components/ui/              Button, Input, Badge, MembershipCard, GymCard, CrowdBadge, CrowdStatusWidget
lib/
  api.ts                    کلاینت fetch با مدیریت خطای فارسی
  cn.ts                     ادغام کلاس‌های Tailwind
```

## اجرا

```bash
cp .env.example .env.local
npm install
npm run dev
```

## الگوی افزودن داشبوردهای باقی‌مانده

شش پنل دیگر (Trainer، Nutritionist، Gym Owner، Reception/Buffet، Super Admin) باید دقیقاً از همین الگو پیروی کنند:

1. یک `app/dashboard/<role>/layout.tsx` با همان ساختار سایدبار (`dashboard/athlete/layout.tsx` را کپی و آیتم‌های نویگیشن را عوض کنید).
2. هر صفحه از `MembershipCard` برای تمام پنل‌های خلاصه‌ای استفاده می‌کند — نه کارت ساده — تا یکپارچگی بصری حفظ شود.
3. فراخوانی API همیشه از طریق `lib/api.ts` با `accessToken` از `sessionStorage` (یا در نسخه production: یک هوک `useAuth` که توکن را از یک httpOnly cookie/refresh flow می‌گیرد).
4. وضعیت‌ها (Pending/Approved/Rejected، اولویت تیکت، سطح شلوغی) همیشه با `Badge` و `tone` متناظر نمایش داده شوند: `success`/`warning`/`danger`/`accent`/`muted` — هرگز رنگ inline.

## همه داشبوردها ساخته شدند

| پنل | مسیر | نکته خاص |
|---|---|---|
| ورزشکار | `dashboard/athlete` | کارت عضویت دیجیتال + ویجت شلوغی زنده |
| صاحب باشگاه | `dashboard/gym-owner` | اعضا (تایید رضایت‌نامه والدین)، تایید مربیان، بوفه، مرکز تیکت |
| مربی | `dashboard/trainer` | لیست شاگردان از `/trainers/students` |
| متخصص تغذیه | `dashboard/nutritionist` | بنر وضعیت تایید Super Admin — تا تایید نشدن، قفل ساخت رژیم نشان داده می‌شود |
| پذیرش | `dashboard/reception` | فرم ثبت حضور دستی (جای‌گزین موقت اسکن QR واقعی) |
| مدیر ارشد (Super Admin) | `dashboard/super-admin` | آمار سراسری پلتفرم + صف تایید متخصصان تغذیه |

همه از یک کامپوننت مشترک `components/ui/dashboard-shell.tsx` استفاده می‌کنند (نه کپی-پیست سایدبار)؛ هر `layout.tsx` فقط آیتم‌های نویگیشن مخصوص نقش خودش را تعریف می‌کند:

```tsx
<DashboardShell title="پنل صاحب باشگاه" nav={NAV}>{children}</DashboardShell>
```

## درباره `cookies()` در صفحات سرور

صفحات داشبورد که در سرور fetch می‌کنند (`members`, `trainers`, `cafeteria`, `tickets`, `super-admin`) با `cookies().get('accessToken')` توکن را می‌خوانند. این یک placeholder عمدی است: در پیاده‌سازی نهایی باید یک Route Handler (`/api/auth/callback`) بعد از لاگین، `accessToken` را در یک کوکی httpOnly ست کند؛ فعلاً فرم لاگین/ثبت‌نام (که کلاینتی هستند) آن را در `sessionStorage` می‌گذارند که فقط برای کامپوننت‌های کلاینتی (مثل `CrowdStatusWidget`, `MembersTable`) در دسترس است.

## چیزی که در این بسته نیست (به‌صورت آگاهانه)

- مدیریت state سراسری (Zustand/Redux) — برای این حجم صفحه فعلی نیاز نبود؛ هر صفحه خودش fetch می‌کند یا server component است.
- اتصال WebSocket واقعی برای `CrowdStatusWidget` (فعلاً polling هر ۳۰ ثانیه) — نقطه اتصال به `attendance/crowd.gateway.ts` در بک‌اند در کامنت کد مشخص شده.
- یکسان‌سازی توکن بین کوکی httpOnly و sessionStorage (توضیح بالا).
- زیرصفحات داخلی هر پنل (مثل `gym-owner/revenue`, `trainer/ai-suggestions`) — فقط صفحه اصلی هر مسیر در نویگیشن ساخته شده؛ بقیه باید با همان الگوی این پروژه (MembershipCard + Badge + api.ts) تکمیل شوند.
- تست‌های e2e (Playwright/Cypress).
