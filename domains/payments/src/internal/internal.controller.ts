import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { Internal, InternalServiceGuard } from "@rti/auth-kit";
import { InternalRefundRequestsService } from "./internal-refund-requests.service";

interface CreateRefundRequestInput {
  merchantId: string;
  transactionId: string;
  requestedBy: string;
  amountMinor?: number;
  reason?: string;
}

@Controller("internal")
@UseGuards(InternalServiceGuard)
export class InternalController {
  constructor(private readonly refundRequests: InternalRefundRequestsService) {}

  @Internal()
  @Post("refund-requests")
  create(@Body() body: CreateRefundRequestInput) {
    return this.refundRequests.request(body);
  }

  @Internal()
  @Get("refund-requests")
  list(@Query("merchantId") merchantId?: string) {
    if (!merchantId) {
      throw new BadRequestException("merchantId query parameter is required");
    }
    return this.refundRequests.listForMerchant(merchantId);
  }
}
