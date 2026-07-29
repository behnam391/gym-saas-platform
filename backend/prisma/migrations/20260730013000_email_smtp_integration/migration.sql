INSERT INTO "PlatformIntegration" (
  "id",
  "key",
  "label",
  "category",
  "provider",
  "status",
  "requiredEnvVars",
  "configuredFields",
  "createdAt",
  "updatedAt"
)
VALUES (
  '7d7bc812-616c-4a61-a606-39ab9493f22a',
  'EMAIL_SMTP',
  'سامانه ایمیل',
  'COMMUNICATION',
  'SMTP',
  'NOT_CONFIGURED',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
