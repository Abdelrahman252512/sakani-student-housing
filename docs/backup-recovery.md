# Backup & Recovery

- Nightly `pg_dump -Fc` to encrypted object storage, 30-day retention, separate credentials from app runtime.
- Weekly restore drill: `pg_restore` into `app_db_restore_test`, run `GET /api/health` + row counts on users/bookings/payments.
- RPO target 24h (WAL archiving for PITR when volume grows), RTO target 4h.
- Incident: revoke sessions (`DELETE FROM sessions`), rotate provider keys, audit `audit_logs` before reopening payments.
