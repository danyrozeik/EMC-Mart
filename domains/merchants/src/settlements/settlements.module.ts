import { Module } from "@nestjs/common";
import { MerchantsModule } from "../merchants/merchants.module";
import { SettlementsController } from "./settlements.controller";
import { SettlementsService } from "./settlements.service";

@Module({
  imports: [MerchantsModule],
  controllers: [SettlementsController],
  providers: [SettlementsService],
})
export class SettlementsModule {}
