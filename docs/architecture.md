# Architecture

Modular monolith: Next.js App Router + Drizzle/PostgreSQL.

- `src/app/api/bootstrap` settings/FAQs/stats + optional first-admin creation from `SAKANI_ADMIN_EMAIL` and `SAKANI_ADMIN_PASSWORD`; no demo records are seeded.
- `src/app/api/auth` scrypt passwords, server sessions (httpOnly cookie `sakani_session`), profile/password.
- `src/app/api/properties` public search + availability enrichment, owner CRUD, unit management, listing state machine (draft, pending_review, verification_required, published, paused, rejected, suspended, archived).
- `src/app/api/bookings` server pricing (`quote` in `src/lib/server.ts`), overlap prevention per unit/bed, and booking state machine. Payment and refund execution are disabled until a real provider is integrated.
- `src/app/api/social` favorites, reviews (completed stays only), conversations/messages, notifications, roommate matching, support, reports, verification submission.
- `src/app/api/admin` permission-guarded (users.suspend, verification.review, settings.manage, refunds.initiate, …) aggregates, moderation, content, settings, audit, CSV export.

Money: integer EGP. Every booking stores an immutable price snapshot; settings/price edits never mutate existing bookings.
Money flow separation in admin: gross booking value ≠ collected cash ≠ deposits held ≠ platform revenue (commission + service fee).
