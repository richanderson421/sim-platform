import { prisma } from '@/lib/db';
export default async function AdminPage() {
  const gameTypes = await prisma.gameType.findMany({ include: { versions: true } });
  return <main className='p-8'><h1 className='text-2xl font-semibold'>Admin Console</h1><div className='mt-4 space-y-3'>{gameTypes.map((gt) => <div key={gt.id} className='rounded border bg-white p-4'><div className='font-medium'>{gt.name}</div><div className='text-sm text-slate-500'>{gt.versions.length} versions</div></div>)}</div></main>
}
