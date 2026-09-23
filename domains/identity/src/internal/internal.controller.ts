import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Internal, InternalServiceGuard } from "@rti/auth-kit";
import { AuditService, type RecordAuditInput } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";

interface RaiseRiskAlertInput {
  customerId?: string;
  merchantId?: string;
  transactionId?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
}

@Controller("internal")
@UseGuards(InternalServiceGuard)
export class InternalController {
  constructor(
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Internal()
  @Post("audit-logs")
  recordAudit(@Body() body: RecordAuditInput) {
    return this.audit.record(body);
  }

  @Internal()
  @Post("risk-alerts")
  raiseRiskAlert(@Body() body: RaiseRiskAlertInput) {
    return this.prisma.riskAlert.create({ data: body });
  }
}
