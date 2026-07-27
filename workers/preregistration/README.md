# Gordyar pre-registration service

Cloudflare Worker and D1 service used by the public Gordyar landing page.

## Public endpoints

- `GET /health`
- `POST /v1/pre-registrations`

## Protected endpoints

Send `Authorization: Bearer <ADMIN_TOKEN>`:

- `GET /v1/admin/pre-registrations`
- `GET /v1/admin/export.csv`

## Local development

```sh
npm install
npm run db:migrate:local
npm run dev
```

The public landing page uses `http://localhost:8787` automatically when served
from `localhost` or `127.0.0.1`.

## Deployment

```sh
npm run db:migrate:remote
npm run deploy
```

Set `ADMIN_TOKEN` and `RATE_LIMIT_SALT` with Wrangler secrets. Never commit
their values.
