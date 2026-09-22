import { Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/jwt.strategy";
import { CustomersService } from "./customers.service";

@ApiTags("customers")
@ApiBearerAuth()
@Controller("v1/customers")
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get("me")
  me(@CurrentUser() user: JwtPayload) {
    return this.customers.getProfile(user.sub);
  }

  @Post("me/kyc/submit")
  submitKyc(@CurrentUser() user: JwtPayload) {
    return this.customers.submitKyc(user.sub);
  }
}
