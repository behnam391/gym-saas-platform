# اپلیکیشن‌های موبایل گُردیار

این پوشه خانه سه محصول موبایل گُردیار است:

- `apps/athlete`: اپ ورزشکار
- `apps/club`: اپ مدیر باشگاه، پذیرش و بوفه‌دار (فاز بعد)
- `apps/pro`: اپ مربی و مشاور تغذیه (فاز بعد)
- `packages/core`: قراردادهای API، نشست و مدل‌های مشترک

## اجرای اپ ورزشکار

```bash
cd mobile
npm install
npm run athlete
```

پس از نمایش QR، آن را با Expo Go اسکن کنید. مقدار
`EXPO_PUBLIC_API_BASE_URL` را می‌توان با کپی‌کردن `.env.example` به `.env`
تغییر داد.

اگر بررسی آنلاین Expo به‌دلیل محدودیت شبکه متوقف شد، از دستور زیر استفاده
کنید:

```bash
npm run athlete:offline
```

قابلیت‌هایی مانند NFC و اعلان‌های Production در Development Build فعال
خواهند شد و جزو نسخه Expo Go نیستند.
