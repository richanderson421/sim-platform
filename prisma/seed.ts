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

  const monthlyScenarios = [
    'Launch month: early adopters are curious but price sensitive.',
    'Customer reviews begin shaping demand and trust.',
    'A competitor enters with discount pricing.',
    'Spring demand rises as market activity increases.',
    'Input costs tick up; margin control matters.',
    'Mid-year slowdown: demand softens unless marketing is strong.',
    'Operational strain month: fulfillment reliability is critical.',
    'Back-to-school bump creates new demand opportunities.',
    'Market saturation risk: differentiation starts to matter.',
    'Promotional season begins with aggressive competitor campaigns.',
    'Budget pressure month: debt and cash flow discipline are key.',
    'Year-end push: maximize performance while avoiding stockouts.',
  ];

  const actorProfiles = [
    { name: 'ValueCo', description: 'Low-price rival that wins highly price-sensitive buyers.', likelyMove: 'May cut prices if you raise yours aggressively.' },
    { name: 'PremiumPlus', description: 'Quality-focused competitor with strong brand loyalty.', likelyMove: 'Will outspend on branding when customer sentiment weakens.' },
    { name: 'SupplyHub', description: 'Key upstream supplier affected by seasonal constraints.', likelyMove: 'Costs and lead-times become volatile during peak demand months.' },
  ];

  const bizRounds = Array.from({ length: 12 }, (_, i) => ({
    roundNumber: i + 1,
    scenario: monthlyScenarios[i],
    briefing: {
      background: `Month ${i + 1}: ${monthlyScenarios[i]} Your objective is to grow sustainable profit while protecting cash flow and avoiding operational instability.`,
      marketActors: actorProfiles,
      focusQuestions: [
        'Are you pricing for volume, margin, or a balanced position?',
        'Can your production and staffing support expected demand?',
        'Are borrowing/repayment choices improving long-term resilience?',
      ],
    },
    fields: [
      { key: 'price', label: 'Unit Price ($)', type: 'number', min: 10, max: 120, description: 'Set customer-facing unit price.', impact: 'Higher price improves margin but may reduce demand.' },
      { key: 'production', label: 'Production Units', type: 'number', min: 0, max: 500, description: 'How many units to produce this month.', impact: 'Too little can cause stockouts; too much increases inventory carrying risk.' },
      { key: 'marketing', label: 'Marketing Spend ($)', type: 'number', min: 0, max: 30000, description: 'Monthly demand generation spend.', impact: 'Increases demand and supports brand growth, but reduces short-term profit.' },
      { key: 'hiring', label: 'Net Hiring (can be negative)', type: 'number', min: -10, max: 20, description: 'Adjust workforce up or down.', impact: 'More staff supports operations but increases payroll burden.' },
      { key: 'rAndD', label: 'R&D Spend ($)', type: 'number', min: 0, max: 25000, description: 'Product/process improvement investment.', impact: 'Improves long-term brand strength and competitiveness.' },
      { key: 'borrow', label: 'Borrow Amount ($)', type: 'number', min: 0, max: 50000, description: 'Additional debt financing this month.', impact: 'Boosts liquidity now, increases interest/debt burden later.' },
      { key: 'repay', label: 'Debt Repayment ($)', type: 'number', min: 0, max: 50000, description: 'Debt paydown amount this month.', impact: 'Reduces future financing costs but lowers immediate cash reserves.' },
    ],
    scoring: { weights: { price: 1 } },
  }));

  const vBiz = await prisma.gameTypeVersion.upsert({
    where: { gameTypeId_versionNumber: { gameTypeId: gtBiz.id, versionNumber: 1 } },
    update: {
      roundCount: 12,
      isPublished: true,
      configJson: {
        simulation: 'business12',
        rounds: bizRounds,
      },
    },
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
