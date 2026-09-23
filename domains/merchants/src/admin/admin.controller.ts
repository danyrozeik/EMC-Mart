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

  @Get("merchants")
  listMerchants(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.admin.listMerchants(take ? Number(take) : undefined, skip ? Number(skip) : undefined);
  }

  @Get("merchant-kyc-cases")
  listKycCases(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.admin.listKycCases(take ? Number(take) : undefined, skip ? Number(skip) : undefined);
  }

  @Patch("merchant-kyc-cases/:id")
  @Roles("OPERATIONS", "SUPER_ADMIN")
  decideKycCase(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: { decision: "APPROVED" | "REJECTED"; notes?: string },
  ) {
    return this.admin.decideKycCase(user.sub, id, body.decision, body.notes);
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
    body: {
      merchantId: string;
      periodStart: string;
      periodEnd: string;
      grossAmountMinor: number;
      feeAmountMinor: number;
    },
  ) {
    return this.admin.createSettlement(user.sub, body);
  }
}
