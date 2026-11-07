import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../src/config/prisma.js";
import { UserRole } from "../src/generated/prisma/enums.js";

const seedEnvSchema = z.object({
  ADMIN_NAME: z.string().min(1),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(12),
});

const parsedEnv = seedEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Invalid administrator seed configuration: ${z.prettifyError(parsedEnv.error)}`,
  );
}

const seedEnv = parsedEnv.data;

async function main(): Promise<void> {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = seedEnv;
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: ADMIN_NAME, passwordHash, role: UserRole.ADMIN, isActive: true },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.info(`Administrator ${ADMIN_EMAIL} is ready.`);
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed the administrator:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
