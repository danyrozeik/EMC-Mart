import { Inject, Injectable } from "@nestjs/common";
import type { ServiceClient } from "@rti/service-client";
import { PAYMENTS_CLIENT } from "../common/clients.module";
import { MerchantsService } from "../merchants/merchants.service";

export interface RefundRequestDto {
  id: string;
  transactionId: string;
  amountMinor: number;
  status: string;
  reason: string | null;
  createdAt: string;
}

@Injectable()
export class RefundRequestsService {
  constructor(
    private readonly merchants: MerchantsService,
    @Inject(PAYMENTS_CLIENT) private readonly payments: ServiceClient,
  ) {}

  async request(
    ownerCustomerId: string,
    merchantId: string,
    input: { transactionId: string; amountMinor?: number; reason?: string },
  ): Promise<RefundRequestDto> {
    await this.merchants.assertOwnership(ownerCustomerId, merchantId);

    return this.payments.post<RefundRequestDto>("/internal/refund-requests", {
      merchantId,
      requestedBy: ownerCustomerId,
      ...input,
    });
  }

  async listForMerchant(ownerCustomerId: string, merchantId: string): Promise<RefundRequestDto[]> {
    await this.merchants.assertOwnership(ownerCustomerId, merchantId);

    return this.payments.get<RefundRequestDto[]>(
      `/internal/refund-requests?merchantId=${encodeURIComponent(merchantId)}`,
    );
  }
}
