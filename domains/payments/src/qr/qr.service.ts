import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ServiceClient } from "@rti/service-client";
import type { CreateQrPaymentIntentInput } from "@rti/shared";
import { PrismaService } from "../prisma/prisma.service";
import { MERCHANTS_CLIENT } from "../common/clients.module";

const INTENT_TTL_MS = 5 * 60 * 1000;

interface MerchantDto {
  id: string;
  ownerCustomerId: string;
}

@Injectable()
export class QrService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MERCHANTS_CLIENT) private readonly merchants: ServiceClient,
  ) {}

  async createIntent(ownerCustomerId: string, input: CreateQrPaymentIntentInput) {
    let merchant: MerchantDto;
    try {
      merchant = await this.merchants.get<MerchantDto>(`/v1/merchants/${input.merchantId}`);
    } catch {
      throw new NotFoundException("Merchant not found");
    }
    if (merchant.ownerCustomerId !== ownerCustomerId) {
      throw new NotFoundException("You do not own this merchant account");
    }

    return this.prisma.qrPaymentIntent.create({
      data: {
        merchantId: input.merchantId,
        amountMinor: input.amountMinor,
        reference: input.reference,
        expiresAt: new Date(Date.now() + INTENT_TTL_MS),
      },
    });
  }

  async getIntent(id: string) {
    return this.prisma.qrPaymentIntent.findUnique({ where: { id } });
  }
}
