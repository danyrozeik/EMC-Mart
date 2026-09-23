import { Module } from "@nestjs/common";
import { InternalController } from "./internal.controller";
import { InternalRefundRequestsService } from "./internal-refund-requests.service";

@Module({
  controllers: [InternalController],
  providers: [InternalRefundRequestsService],
})
export class InternalModule {}
