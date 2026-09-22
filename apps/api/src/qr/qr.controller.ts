import { Body, Controller, Get, Param, Post, UsePipes } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CreateQrPaymentIntentSchema, type CreateQrPaymentIntentInput } from "@rti/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/jwt.strategy";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { QrService } from "./qr.service";

@ApiTags("qr")
@ApiBearerAuth()
@Controller("v1/qr")
export class QrController {
  constructor(private readonly qr: QrService) {}

  @Post("payment-intents")
  @UsePipes(new ZodValidationPipe(CreateQrPaymentIntentSchema))
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateQrPaymentIntentInput) {
    return this.qr.createIntent(user.sub, body);
  }

  @Get("payment-intents/:id")
  get(@Param("id") id: string) {
    return this.qr.getIntent(id);
  }
}
