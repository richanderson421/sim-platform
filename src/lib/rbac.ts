import { InstanceRole, SystemRole } from '@prisma/client';
import { prisma } from './db';
export async function canAccessInstance(userId: string, instanceId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { systemRole: true } });
  if (user?.systemRole === SystemRole.SYSTEM_ADMIN) return true;
  return Boolean(await prisma.roleAssignment.findFirst({ where: { userId, instanceId, role: { in: [InstanceRole.OWNER, InstanceRole.TA, InstanceRole.PLAYER] } } }));
}
export async function canManageInstance(userId: string, instanceId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { systemRole: true } });
  if (user?.systemRole === SystemRole.SYSTEM_ADMIN) return true;
  return Boolean(await prisma.roleAssignment.findFirst({ where: { userId, instanceId, role: { in: [InstanceRole.OWNER, InstanceRole.TA] } } }));
}
