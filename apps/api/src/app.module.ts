import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { PrismaModule } from "./prisma/prisma.module";
import { AuditModule } from "./common/audit/audit.module";
import { IdempotencyModule } from "./common/idempotency/idempotency.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { RolesGuard } from "./auth/roles.guard";
import { CustomersModule } from "./customers/customers.module";
import { MerchantsModule } from "./merchants/merchants.module";
import { PaymentsModule } from "./payments/payments.module";
import { QrModule } from "./qr/qr.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { LoyaltyModule } from "./loyalty/loyalty.module";
import { RefundsModule } from "./refunds/refunds.module";
import { SettlementsModule } from "./settlements/settlements.module";
import { OffersModule } from "./offers/offers.module";
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
    AuditModule,
    IdempotencyModule,
    AuthModule,
    CustomersModule,
    MerchantsModule,
    PaymentsModule,
    QrModule,
    TransactionsModule,
    LoyaltyModule,
    RefundsModule,
    SettlementsModule,
    OffersModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
