import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { MerchantsService } from "../merchants/merchants.service";

export interface CreateOfferInput {
  title: string;
  description?: string;
  discountPercent?: number;
  startsAt?: string;
  endsAt?: string;
}

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchants: MerchantsService,
    private readonly audit: AuditService,
  ) {}

  async create(ownerCustomerId: string, merchantId: string, input: CreateOfferInput) {
    await this.merchants.assertOwnership(ownerCustomerId, merchantId);

    const offer = await this.prisma.offer.create({
      data: {
        merchantId,
        title: input.title,
        description: input.description,
        discountPercent: input.discountPercent,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
      },
    });

    await this.audit.record({
      actorType: "MERCHANT",
      actorId: ownerCustomerId,
      action: "OFFER_CREATED",
      targetType: "Offer",
      targetId: offer.id,
    });

    return offer;
  }

  async listForMerchant(merchantId: string) {
    return this.prisma.offer.findMany({ where: { merchantId }, orderBy: { createdAt: "desc" } });
  }
}
