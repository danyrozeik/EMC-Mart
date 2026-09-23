import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Internal, InternalServiceGuard } from "@rti/auth-kit";
import { LoyaltyService } from "../loyalty/loyalty.service";

interface EarnInput {
  customerId: string;
  transactionId: string;
  amountMinor: number;
}

interface ReverseInput {
  customerId: string;
  transactionId: string;
  reason: string;
}

@Controller("internal/loyalty")
@UseGuards(InternalServiceGuard)
export class InternalController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Internal()
  @Post("earn")
  earn(@Body() body: EarnInput) {
    return this.loyalty.earnForTransaction(body);
  }

  @Internal()
  @Post("reverse")
  reverse(@Body() body: ReverseInput) {
    return this.loyalty.reverseForTransaction(body.transactionId, body.customerId, body.reason);
  }
}
