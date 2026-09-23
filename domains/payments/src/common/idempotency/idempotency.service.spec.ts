import { ConflictException } from "@nestjs/common";
import { IdempotencyService } from "./idempotency.service";

interface FakeRecord {
  key: string;
  scope: string;
  requestHash: string;
  statusCode: number | null;
  responseBody: unknown;
}

function buildFakePrisma() {
  const store = new Map<string, FakeRecord>();

  return {
    store,
    idempotencyRecord: {
      findUnique: jest.fn(async ({ where: { key } }: { where: { key: string } }) => store.get(key) ?? null),
      create: jest.fn(async ({ data }: { data: Omit<FakeRecord, "statusCode" | "responseBody"> }) => {
        if (store.has(data.key)) {
          throw new Error("unique constraint violation");
        }
        const record: FakeRecord = { ...data, statusCode: null, responseBody: null };
        store.set(data.key, record);
        return record;
      }),
      update: jest.fn(
        async ({ where: { key }, data }: { where: { key: string }; data: Partial<FakeRecord> }) => {
          const record = store.get(key);
          if (!record) throw new Error("not found");
          Object.assign(record, data);
          return record;
        },
      ),
    },
  };
}

describe("IdempotencyService", () => {
  it("executes the side effect exactly once for a given key", async () => {
    const prisma = buildFakePrisma();
    const service = new IdempotencyService(prisma as never);
    const execute = jest.fn().mockResolvedValue({ statusCode: 201, body: { id: "tx_1" } });

    const first = await service.withIdempotency("key-1", "payments.pay", { amount: 100 }, execute);
    const second = await service.withIdempotency("key-1", "payments.pay", { amount: 100 }, execute);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.body).toEqual({ id: "tx_1" });
  });

  it("rejects a reused key with a different payload", async () => {
    const prisma = buildFakePrisma();
    const service = new IdempotencyService(prisma as never);
    const execute = jest.fn().mockResolvedValue({ statusCode: 201, body: {} });

    await service.withIdempotency("key-1", "payments.pay", { amount: 100 }, execute);

    await expect(
      service.withIdempotency("key-1", "payments.pay", { amount: 200 }, execute),
    ).rejects.toThrow(ConflictException);
  });
});
