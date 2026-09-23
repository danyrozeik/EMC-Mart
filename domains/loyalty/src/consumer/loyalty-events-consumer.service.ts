import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { LOYALTY_EVENTS_QUEUE, type LoyaltyOutboxEvent } from "@rti/shared";
import { LoyaltyService } from "../loyalty/loyalty.service";

const BLOCK_TIMEOUT_SECONDS = 5;

/**
 * Consumes payment-completed/refunded events published by the payments
 * service's transactional outbox, so loyalty crediting happens out-of-band
 * instead of inline with the payment request.
 */
@Injectable()
export class LoyaltyEventsConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LoyaltyEventsConsumerService.name);
  private readonly redis: Redis;
  private stopped = false;
  private loopPromise?: Promise<void>;

  constructor(
    private readonly loyalty: LoyaltyService,
    config: ConfigService,
  ) {
    this.redis = new Redis(config.getOrThrow<string>("REDIS_URL"), { lazyConnect: true });
  }

  onModuleInit() {
    this.loopPromise = this.run();
  }

  async onModuleDestroy() {
    this.stopped = true;
    await this.loopPromise;
    await this.redis.quit();
  }

  private async run() {
    while (!this.stopped) {
      try {
        const result = await this.redis.blpop(LOYALTY_EVENTS_QUEUE, BLOCK_TIMEOUT_SECONDS);
        if (!result) continue;
        const [, raw] = result;
        await this.handle(JSON.parse(raw) as LoyaltyOutboxEvent);
      } catch (error) {
        if (!this.stopped) {
          this.logger.error("Loyalty events consumer loop error", error as Error);
        }
      }
    }
  }

  private async handle(event: LoyaltyOutboxEvent) {
    if (event.type === "PAYMENT_COMPLETED") {
      await this.loyalty.earnForTransaction(event);
    } else if (event.type === "PAYMENT_REFUNDED") {
      await this.loyalty.reverseForTransaction(event.transactionId, event.customerId, event.reason);
    }
  }
}
