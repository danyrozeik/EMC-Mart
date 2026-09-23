import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuditClient, ServiceClient } from "@rti/service-client";

export const PAYMENTS_CLIENT = Symbol("PAYMENTS_CLIENT");
export const AUDIT_CLIENT = Symbol("AUDIT_CLIENT");

/** Wires up outbound clients to the other domain services this service calls. */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PAYMENTS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new ServiceClient(
          config.getOrThrow<string>("PAYMENTS_SERVICE_URL"),
          config.getOrThrow<string>("INTERNAL_SERVICE_TOKEN"),
        ),
    },
    {
      provide: AUDIT_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new AuditClient(
          config.getOrThrow<string>("IDENTITY_SERVICE_URL"),
          config.getOrThrow<string>("INTERNAL_SERVICE_TOKEN"),
        ),
    },
  ],
  exports: [PAYMENTS_CLIENT, AUDIT_CLIENT],
})
export class ClientsModule {}
