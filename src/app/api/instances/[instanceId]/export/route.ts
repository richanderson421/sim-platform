import { auth } from '@/lib/auth';
import { toCsv } from '@/lib/csv';
import { prisma } from '@/lib/db';
import { canManageInstance } from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest, context: { params: Promise<{ instanceId: string }> }) {
  const session = await auth(); if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } }); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { instanceId } = await context.params; if (!(await canManageInstance(user.id, instanceId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const kind = req.nextUrl.searchParams.get('kind') ?? 'roster';
  if (kind === 'roster') { const rows = await prisma.enrollment.findMany({ where: { gameInstanceId: instanceId }, include: { user: true } }); return new NextResponse(toCsv(rows.map(r => ({ email: r.user.email, name: r.user.name, status: r.status }))), { headers: { 'content-type': 'text/csv' } }); }
  const rows = await prisma.result.findMany({ where: { gameInstanceId: instanceId }, include: { user: true, round: true } });
  return new NextResponse(toCsv(rows.map(r => ({ round: r.round.number, email: r.user?.email, score: r.score }))), { headers: { 'content-type': 'text/csv' } });
}
