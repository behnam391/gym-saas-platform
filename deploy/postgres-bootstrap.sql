-- Run once against a fresh database. In docker-compose this is NOT
-- auto-mounted (to avoid silently resetting a populated volume) — apply it
-- explicitly via the deploy script below, or mount it into
-- /docker-entrypoint-initdb.d/ for a brand-new environment only.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gym_app') THEN
    CREATE ROLE gym_app LOGIN PASSWORD :'gym_app_password';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gym_admin') THEN
    CREATE ROLE gym_admin LOGIN PASSWORD :'gym_admin_password' BYPASSRLS;
  END IF;
END $$;

GRANT ALL PRIVILEGES ON DATABASE gym_saas TO gym_app, gym_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO gym_app, gym_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO gym_app, gym_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gym_app, gym_admin;
