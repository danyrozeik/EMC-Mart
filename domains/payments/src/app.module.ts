import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { AuthKitModule, JwtAuthGuard, RolesGuard } from "@rti/auth-kit";
import { PrismaModule } from "./prisma/prisma.module";
import { IdempotencyModule } from "./common/idempotency/idempotency.module";
import { ClientsModule } from "./common/clients.module";
import { PaymentsModule } from "./payments/payments.module";
import { QrModule } from "./qr/qr.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { AdminModule } from "./admin/admin.module";
import { InternalModule } from "./internal/internal.module";

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
    IdempotencyModule,
    ClientsModule,
    AuthKitModule,
    PaymentsModule,
    QrModule,
    TransactionsModule,
    AdminModule,
    InternalModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
