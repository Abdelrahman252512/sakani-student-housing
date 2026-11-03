# Security

Implemented and server-enforced:
- Passwords hashed with scrypt + per-user salt; sessions are random server-side tokens in httpOnly cookies; suspended accounts are rejected at session resolution.
- Ownership checks on every mutation: owners cannot edit others' listings/units; students cannot read others' conversations; reviews require a completed booking owned by the caller; roommate requests are same-gender only and contact data stays hidden until acceptance.
- Privilege escalation: registration can only create student/owner; roles/permissions change only via admin endpoint requiring `staff.permissions.manage`. Admins cannot approve their own verification.
- Price/state integrity: quotes and totals are computed server-side from DB prices and settings; booking/listing transitions validated against explicit state machines.
- Payments are disabled. The payment endpoint rejects requests and the UI never collects card details; before activation, integrate a real provider and verify webhook signatures server-side.
- Audit log records actor/action/target for admin and sensitive operations.

Pre-production hardening checklist: rate limiting on auth, CSRF tokens for cookie auth (or SameSite=strict + origin checks), signed short-lived URLs for verification documents in S3, EXCLUDE constraint for booking overlap under concurrency, password reset flow, dependency scanning in CI, backups encryption test.
