import { Injectable } from "@nestjs/common";
import type { CreateQrPaymentIntentInput } from "@rti/shared";
import { PrismaService } from "../prisma/prisma.service";
import { MerchantsService } from "../merchants/merchants.service";

const INTENT_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class QrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchants: MerchantsService,
  ) {}

  async createIntent(ownerCustomerId: string, input: CreateQrPaymentIntentInput) {
    await this.merchants.assertOwnership(ownerCustomerId, input.merchantId);

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
