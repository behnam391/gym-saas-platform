const REQUIRED_ENV = [
  'DATABASE_URL',
  'DATABASE_ADMIN_URL',
  'JWT_ACCESS_SECRET',
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

  const jwtSecret = String(config.JWT_ACCESS_SECRET);
  if (jwtSecret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET باید حداقل ۳۲ کاراکتر باشد.');
  }

  return config;
}
