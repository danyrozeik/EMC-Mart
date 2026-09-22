# RTI Super-App

Working product name: **RTI** · Currency: **EGP** · Loyalty: **RTI Points**

Egypt-focused payments + commerce + services + loyalty super-app monorepo. This repository is a
product/engineering foundation, **not** a licensed payment implementation — see
[Regulatory status](#regulatory-status--unresolved-placeholders) below.

## Monorepo layout

```
apps/
  api/      NestJS API (auth, customers, merchants, payments, QR, transactions, loyalty, refunds,
            settlements, offers, admin) — PostgreSQL via Prisma, structured logging via pino
  admin/    Next.js 14 admin portal (customers, merchants, transactions, KYC, risk, refunds,
            settlements, support, audit log)
  mobile/   Expo React Native app (Home, Scan & Pay, Shop, Activity, Profile)
packages/
  shared/   Shared domain types, money (integer minor-unit EGP) utilities, id generation, zod schemas
docs/
  architecture.md          High-level system architecture and rules
  claude-code-prompt.md    Original implementation brief this codebase was built against
legacy/
  emc-mart-appbridge/      Prior, unrelated EMC-Mart scaffold kept for reference
```

## Prerequisites

- Node.js 20+, pnpm 10 (`corepack enable` or `npm i -g pnpm`)
- Docker (for local PostgreSQL + Redis), or your own Postgres 16 instance

## Setup

```bash
pnpm install

# start local Postgres + Redis
docker compose up -d

# configure environment
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env.local

# create the database schema
cd apps/api
pnpm prisma:migrate      # first run: creates migration + applies it
pnpm prisma:generate     # regenerate the Prisma client after schema changes
pnpm prisma:seed         # seeds an admin user, two customers, a merchant, a sample transaction
```

Seeded accounts (all share the password `Passw0rd!`):

| Role     | Identifier              |
| -------- | ------------------------ |
| Admin    | `admin@rti.example`      |
| Customer (merchant owner) | `+201000000001` |
| Customer (shopper)        | `+201000000002` |

## Run

```bash
# from the repo root — runs api (3001), admin (3002) in parallel via turbo
pnpm dev

# or individually
pnpm --filter @rti/api start:dev
pnpm --filter @rti/admin dev
pnpm --filter @rti/mobile start
```

- API: http://localhost:3001 — Swagger/OpenAPI docs at `/docs`
- Admin: http://localhost:3002 — sign in at `/login`
- Mobile: Expo dev server — scan the QR with Expo Go, or press `w` for web preview

## Test

```bash
pnpm test                              # turbo: runs every workspace's test script
pnpm --filter @rti/shared test         # vitest — money/id/schema unit tests
pnpm --filter @rti/api test            # jest — payment orchestrator, idempotency, loyalty ledger
```

All three workspaces also typecheck/build cleanly: `pnpm --filter @rti/shared build`,
`pnpm --filter @rti/api build` (nest build), `pnpm --filter @rti/admin build` (next build).

## Environment variables

**apps/api/.env**
| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (reserved for queues/ephemeral state; not yet wired into a module) |
| `JWT_SECRET` | Signing secret for customer/admin access tokens — **must** be rotated for any non-local environment |
| `JWT_EXPIRES_IN` | Access token TTL (default `15m`) |
| `PORT` | API port (default `3001`) |

**apps/admin/.env.local**
| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_RTI_API_BASE_URL` | Base URL the admin portal calls (default `http://localhost:3001`) |

## Database migrations

```bash
cd apps/api
pnpm prisma:migrate      # dev: creates + applies a new migration from schema.prisma changes
pnpm prisma:deploy       # CI/production: applies committed migrations only, no new ones
```

The Prisma schema (`apps/api/prisma/schema.prisma`) is the source of truth: customers, merchants,
transactions, loyalty ledger, idempotency records, refund requests, settlements, offers, KYC cases,
risk alerts, audit log, QR payment intents, admin users.

## What's implemented (first implementation order, per the brief)

1. Workspace and package structure (pnpm + Turborepo)
2. Shared domain types, money (integer EGP minor units), id, zod schemas — `packages/shared`
3. API auth (JWT, phone+password), customer and merchant modules
4. Transaction ledger schema + read APIs
5. Payment-provider adapter boundary (`PaymentProvider` interface) + `MockPaymentProvider`
6. QR payment command: `POST /v1/qr/payment-intents` → `POST /v1/payments`, idempotent via
   `Idempotency-Key` header (persisted idempotency records, replay-safe, conflict on payload mismatch)
7. Transaction history: `GET /v1/transactions`
8. RTI Points ledger (`EARN`/`REDEEM`/`EXPIRE`/`ADJUST`), triggered only by `COMPLETED` transactions,
   idempotent per transaction, reversed on full refund
9. Merchant dashboard APIs: payment history, settlement view, refund requests, offers
10. Mobile: Home, Pay (scan placeholder), Shop, Activity, Profile with bottom-tab navigation
11. Admin: customers, merchants, transactions, KYC review, risk alerts, refund approval,
    settlements, support placeholder, audit log
12. Unit tests (payment orchestrator, idempotency service, loyalty ledger, money utilities) +
    Prisma seed data for local development

## API conventions implemented

```
POST /v1/auth/register            POST /v1/auth/login
GET  /v1/customers/me              POST /v1/customers/me/kyc/submit
POST /v1/merchants                 GET  /v1/merchants/:id            POST /v1/merchants/:id/kyc/submit
POST /v1/qr/payment-intents        GET  /v1/qr/payment-intents/:id
POST /v1/payments                  POST /v1/payments/:id/refund
GET  /v1/transactions              GET  /v1/transactions/:id
GET  /v1/loyalty/balance           GET  /v1/loyalty/ledger           POST /v1/loyalty/redeem
POST /v1/merchants/:id/refund-requests     GET /v1/merchants/:id/refund-requests
GET  /v1/merchants/:id/settlements
POST /v1/merchants/:id/offers      GET  /v1/merchants/:id/offers
POST /v1/admin/auth/login
GET/PATCH /v1/admin/kyc-cases[...] GET/POST /v1/admin/risk-alerts[...]
GET  /v1/admin/refund-requests     POST /v1/admin/refund-requests/:id/approve|reject
GET/POST /v1/admin/settlements     GET  /v1/admin/audit-logs
```

Payment commands (`POST /v1/payments`, `POST /v1/payments/:id/refund`,
`POST /v1/admin/refund-requests/:id/approve`) all require an `Idempotency-Key` header; the customer
identity is always taken from the authenticated JWT, never from the request body.

## Money & loyalty model

- All persisted amounts are **integer minor units** (piastres): `EGP 1,250.00` is stored as `125000`.
  Floating point is never used for persisted monetary values (`packages/shared/src/money.ts`).
- RTI Points are a separate, integer, append-only ledger and are **never** treated as EGP.
- Default earn rate: **1 RTI Point per EGP 10.00** spent on an eligible `COMPLETED` `QR_PAYMENT`
  transaction (`apps/api/src/loyalty/loyalty.service.ts`) — tune `EARN_RATE_MINOR_PER_POINT` there.

## Regulatory status & unresolved placeholders

**RTI does not move money in this codebase.** `MockPaymentProvider`
(`apps/api/src/payments/providers/mock-payment-provider.ts`) simulates a PSP synchronously for local
development and demos only. Before any real transaction can occur:

- A licensed bank/PSP adapter implementing `PaymentProvider` (`apps/api/src/payments/payment-provider.ts`)
  must be built and reviewed for regulatory approval — no other code path may touch real funds.
- Bills payment is an unimplemented integration boundary (listed in the MVP scope, no module yet).
- Support ticketing (`GET /v1/admin/support/tickets`) is a placeholder pending a helpdesk integration
  (e.g. Zendesk/Freshdesk) or an in-house queue.
- KYC is "KYC-ready" only: `kyc_cases` + status transitions exist, but there is no document capture,
  liveness check, or sanctions/PEP screening — those require a licensed KYC/AML vendor integration.
- Risk alerts are manually resolvable but nothing yet *generates* them — a fraud/risk rules engine
  (velocity checks, device fingerprinting, anomaly detection) is not implemented.
- Redis is configured (`REDIS_URL`) but not yet wired into a queue/outbox consumer — the "outbox/event
  pattern for transaction and loyalty events" from the brief is not implemented; today, loyalty earning
  happens synchronously and idempotently inside the payment request instead of via an event bus.
- No CI pipeline (GitHub Actions, etc.) is configured yet.

Mobile QR scanning is implemented: the Pay screen (`apps/mobile/src/screens/PayScreen.tsx`) uses
`expo-camera`'s `CameraView` to scan a QR code encoding a raw `qrPaymentIntentId`, fetches
`GET /v1/qr/payment-intents/:id` to preview the amount, and on confirmation calls `POST /v1/payments`
with an `expo-crypto`-generated UUID as the `Idempotency-Key`.

Mobile auth is implemented: `AuthScreen` (sign-in/create-account toggle) gates the tab navigator via
`AuthProvider`/`useAuth` (`apps/mobile/src/auth/AuthContext.tsx`). The access token is persisted with
`expo-secure-store` (device keychain/keystore, not `AsyncStorage`, since it's a bearer credential),
rehydrated on launch, and verified against `GET /v1/customers/me` before trusting a stored session.
Profile → Sign out clears it.

## Next recommended implementation task

Replace the synchronous loyalty-earn call in `PaymentsService.executePayment`
(`apps/api/src/payments/payments.service.ts`) with an outbox row + worker, per the brief's outbox/event
pattern requirement for transaction and loyalty events, so payment completion and loyalty crediting are
decoupled and can be retried/replayed independently of the request/response cycle. Redis (`REDIS_URL`)
is already configured but unused — it's the natural queue backend for the worker.
