import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
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

    await this.prisma.customer.update({
      where: { id: kycCase.customerId },
      data: { kycStatus: decision },
    });

    await this.audit.record({
      actorType: "ADMIN",
      actorId: adminId,
      action: `KYC_${decision}`,
      targetType: "Customer",
      targetId: kycCase.customerId,
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

  listAuditLog(take = 100, skip = 0) {
    return this.prisma.auditLogEntry.findMany({ take, skip, orderBy: { createdAt: "desc" } });
  }
}
