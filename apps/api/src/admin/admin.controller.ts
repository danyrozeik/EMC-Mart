import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/jwt.strategy";
import { Roles } from "../auth/roles.decorator";
import { IdempotencyKey } from "../common/decorators/idempotency-key.decorator";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("v1/admin")
@Roles("SUPPORT", "RISK_ANALYST", "OPERATIONS", "SUPER_ADMIN")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("customers")
  listCustomers(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.admin.listCustomers(take ? Number(take) : undefined, skip ? Number(skip) : undefined);
  }

  @Get("merchants")
  listMerchants(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.admin.listMerchants(take ? Number(take) : undefined, skip ? Number(skip) : undefined);
  }

  @Get("transactions")
  listTransactions(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.admin.listTransactions(take ? Number(take) : undefined, skip ? Number(skip) : undefined);
  }

  @Get("kyc-cases")
  listKycCases(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.admin.listKycCases(take ? Number(take) : undefined, skip ? Number(skip) : undefined);
  }

  @Patch("kyc-cases/:id")
  @Roles("OPERATIONS", "SUPER_ADMIN")
  decideKycCase(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: { decision: "APPROVED" | "REJECTED"; notes?: string },
  ) {
    return this.admin.decideKycCase(user.sub, id, body.decision, body.notes);
  }

  @Get("risk-alerts")
  @Roles("RISK_ANALYST", "SUPER_ADMIN")
  listRiskAlerts(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.admin.listRiskAlerts(take ? Number(take) : undefined, skip ? Number(skip) : undefined);
  }

  @Post("risk-alerts/:id/resolve")
  @Roles("RISK_ANALYST", "SUPER_ADMIN")
  resolveRiskAlert(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.admin.resolveRiskAlert(user.sub, id);
  }

  @Get("refund-requests")
  @Roles("OPERATIONS", "SUPER_ADMIN")
  listRefundRequests(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.admin.listRefundRequests(take ? Number(take) : undefined, skip ? Number(skip) : undefined);
  }

  @Post("refund-requests/:id/approve")
  @Roles("OPERATIONS", "SUPER_ADMIN")
  approveRefundRequest(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    return this.admin.approveRefundRequest(user.sub, id, idempotencyKey);
  }

  @Post("refund-requests/:id/reject")
  @Roles("OPERATIONS", "SUPER_ADMIN")
  rejectRefundRequest(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.admin.rejectRefundRequest(user.sub, id);
  }

  @Get("settlements")
  @Roles("OPERATIONS", "SUPER_ADMIN")
  listSettlements(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.admin.listSettlements(take ? Number(take) : undefined, skip ? Number(skip) : undefined);
  }

  @Post("settlements")
  @Roles("OPERATIONS", "SUPER_ADMIN")
  createSettlement(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: { merchantId: string; periodStart: string; periodEnd: string; grossAmountMinor: number; feeAmountMinor: number },
  ) {
    return this.admin.createSettlement(user.sub, body);
  }

  @Get("audit-logs")
  @Roles("SUPER_ADMIN")
  listAuditLog(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.admin.listAuditLog(take ? Number(take) : undefined, skip ? Number(skip) : undefined);
  }

  @Get("support/tickets")
  listSupportTickets() {
    return this.admin.listSupportTickets();
  }
}
