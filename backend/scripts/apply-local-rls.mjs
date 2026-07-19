import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: process.env.LOCAL_POSTGRES_ADMIN_URL ??
    'postgresql://postgres:postgres_local_dev@localhost:5432/gym_saas',
});
await client.connect();
const rls = await fs.readFile(path.resolve(process.cwd(), 'prisma', 'rls-policies.sql'), 'utf8');
await client.query(rls);
await client.query(`
  GRANT USAGE, CREATE ON SCHEMA public TO gym_app, gym_admin;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO gym_app, gym_admin;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO gym_app, gym_admin;
  ALTER DEFAULT PRIVILEGES FOR ROLE gym_app IN SCHEMA public GRANT ALL ON TABLES TO gym_admin;
  ALTER DEFAULT PRIVILEGES FOR ROLE gym_app IN SCHEMA public GRANT ALL ON SEQUENCES TO gym_admin;
`);
await client.end();
console.log('LOCAL_RLS_READY');

