# Deployment

1. Provision PostgreSQL 15+, create database, set `DATABASE_URL`.
2. `npm ci && npx drizzle-kit push` (or generate migrations with `drizzle-kit generate` and apply in CI).
3. `npm run build && npm run start` behind a reverse proxy (HTTPS required for secure cookies in production).
4. Health: `GET /api/health`.
5. The bootstrap route does not create demo marketplace data. It may create the configured first admin when both `SAKANI_ADMIN_EMAIL` and `SAKANI_ADMIN_PASSWORD` are present.
6. Rollback: redeploy previous build; schema changes are additive-first. Production data cleanup must be reviewed and backed up separately.
6. Backups: nightly `pg_dump` encrypted at rest, 30-day retention, monthly restore drill into a scratch DB (see backup-recovery.md).
