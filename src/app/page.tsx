import Link from 'next/link';
export default function Home() {
  return <main className='min-h-screen bg-slate-50 p-10'><div className='mx-auto max-w-4xl rounded-2xl bg-white p-10 shadow'><h1 className='text-3xl font-bold'>SimHub MVP</h1><p className='mt-3 text-slate-600'>Multi-tenant instructional simulation games platform.</p><div className='mt-8 flex gap-3'><Link href='/dashboard' className='rounded bg-slate-900 px-4 py-2 text-white'>Instructor Dashboard</Link><Link href='/admin' className='rounded border px-4 py-2'>Admin Console</Link></div></div></main>
}
