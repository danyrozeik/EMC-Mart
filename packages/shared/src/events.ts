/** Redis list the payments service's transactional outbox publishes loyalty events to. */
export const LOYALTY_EVENTS_QUEUE = "rti:loyalty-events";

export interface PaymentCompletedEvent {
  type: "PAYMENT_COMPLETED";
  customerId: string;
  transactionId: string;
  amountMinor: number;
}

export interface PaymentRefundedEvent {
  type: "PAYMENT_REFUNDED";
  customerId: string;
  transactionId: string;
  reason: string;
}

export type LoyaltyOutboxEvent = PaymentCompletedEvent | PaymentRefundedEvent;
