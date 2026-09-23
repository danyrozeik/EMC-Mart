# RTI EGYPAY

Save this file as `CLAUDE.md` in the project root. Claude Code loads it automatically.

You help the human owner. You do not approve business, legal, financial, or production decisions. Silence is not approval. A recommendation is not a decision. An earlier yes does not cover a later change in scope, risk, cost, security, compliance, or architecture.

This file is not legal advice and not regulatory approval.

## Hard stops

- Do not claim RTI EGYPAY is a licensed bank, payment institution, e-money issuer, or financial institution.
- Do not connect live payment rails or move real EGP.
- Do not store real national IDs or production customer funds.
- Do not turn RTI Points into pounds. Points are a separate loyalty ledger.
- Do not use floating-point arithmetic for money. EGP is integer piasters (1 EGP = 100).
- Do not edit historical ledger lines. Reversal is a new line.
- Do not treat mock or simulation payments as real payments.
- Do not invent Egyptian legal conclusions. Label each point verified, likely, assumption, or needs a lawyer.
- Do not continue past an approval gate until the owner replies APPROVE, REJECT, or REQUEST CHANGES.

When a gate is required, stop and write:

```text
APPROVAL REQUIRED
Decision:
Why it matters:
Recommended option: (not assumed approval)
Alternatives:
Impact:
Risks:
Reversibility:
Decision needed: APPROVE / REJECT / REQUEST CHANGES
```

## Product

Egypt-focused wallet, payments, commerce, and loyalty platform.

- Currency: EGP. Loyalty: RTI Points, not cash.
- Languages: English and Arabic (RTL). Timezone: Africa/Cairo.
- Long-term scope includes merchants, offers, risk, support, and future licensed payment integrations.
- Today it is a simulation, not a licensed wallet.

## Gates (23 September 2026)

| Gate | Area | Status | Do not |
| --- | --- | --- | --- |
| 0 | Foundation | **Approved 23 September 2026** — vision, MVP, and roadmap as documented in `docs/claude-code-prompt.md` and `README.md`, simulation-only until Gates 2/3/4/8 clear | Reopen without a new owner decision |
| 1 | Architecture | Draft only | Treat the design as final |
| 2 | Financial architecture | Simulation only | Build real transfer, payment, refund, or settlement |
| 3 | Security | Not started | Deploy without a security review |
| 4 | Regulatory | Research only | Call research a legal opinion |
| 5 | UX | Simulation shell | Ship major production flows unreviewed |
| 6 | Production readiness | Not started | Treat tests as launch approval |
| 7 | Deployment | Not authorized | Deploy |
| 8 | Real money | Blocked | Activate balances, payouts, or rails |
| 9 | AI autonomy | Research and simulation | Grant yourself more authority |

Always ask before production changes to financial logic, security, authentication, compliance, wallet balances
