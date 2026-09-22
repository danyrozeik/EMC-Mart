# Claude Code implementation brief

You are the lead engineer for RTI, an Egypt-focused payments + commerce + services + loyalty super-app.

Build production-quality foundations, but do NOT implement or simulate regulated money movement as if RTI itself is licensed.

## Product rules
- App name: RTI
- Currency: EGP
- Loyalty: RTI Points
- RTI Points are loyalty units and must never be represented as EGP.
- Arabic and English must be supported; architecture must be RTL-ready.
- Mobile-first.
- Security and auditability are first-class requirements.

## MVP
Consumer:
1. Registration/login
2. KYC-ready onboarding
3. Home dashboard
4. Scan & Pay
5. Send money
6. Request money
7. Bills placeholder/integration boundary
8. Shop
9. Merchant storefront
10. Transaction activity
11. RTI Points
12. Profile/security/support

Merchant:
1. Business onboarding
2. KYC-ready flow
3. QR acceptance
4. Payment history
5. Settlement view
6. Refund request
7. Offers
8. Reports

Admin:
1. Customers
2. Merchants
3. Transactions
4. KYC cases
5. Risk alerts
6. Refunds
7. Settlements
8. Support
9. Audit logs

## Engineering requirements
- TypeScript everywhere practical.
- Monorepo with pnpm + Turborepo.
- Expo React Native for mobile.
- Next.js for admin.
- NestJS for API.
- PostgreSQL.
- Redis for ephemeral state/queues.
- OpenAPI for API contracts.
- Zod/class-validator at boundaries.
- UUID/ULID IDs.
- Integer minor units for money.
- Idempotency on payment/refund commands.
- Outbox/event pattern for transaction and loyalty events.
- Role-based access control.
- Structured logging.
- Secrets only through environment/secret manager.
- No raw PAN/CVV/bank passwords.
- Provider integrations must implement the PaymentProvider interface.
- Add automated unit/integration tests.

## First implementation order
1. Create workspace and package structure.
2. Implement shared domain types.
3. Implement API auth/customer/merchant modules.
4. Implement transaction ledger schema.
5. Implement payment-provider adapter boundary.
6. Implement QR payment command with idempotency.
7. Implement transaction history.
8. Implement RTI Points ledger triggered only by eligible completed transactions.
9. Implement merchant dashboard APIs.
10. Implement mobile Home, Pay, Activity, Shop and Profile.
11. Implement admin transaction/customer/merchant views.
12. Add tests and local development seed data.

## Money model
EGP 1.00 = 100 piastres.
Store 1250 EGP as minor=125000.
Never use floating point for persisted monetary values.

## Loyalty model
RTI Points are integers.
Keep an append-only ledger:
- EARN
- REDEEM
- EXPIRE
- ADJUST

Every adjustment requires an audit record.

## API conventions
POST /v1/payments
POST /v1/payments/:id/refund
GET /v1/transactions
GET /v1/loyalty/balance
GET /v1/loyalty/ledger
POST /v1/merchants
GET /v1/merchants/:id
POST /v1/qr/payment-intents

Payment commands require:
Idempotency-Key header
Request ID
Authenticated actor
Amount in minor EGP units

## UX
Use a premium, trustworthy Egyptian fintech visual language.
Avoid government-like styling.
Primary CTA: SCAN & PAY.
Show currency as EGP 12,450.
Show loyalty as 2,450 RTI Points.

## Deliverables
At the end, provide:
- files created/changed
- commands to run
- environment variables required
- database migration instructions
- test commands
- unresolved regulatory/provider integration placeholders
- next recommended implementation task

Do not claim that a payment is real unless connected to a real approved provider.
