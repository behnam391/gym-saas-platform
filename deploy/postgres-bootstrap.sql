-- Run once against a fresh database. In docker-compose this is NOT
-- auto-mounted (to avoid silently resetting a populated volume) — apply it
-- explicitly via the deploy script below, or mount it into
-- /docker-entrypoint-initdb.d/ for a brand-new environment only.

-- psql variables are intentionally expanded outside a dollar-quoted DO block.
-- This keeps password quoting correct and makes reruns rotate both credentials.
SELECT format('CREATE ROLE gym_app LOGIN PASSWORD %L', :'gym_app_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gym_app') \gexec

SELECT format('CREATE ROLE gym_admin LOGIN PASSWORD %L BYPASSRLS', :'gym_admin_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gym_admin') \gexec

SELECT format('ALTER ROLE gym_app LOGIN PASSWORD %L', :'gym_app_password') \gexec
SELECT format('ALTER ROLE gym_admin LOGIN PASSWORD %L BYPASSRLS', :'gym_admin_password') \gexec

GRANT ALL PRIVILEGES ON DATABASE gym_saas TO gym_app, gym_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO gym_app, gym_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO gym_app, gym_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gym_app, gym_admin;
