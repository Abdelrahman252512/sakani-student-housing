# Current Acceptance Status

- First visit no longer seeds demo users, listings, bookings, or FAQs.
- A full platform admin is created only from the configured `SAKANI_ADMIN_EMAIL` and Replit secret `SAKANI_ADMIN_PASSWORD`.
- Listing forms require owners to enter actual details, prices, and real photos before submission for review.
- Electronic payment and refunds are disabled; the app does not collect card details or record sandbox payments.

Still not configured: real payment processing, SMS OTP, outbound email, and document storage. Production data was not modified as part of this change.
