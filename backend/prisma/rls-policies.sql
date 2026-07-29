-- ============================================================================
-- Row-Level Security policies — run AFTER `prisma migrate deploy`.
-- This is the database-layer enforcement described in database-design.md.
-- Apply via a plain `psql` run in CI/CD (Prisma does not manage RLS DDL).
-- ============================================================================

-- Two roles:
--   gym_app   — used by the normal NestJS connection pool (DATABASE_URL).
--               RLS-restricted; can only see/write rows for the tenant set
--               via `SET LOCAL app.tenant_id`.
--   gym_admin — used ONLY by Super-Admin / platform reporting flows
--               (DATABASE_ADMIN_URL). BYPASSRLS, so it must never be the
--               connection string used by tenant-scoped request handling.

-- (Run once per environment; adjust passwords via your secrets manager.)
-- CREATE ROLE gym_app LOGIN PASSWORD '...';
-- CREATE ROLE gym_admin LOGIN PASSWORD '...' BYPASSRLS;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO gym_app, gym_admin;

DO $$
DECLARE
  tbl text;
  predicate text;
  tenant_scoped_tables text[] := ARRAY[
    'User', 'MembershipPlan', 'Membership', 'Payment', 'Attendance',
    'CrowdSnapshot', 'TrainingProgram', 'DietPlan', 'ProductCategory',
    'CafeteriaProduct', 'Order', 'Ticket', 'Review', 'Notification',
    'Message', 'AuditLog', 'TenantGalleryImage', 'TenantFacility',
    'Advertisement', 'AttendanceDevice', 'AttendanceCredential',
    'FinancialAccount', 'TenantSubscription', 'ProfessionalContract',
    'ProfessionalSettlement'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_scoped_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl); -- applies even to the table owner
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING ("tenantId" = current_setting(''app.tenant_id'', true))
         WITH CHECK ("tenantId" = current_setting(''app.tenant_id'', true));',
      tbl
    );
  END LOOP;

  -- Child tables without a physical tenantId are isolated through their
  -- tenant-owned parent. PostgreSQL does not inherit RLS through foreign keys,
  -- so every such table needs its own explicit policy.
  FOR tbl, predicate IN
    SELECT * FROM (VALUES
      ('RefreshToken',
        'EXISTS (SELECT 1 FROM "User" u WHERE u.id = "RefreshToken"."userId" AND u."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('ParentalConsent',
        'EXISTS (SELECT 1 FROM "User" u WHERE u.id = "ParentalConsent"."userId" AND u."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('InsuranceDocument',
        'EXISTS (SELECT 1 FROM "User" u WHERE u.id = "InsuranceDocument"."userId" AND u."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('AthleteProfile',
        'EXISTS (SELECT 1 FROM "User" u WHERE u.id = "AthleteProfile"."userId" AND u."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('BodyMeasurement',
        'EXISTS (SELECT 1 FROM "AthleteProfile" a JOIN "User" u ON u.id = a."userId" WHERE a.id = "BodyMeasurement"."athleteId" AND u."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('Goal',
        'EXISTS (SELECT 1 FROM "AthleteProfile" a JOIN "User" u ON u.id = a."userId" WHERE a.id = "Goal"."athleteId" AND u."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('TrainerProfile',
        'EXISTS (SELECT 1 FROM "User" u WHERE u.id = "TrainerProfile"."userId" AND u."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('NutritionistProfile',
        'EXISTS (SELECT 1 FROM "User" u WHERE u.id = "NutritionistProfile"."userId" AND u."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('TrainerStudent',
        'EXISTS (SELECT 1 FROM "TrainerProfile" p JOIN "User" u ON u.id = p."userId" WHERE p.id = "TrainerStudent"."trainerId" AND u."tenantId" = current_setting(''app.tenant_id'', true)) AND EXISTS (SELECT 1 FROM "AthleteProfile" a JOIN "User" u ON u.id = a."userId" WHERE a.id = "TrainerStudent"."athleteId" AND a."userId" = "TrainerStudent"."userId" AND u."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('NutritionistClient',
        'EXISTS (SELECT 1 FROM "NutritionistProfile" p JOIN "User" u ON u.id = p."userId" WHERE p.id = "NutritionistClient"."nutritionistId" AND u."tenantId" = current_setting(''app.tenant_id'', true)) AND EXISTS (SELECT 1 FROM "AthleteProfile" a JOIN "User" u ON u.id = a."userId" WHERE a.id = "NutritionistClient"."athleteId" AND a."userId" = "NutritionistClient"."userId" AND u."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('AISuggestion',
        'EXISTS (SELECT 1 FROM "AthleteProfile" a JOIN "User" u ON u.id = a."userId" WHERE a.id = "AISuggestion"."athleteId" AND u."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('ProgramSession',
        'EXISTS (SELECT 1 FROM "TrainingProgram" p WHERE p.id = "ProgramSession"."programId" AND p."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('ProgramExercise',
        'EXISTS (SELECT 1 FROM "ProgramSession" s JOIN "TrainingProgram" p ON p.id = s."programId" WHERE s.id = "ProgramExercise"."sessionId" AND p."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('DietMeal',
        'EXISTS (SELECT 1 FROM "DietPlan" p WHERE p.id = "DietMeal"."dietPlanId" AND p."tenantId" = current_setting(''app.tenant_id'', true))'),
      ('OrderItem',
        'EXISTS (SELECT 1 FROM "Order" o WHERE o.id = "OrderItem"."orderId" AND o."tenantId" = current_setting(''app.tenant_id'', true))')
    ) AS child_policies(table_name, predicate_sql)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (%s) WITH CHECK (%s);',
      tbl,
      predicate,
      predicate
    );
  END LOOP;
END $$;

-- User.tenantId is nullable (SUPER_ADMIN has none) — the policy above still
-- works because a NULL tenantId row simply never matches a session variable
-- comparison and is invisible to `gym_app`. SUPER_ADMIN flows must use
-- `gym_admin` (BYPASSRLS) rather than relying on NULL-matching tricks.

-- Tenant itself is intentionally global so the public marketplace can read
-- verified gyms. Every tenant-owned child table, including indirect children,
-- is protected above. Platform and authentication flows use gym_admin, whose
-- explicit BYPASSRLS privilege is restricted to those code paths.
