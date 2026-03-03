import { PrismaClient, SystemRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.user.upsert({ where: { email: 'admin@simhub.dev' }, update: {}, create: { email: 'admin@simhub.dev', name: 'Admin', systemRole: SystemRole.SYSTEM_ADMIN, passwordHash: await bcrypt.hash('admin1234', 10) } });
  const owner = await prisma.user.upsert({ where: { email: 'owner@simhub.dev' }, update: {}, create: { email: 'owner@simhub.dev', name: 'Owner', passwordHash: await bcrypt.hash('owner1234', 10) } });
  const gtA = await prisma.gameType.upsert({ where: { key: 'type-a' }, update: {}, create: { key: 'type-a', name: 'Game Type A', createdById: admin.id } });
  const vA = await prisma.gameTypeVersion.upsert({ where: { gameTypeId_versionNumber: { gameTypeId: gtA.id, versionNumber: 1 } }, update: {}, create: { gameTypeId: gtA.id, versionNumber: 1, createdById: admin.id, isPublished: true, roundCount: 2, configJson: { rounds: [{ roundNumber: 1, fields: [{ key:'a', label:'A', type:'number' },{ key:'b', label:'B', type:'number' },{ key:'c', label:'C', type:'number' }], scoring: { weights: { a:1,b:1,c:1 } } }, { roundNumber: 2, fields: [{ key:'a', label:'A', type:'number' },{ key:'b', label:'B', type:'number' },{ key:'c', label:'C', type:'number' }], scoring: { weights: { a:1.2,b:1,c:0.8 } } }] } } });
  const instance = await prisma.gameInstance.upsert({ where: { slug: 'econ-101-spring' }, update: {}, create: { slug: 'econ-101-spring', title: 'ECON 101 Spring', ownerId: owner.id, gameTypeVersionId: vA.id, status: 'ENROLLMENT_OPEN' } });
  await prisma.instanceSettings.upsert({ where: { gameInstanceId: instance.id }, update: {}, create: { gameInstanceId: instance.id } });
  await prisma.round.upsert({ where: { gameInstanceId_number: { gameInstanceId: instance.id, number: 1 } }, update: {}, create: { gameInstanceId: instance.id, number: 1, status: 'OPEN' } });
  await prisma.round.upsert({ where: { gameInstanceId_number: { gameInstanceId: instance.id, number: 2 } }, update: {}, create: { gameInstanceId: instance.id, number: 2, status: 'DRAFT' } });
}
main().finally(() => prisma.$disconnect());
