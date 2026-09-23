import { Inject, Injectable } from "@nestjs/common";
import { PAYMENT_PROVIDER, type PaymentProvider } from "./payment-provider";

@Injectable()
export class PaymentOrchestrator {
  constructor(@Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider) {}

  async pay(input: { customerId: string; merchantId: string; amountMinor: number; reference: string }) {
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new Error("Amount must be a positive integer in EGP piastres");
    }

    return this.provider.createPayment({
      ...input,
      currency: "EGP",
    });
  }

  async refund(input: { providerPaymentId: string; amountMinor?: number; reason?: string }) {
    return this.provider.refund(input);
  }
}
