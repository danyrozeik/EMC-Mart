import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles, type JwtPayload } from "@rti/auth-kit";
import { LoyaltyService } from "../loyalty/loyalty.service";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("v1/admin/loyalty")
@Roles("OPERATIONS", "SUPER_ADMIN")
export class AdminController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Post(":customerId/adjust")
  adjust(
    @CurrentUser() user: JwtPayload,
    @Param("customerId") customerId: string,
    @Body() body: { points: number; reason: string },
  ) {
    return this.loyalty.adjust(customerId, body.points, body.reason, user.sub);
  }
}
