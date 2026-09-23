import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { AuthKitModule, JwtAuthGuard, RolesGuard } from "@rti/auth-kit";
import { PrismaModule } from "./prisma/prisma.module";
import { ClientsModule } from "./common/clients.module";
import { LoyaltyModule } from "./loyalty/loyalty.module";
import { InternalModule } from "./internal/internal.module";
import { AdminModule } from "./admin/admin.module";
import { ConsumerModule } from "./consumer/consumer.module";

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
    LoyaltyModule,
    InternalModule,
    AdminModule,
    ConsumerModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
