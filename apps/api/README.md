# RTI API

NestJS service. PostgreSQL via Prisma, JWT auth, pino structured logging, Swagger at `/docs`.

## Modules

- `auth` — customer registration/login (JWT, phone + password)
- `customers` — profile, KYC submission
- `merchants` — registration, KYC submission, ownership checks
- `payments` — `PaymentOrchestrator` + `PaymentProvider` adapter boundary, idempotent pay/refund
- `qr` — merchant-issued QR payment intents (5 minute TTL)
- `transactions` — read-only ledger queries
- `loyalty` — append-only RTI Points ledger (EARN/REDEEM/EXPIRE/ADJUST)
- `refunds` — merchant-initiated refund requests
- `settlements` — merchant settlement view
- `offers` — merchant offers CRUD (read is public, write is merchant-authenticated)
- `admin` — admin auth + customers/merchants/transactions/KYC/risk/refund-approval/settlements/audit-log
- `common` — Prisma service, audit log, idempotency service, zod validation pipe

Payment provider integrations must implement the `PaymentProvider` interface
(`src/payments/payment-provider.ts`). `MockPaymentProvider` is for local development only — see the
root README's "Regulatory status" section before connecting a real rail.

## Commands

```bash
pnpm start:dev        # watch mode
pnpm build             # nest build
pnpm test              # jest unit tests
pnpm prisma:migrate    # create + apply a dev migration
pnpm prisma:seed       # seed local data
```
