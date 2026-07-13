# راهنمای آپلود پروژه به GitHub

## مرحله ۱ — ایجاد ریپازیتوری در GitHub

1. به https://github.com/new بروید
2. نام ریپازیتوری: `gym-saas-platform`
3. Private انتخاب کنید (چون شامل ساختار پروژه تجاری است)
4. **هیچ‌کدام** از گزینه‌های Initialize را تیک نزنید (نه README، نه .gitignore)
5. روی **Create repository** کلیک کنید

---

## مرحله ۲ — آماده‌سازی فایل‌ها روی کامپیوتر شما

آرشیو `gym-saas-platform.tar.gz` را که دانلود کردید، extract کنید:

**روی Mac/Linux:**
```bash
mkdir gym-saas-platform
tar xzf gym-saas-platform.tar.gz -C gym-saas-platform
cd gym-saas-platform
```

**روی Windows (PowerShell):**
```powershell
mkdir gym-saas-platform
cd gym-saas-platform
tar -xzf ..\gym-saas-platform.tar.gz
```

---

## مرحله ۳ — راه‌اندازی Git و push اولیه

```bash
# داخل پوشه پروژه:
git init
git add .
git commit -m "feat: initial platform — database + backend + frontend + deploy"

# ریپازیتوری GitHub را اضافه کنید (آدرس خودتان را بگذارید)
git remote add origin https://github.com/YOUR-USERNAME/gym-saas-platform.git

git branch -M main
git push -u origin main
```

---

## مرحله ۴ — بررسی در GitHub

بعد از push، در GitHub باید ببینید:

```
gym-saas-platform/
├── .github/workflows/ci-cd.yml   ← CI/CD آماده
├── backend/                       ← NestJS
├── frontend/                      ← Next.js
├── deploy/                        ← Docker + Nginx
├── database-design.md
├── DEPLOY-GUIDE.md
└── README.md
```

---

## مرحله ۵ — تنظیم Secrets برای CI/CD

در GitHub ریپازیتوری:
**Settings → Secrets and variables → Actions → New repository secret**

این secrets را اضافه کنید:

| نام | مقدار |
|---|---|
| `DEPLOY_HOST` | IP سرور شما |
| `DEPLOY_USER` | نام کاربری SSH (معمولاً `ubuntu` یا `root`) |
| `DEPLOY_SSH_KEY` | محتوای فایل `~/.ssh/id_rsa` (کلید خصوصی) |

---

## مرحله ۶ — GitHub Desktop (اگر ترجیح می‌دهید)

1. GitHub Desktop را باز کنید
2. **File → Add Local Repository**
3. پوشه `gym-saas-platform` را انتخاب کنید
4. اگر پیام داد "This directory does not appear to be a Git repository" → **Create Repository** را بزنید
5. در بالا **Publish repository** را بزنید
6. نام `gym-saas-platform`، Private تیک بزنید → **Publish**

---

## مرحله ۷ — Workflow بعد از این

برای هر تغییر در آینده:

```bash
# کد را تغییر دهید
git add .
git commit -m "feat: توضیح تغییر"
git push
```

GitHub Actions خودکار:
1. تست‌ها را اجرا می‌کند
2. Docker image می‌سازد
3. روی سرور deploy می‌کند
