# راهنمای کامل دیپلوی — گام به گام

## پیش‌نیازها (روی سرور یا لوکال)

- Docker + Docker Compose v2
- Git
- یک دامنه (برای production) یا فقط localhost برای تست لوکال

---

## مرحله ۱ — دریافت کد

```bash
# اگر روی GitHub گذاشتید:
git clone https://github.com/your-org/gym-saas-platform.git
cd gym-saas-platform

# یا از آرشیوی که دانلود کردید:
tar xzf gym-saas-platform.tar.gz
cd gym-saas-platform
```

---

## مرحله ۲ — تنظیم متغیرهای محیطی

```bash
cd deploy
cp .env.example .env
```

فایل `.env` را باز کنید و این مقادیر را پر کنید:

```env
# پسوردهای دیتابیس — هر چیزی قوی بگذارید
POSTGRES_PASSWORD=MyStr0ngPass!
POSTGRES_ADMIN_PASSWORD=AdminStr0ng!

# پسورد Redis
REDIS_PASSWORD=RedisPass123!

# کلیدهای JWT — حتماً random و طولانی باشند
JWT_ACCESS_SECRET=some-very-long-random-secret-string-here
JWT_REFRESH_SECRET=another-very-long-random-secret-string-here

# کلید Anthropic برای هوش مصنوعی
ANTHROPIC_API_KEY=sk-ant-...

# آدرس‌های عمومی (برای تست لوکال همین باشد)
PUBLIC_FRONTEND_URL=http://localhost
PUBLIC_API_URL=http://localhost
```

---

## مرحله ۳ — دیپلوی اولیه (یک‌بار)

```bash
# مجوز اجرا بدهید
chmod +x deploy.sh

# اجرا کنید
./deploy.sh
```

این اسکریپت به‌ترتیب:
1. صبر می‌کند Postgres سالم بیاید بالا
2. نقش‌های `gym_app` و `gym_admin` را در Postgres می‌سازد
3. تمام جداول را با `prisma migrate deploy` می‌سازد
4. سیاست‌های Row-Level Security را اعمال می‌کند
5. همه سرویس‌ها را build و بالا می‌آورد

**خروجی موفق:**
```
==> Waiting for Postgres to be healthy... ✓
==> Bootstrapping gym_app / gym_admin roles... ✓
==> Running Prisma migrations... ✓
==> Applying Row-Level Security policies... ✓
==> Building and starting all services... ✓
==> Done. Check health with: docker compose ps
```

---

## مرحله ۴ — بررسی وضعیت سرویس‌ها

```bash
docker compose ps
```

باید چیزی شبیه این ببینید:

```
NAME         STATUS          PORTS
postgres     healthy         5432/tcp
redis        healthy         6379/tcp
backend      healthy         3000/tcp
frontend     running         3001/tcp
worker       running
nginx        running         0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

---

## مرحله ۵ — تست سریع API

```bash
# باید لیست باشگاه‌ها (خالی) برگردد
curl http://localhost/api/v1/tenants

# خروجی موفق:
# []

# ثبت‌نام یک کاربر تست
curl -X POST http://localhost/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "علی",
    "lastName": "تست",
    "nationalId": "0012345678",
    "mobile": "09120000001",
    "password": "Test1234!",
    "gender": "MALE",
    "dateOfBirth": "1990-06-15"
  }'

# خروجی موفق:
# {"userId":"...","isMinor":false,"message":"ثبت‌نام با موفقیت انجام شد."}

# لاگین
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"09120000001","password":"Test1234!"}'

# خروجی موفق:
# {"accessToken":"eyJ...","refreshToken":"...","role":"ATHLETE","tenantId":null}
```

---

## مرحله ۶ — دیدن فرانت‌اند

مرورگر را باز کنید:

```
http://localhost          → صفحه اصلی مارکت‌پلیس
http://localhost/auth/login     → صفحه ورود
http://localhost/auth/register  → صفحه ثبت‌نام
```

---

## مرحله ۷ — لاگ‌ها و دیباگ

```bash
# لاگ همه سرویس‌ها
docker compose logs -f

# لاگ فقط بک‌اند
docker compose logs -f backend

# لاگ worker (صف پیامک)
docker compose logs -f worker

# ورود به shell دیتابیس
docker compose exec postgres psql -U gym_app -d gym_saas

# بررسی جداول
\dt

# بررسی سیاست‌های RLS
SELECT tablename, policyname FROM pg_policies;
```

---

## دیپلوی‌های بعدی (بعد از تغییر کد)

```bash
cd deploy

# build مجدد و restart (بدون از دست دادن داده)
docker compose up -d --build

# اگر migration جدید اضافه شد:
docker compose run --rm backend npx prisma migrate deploy
```

---

## عیب‌یابی رایج

| مشکل | راه‌حل |
|---|---|
| `backend` بالا نمی‌آید | `docker compose logs backend` — احتمالاً DATABASE_URL اشتباه است |
| صفحه فرانت خطای API می‌دهد | مطمئن شوید `PUBLIC_API_URL` در `.env` درست است |
| `worker` crash می‌کند | نگران نباشید — بدون `SMS_PROVIDER_API_KEY` فقط لاگ می‌کند و ادامه می‌دهد |
| پورت ۸۰ در دسترس نیست | در `docker-compose.yml` پورت Nginx را به `8080:80` تغییر دهید |
