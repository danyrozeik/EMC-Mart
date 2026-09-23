import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InternalRefundRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async request(input: {
    merchantId: string;
    transactionId: string;
    requestedBy: string;
    amountMinor?: number;
    reason?: string;
  }) {
    const transaction = await this.prisma.transaction.findUnique({ where: { id: input.transactionId } });
    if (!transaction || transaction.merchantId !== input.merchantId) {
      throw new BadRequestException("Transaction does not belong to this merchant");
    }

    return this.prisma.refundRequest.create({
      data: {
        transactionId: input.transactionId,
        merchantId: input.merchantId,
        amountMinor: input.amountMinor ?? transaction.amountMinor,
        status: "REQUESTED",
        reason: input.reason,
        requestedBy: input.requestedBy,
      },
    });
  }

  async listForMerchant(merchantId: string) {
    return this.prisma.refundRequest.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
    });
  }
}
