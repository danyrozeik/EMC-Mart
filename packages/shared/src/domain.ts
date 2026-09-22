export type Currency = "EGP";
export type LoyaltyUnit = "RTI Points";

export type TransactionStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type TransactionType = "QR_PAYMENT" | "SEND" | "REQUEST" | "REFUND" | "BILL_PAYMENT";

export interface Money {
  currency: Currency;
  minor: number; // EGP piastres, integer only
}

export interface Transaction {
  id: string;
  type: TransactionType;
  customerId: string;
  merchantId?: string;
  counterpartyCustomerId?: string;
  amount: Money;
  status: TransactionStatus;
  reference: string;
  idempotencyKey: string;
  providerPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type LoyaltyEntryType = "EARN" | "REDEEM" | "EXPIRE" | "ADJUST";

export interface LoyaltyLedgerEntry {
  id: string;
  customerId: string;
  type: LoyaltyEntryType;
  // EARN/REDEEM/EXPIRE are always a positive magnitude (direction implied by type).
  // ADJUST may be positive (credit correction) or negative (debit correction).
  points: number;
  transactionId?: string;
  reason?: string;
  createdAt: string;
}

export interface LoyaltyBalance {
  customerId: string;
  points: number;
  unit: LoyaltyUnit;
}

export type KycStatus = "NOT_STARTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  kycStatus: KycStatus;
  preferredLanguage: "ar" | "en";
  createdAt: string;
}

export interface Merchant {
  id: string;
  businessName: string;
  ownerCustomerId: string;
  kycStatus: KycStatus;
  category: string;
  createdAt: string;
}

export type RefundStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface RefundRequest {
  id: string;
  transactionId: string;
  amount: Money;
  status: RefundStatus;
  reason?: string;
  requestedBy: string;
  createdAt: string;
}

export type SettlementStatus = "PENDING" | "PAID" | "FAILED";

export interface Settlement {
  id: string;
  merchantId: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: Money;
  feeAmount: Money;
  netAmount: Money;
  status: SettlementStatus;
  createdAt: string;
}

export type RiskAlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskAlert {
  id: string;
  customerId?: string;
  merchantId?: string;
  transactionId?: string;
  severity: RiskAlertSeverity;
  reason: string;
  createdAt: string;
  resolvedAt?: string;
}

export type ActorType = "CUSTOMER" | "MERCHANT" | "ADMIN" | "SYSTEM";

export interface AuditLogEntry {
  id: string;
  actorType: ActorType;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type AdminRole = "SUPPORT" | "RISK_ANALYST" | "OPERATIONS" | "SUPER_ADMIN";
