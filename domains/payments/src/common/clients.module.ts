import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuditClient, ServiceClient } from "@rti/service-client";

export const MERCHANTS_CLIENT = Symbol("MERCHANTS_CLIENT");
export const LOYALTY_CLIENT = Symbol("LOYALTY_CLIENT");
export const AUDIT_CLIENT = Symbol("AUDIT_CLIENT");

/** Wires up outbound clients to the other domain services this service calls. */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MERCHANTS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new ServiceClient(
          config.getOrThrow<string>("MERCHANTS_SERVICE_URL"),
          config.getOrThrow<string>("INTERNAL_SERVICE_TOKEN"),
        ),
    },
    {
      provide: LOYALTY_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new ServiceClient(
          config.getOrThrow<string>("LOYALTY_SERVICE_URL"),
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
  exports: [MERCHANTS_CLIENT, LOYALTY_CLIENT, AUDIT_CLIENT],
})
export class ClientsModule {}
