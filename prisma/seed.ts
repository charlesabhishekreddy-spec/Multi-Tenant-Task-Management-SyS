import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: {},
    create: { name: "Acme Inc", slug: "acme" }
  });

  const adminHash = await hashPassword("Admin123!");
  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "admin@acme.com" } },
    update: {},
    create: {
      organizationId: org.id,
      email: "admin@acme.com",
      passwordHash: adminHash,
      name: "Acme Admin",
      role: Role.ADMIN
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
