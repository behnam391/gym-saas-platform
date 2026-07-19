import fs from 'node:fs';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

const databaseDir = path.resolve(process.cwd(), '..', '.local', 'postgres-18-utf8');
const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'postgres',
  password: 'postgres_local_dev',
  port: 5432,
  persistent: true,
  initdbFlags: ['--encoding=UTF8'],
  onLog: (message) => process.stdout.write(`[postgres] ${message}`),
  onError: (message) => process.stderr.write(`[postgres] ${String(message)}\n`),
});

if (!fs.existsSync(path.join(databaseDir, 'PG_VERSION'))) {
  await pg.initialise();
}

await pg.start();
const admin = pg.getPgClient('postgres');
await admin.connect();

const databaseExists = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'gym_saas'");
if (!databaseExists.rowCount) await admin.query('CREATE DATABASE gym_saas');

await admin.query(`
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gym_app') THEN
      CREATE ROLE gym_app LOGIN PASSWORD 'gym_local_app';
    ELSE
      ALTER ROLE gym_app LOGIN PASSWORD 'gym_local_app';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gym_admin') THEN
      CREATE ROLE gym_admin LOGIN PASSWORD 'gym_local_admin' BYPASSRLS;
    ELSE
      ALTER ROLE gym_admin LOGIN PASSWORD 'gym_local_admin' BYPASSRLS;
    END IF;
  END $$;
`);
await admin.query('ALTER DATABASE gym_saas OWNER TO gym_app');
await admin.query('GRANT ALL PRIVILEGES ON DATABASE gym_saas TO gym_app, gym_admin');
await admin.end();

console.log('LOCAL_POSTGRES_READY=postgresql://localhost:5432/gym_saas');
await new Promise(() => {});
