import { PrismaClient } from "../generated/prisma-client";

const prisma = new PrismaClient();

/** Must match the seeded customer/transaction ids in the identity and payments services. */
const SHOPPER_CUSTOMER_ID = "seed-customer-shopper";
const TRANSACTION_ID = "seed-txn-1";

async function main() {
  const entry = await prisma.loyaltyLedgerEntry.upsert({
    where: { id: "seed-loyalty-1" },
    update: {},
    create: {
      id: "seed-loyalty-1",
      customerId: SHOPPER_CUSTOMER_ID,
      type: "EARN",
      points: 125,
      transactionId: TRANSACTION_ID,
      reason: "Eligible completed transaction",
    },
  });

  console.log("Seed complete:", { loyaltyEntry: entry.id, points: entry.points });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
