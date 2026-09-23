import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { LOYALTY_EVENTS_QUEUE } from "@rti/shared";
import { PrismaService } from "../prisma/prisma.service";

const POLL_INTERVAL_MS = 2000;
const BATCH_SIZE = 20;

/**
 * Publishes PENDING OutboxEvent rows to Redis on a timer, independently of
 * the request that created them. A slow or unavailable loyalty service can
 * never slow down or fail a payment: the outbox row already committed in
 * the same DB transaction as the payment, and this dispatcher retries the
 * Redis publish on its own schedule.
 */
@Injectable()
export class OutboxDispatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxDispatcherService.name);
  private readonly redis: Redis;
  private timer?: NodeJS.Timeout;
  private dispatching = false;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.redis = new Redis(config.getOrThrow<string>("REDIS_URL"), { lazyConnect: true });
  }

  onModuleInit() {
    this.timer = setInterval(() => void this.dispatchOnce(), POLL_INTERVAL_MS);
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.redis.quit();
  }

  private async dispatchOnce() {
    if (this.dispatching) return;
    this.dispatching = true;
    try {
      const pending = await this.prisma.outboxEvent.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: BATCH_SIZE,
      });

      for (const row of pending) {
        try {
          await this.redis.rpush(LOYALTY_EVENTS_QUEUE, JSON.stringify(row.payload));
          await this.prisma.outboxEvent.update({
            where: { id: row.id },
            data: { status: "SENT", processedAt: new Date() },
          });
        } catch (error) {
          await this.prisma.outboxEvent.update({
            where: { id: row.id },
            data: { attempts: { increment: 1 }, lastError: (error as Error).message },
          });
        }
      }
    } catch (error) {
      this.logger.error("Outbox dispatch loop failed", error as Error);
    } finally {
      this.dispatching = false;
    }
  }
}
