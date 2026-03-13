import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const adminName = process.env.SEED_ADMIN_NAME ?? 'Administrador Soil';
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@soil.local';
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'soil123456';

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  let farm = await prisma.farm.findFirst({
    where: { name: 'Fazenda Boa Terra' },
  });

  if (!farm) {
    farm = await prisma.farm.create({
      data: {
        name: 'Fazenda Boa Terra',
        latitude: -19.9167,
        longitude: -43.9345,
      },
    });
  }

  const pivots = [
    {
      name: 'Pivot Norte',
      code: 'pivot-norte',
      latitude: -19.9153,
      longitude: -43.9329,
      bladeAt100: 12,
    },
    {
      name: 'Pivot Sul',
      code: 'pivot-sul',
      latitude: -19.9189,
      longitude: -43.9364,
      bladeAt100: 10,
    },
  ];

  for (const pivot of pivots) {
    await prisma.pivot.upsert({
      where: { code: pivot.code },
      update: {
        ...pivot,
        farmId: farm.id,
        status: {
          code: pivot.code,
          isOn: false,
          direction: 'stopped',
          isIrrigating: false,
          percentimeter: 0,
          angle: 0,
          source: 'seed',
        },
      },
      create: {
        ...pivot,
        farmId: farm.id,
        status: {
          code: pivot.code,
          isOn: false,
          direction: 'stopped',
          isIrrigating: false,
          percentimeter: 0,
          angle: 0,
          source: 'seed',
        },
      },
    });
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
    await prisma.$disconnect();
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
