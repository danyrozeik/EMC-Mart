export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");

export type ProviderPaymentStatus = "SUCCEEDED" | "FAILED";
export type ProviderRefundStatus = "SUCCEEDED" | "FAILED";

/**
 * Boundary every regulated payment rail must implement. RTI does not move
 * money itself in this codebase — every concrete implementation must be a
 * licensed bank/PSP adapter reviewed for regulatory approval before use.
 */
export interface PaymentProvider {
  createPayment(input: {
    customerId: string;
    merchantId: string;
    amountMinor: number;
    currency: "EGP";
    reference: string;
  }): Promise<{ providerPaymentId: string; status: ProviderPaymentStatus }>;

  refund(input: {
    providerPaymentId: string;
    amountMinor?: number;
    reason?: string;
  }): Promise<{ providerRefundId: string; status: ProviderRefundStatus }>;
}
