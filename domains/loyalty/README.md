# RTI Loyalty Service

Owns the append-only RTI Points ledger.

## Owns

- `LoyaltyLedgerEntry`

## Public API

- `GET /v1/loyalty/balance`, `GET /v1/loyalty/ledger`, `POST /v1/loyalty/redeem`
- `POST /v1/admin/loyalty/:customerId/adjust`

## Internal API (X-Internal-Token only)

- `POST /internal/loyalty/earn` / `POST /internal/loyalty/reverse` — available for manual/admin use.
  Not on the payment request path (see below).

## Earning from payments (queue, not a direct call)

`LoyaltyEventsConsumerService` (`src/consumer/`) blocks on the `rti:loyalty-events` Redis list that
the payments service's transactional outbox publishes to, and calls `earnForTransaction` /
`reverseForTransaction` as events arrive — idempotent per `transactionId`, same as a direct call. See
the root README's "Loyalty crediting: transactional outbox" section.

RTI Points are never treated as EGP — see the root `CLAUDE.md`.
