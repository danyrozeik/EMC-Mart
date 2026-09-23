import { PrismaClient } from "../generated/prisma-client";
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
      id: "seed-customer-owner",
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
      id: "seed-customer-shopper",
      fullName: "Omar Khaled",
      phone: "+201000000002",
      email: "omar@example.com",
      passwordHash,
      kycStatus: "APPROVED",
      preferredLanguage: "en",
    },
  });

  console.log("Seed complete:", { admin: admin.email, owner: owner.phone, shopper: shopper.phone });
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
