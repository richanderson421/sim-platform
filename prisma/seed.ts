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
        'Are you pricing near or away from the market average this month?',
        'Do staff and machine levels support likely demand without overspending?',
        'Is marketing spend proportional to your current cash position?',
      ],
      metricHints: {
        marketAveragePrice: 55,
        typicalCogsPerUnit: 18,
        staffingProductivityRule: 'Each machine is ideally staffed by ~3 team members; understaffing lowers machine efficiency.',
        machineryProductivityRule: 'Each machine provides base throughput; extra staff above ideal gives smaller efficiency gains unless machines increase.',
        fixedOverheadEstimate: 2200,
        payrollPerStaffEstimate: 700,
      },
    },
    fields: [
      { key: 'price', label: 'Unit Price ($)', type: 'number', min: 10, max: 120, description: 'Set customer-facing unit price.', impact: 'Higher price improves margin but usually lowers demand. Lower price can increase demand but squeeze margin.' },
      { key: 'staffDelta', label: 'Net Staff Change', type: 'number', min: -5, max: 10, description: 'How many staff to hire (positive) or reduce (negative).', impact: 'More staff increases capacity and payroll. Too few staff can constrain output and growth.' },
      { key: 'machinePurchase', label: 'New Machines to Buy', type: 'number', min: 0, max: 2, description: 'How many additional production machines to buy this month.', impact: 'Machines raise production capacity but require upfront capital expense.' },
      { key: 'marketing', label: 'Marketing Spend ($)', type: 'number', min: 0, max: 30000, description: 'Monthly demand generation spend.', impact: 'Can increase demand and brand strength, but reduces short-term profit.' },
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
