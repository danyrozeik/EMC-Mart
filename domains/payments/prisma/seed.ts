import { PrismaClient } from "../generated/prisma-client";

const prisma = new PrismaClient();

/** Must match the seeded customer/merchant ids in the identity and merchants services. */
const SHOPPER_CUSTOMER_ID = "seed-customer-shopper";
const MERCHANT_ID = "seed-merchant-emc-mart";

async function main() {
  const transaction = await prisma.transaction.upsert({
    where: { idempotencyKey: "seed-txn-1" },
    update: {},
    create: {
      id: "seed-txn-1",
      type: "QR_PAYMENT",
      customerId: SHOPPER_CUSTOMER_ID,
      merchantId: MERCHANT_ID,
      amountMinor: 125000,
      reference: "Grocery run",
      idempotencyKey: "seed-txn-1",
      providerPaymentId: "seed_provider_pay_1",
      status: "COMPLETED",
    },
  });

  console.log("Seed complete:", { transaction: transaction.id });
  console.log(
    "Note: this seeds the payments DB only — the matching RTI Points EARN entry must be seeded via the loyalty service's own seed script.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
