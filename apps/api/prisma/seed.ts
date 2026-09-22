import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Passw0rd!", 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@rti.example" },
    update: {},
    create: { email: "admin@rti.example", passwordHash, role: "SUPER_ADMIN" },
  });

  const owner = await prisma.customer.upsert({
    where: { phone: "+201000000001" },
    update: {},
    create: {
      fullName: "Sara Ahmed",
      phone: "+201000000001",
      email: "sara@example.com",
      passwordHash,
      kycStatus: "APPROVED",
      preferredLanguage: "ar",
    },
  });

  const shopper = await prisma.customer.upsert({
    where: { phone: "+201000000002" },
    update: {},
    create: {
      fullName: "Omar Khaled",
      phone: "+201000000002",
      email: "omar@example.com",
      passwordHash,
      kycStatus: "APPROVED",
      preferredLanguage: "en",
    },
  });

  const merchant = await prisma.merchant.upsert({
    where: { id: "seed-merchant-emc-mart" },
    update: {},
    create: {
      id: "seed-merchant-emc-mart",
      businessName: "EMC Mart",
      ownerCustomerId: owner.id,
      category: "Grocery",
      kycStatus: "APPROVED",
    },
  });

  const transaction = await prisma.transaction.upsert({
    where: { idempotencyKey: "seed-txn-1" },
    update: {},
    create: {
      type: "QR_PAYMENT",
      customerId: shopper.id,
      merchantId: merchant.id,
      amountMinor: 125000,
      reference: "Grocery run",
      idempotencyKey: "seed-txn-1",
      providerPaymentId: "seed_provider_pay_1",
      status: "COMPLETED",
    },
  });

  await prisma.loyaltyLedgerEntry.upsert({
    where: { id: "seed-loyalty-1" },
    update: {},
    create: {
      id: "seed-loyalty-1",
      customerId: shopper.id,
      type: "EARN",
      points: 125,
      transactionId: transaction.id,
      reason: "Eligible completed transaction",
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

  console.log("Seed complete:", {
    admin: admin.email,
    owner: owner.phone,
    shopper: shopper.phone,
    merchant: merchant.businessName,
  });
  console.log("All seeded users share the password: Passw0rd!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
