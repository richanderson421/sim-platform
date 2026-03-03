import { prisma } from '@/lib/db';
export default async function InstancePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const instance = await prisma.gameInstance.findUnique({ where: { slug }, include: { rounds: true, enrollmentRequests: true } });
  if (!instance) return <main className='p-8'>Not found</main>;
  return <main className='p-8 max-w-5xl mx-auto'><h1 className='text-2xl font-semibold'>{instance.title}</h1><section className='mt-6 rounded-xl border bg-white p-4'><h2 className='font-medium'>Requests</h2><ul className='mt-2 space-y-2 text-sm'>{instance.enrollmentRequests.map(r => <li key={r.id}>{r.name} ({r.email}) - {r.status}</li>)}</ul></section><section className='mt-6 rounded-xl border bg-white p-4'><h2 className='font-medium'>Rounds</h2><ul className='mt-2 space-y-2 text-sm'>{instance.rounds.map(r => <li key={r.id}>Round {r.number}: {r.status}</li>)}</ul></section></main>
}
