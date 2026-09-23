import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type JwtPayload } from "@rti/auth-kit";
import { LoyaltyService } from "./loyalty.service";

@ApiTags("loyalty")
@ApiBearerAuth()
@Controller("v1/loyalty")
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get("balance")
  async balance(@CurrentUser() user: JwtPayload) {
    const points = await this.loyalty.getBalance(user.sub);
    return { customerId: user.sub, points, unit: "RTI Points" };
  }

  @Get("ledger")
  ledger(@CurrentUser() user: JwtPayload, @Query("take") take?: string, @Query("skip") skip?: string) {
    return this.loyalty.getLedger(user.sub, take ? Number(take) : undefined, skip ? Number(skip) : undefined);
  }

  @Post("redeem")
  redeem(@CurrentUser() user: JwtPayload, @Body() body: { points: number; reason?: string }) {
    return this.loyalty.redeem(user.sub, body.points, body.reason);
  }
}
