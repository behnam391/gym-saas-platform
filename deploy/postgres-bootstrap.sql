-- Run as the PostgreSQL owner before migrations, then once more afterwards.
-- gym_app is the restricted runtime role. gym_admin is reserved for platform
-- administration and migrations and deliberately bypasses tenant RLS.

SELECT format('CREATE ROLE gym_app LOGIN PASSWORD %L', :'gym_app_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gym_app') \gexec

SELECT format('CREATE ROLE gym_admin LOGIN PASSWORD %L BYPASSRLS', :'gym_admin_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gym_admin') \gexec

SELECT format('ALTER ROLE gym_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L', :'gym_app_password') \gexec
SELECT format('ALTER ROLE gym_admin LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION BYPASSRLS PASSWORD %L', :'gym_admin_password') \gexec

GRANT CONNECT ON DATABASE gym_saas TO gym_app, gym_admin;
GRANT USAGE ON SCHEMA public TO gym_app;
GRANT USAGE, CREATE ON SCHEMA public TO gym_admin;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gym_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO gym_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO gym_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gym_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gym_admin;

ALTER DEFAULT PRIVILEGES FOR ROLE gym_admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gym_app;
ALTER DEFAULT PRIVILEGES FOR ROLE gym_admin IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO gym_app;
ALTER DEFAULT PRIVILEGES FOR ROLE gym_admin IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO gym_app;
