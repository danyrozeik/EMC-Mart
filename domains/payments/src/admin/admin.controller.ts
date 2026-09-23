import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles, type JwtPayload } from "@rti/auth-kit";
import { IdempotencyKey } from "../common/decorators/idempotency-key.decorator";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("v1/admin")
@Roles("SUPPORT", "RISK_ANALYST", "OPERATIONS", "SUPER_ADMIN")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("transactions")
  listTransactions(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.admin.listTransactions(take ? Number(take) : undefined, skip ? Number(skip) : undefined);
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
}
