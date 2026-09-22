import { ConflictException, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  hashPayload(payload: unknown): string {
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  }

  /**
   * Runs `execute` at most once for a given idempotency key + scope.
   * Concurrent/replayed requests with a matching payload hash receive the
   * original response instead of re-executing side effects.
   */
  async withIdempotency<T>(
    key: string,
    scope: string,
    requestPayload: unknown,
    execute: () => Promise<{ statusCode: number; body: T }>,
  ): Promise<{ statusCode: number; body: T; replayed: boolean }> {
    const requestHash = this.hashPayload(requestPayload);

    const existing = await this.prisma.idempotencyRecord.findUnique({ where: { key } });
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException(
          `Idempotency-Key "${key}" was already used with a different request payload`,
        );
      }
      if (existing.statusCode !== null && existing.responseBody !== null) {
        return { statusCode: existing.statusCode, body: existing.responseBody as T, replayed: true };
      }
      throw new ConflictException(`Request with Idempotency-Key "${key}" is still in progress`);
    }

    try {
      await this.prisma.idempotencyRecord.create({
        data: { key, scope, requestHash },
      });
    } catch {
      throw new ConflictException(`Request with Idempotency-Key "${key}" is already in progress`);
    }

    const result = await execute();

    await this.prisma.idempotencyRecord.update({
      where: { key },
      data: { statusCode: result.statusCode, responseBody: result.body as never },
    });

    return { ...result, replayed: false };
  }
}
