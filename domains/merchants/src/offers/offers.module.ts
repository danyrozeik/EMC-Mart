import { Module } from "@nestjs/common";
import { MerchantsModule } from "../merchants/merchants.module";
import { OffersController } from "./offers.controller";
import { OffersService } from "./offers.service";

@Module({
  imports: [MerchantsModule],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
