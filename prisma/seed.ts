import { PrismaClient, SystemRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@simhub.dev' },
    update: {},
    create: {
      email: 'admin@simhub.dev',
      name: 'Admin',
      systemRole: SystemRole.SYSTEM_ADMIN,
      passwordHash: await bcrypt.hash('admin1234', 10),
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@simhub.dev' },
    update: {},
    create: {
      email: 'owner@simhub.dev',
      name: 'Owner',
      passwordHash: await bcrypt.hash('owner1234', 10),
    },
  });

  const gtA = await prisma.gameType.upsert({
    where: { key: 'type-a' },
    update: {},
    create: { key: 'type-a', name: 'Game Type A', createdById: admin.id },
  });

  const vA = await prisma.gameTypeVersion.upsert({
    where: { gameTypeId_versionNumber: { gameTypeId: gtA.id, versionNumber: 1 } },
    update: {},
    create: {
      gameTypeId: gtA.id,
      versionNumber: 1,
      createdById: admin.id,
      isPublished: true,
      roundCount: 2,
      configJson: {
        rounds: [
          { roundNumber: 1, fields: [{ key: 'a', label: 'A', type: 'number' }, { key: 'b', label: 'B', type: 'number' }, { key: 'c', label: 'C', type: 'number' }], scoring: { weights: { a: 1, b: 1, c: 1 } } },
          { roundNumber: 2, fields: [{ key: 'a', label: 'A', type: 'number' }, { key: 'b', label: 'B', type: 'number' }, { key: 'c', label: 'C', type: 'number' }], scoring: { weights: { a: 1.2, b: 1, c: 0.8 } } },
        ],
      },
    },
  });

  const gtBiz = await prisma.gameType.upsert({
    where: { key: 'business-12-month' },
    update: {},
    create: { key: 'business-12-month', name: 'Business Simulation (12-Month)', createdById: admin.id },
  });

  const bizRounds = Array.from({ length: 12 }, (_, i) => ({
    roundNumber: i + 1,
    fields: [
      { key: 'price', label: 'Unit Price ($)', type: 'number', min: 10, max: 120 },
      { key: 'production', label: 'Production Units', type: 'number', min: 0, max: 500 },
      { key: 'marketing', label: 'Marketing Spend ($)', type: 'number', min: 0, max: 30000 },
      { key: 'hiring', label: 'Net Hiring (can be negative)', type: 'number', min: -10, max: 20 },
      { key: 'rAndD', label: 'R&D Spend ($)', type: 'number', min: 0, max: 25000 },
      { key: 'borrow', label: 'Borrow Amount ($)', type: 'number', min: 0, max: 50000 },
      { key: 'repay', label: 'Debt Repayment ($)', type: 'number', min: 0, max: 50000 },
    ],
    scoring: { weights: { price: 1 } },
  }));

  const vBiz = await prisma.gameTypeVersion.upsert({
    where: { gameTypeId_versionNumber: { gameTypeId: gtBiz.id, versionNumber: 1 } },
    update: {},
    create: {
      gameTypeId: gtBiz.id,
      versionNumber: 1,
      createdById: admin.id,
      isPublished: true,
      roundCount: 12,
      configJson: {
        simulation: 'business12',
        rounds: bizRounds,
      },
    },
  });

  const instance = await prisma.gameInstance.upsert({
    where: { slug: 'econ-101-spring' },
    update: {},
    create: { slug: 'econ-101-spring', title: 'ECON 101 Spring', ownerId: owner.id, gameTypeVersionId: vA.id, status: 'ENROLLMENT_OPEN' },
  });

  const bizInstance = await prisma.gameInstance.upsert({
    where: { slug: 'biz-sim-12m' },
    update: {},
    create: { slug: 'biz-sim-12m', title: 'Business Simulation - 12 Months', ownerId: owner.id, gameTypeVersionId: vBiz.id, status: 'ENROLLMENT_OPEN' },
  });

  await prisma.instanceSettings.upsert({ where: { gameInstanceId: instance.id }, update: {}, create: { gameInstanceId: instance.id } });
  await prisma.instanceSettings.upsert({ where: { gameInstanceId: bizInstance.id }, update: {}, create: { gameInstanceId: bizInstance.id } });

  for (const n of [1, 2]) {
    await prisma.round.upsert({ where: { gameInstanceId_number: { gameInstanceId: instance.id, number: n } }, update: {}, create: { gameInstanceId: instance.id, number: n, status: n === 1 ? 'OPEN' : 'DRAFT' } });
  }

  for (let n = 1; n <= 12; n += 1) {
    await prisma.round.upsert({ where: { gameInstanceId_number: { gameInstanceId: bizInstance.id, number: n } }, update: {}, create: { gameInstanceId: bizInstance.id, number: n, status: n === 1 ? 'OPEN' : 'DRAFT' } });
  }

  console.log('Seed complete');
}

main().finally(() => prisma.$disconnect());
