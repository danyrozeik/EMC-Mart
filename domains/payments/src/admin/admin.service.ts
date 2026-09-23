import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AuditClient } from "@rti/service-client";
import { PrismaService } from "../prisma/prisma.service";
import { AUDIT_CLIENT } from "../common/clients.module";
import { PaymentsService } from "../payments/payments.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    @Inject(AUDIT_CLIENT) private readonly audit: AuditClient,
  ) {}

  listTransactions(take = 50, skip = 0) {
    return this.prisma.transaction.findMany({ take, skip, orderBy: { createdAt: "desc" } });
  }

  listRefundRequests(take = 50, skip = 0) {
    return this.prisma.refundRequest.findMany({
      where: { status: "REQUESTED" },
      take,
      skip,
      orderBy: { createdAt: "desc" },
    });
  }

  async approveRefundRequest(adminId: string, refundRequestId: string, idempotencyKey: string) {
    const request = await this.prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!request) {
      throw new NotFoundException("Refund request not found");
    }
    if (request.status !== "REQUESTED") {
      throw new BadRequestException("Refund request has already been decided");
    }

    const result = await this.payments.refund(
      request.transactionId,
      adminId,
      { amountMinor: request.amountMinor, reason: request.reason ?? undefined },
      idempotencyKey,
    );

    await this.prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: { status: "APPROVED" },
    });

    return result;
  }

  async rejectRefundRequest(adminId: string, refundRequestId: string) {
    const updated = await this.prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: { status: "REJECTED" },
    });

    await this.audit.record({
      actorType: "ADMIN",
      actorId: adminId,
      action: "REFUND_REQUEST_REJECTED",
      targetType: "RefundRequest",
      targetId: refundRequestId,
    });

    return updated;
  }
}
