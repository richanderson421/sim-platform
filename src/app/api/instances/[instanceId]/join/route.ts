import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest, context: { params: Promise<{ instanceId: string }> }) {
  const { instanceId } = await context.params;
  const { email, name, studentId } = await req.json();
  if (!email || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const settings = await prisma.instanceSettings.findUnique({ where: { gameInstanceId: instanceId } });
  const enrollment = await prisma.enrollmentRequest.create({ data: { gameInstanceId: instanceId, email, name, studentId, status: settings?.autoApproveEnrollments ? 'APPROVED' : 'PENDING' } });
  return NextResponse.json({ ok: true, requestId: enrollment.id });
}
