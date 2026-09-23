# RTI Payments Service

Owns QR payment intents, the transaction ledger, payment execution (behind the
`PaymentProvider` adapter boundary), and refunds.

## Owns

- `Transaction`, `QrPaymentIntent`, `RefundRequest`, `IdempotencyRecord`

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
- **loyalty service** — earns RTI Points after a completed transaction and
  reverses them on a full refund.
- **identity service** — writes audit log entries.

`MockPaymentProvider` is not a real payment rail — see the root README's
"Regulatory status" section before connecting a licensed PSP adapter.
