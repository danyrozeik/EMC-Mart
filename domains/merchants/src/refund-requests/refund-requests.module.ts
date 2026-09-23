import { Module } from "@nestjs/common";
import { MerchantsModule } from "../merchants/merchants.module";
import { RefundRequestsController } from "./refund-requests.controller";
import { RefundRequestsService } from "./refund-requests.service";

@Module({
  imports: [MerchantsModule],
  controllers: [RefundRequestsController],
  providers: [RefundRequestsService],
})
export class RefundRequestsModule {}
