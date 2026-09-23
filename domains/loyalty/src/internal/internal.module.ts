import { Module } from "@nestjs/common";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { InternalController } from "./internal.controller";

@Module({
  imports: [LoyaltyModule],
  controllers: [InternalController],
})
export class InternalModule {}
