# RTI Payments Service

Owns QR payment intents, the transaction ledger, payment execution (behind the
`PaymentProvider` adapter boundary), and refunds.

## Owns

- `Transaction`, `QrPaymentIntent`, `RefundRequest`, `IdempotencyRecord`, `OutboxEvent`

## Public API

- `POST /v1/qr/payment-intents`, `GET /v1/qr/payment-intents/:id`
- `POST /v1/payments`, `POST /v1/payments/:id/refund` (both require `Idempotency-Key`)
- `GET /v1/transactions`, `GET /v1/transactions/:id`
- `GET /v1/admin/transactions`
- `GET /v1/admin/refund-requests`, `POST /v1/admin/refund-requests/:id/approve|reject`

## Internal API (X-Internal-Token only)

- `POST /internal/refund-requests`, `GET /internal/refund-requests?merchantId=` —
  called by the merchants service, which has already verified the caller owns
  the merchant.

## Calls out to

- **merchants service** — verifies a merchant exists before creating a QR
  intent or payment.
- **identity service** — writes audit log entries.

## Loyalty crediting (outbox, not a direct call)

Payments does **not** call the loyalty service directly. `PaymentsService` writes an `OutboxEvent`
row in the same DB transaction as the `Transaction`/`RefundRequest` change; `OutboxDispatcherService`
(`src/outbox/`) publishes `PENDING` rows to the `rti:loyalty-events` Redis list on a timer, so a slow
or unavailable loyalty service can never slow down or fail a payment. See the root README's "Loyalty
crediting: transactional outbox" section.

`MockPaymentProvider` is not a real payment rail — see the root README's
"Regulatory status" section before connecting a licensed PSP adapter.
