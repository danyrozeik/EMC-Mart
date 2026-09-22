# RTI Architecture

Customer App
  -> API Gateway
  -> Auth / Identity / Customer Services
  -> Payment Orchestrator
  -> Licensed Bank/PSP adapters
  -> Approved Egyptian payment rails

Commerce:
Customer -> Marketplace -> Merchant -> Order -> Payment

Loyalty:
Completed eligible transaction -> Loyalty Ledger -> RTI Points balance

## Rules
1. All money amounts are integer minor units (piastres).
2. Currency is always EGP in MVP.
3. RTI Points are a separate loyalty ledger, not money.
4. Never treat RTI Points as EGP.
5. Payment provider-specific code stays behind adapters.
6. Idempotency keys are mandatory for payment creation/refund endpoints.
7. Audit every privileged/admin action.
8. Separate customer, merchant and admin authorization scopes.
