# Stripe Embedded Checkout Integration — Design

**Date:** 2026-04-22
**Status:** Approved (user confirmed)
**Scope:** Replace the mock payment flow with a real Stripe Embedded Checkout integration, triggered after project intake at `http://127.0.0.1/project/new`, with end-to-end success + failure handling.

## Goal

Allow a homeowner who just finished the intake chat at `/project/new` to pay $19.99 (test payment) via Stripe Embedded Checkout, see a clear success or failure screen, and be redirected to the right page afterwards. Backend source of truth comes from a signature-verified Stripe webhook.

## User flow

```
/project/new  →  submit intake  →  POST /api/v1/projects  →  { id, session_id }
      ↓
navigate to /project/:id/pay
      ↓
POST /api/v1/payments/checkout-session  { project_id, payment_type: "test_payment" }
      ↓
backend: stripe.checkout.Session.create(ui_mode="embedded", mode="payment",
                                       amount=1999, return_url=…)
      ↓
frontend mounts <EmbeddedCheckout clientSecret=…>
      ↓
user pays (4242…) OR declined (4000 0000 0000 0002)
      ↓
Stripe redirects → /project/:id/payment/return?session_id=cs_…
      ↓
GET /api/v1/payments/session/:checkout_session_id  → { status, payment_type, amount_cents, failure_reason? }
      ↓
  ┌───────────────────────┼────────────────────────┐
  ▼ status=complete       ▼ status=failed         ▼ status=pending
✅ success UI           ❌ failure UI            ⏳ polling (up to 10s)
2s auto-redirect →      Retry → /project/:id/pay    → then whichever lands
/project/:id/results
```

## Backend

### New files

- `app/domain/payments/stripe_client.py` — thin wrapper over the Stripe Python SDK. Exposes:
  - `create_checkout_session(amount_cents, currency, return_url, metadata) -> Session`
  - `retrieve_session(session_id) -> Session`
  - `construct_webhook_event(payload, sig_header) -> Event`
  Isolates all network + SDK surface so the service is trivially mockable.

### Modified files

- `app/config.py` — add `STRIPE_PUBLISHABLE_KEY: str = ""`, `STRIPE_SUCCESS_RETURN_URL: str = "http://127.0.0.1/project/{PROJECT_ID}/payment/return?session_id={CHECKOUT_SESSION_ID}"`.
- `app/domain/payments/models.py` — add `stripe_checkout_session_id`, `failure_reason`, `session_id`, `updated_at`. Make `user_id` nullable (anonymous payments).
- `app/domain/payments/schemas.py` — add `CreateCheckoutSession`, `CheckoutSessionResponse`, `PaymentStatusResponse`.
- `app/domain/payments/repository.py` — add `get_by_stripe_session_id()`, `update_status_by_session_id()`, `update_status_by_intent_id()`.
- `app/domain/payments/service.py` — real Stripe calls. Dispatch webhook events to `_handle_session_completed` / `_handle_session_failed` / `_handle_payment_intent_failed`. Idempotent.
- `app/domain/payments/router.py` — `POST /payments/checkout-session` (anonymous-allowed), `GET /payments/session/{checkout_session_id}`, rewrite `POST /payments/webhook` with signature verification.

### Pricing

Add `PRICING["test_payment"] = 1999` ($19.99). Existing tiers kept.

### Alembic migration

```
ALTER TABLE payments
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN stripe_checkout_session_id VARCHAR(255),
  ADD COLUMN failure_reason VARCHAR(500),
  ADD COLUMN session_id UUID,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE INDEX ix_payments_stripe_checkout_session_id ON payments (stripe_checkout_session_id);
CREATE INDEX ix_payments_session_id ON payments (session_id);
```

## Frontend

### New files

- `src/api/payments.ts` — `paymentsApi.createCheckoutSession(projectId)`, `paymentsApi.getSessionStatus(sessionId)`.
- `src/pages/ProjectPayment.tsx` — mounts `EmbeddedCheckoutProvider` + `EmbeddedCheckout`. Fetches client secret on mount.
- `src/pages/PaymentReturn.tsx` — reads `session_id` query param, polls status every 1s up to 10s, then either:
  - success → render ✅ success UI → `setTimeout` navigate to `/project/:id/results`
  - failed → render ❌ failure UI with "Try again" → `/project/:id/pay`
  - timeout (still pending) → render ⏳ + manual refresh

### Modified files

- `src/App.tsx` — add `/project/:id/pay` and `/project/:id/payment/return` routes (outside Layout — full-screen like intake).
- `src/pages/ProjectIntake.tsx` — after successful `projectsApi.create`, navigate to `/project/:id/pay` (not results).
- `package.json` — add `@stripe/stripe-js`, `@stripe/react-stripe-js`.

## Security

1. **Webhook signature verification** is mandatory — `stripe.Webhook.construct_event(payload, sig_header, webhook_secret)`. Return `400` if it fails.
2. **Source of truth** = DB row updated exclusively by the webhook handler. Return page reads, never writes.
3. **Idempotency** — status transitions are one-way: `pending → completed | failed`. Duplicate webhooks are no-ops.
4. **Anonymous-safe authorization** — `POST /checkout-session` only requires a valid `project_id`. Stripe enforces real payment auth.

## Ops

- `make browser` — open Chrome on `http://127.0.0.1/project/new` (macOS via `open -a "Google Chrome"`, Linux via `xdg-open`).
- `make stripe-listen` — `stripe listen --forward-to http://127.0.0.1/api/v1/payments/webhook`. Prints the `whsec_…` — copy into `.env` as `STRIPE_WEBHOOK_SECRET` and restart backend.

## Test matrix

| Card | Expected UI |
|---|---|
| `4242 4242 4242 4242` | ✅ success, auto-redirect to results |
| `4000 0000 0000 0002` | ❌ failure, "Try again" |
| `4000 0000 0000 9995` (insufficient funds) | ❌ failure, "Try again" |

## Out of scope

- Real authenticated per-user payment gating (current flow is anonymous by design).
- Apple/Google Pay wallet enablement (Stripe dashboard toggle — configure separately).
- Full test suite (not requested; structure leaves room).
