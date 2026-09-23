import { Module } from "@nestjs/common";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { LoyaltyEventsConsumerService } from "./loyalty-events-consumer.service";

@Module({
  imports: [LoyaltyModule],
  providers: [LoyaltyEventsConsumerService],
})
export class ConsumerModule {}
