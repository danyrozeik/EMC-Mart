import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/jwt.strategy";
import { RefundsService } from "./refunds.service";

@ApiTags("refunds")
@ApiBearerAuth()
@Controller("v1/merchants/:merchantId/refund-requests")
export class RefundsController {
  constructor(private readonly refunds: RefundsService) {}

  @Post()
  request(
    @CurrentUser() user: JwtPayload,
    @Param("merchantId") merchantId: string,
    @Body() body: { transactionId: string; amountMinor?: number; reason?: string },
  ) {
    return this.refunds.requestRefund(user.sub, { merchantId, ...body });
  }

  @Get()
  list(@CurrentUser() user: JwtPayload, @Param("merchantId") merchantId: string) {
    return this.refunds.listForMerchant(user.sub, merchantId);
  }
}
