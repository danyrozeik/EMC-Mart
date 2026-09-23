import { computeEarnedPoints, LoyaltyService } from "./loyalty.service";

describe("computeEarnedPoints", () => {
  it("awards 1 RTI Point per EGP 10 spent", () => {
    expect(computeEarnedPoints(1000)).toBe(1);
    expect(computeEarnedPoints(12500)).toBe(12);
    expect(computeEarnedPoints(999)).toBe(0);
  });
});

describe("LoyaltyService.earnForTransaction", () => {
  function buildFakePrisma() {
    const entries: Array<{ id: string; customerId: string; type: string; points: number; transactionId?: string }> = [];
    let counter = 0;

    return {
      entries,
      loyaltyLedgerEntry: {
        findFirst: jest.fn(async ({ where }: { where: { transactionId?: string; type?: string } }) =>
          entries.find(
            (e) =>
              (where.transactionId === undefined || e.transactionId === where.transactionId) &&
              (where.type === undefined || e.type === where.type),
          ) ?? null,
        ),
        create: jest.fn(async ({ data }: { data: { customerId: string; type: string; points: number; transactionId?: string } }) => {
          const entry = { id: `entry_${++counter}`, ...data };
          entries.push(entry);
          return entry;
        }),
      },
    };
  }

  it("is idempotent: earning twice for the same transaction only credits once", async () => {
    const prisma = buildFakePrisma();
    const audit = { record: jest.fn() };
    const service = new LoyaltyService(prisma as never, audit as never);

    await service.earnForTransaction({ customerId: "c1", transactionId: "tx1", amountMinor: 125000 });
    await service.earnForTransaction({ customerId: "c1", transactionId: "tx1", amountMinor: 125000 });

    const earnEntries = prisma.entries.filter((e) => e.transactionId === "tx1" && e.type === "EARN");
    expect(earnEntries).toHaveLength(1);
    expect(earnEntries[0].points).toBe(125);
  });

  it("does not create an entry when the transaction earns zero points", async () => {
    const prisma = buildFakePrisma();
    const audit = { record: jest.fn() };
    const service = new LoyaltyService(prisma as never, audit as never);

    const result = await service.earnForTransaction({ customerId: "c1", transactionId: "tx2", amountMinor: 50 });

    expect(result).toBeNull();
    expect(prisma.entries).toHaveLength(0);
  });
});
