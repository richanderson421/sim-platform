import { auth } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { canManageInstance } from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest, context: { params: Promise<{ requestId: string }> }) {
  const session = await auth(); if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } }); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { requestId } = await context.params; const { decision, reason } = await req.json();
  const request = await prisma.enrollmentRequest.findUnique({ where: { id: requestId } }); if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!(await canManageInstance(user.id, request.gameInstanceId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const updated = await prisma.enrollmentRequest.update({ where: { id: requestId }, data: { status: decision, deniedReason: reason, reviewedById: user.id, reviewedAt: new Date() } });
  await audit('ENROLLMENT_DECISION', user.id, request.gameInstanceId, { requestId, decision });
  return NextResponse.json({ ok: true, request: updated });
}
