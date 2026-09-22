import { Module } from "@nestjs/common";
import { MerchantsModule } from "../merchants/merchants.module";
import { QrController } from "./qr.controller";
import { QrService } from "./qr.service";

@Module({
  imports: [MerchantsModule],
  controllers: [QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
