import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { PaymentsService } from "../payments/payments.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly payments: PaymentsService,
  ) {}

  listCustomers(take = 50, skip = 0) {
    return this.prisma.customer.findMany({
      take,
      skip,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        kycStatus: true,
        preferredLanguage: true,
        createdAt: true,
      },
    });
  }

  listMerchants(take = 50, skip = 0) {
    return this.prisma.merchant.findMany({ take, skip, orderBy: { createdAt: "desc" } });
  }

  listTransactions(take = 50, skip = 0) {
    return this.prisma.transaction.findMany({ take, skip, orderBy: { createdAt: "desc" } });
  }

  listKycCases(take = 50, skip = 0) {
    return this.prisma.kycCase.findMany({ take, skip, orderBy: { createdAt: "desc" } });
  }

  async decideKycCase(adminId: string, caseId: string, decision: "APPROVED" | "REJECTED", notes?: string) {
    const kycCase = await this.prisma.kycCase.findUnique({ where: { id: caseId } });
    if (!kycCase) {
      throw new NotFoundException("KYC case not found");
    }

    const updated = await this.prisma.kycCase.update({
      where: { id: caseId },
      data: { status: decision, notes, reviewedBy: adminId },
    });

    if (kycCase.subjectType === "CUSTOMER") {
      await this.prisma.customer.update({ where: { id: kycCase.subjectId }, data: { kycStatus: decision } });
    } else {
      await this.prisma.merchant.update({ where: { id: kycCase.subjectId }, data: { kycStatus: decision } });
    }

    await this.audit.record({
      actorType: "ADMIN",
      actorId: adminId,
      action: `KYC_${decision}`,
      targetType: kycCase.subjectType === "CUSTOMER" ? "Customer" : "Merchant",
      targetId: kycCase.subjectId,
      metadata: { caseId, notes },
    });

    return updated;
  }

  listRiskAlerts(take = 50, skip = 0) {
    return this.prisma.riskAlert.findMany({ take, skip, orderBy: { createdAt: "desc" } });
  }

  async resolveRiskAlert(adminId: string, alertId: string) {
    const alert = await this.prisma.riskAlert.update({
      where: { id: alertId },
      data: { resolvedAt: new Date() },
    });

    await this.audit.record({
      actorType: "ADMIN",
      actorId: adminId,
      action: "RISK_ALERT_RESOLVED",
      targetType: "RiskAlert",
      targetId: alertId,
    });

    return alert;
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

  listAuditLog(take = 100, skip = 0) {
    return this.prisma.auditLogEntry.findMany({ take, skip, orderBy: { createdAt: "desc" } });
  }

  /**
   * Support ticketing is out of scope for this MVP — this is the
   * integration boundary a helpdesk provider (e.g. Zendesk/Freshdesk)
   * would be wired into.
   */
  listSupportTickets() {
    return [];
  }
}
