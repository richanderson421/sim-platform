import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateSubmission, evaluateSubmission } from '@/lib/engine/config-engine';
import { canAccessInstance } from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
export async function POST(req: NextRequest, context: { params: Promise<{ instanceId: string; roundId: string }> }) {
  const session = await auth(); if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } }); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { instanceId, roundId } = await context.params; if (!(await canAccessInstance(user.id, instanceId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const round = await prisma.round.findUnique({ where: { id: roundId }, include: { gameInstance: { include: { gameTypeVersion: true } } } });
  if (!round || round.status !== 'OPEN') return NextResponse.json({ error: 'Round not open' }, { status: 400 });
  const payload = validateSubmission(round.gameInstance.gameTypeVersion.configJson, round.number, await req.json());
  const jsonPayload = payload as Prisma.InputJsonValue;
  await prisma.decisionSubmission.upsert({ where: { roundId_userId: { roundId, userId: user.id } }, update: { payload: jsonPayload }, create: { roundId, userId: user.id, gameInstanceId: instanceId, payload: jsonPayload } });
  const result = evaluateSubmission(round.gameInstance.gameTypeVersion.configJson, round.number, payload as Record<string, unknown>);
  await prisma.result.create({ data: { gameInstanceId: instanceId, roundId, userId: user.id, score: result.score, details: result } });
  return NextResponse.json({ ok: true, score: result.score });
}
