ALTER TABLE "PlatformIntegration"
  ADD COLUMN "encryptedConfig" TEXT,
  ADD COLUMN "configuredFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
