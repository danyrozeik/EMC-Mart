import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type JwtPayload } from "@rti/auth-kit";
import { OffersService, type CreateOfferInput } from "./offers.service";

@ApiTags("offers")
@Controller("v1/merchants/:merchantId/offers")
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @ApiBearerAuth()
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Param("merchantId") merchantId: string,
    @Body() body: CreateOfferInput,
  ) {
    return this.offers.create(user.sub, merchantId, body);
  }

  @Get()
  list(@Param("merchantId") merchantId: string) {
    return this.offers.listForMerchant(merchantId);
  }
}
