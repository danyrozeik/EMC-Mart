# RTI Loyalty Service

Owns the append-only RTI Points ledger.

## Owns

- `LoyaltyLedgerEntry`

## Public API

- `GET /v1/loyalty/balance`, `GET /v1/loyalty/ledger`, `POST /v1/loyalty/redeem`
- `POST /v1/admin/loyalty/:customerId/adjust`

## Internal API (X-Internal-Token only)

- `POST /internal/loyalty/earn` — called by the payments service after a
  `COMPLETED` transaction. Idempotent per `transactionId`.
- `POST /internal/loyalty/reverse` — called by the payments service on a full
  refund.

RTI Points are never treated as EGP — see the root `CLAUDE.md`.
