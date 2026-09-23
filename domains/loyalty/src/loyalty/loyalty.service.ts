import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { AuditClient } from "@rti/service-client";
import { PrismaService } from "../prisma/prisma.service";
import { AUDIT_CLIENT } from "../common/clients.module";

/** 1 RTI Point earned per EGP 10.00 (1000 minor units) spent on an eligible transaction. */
const EARN_RATE_MINOR_PER_POINT = 1000;

export function computeEarnedPoints(amountMinor: number): number {
  return Math.floor(amountMinor / EARN_RATE_MINOR_PER_POINT);
}

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUDIT_CLIENT) private readonly audit: AuditClient,
  ) {}

  async getBalance(customerId: string): Promise<number> {
    const entries = await this.prisma.loyaltyLedgerEntry.findMany({
      where: { customerId },
      select: { type: true, points: true },
    });
    return entries.reduce((total, entry) => total + this.signedPoints(entry.type, entry.points), 0);
  }

  async getLedger(customerId: string, take = 50, skip = 0) {
    return this.prisma.loyaltyLedgerEntry.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
  }

  /**
   * Earns RTI Points for an eligible COMPLETED transaction. Idempotent per
   * transaction: calling this more than once for the same transaction never
   * double-credits the customer.
   */
  async earnForTransaction(input: { customerId: string; transactionId: string; amountMinor: number }) {
    const alreadyEarned = await this.prisma.loyaltyLedgerEntry.findFirst({
      where: { transactionId: input.transactionId, type: "EARN" },
    });
    if (alreadyEarned) {
      return alreadyEarned;
    }

    const points = computeEarnedPoints(input.amountMinor);
    if (points <= 0) {
      return null;
    }

    const entry = await this.prisma.loyaltyLedgerEntry.create({
      data: {
        customerId: input.customerId,
        type: "EARN",
        points,
        transactionId: input.transactionId,
        reason: "Eligible completed transaction",
      },
    });

    await this.audit.record({
      actorType: "SYSTEM",
      actorId: "loyalty-engine",
      action: "LOYALTY_EARNED",
      targetType: "Customer",
      targetId: input.customerId,
      metadata: { transactionId: input.transactionId, points },
    });

    return entry;
  }

  /** Reverses previously earned points when a transaction is refunded. */
  async reverseForTransaction(transactionId: string, customerId: string, reason: string) {
    const earned = await this.prisma.loyaltyLedgerEntry.findFirst({
      where: { transactionId, type: "EARN" },
    });
    if (!earned) {
      return null;
    }

    return this.prisma.loyaltyLedgerEntry.create({
      data: {
        customerId,
        type: "ADJUST",
        points: -earned.points,
        transactionId,
        reason,
      },
    });
  }

  async redeem(customerId: string, points: number, reason?: string) {
    if (!Number.isInteger(points) || points <= 0) {
      throw new BadRequestException("Points to redeem must be a positive integer");
    }

    const balance = await this.getBalance(customerId);
    if (balance < points) {
      throw new BadRequestException("Insufficient RTI Points balance");
    }

    const entry = await this.prisma.loyaltyLedgerEntry.create({
      data: { customerId, type: "REDEEM", points, reason },
    });

    await this.audit.record({
      actorType: "CUSTOMER",
      actorId: customerId,
      action: "LOYALTY_REDEEMED",
      targetType: "Customer",
      targetId: customerId,
      metadata: { points, reason },
    });

    return entry;
  }

  async adjust(customerId: string, points: number, reason: string, actorId: string) {
    if (!Number.isInteger(points) || points === 0) {
      throw new BadRequestException("Adjustment points must be a non-zero integer");
    }

    const entry = await this.prisma.loyaltyLedgerEntry.create({
      data: { customerId, type: "ADJUST", points, reason },
    });

    await this.audit.record({
      actorType: "ADMIN",
      actorId,
      action: "LOYALTY_ADJUSTED",
      targetType: "Customer",
      targetId: customerId,
      metadata: { points, reason },
    });

    return entry;
  }

  private signedPoints(type: string, points: number): number {
    switch (type) {
      case "EARN":
        return Math.abs(points);
      case "REDEEM":
      case "EXPIRE":
        return -Math.abs(points);
      case "ADJUST":
        return points;
      default:
        return 0;
    }
  }
}
