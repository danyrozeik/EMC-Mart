import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MerchantsService } from "../merchants/merchants.service";

@Injectable()
export class SettlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchants: MerchantsService,
  ) {}

  async listForMerchant(ownerCustomerId: string, merchantId: string) {
    await this.merchants.assertOwnership(ownerCustomerId, merchantId);

    return this.prisma.settlement.findMany({
      where: { merchantId },
      orderBy: { periodStart: "desc" },
    });
  }
}
