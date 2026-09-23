import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { AuthKitModule, JwtAuthGuard, RolesGuard } from "@rti/auth-kit";
import { PrismaModule } from "./prisma/prisma.module";
import { ClientsModule } from "./common/clients.module";
import { MerchantsModule } from "./merchants/merchants.module";
import { OffersModule } from "./offers/offers.module";
import { SettlementsModule } from "./settlements/settlements.module";
import { RefundRequestsModule } from "./refund-requests/refund-requests.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        redact: ["req.headers.authorization"],
      },
    }),
    PrismaModule,
    ClientsModule,
    AuthKitModule,
    MerchantsModule,
    OffersModule,
    SettlementsModule,
    RefundRequestsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
