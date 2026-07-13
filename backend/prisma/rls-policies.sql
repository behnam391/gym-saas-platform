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
  tenant_scoped_tables text[] := ARRAY[
    'User', 'MembershipPlan', 'Membership', 'Payment', 'Attendance',
    'CrowdSnapshot', 'TrainingProgram', 'DietPlan', 'ProductCategory',
    'CafeteriaProduct', 'Order', 'Ticket', 'Review', 'Notification',
    'Message', 'AuditLog', 'TenantGalleryImage', 'TenantFacility'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_scoped_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl); -- applies even to the table owner
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING ("tenantId" = current_setting(''app.tenant_id'', true))
         WITH CHECK ("tenantId" = current_setting(''app.tenant_id'', true));',
      tbl
    );
  END LOOP;
END $$;

-- User.tenantId is nullable (SUPER_ADMIN has none) — the policy above still
-- works because a NULL tenantId row simply never matches a session variable
-- comparison and is invisible to `gym_app`. SUPER_ADMIN flows must use
-- `gym_admin` (BYPASSRLS) rather than relying on NULL-matching tricks.

-- Tables that are NOT tenant-scoped (Tenant itself, RefreshToken, global
-- lookup/reference tables) intentionally have NO RLS policy — they are
-- either platform-global or already scoped indirectly through a parent
-- relation checked at the application layer (e.g. RefreshToken -> User).
