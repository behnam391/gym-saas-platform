const REQUIRED_ENV = [
  'DATABASE_URL',
  'DATABASE_ADMIN_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED_ENV.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(
      `متغیرهای محیطی الزامی تنظیم نشده‌اند: ${missing.join(', ')}`,
    );
  }

  const accessSecret = String(config.JWT_ACCESS_SECRET);
  const refreshSecret = String(config.JWT_REFRESH_SECRET);
  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error('کلیدهای JWT باید حداقل ۳۲ کاراکتر باشند.');
  }
  if (accessSecret === refreshSecret) {
    throw new Error('کلیدهای دسترسی و تمدید JWT باید متفاوت باشند.');
  }

  if (config.NODE_ENV === 'production') {
    const corsOrigin = String(config.CORS_ORIGIN ?? '');
    if (!corsOrigin.startsWith('https://')) {
      throw new Error('CORS_ORIGIN در محیط اصلی باید با https:// شروع شود.');
    }
  }

  return config;
}
