# RTI Identity Service

Owns customer accounts, admin users, customer KYC status, risk alerts, and the
centralized audit log for all domain services.

## Owns

- `Customer`, `AdminUser`, `KycCase` (customer-scoped), `RiskAlert`, `AuditLogEntry`

## Public API

- `POST /v1/auth/register`, `POST /v1/auth/login`
- `GET /v1/customers/me`, `POST /v1/customers/me/kyc/submit`
- `POST /v1/admin/auth/login`
- `GET /v1/admin/customers`
- `GET /v1/admin/kyc-cases`, `PATCH /v1/admin/kyc-cases/:id`
- `GET /v1/admin/risk-alerts`, `POST /v1/admin/risk-alerts/:id/resolve`
- `GET /v1/admin/audit-logs`

## Internal API (X-Internal-Token only)

- `POST /internal/audit-logs` — every other domain service writes its audit
  trail here so there is one place operators look.
- `POST /internal/risk-alerts` — other services can raise a risk alert against
  a customer/merchant/transaction they own.

Every other domain service verifies customer/admin JWTs locally (shared
`JWT_SECRET`) rather than calling this service per request.
