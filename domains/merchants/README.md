# RTI Merchants Service

Owns merchant accounts, merchant KYC, offers, and settlements.

## Owns

- `Merchant`, `Offer`, `Settlement`, `KycCase` (merchant-scoped)

## Public API

- `POST /v1/merchants`, `GET /v1/merchants/:id`, `POST /v1/merchants/:id/kyc/submit`
- `POST /v1/merchants/:id/offers`, `GET /v1/merchants/:id/offers`
- `GET /v1/merchants/:id/settlements`
- `POST /v1/merchants/:id/refund-requests`, `GET /v1/merchants/:id/refund-requests`
  (proxies to the payments service — refund requests reference a transaction,
  which this service does not own)
- `GET /v1/admin/merchants`
- `GET /v1/admin/merchant-kyc-cases`, `PATCH /v1/admin/merchant-kyc-cases/:id`
- `GET /v1/admin/settlements`, `POST /v1/admin/settlements`

Ownership of a `merchantId` is always checked locally (`Merchant.ownerCustomerId`)
against the authenticated customer's JWT `sub` — `ownerCustomerId` is an opaque
reference to a customer owned by the identity service, not a foreign key.
