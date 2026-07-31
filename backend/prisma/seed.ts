import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'password123';

async function main(): Promise<void> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const acme = await prisma.organization.upsert({
    where: { id: 'org_acme_demo' },
    update: {},
    create: { id: 'org_acme_demo', name: 'Acme Corp', featureFlags: { changeRequests: true } },
  });

  const users = [
    { id: 'user_acme_admin', name: 'Ada Admin', email: 'admin@acme.test', role: Role.ADMIN },
    {
      id: 'user_acme_manager',
      name: 'Mia Manager',
      email: 'manager@acme.test',
      role: Role.MANAGER,
    },
    { id: 'user_acme_finance', name: 'Fin Ance', email: 'finance@acme.test', role: Role.FINANCE },
    {
      id: 'user_acme_employee',
      name: 'Evan Employee',
      email: 'employee@acme.test',
      role: Role.EMPLOYEE,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { ...user, passwordHash, organizationId: acme.id },
    });
  }

  console.log(`Seeded organization "${acme.name}" with ${users.length} users.`);
  console.log(`Demo login password for all seeded users: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
