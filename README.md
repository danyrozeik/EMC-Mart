# RTI Super-App

Working product name: **RTI** · Currency: **EGP** · Loyalty: **RTI Points**

Egypt-focused payments + commerce + services + loyalty super-app monorepo. This repository is a
product/engineering foundation, **not** a licensed payment implementation — see
[Regulatory status](#regulatory-status--unresolved-placeholders) below, and `CLAUDE.md` for the
governance gates this codebase operates under (simulation-only until Gates 2/3/4/8 clear).

## Architecture: domain-first microservices

The backend is split into four bounded-context services, each owning its own database. There is no
shared schema and no cross-database foreign key — every cross-service reference (a `customerId` on a
`Transaction`, a `merchantId` on a `RefundRequest`, etc.) is a plain opaque string ID, resolved by
calling the owning service.

```
domains/
  identity/    Customer, AdminUser, KYC (customer-scoped), RiskAlert, and the centralized AuditLogEntry
               — port 3001, DB rti_identity
  merchants/   Merchant, Offer, Settlement, KYC (merchant-scoped)
               — port 3002, DB rti_merchants
  payments/    Transaction, QrPaymentIntent, RefundRequest, IdempotencyRecord
               — port 3003, DB rti_payments
  loyalty/     LoyaltyLedgerEntry (RTI Points, append-only)
               — port 3004, DB rti_loyalty
apps/
  admin/       Next.js 14 admin portal — calls all four services directly
  mobile/      Expo React Native app (Home, Scan & Pay, Shop, Activity, Profile)
packages/
  shared/         Shared domain types, money (integer minor-unit EGP) utilities, id generation, zod schemas
  auth-kit/       Shared NestJS auth: JWT strategy/guard, Public()/Internal() decorators, roles guard
  service-client/ Shared fetch-based inter-service HTTP client + centralized AuditClient
docs/
  architecture.md          High-level system architecture and rules
  claude-code-prompt.md    Original implementation brief this codebase was built against
legacy/
  emc-mart-appbridge/      Prior, unrelated EMC-Mart scaffold kept for reference
```

### How the services talk to each other

- **Customer/admin auth**: every service independently validates the same signed JWT (shared
  `JWT_SECRET`, via `@rti/auth-kit`'s `JwtStrategy`) — there is no per-request call back to identity.
- **Service-to-service calls**: a small `ServiceClient` (`@rti/service-client`) wraps `fetch` and adds
  an `X-Internal-Token` header. Routes intended only for other services are marked `@Internal()` and
  guarded by `InternalServiceGuard`, which checks that header against `INTERNAL_SERVICE_TOKEN`.
- **Centralized audit log**: `identity` is the sole writer of `AuditLogEntry`. Every other service
  calls it through `AuditClient.record()` → `POST /internal/audit-logs`.
- **Payments → merchants**: before executing a payment or creating a QR intent, `payments` calls
  `GET /v1/merchants/:id` on `merchants` to confirm the merchant exists (and, for QR intents, that it
  is owned by the requesting customer).
- **Payments → loyalty**: not a direct call. `payments` writes a transactional outbox row on a
  completed payment or full refund; `loyalty` consumes it off a Redis queue and credits/reverses
  points independently. See "Loyalty crediting: transactional outbox" below.
- **Merchants → payments**: merchant-initiated refund requests are created and listed in `merchants`,
  but the underlying record lives in `payments`; `merchants` verifies ownership locally, then proxies
  to `payments`' `POST /internal/refund-requests` / `GET /internal/refund-requests`.

## Prerequisites

- Node.js 20+, pnpm 10 (`corepack enable` or `npm i -g pnpm`)
- Docker (for local PostgreSQL + Redis), or your own Postgres 16 instance with four databases:
  `rti_identity`, `rti_merchants`, `rti_payments`, `rti_loyalty`

## Setup

```bash
pnpm install

# start local Postgres (creates the 4 service databases on first boot, via
# docker/postgres-init/) + Redis
docker compose up -d

# configure environment — one .env per service, plus the two frontends
cp domains/identity/.env.example domains/identity/.env
cp domains/merchants/.env.example domains/merchants/.env
cp domains/payments/.env.example domains/payments/.env
cp domains/loyalty/.env.example domains/loyalty/.env
cp apps/admin/.env.example apps/admin/.env.local

# create each service's schema, generate its Prisma client, and seed it
for svc in identity merchants payments loyalty; do
  (cd "domains/$svc" && pnpm prisma:migrate && pnpm prisma:generate && pnpm prisma:seed)
done
```

Seed data is cross-linked across services by shared IDs (`seed-customer-owner`,
`seed-customer-shopper`, `seed-merchant-emc-mart`, `seed-txn-1`, …) — seed every service, in any order,
before relying on any one of them in isolation.

Seeded accounts (all share the password `Passw0rd!`):

| Role     | Identifier              |
| -------- | ------------------------ |
| Admin    | `admin@rti.example`      |
| Customer (merchant owner) | `+201000000001` |
| Customer (shopper)        | `+201000000002` |

## Run

```bash
# from the repo root — runs all four domain services + admin in parallel via turbo
pnpm dev

# or individually
pnpm --filter @rti/identity start:dev
pnpm --filter @rti/merchants start:dev
pnpm --filter @rti/payments start:dev
pnpm --filter @rti/loyalty start:dev
pnpm --filter @rti/admin dev
pnpm --filter @rti/mobile start
```

| Service    | URL                          |
| ---------- | ----------------------------- |
| identity   | http://localhost:3001 (Swagger at `/docs`) |
| merchants  | http://localhost:3002 (Swagger at `/docs`) |
| payments   | http://localhost:3003 (Swagger at `/docs`) |
| loyalty    | http://localhost:3004 (Swagger at `/docs`) |
| admin      | http://localhost:3000 — sign in at `/login` |
| mobile     | Expo dev server — scan the QR with Expo Go, or press `w` for web preview |

## Test

```bash
pnpm test                              # turbo: runs every workspace's test script
pnpm --filter @rti/shared test         # vitest — money/id/schema unit tests
pnpm --filter @rti/payments test       # jest — payment orchestrator, idempotency
pnpm --filter @rti/loyalty test        # jest — RTI Points ledger
```

All workspaces also typecheck/build cleanly: `pnpm --filter @rti/shared build`,
`pnpm --filter @rti/identity build` / `@rti/merchants` / `@rti/payments` / `@rti/loyalty` (nest build
each), `pnpm --filter @rti/admin build` (next build).

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull request against it: install,
`prisma generate` for all four domain services, `pnpm build` (turbo, every workspace), `pnpm test`
(turbo, every workspace), and a mobile typecheck (`tsc --noEmit`) — the same commands documented above,
run the same way locally. It does not need a live Postgres or Redis: `prisma generate` only reads the
schema, and the current unit test suites (payment orchestrator, idempotency, loyalty ledger, money
utilities) don't hit a real database. Lint scripts exist per-package but aren't wired into CI yet — most
packages don't have an ESLint config checked in, so `pnpm lint` isn't reliable across the repo yet.

## Environment variables

**domains/identity/.env**, **domains/merchants/.env**, **domains/payments/.env**, **domains/loyalty/.env**

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for that service's own database |
| `JWT_SECRET` | Signing secret for customer/admin access tokens — **must be identical across all four services** and rotated together for any non-local environment |
| `JWT_EXPIRES_IN` | Access token TTL (default `15m`) |
| `INTERNAL_SERVICE_TOKEN` | Shared secret for service-to-service calls — **must be identical across all four services** |
| `PORT` | Service port (3001 / 3002 / 3003 / 3004) |
| `IDENTITY_SERVICE_URL` / `MERCHANTS_SERVICE_URL` / `PAYMENTS_SERVICE_URL` / `LOYALTY_SERVICE_URL` | Base URLs this service calls out to (varies per service — see each service's `.env.example`) |

**apps/admin/.env.local**

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_IDENTITY_API_URL` | Base URL for identity calls (default `http://localhost:3001`) |
| `NEXT_PUBLIC_MERCHANTS_API_URL` | Base URL for merchants calls (default `http://localhost:3002`) |
| `NEXT_PUBLIC_PAYMENTS_API_URL` | Base URL for payments calls (default `http://localhost:3003`) |
| `NEXT_PUBLIC_LOYALTY_API_URL` | Base URL for loyalty calls (default `http://localhost:3004`) |

**apps/mobile/app.json → `expo.extra`**

| Key | Purpose |
| --- | --- |
| `identityApiUrl` | default `http://localhost:3001` |
| `merchantsApiUrl` | default `http://localhost:3002` |
| `paymentsApiUrl` | default `http://localhost:3003` |
| `loyaltyApiUrl` | default `http://localhost:3004` |

## Database migrations

Each service owns and migrates its own database independently:

```bash
cd domains/<identity|merchants|payments|loyalty>
pnpm prisma:migrate      # dev: creates + applies a new migration from schema.prisma changes
pnpm prisma:deploy       # CI/production: applies committed migrations only, no new ones
```

Each service's `prisma/schema.prisma` is the source of truth for its own tables only. Cross-service
references (`customerId`, `merchantId`, `transactionId`, …) are plain `String` fields with no foreign
key — the owning service is always the source of truth for that entity, and its ID is treated as
opaque by every other service.

## What's implemented (first implementation order, per the brief)

1. Workspace and package structure (pnpm + Turborepo), split into four domain services plus shared
   `auth-kit` and `service-client` packages
2. Shared domain types, money (integer EGP minor units), id, zod schemas — `packages/shared`
3. Identity: auth (JWT, phone+password), customer profile + KYC submission, admin auth, centralized
   audit log
4. Merchants: merchant onboarding + KYC, offers, settlements, merchant-initiated refund requests
   (proxied to payments)
5. Payments: transaction ledger, payment-provider adapter boundary (`PaymentProvider`) +
   `MockPaymentProvider`, QR payment command (`POST /v1/qr/payment-intents` → `POST /v1/payments`,
   idempotent via `Idempotency-Key`), transaction history, refund requests + admin approval
6. Loyalty: RTI Points ledger (`EARN`/`REDEEM`/`EXPIRE`/`ADJUST`), triggered by completed payments via
   a transactional outbox + Redis queue, idempotent per transaction, reversed on full refund
7. Mobile: Home, Pay (live QR scanning via `expo-camera`), Shop, Activity, Profile with bottom-tab
   navigation; phone+password auth with secure token persistence
8. Admin: customers, merchants, transactions, KYC review, risk alerts, refund approval, settlements,
   support placeholder, audit log — each page now calls its owning service directly
9. Unit tests (payment orchestrator, idempotency service, loyalty ledger, money utilities) + Prisma
   seed data per service, cross-linked by shared seed IDs

## API conventions implemented

```
identity   POST /v1/auth/register            POST /v1/auth/login
           GET  /v1/customers/me              POST /v1/customers/me/kyc/submit
           POST /v1/admin/auth/login
           GET/PATCH /v1/admin/kyc-cases[...] GET/POST /v1/admin/risk-alerts[...]
           GET  /v1/admin/customers           GET  /v1/admin/audit-logs
           POST /internal/audit-logs          POST /internal/risk-alerts

merchants  POST /v1/merchants                 GET  /v1/merchants/:id            POST /v1/merchants/:id/kyc/submit
           POST /v1/merchants/:id/refund-requests     GET /v1/merchants/:id/refund-requests
           GET  /v1/merchants/:id/settlements
           POST /v1/merchants/:id/offers      GET  /v1/merchants/:id/offers
           GET  /v1/admin/merchants           GET/PATCH /v1/admin/merchant-kyc-cases
           GET/POST /v1/admin/settlements

payments   POST /v1/qr/payment-intents        GET  /v1/qr/payment-intents/:id
           POST /v1/payments                  POST /v1/payments/:id/refund
           GET  /v1/transactions               GET  /v1/transactions/:id
           GET  /v1/admin/transactions        GET  /v1/admin/refund-requests
           POST /v1/admin/refund-requests/:id/approve|reject
           POST /internal/refund-requests     GET  /internal/refund-requests

loyalty    GET  /v1/loyalty/balance           GET  /v1/loyalty/ledger           POST /v1/loyalty/redeem
           POST /v1/admin/loyalty/:customerId/adjust
           POST /internal/loyalty/earn        POST /internal/loyalty/reverse
```

Payment commands (`POST /v1/payments`, `POST /v1/payments/:id/refund`,
`POST /v1/admin/refund-requests/:id/approve`) all require an `Idempotency-Key` header; the customer
identity is always taken from the authenticated JWT, never from the request body. Routes under
`/internal/*` require the `X-Internal-Token` header and are not reachable by customer/admin JWTs.

## Money & loyalty model

- All persisted amounts are **integer minor units** (piastres): `EGP 1,250.00` is stored as `125000`.
  Floating point is never used for persisted monetary values (`packages/shared/src/money.ts`).
- RTI Points are a separate, integer, append-only ledger and are **never** treated as EGP or converted
  to pounds.
- Default earn rate: **1 RTI Point per EGP 10.00** spent on an eligible `COMPLETED` `QR_PAYMENT`
  transaction (`domains/loyalty/src/loyalty/loyalty.service.ts`) — tune `EARN_RATE_MINOR_PER_POINT`
  there.
- Ledger corrections are always a new `ADJUST` entry, signed positive or negative — historical ledger
  lines are never edited.

## Regulatory status & unresolved placeholders

**RTI does not move money in this codebase.** `MockPaymentProvider`
(`domains/payments/src/payments/providers/mock-payment-provider.ts`) simulates a PSP synchronously for
local development and demos only. Before any real transaction can occur:

- A licensed bank/PSP adapter implementing `PaymentProvider`
  (`domains/payments/src/payments/payment-provider.ts`) must be built and reviewed for regulatory
  approval — no other code path may touch real funds.
- Bills payment is an unimplemented integration boundary (listed in the MVP scope, no module yet).
- Support ticketing (`GET /v1/admin/support/tickets`) is a placeholder pending a helpdesk integration
  (e.g. Zendesk/Freshdesk) or an in-house queue.
- KYC is "KYC-ready" only: `KycCase` + status transitions exist in both `identity` (customer-scoped)
  and `merchants` (merchant-scoped), but there is no document capture, liveness check, or
  sanctions/PEP screening — those require a licensed KYC/AML vendor integration.
- Risk alerts are manually resolvable via `identity`'s `/internal/risk-alerts` endpoint, but nothing yet
  *generates* them from the other services — a fraud/risk rules engine (velocity checks, device
  fingerprinting, anomaly detection) is not implemented.

Mobile QR scanning is implemented: the Pay screen (`apps/mobile/src/screens/PayScreen.tsx`) uses
`expo-camera`'s `CameraView` to scan a QR code encoding a raw `qrPaymentIntentId`, fetches
`GET /v1/qr/payment-intents/:id` (payments service) to preview the amount, and on confirmation calls
`POST /v1/payments` with an `expo-crypto`-generated UUID as the `Idempotency-Key`.

Mobile auth is implemented: `AuthScreen` (sign-in/create-account toggle) gates the tab navigator via
`AuthProvider`/`useAuth` (`apps/mobile/src/auth/AuthContext.tsx`). The access token is persisted with
`expo-secure-store` (device keychain/keystore, not `AsyncStorage`, since it's a bearer credential),
rehydrated on launch, and verified against `GET /v1/customers/me` (identity service) before trusting a
stored session. Profile → Sign out clears it.

## Loyalty crediting: transactional outbox

Payment completion and loyalty crediting are decoupled via a transactional outbox, so a slow or
unavailable loyalty service can never slow down or fail a payment:

1. `PaymentsService.executePayment` / `executeRefund`
   (`domains/payments/src/payments/payments.service.ts`) write an `OutboxEvent` row in the **same DB
   transaction** as the `Transaction`/`RefundRequest` state change — the event can never be lost or
   emitted without the write it describes having actually committed.
2. `OutboxDispatcherService` (`domains/payments/src/outbox/`) polls `PENDING` rows on a timer and
   publishes them to a Redis list (`rti:loyalty-events`), independently of the original request.
   Publish failures are retried on the next tick; the row stays `PENDING`.
3. `LoyaltyEventsConsumerService` (`domains/loyalty/src/consumer/`) blocks on that Redis list and
   calls `LoyaltyService.earnForTransaction` / `reverseForTransaction` — the same idempotent methods
   used everywhere else in the loyalty ledger.

Both services need `REDIS_URL` (`docker-compose.yml` already provisions Redis). The `POST
/internal/loyalty/earn` / `reverse` endpoints remain available for manual/admin use but are no longer
on the payment request path.

## Next recommended implementation task

Add a dead-letter path to `LoyaltyEventsConsumerService`
(`domains/loyalty/src/consumer/loyalty-events-consumer.service.ts`): an event that repeatedly fails to
process (e.g. a transient DB error) is currently just logged and dropped after the handler throws.
Push it to a `rti:loyalty-events:dead` list with the error and let an admin endpoint list/replay
dead-lettered events, so a bad event can't silently vanish.
