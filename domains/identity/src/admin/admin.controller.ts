import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles, type JwtPayload } from "@rti/auth-kit";
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

  @Get("audit-logs")
  @Roles("SUPER_ADMIN")
  listAuditLog(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.admin.listAuditLog(take ? Number(take) : undefined, skip ? Number(skip) : undefined);
  }
}
