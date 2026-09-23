import { Injectable } from "@nestjs/common";
import { newId } from "@rti/shared";
import type { PaymentProvider } from "../payment-provider";

/**
 * NOT a real payment rail. Simulates a PSP synchronously for local
 * development and demos. Replace with a licensed bank/PSP adapter behind
 * the same PaymentProvider interface before any real money movement.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(input: {
    customerId: string;
    merchantId: string;
    amountMinor: number;
    currency: "EGP";
    reference: string;
  }) {
    return {
      providerPaymentId: newId("mock_pay"),
      status: "SUCCEEDED" as const,
    };
  }

  async refund(input: { providerPaymentId: string; amountMinor?: number; reason?: string }) {
    return {
      providerRefundId: newId("mock_refund"),
      status: "SUCCEEDED" as const,
    };
  }
}
