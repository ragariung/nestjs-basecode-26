import * as bcrypt from 'bcryptjs';
import { PrismaClient, RoleName } from '../../generated/postgres-client';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Homelab2026*';

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // SUPER_ADMIN is a single global role — tenantId is null, not tied to any tenant.
  // Postgres treats multiple NULLs as distinct under a unique index, so the
  // (tenantId, name) constraint can't dedupe this row; find-then-create instead.
  const superAdminRole =
    (await prisma.role.findFirst({ where: { name: RoleName.SUPER_ADMIN, tenantId: null } })) ??
    (await prisma.role.create({ data: { name: RoleName.SUPER_ADMIN, tenantId: null } }));

  await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      password: passwordHash,
      name: 'Super Admin',
      roleId: superAdminRole.id,
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: { name: 'Acme Corp', slug: 'acme' },
  });

  const tenantRoles: Record<Exclude<RoleName, 'SUPER_ADMIN'>, { id: string }> = {} as never;
  for (const name of [RoleName.ADMIN, RoleName.MANAGER, RoleName.SPV, RoleName.USER]) {
    tenantRoles[name] = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name } },
      update: {},
      create: { name, tenantId: tenant.id },
    });
  }

  const seedUsers: Array<{ email: string; name: string; role: RoleName }> = [
    { email: 'admin@acme.test', name: 'Acme Admin', role: RoleName.ADMIN },
    { email: 'manager@acme.test', name: 'Acme Manager', role: RoleName.MANAGER },
    { email: 'spv@acme.test', name: 'Acme Supervisor', role: RoleName.SPV },
    { email: 'user@acme.test', name: 'Acme User', role: RoleName.USER },
  ];

  for (const seedUser of seedUsers) {
    await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {},
      create: {
        email: seedUser.email,
        password: passwordHash,
        name: seedUser.name,
        roleId: tenantRoles[seedUser.role].id,
      },
    });
  }

  console.log('Seed complete. All seeded users share the password:', SEED_PASSWORD);
  console.log('  superadmin@example.com (SUPER_ADMIN, all tenants)');
  console.log('  admin@acme.test        (ADMIN, tenant: acme)');
  console.log('  manager@acme.test      (MANAGER, tenant: acme)');
  console.log('  spv@acme.test          (SPV, tenant: acme)');
  console.log('  user@acme.test         (USER, tenant: acme)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
