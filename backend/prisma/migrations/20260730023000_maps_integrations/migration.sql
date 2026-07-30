INSERT INTO "PlatformIntegration" (
  "id", "key", "label", "category", "provider", "status",
  "requiredEnvVars", "configuredFields", "createdAt", "updatedAt"
)
VALUES
(
  '85078a56-ab7e-4810-8a5d-64a4163682a5',
  'NESHAN_MAPS',
  'نقشه نشان',
  'MAPS',
  'نشان',
  'NOT_CONFIGURED',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  '06585023-0efb-492a-a50c-fb28e4bc16d5',
  'GOOGLE_MAPS',
  'Google Maps',
  'MAPS',
  'Google',
  'NOT_CONFIGURED',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
