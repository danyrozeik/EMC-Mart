import { PaymentOrchestrator } from "./payment-orchestrator";
import type { PaymentProvider } from "./payment-provider";

describe("PaymentOrchestrator", () => {
  function buildProvider(overrides: Partial<PaymentProvider> = {}): PaymentProvider {
    return {
      createPayment: jest.fn().mockResolvedValue({ providerPaymentId: "prov_1", status: "SUCCEEDED" }),
      refund: jest.fn().mockResolvedValue({ providerRefundId: "ref_1", status: "SUCCEEDED" }),
      ...overrides,
    };
  }

  it("rejects a non-positive amount before calling the provider", async () => {
    const provider = buildProvider();
    const orchestrator = new PaymentOrchestrator(provider);

    await expect(
      orchestrator.pay({ customerId: "c1", merchantId: "m1", amountMinor: 0, reference: "ref" }),
    ).rejects.toThrow("Amount must be a positive integer in EGP piastres");
    expect(provider.createPayment).not.toHaveBeenCalled();
  });

  it("rejects a fractional amount", async () => {
    const provider = buildProvider();
    const orchestrator = new PaymentOrchestrator(provider);

    await expect(
      orchestrator.pay({ customerId: "c1", merchantId: "m1", amountMinor: 10.5, reference: "ref" }),
    ).rejects.toThrow();
  });

  it("delegates a valid payment to the provider with EGP currency", async () => {
    const provider = buildProvider();
    const orchestrator = new PaymentOrchestrator(provider);

    const result = await orchestrator.pay({
      customerId: "c1",
      merchantId: "m1",
      amountMinor: 125000,
      reference: "order-1",
    });

    expect(provider.createPayment).toHaveBeenCalledWith({
      customerId: "c1",
      merchantId: "m1",
      amountMinor: 125000,
      reference: "order-1",
      currency: "EGP",
    });
    expect(result).toEqual({ providerPaymentId: "prov_1", status: "SUCCEEDED" });
  });

  it("delegates refunds to the provider", async () => {
    const provider = buildProvider();
    const orchestrator = new PaymentOrchestrator(provider);

    const result = await orchestrator.refund({ providerPaymentId: "prov_1", amountMinor: 5000 });

    expect(provider.refund).toHaveBeenCalledWith({ providerPaymentId: "prov_1", amountMinor: 5000 });
    expect(result).toEqual({ providerRefundId: "ref_1", status: "SUCCEEDED" });
  });
});
