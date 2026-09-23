import { PrismaClient } from "../generated/prisma-client";

const prisma = new PrismaClient();

/** Must match the seeded customer ids in domains/identity/prisma/seed.ts. */
const OWNER_CUSTOMER_ID = "seed-customer-owner";

async function main() {
  const merchant = await prisma.merchant.upsert({
    where: { id: "seed-merchant-emc-mart" },
    update: {},
    create: {
      id: "seed-merchant-emc-mart",
      businessName: "EMC Mart",
      ownerCustomerId: OWNER_CUSTOMER_ID,
      category: "Grocery",
      kycStatus: "APPROVED",
    },
  });

  await prisma.settlement.upsert({
    where: { id: "seed-settlement-1" },
    update: {},
    create: {
      id: "seed-settlement-1",
      merchantId: merchant.id,
      periodStart: new Date("2026-09-01T00:00:00Z"),
      periodEnd: new Date("2026-09-07T23:59:59Z"),
      grossAmountMinor: 125000,
      feeAmountMinor: 2500,
      netAmountMinor: 122500,
      status: "PAID",
    },
  });

  await prisma.offer.upsert({
    where: { id: "seed-offer-1" },
    update: {},
    create: {
      id: "seed-offer-1",
      merchantId: merchant.id,
      title: "10% off first order",
      description: "Welcome offer for new RTI customers",
      discountPercent: 10,
    },
  });

  console.log("Seed complete:", { merchant: merchant.businessName });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
