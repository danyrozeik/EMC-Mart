import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type JwtPayload } from "@rti/auth-kit";
import { RefundRequestsService } from "./refund-requests.service";

@ApiTags("refund-requests")
@ApiBearerAuth()
@Controller("v1/merchants/:merchantId/refund-requests")
export class RefundRequestsController {
  constructor(private readonly refundRequests: RefundRequestsService) {}

  @Post()
  request(
    @CurrentUser() user: JwtPayload,
    @Param("merchantId") merchantId: string,
    @Body() body: { transactionId: string; amountMinor?: number; reason?: string },
  ) {
    return this.refundRequests.request(user.sub, merchantId, body);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload, @Param("merchantId") merchantId: string) {
    return this.refundRequests.listForMerchant(user.sub, merchantId);
  }
}
