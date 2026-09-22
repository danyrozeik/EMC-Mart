import { Module } from "@nestjs/common";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { MerchantsModule } from "../merchants/merchants.module";
import { PaymentOrchestrator } from "./payment-orchestrator";
import { PAYMENT_PROVIDER } from "./payment-provider";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { MockPaymentProvider } from "./providers/mock-payment-provider";

@Module({
  imports: [LoyaltyModule, MerchantsModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentOrchestrator,
    { provide: PAYMENT_PROVIDER, useClass: MockPaymentProvider },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
