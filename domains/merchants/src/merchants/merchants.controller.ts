import { Body, Controller, Get, Param, Post, UsePipes } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Public, type JwtPayload } from "@rti/auth-kit";
import { RegisterMerchantSchema, type RegisterMerchantInput } from "@rti/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { MerchantsService } from "./merchants.service";

@ApiTags("merchants")
@ApiBearerAuth()
@Controller("v1/merchants")
export class MerchantsController {
  constructor(private readonly merchants: MerchantsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(RegisterMerchantSchema))
  register(@CurrentUser() user: JwtPayload, @Body() body: RegisterMerchantInput) {
    return this.merchants.register(user.sub, body);
  }

  @Public()
  @Get(":id")
  getById(@Param("id") id: string) {
    return this.merchants.getById(id);
  }

  @Post(":id/kyc/submit")
  submitKyc(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.merchants.submitKyc(user.sub, id);
  }
}
