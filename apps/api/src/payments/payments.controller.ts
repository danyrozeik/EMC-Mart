import { Body, Controller, Param, Post, UsePipes } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PayMerchantSchema, RefundPaymentSchema, type PayMerchantInput, type RefundPaymentInput } from "@rti/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/jwt.strategy";
import { IdempotencyKey } from "../common/decorators/idempotency-key.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@ApiBearerAuth()
@Controller("v1/payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(PayMerchantSchema))
  pay(
    @CurrentUser() user: JwtPayload,
    @Body() body: PayMerchantInput,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    return this.payments.pay(user.sub, body, idempotencyKey);
  }

  @Post(":id/refund")
  @UsePipes(new ZodValidationPipe(RefundPaymentSchema))
  refund(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: RefundPaymentInput,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    return this.payments.refund(id, user.sub, body, idempotencyKey);
  }
}
