# Database setup

Set `DATABASE_URL` in `.env.local` to a PostgreSQL connection string, then run:

Start local PostgreSQL with `docker compose up -d postgres`.

```bash
npx prisma migrate dev --name init
npx prisma generate
```

The current local JSON API remains available until the database connection is configured and verified.
