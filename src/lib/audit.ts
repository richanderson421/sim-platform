import { prisma } from './db';
export async function audit(action: string, actorId?: string, gameInstanceId?: string, metadata?: unknown) {
  await prisma.auditLog.create({ data: { action, actorId, gameInstanceId, metadata: metadata as object | undefined } });
}
