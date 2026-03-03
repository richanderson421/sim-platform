import Link from 'next/link';
import { prisma } from '@/lib/db';
export default async function DashboardPage() {
  const instances = await prisma.gameInstance.findMany({ include: { enrollments: true, rounds: true }, take: 20 });
  return <main className='p-8'><h1 className='text-2xl font-semibold'>Instructor Dashboard</h1><div className='mt-6 grid gap-4'>{instances.map((i) => <Link key={i.id} href={`/instances/${i.slug}`} className='rounded-xl border bg-white p-4'><div className='font-medium'>{i.title}</div><div className='text-sm text-slate-500'>{i.enrollments.length} students · {i.rounds.length} rounds · {i.status}</div></Link>)}</div></main>
}
