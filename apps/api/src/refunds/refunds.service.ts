import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { MerchantsService } from "../merchants/merchants.service";

@Injectable()
export class RefundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchants: MerchantsService,
    private readonly audit: AuditService,
  ) {}

  async requestRefund(
    ownerCustomerId: string,
    input: { merchantId: string; transactionId: string; amountMinor?: number; reason?: string },
  ) {
    await this.merchants.assertOwnership(ownerCustomerId, input.merchantId);

    const transaction = await this.prisma.transaction.findUnique({ where: { id: input.transactionId } });
    if (!transaction || transaction.merchantId !== input.merchantId) {
      throw new BadRequestException("Transaction does not belong to this merchant");
    }

    const refundRequest = await this.prisma.refundRequest.create({
      data: {
        transactionId: input.transactionId,
        amountMinor: input.amountMinor ?? transaction.amountMinor,
        status: "REQUESTED",
        reason: input.reason,
        requestedBy: ownerCustomerId,
      },
    });

    await this.audit.record({
      actorType: "MERCHANT",
      actorId: ownerCustomerId,
      action: "REFUND_REQUESTED",
      targetType: "RefundRequest",
      targetId: refundRequest.id,
      metadata: { transactionId: input.transactionId },
    });

    return refundRequest;
  }

  async listForMerchant(ownerCustomerId: string, merchantId: string) {
    await this.merchants.assertOwnership(ownerCustomerId, merchantId);

    return this.prisma.refundRequest.findMany({
      where: { transaction: { merchantId } },
      orderBy: { createdAt: "desc" },
    });
  }
}
