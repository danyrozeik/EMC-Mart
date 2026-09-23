import { Module } from "@nestjs/common";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { AdminController } from "./admin.controller";

@Module({
  imports: [LoyaltyModule],
  controllers: [AdminController],
})
export class AdminModule {}
