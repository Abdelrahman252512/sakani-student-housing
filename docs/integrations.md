# Integrations & Payment Activation

Current state is shown honestly in Admin → Integrations & System Health.

To activate real payments (e.g., Paymob / Fawry):
1. Obtain merchant account approval and API keys; store only in server env (`PAYMENT_API_KEY`, `PAYMENT_WEBHOOK_SECRET`).
2. Create payment orders server-side from the booking's `payableNow` snapshot; never accept client-supplied amounts.
3. Verify webhook signatures, amount, and currency (EGP) before marking a payment succeeded; process webhooks idempotently (unique provider event id).
4. Reconcile daily against provider statements; refunds go through the provider refund API and are mirrored in `payments`.
5. Keep payment disabled until provider sandbox tests cover success, failure, duplicate webhooks, and refunds. Enable only after those checks pass.

SMS OTP: add provider (e.g., local aggregator) and switch registration verification. Email: configure SES/SMTP; in-app notifications already persist. Documents: move to private S3 bucket with signed URLs (5–15 min expiry) and virus scan.
