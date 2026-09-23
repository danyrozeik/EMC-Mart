import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AuditClient } from "@rti/service-client";
import { PrismaService } from "../prisma/prisma.service";
import { AUDIT_CLIENT } from "../common/clients.module";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUDIT_CLIENT) private readonly audit: AuditClient,
  ) {}

  listMerchants(take = 50, skip = 0) {
    return this.prisma.merchant.findMany({ take, skip, orderBy: { createdAt: "desc" } });
  }

  listKycCases(take = 50, skip = 0) {
    return this.prisma.kycCase.findMany({ take, skip, orderBy: { createdAt: "desc" } });
  }

  async decideKycCase(adminId: string, caseId: string, decision: "APPROVED" | "REJECTED", notes?: string) {
    const kycCase = await this.prisma.kycCase.findUnique({ where: { id: caseId } });
    if (!kycCase) {
      throw new NotFoundException("Merchant KYC case not found");
    }

    const updated = await this.prisma.kycCase.update({
      where: { id: caseId },
      data: { status: decision, notes, reviewedBy: adminId },
    });

    await this.prisma.merchant.update({
      where: { id: kycCase.merchantId },
      data: { kycStatus: decision },
    });

    await this.audit.record({
      actorType: "ADMIN",
      actorId: adminId,
      action: `MERCHANT_KYC_${decision}`,
      targetType: "Merchant",
      targetId: kycCase.merchantId,
      metadata: { caseId, notes },
    });

    return updated;
  }

  listSettlements(take = 50, skip = 0) {
    return this.prisma.settlement.findMany({ take, skip, orderBy: { periodStart: "desc" } });
  }

  async createSettlement(
    adminId: string,
    input: {
      merchantId: string;
      periodStart: string;
      periodEnd: string;
      grossAmountMinor: number;
      feeAmountMinor: number;
    },
  ) {
    const netAmountMinor = input.grossAmountMinor - input.feeAmountMinor;
    if (netAmountMinor < 0) {
      throw new BadRequestException("Fee amount cannot exceed the gross amount");
    }

    const settlement = await this.prisma.settlement.create({
      data: {
        merchantId: input.merchantId,
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        grossAmountMinor: input.grossAmountMinor,
        feeAmountMinor: input.feeAmountMinor,
        netAmountMinor,
        status: "PENDING",
      },
    });

    await this.audit.record({
      actorType: "ADMIN",
      actorId: adminId,
      action: "SETTLEMENT_CREATED",
      targetType: "Settlement",
      targetId: settlement.id,
    });

    return settlement;
  }
}
