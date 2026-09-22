import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { RegisterMerchantInput } from "@rti/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../common/audit/audit.service";

@Injectable()
export class MerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async register(ownerCustomerId: string, input: RegisterMerchantInput) {
    const merchant = await this.prisma.merchant.create({
      data: {
        ownerCustomerId,
        businessName: input.businessName,
        category: input.category,
        kycStatus: "NOT_STARTED",
      },
    });

    await this.audit.record({
      actorType: "CUSTOMER",
      actorId: ownerCustomerId,
      action: "MERCHANT_REGISTERED",
      targetType: "Merchant",
      targetId: merchant.id,
    });

    return merchant;
  }

  async getById(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      throw new NotFoundException("Merchant not found");
    }
    return merchant;
  }

  async assertOwnership(customerId: string, merchantId: string) {
    const merchant = await this.getById(merchantId);
    if (merchant.ownerCustomerId !== customerId) {
      throw new ForbiddenException("You do not own this merchant account");
    }
    return merchant;
  }

  async submitKyc(customerId: string, merchantId: string) {
    await this.assertOwnership(customerId, merchantId);

    const merchant = await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { kycStatus: "PENDING_REVIEW" },
    });

    await this.prisma.kycCase.create({
      data: { subjectType: "MERCHANT", subjectId: merchantId, status: "PENDING_REVIEW" },
    });

    await this.audit.record({
      actorType: "CUSTOMER",
      actorId: customerId,
      action: "MERCHANT_KYC_SUBMITTED",
      targetType: "Merchant",
      targetId: merchantId,
    });

    return merchant;
  }
}
