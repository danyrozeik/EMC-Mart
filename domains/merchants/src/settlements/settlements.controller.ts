import { Controller, Get, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type JwtPayload } from "@rti/auth-kit";
import { SettlementsService } from "./settlements.service";

@ApiTags("settlements")
@ApiBearerAuth()
@Controller("v1/merchants/:merchantId/settlements")
export class SettlementsController {
  constructor(private readonly settlements: SettlementsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Param("merchantId") merchantId: string) {
    return this.settlements.listForMerchant(user.sub, merchantId);
  }
}
