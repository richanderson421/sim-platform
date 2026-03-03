import { prisma } from "@/lib/db";

export default async function InstancePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const instance = await prisma.gameInstance.findUnique({
    where: { slug },
    include: { rounds: true, enrollmentRequests: true },
  });

  if (!instance) return <main className="app-shell">Not found</main>;

  return (
    <main className="min-h-screen">
      <div className="app-shell">
        <h1 className="page-title">{instance.title}</h1>
        <p className="page-subtitle">Instance control center for roster approvals and round status.</p>

        <section className="card mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Enrollment Requests</h2>
            <span className="status-badge">{instance.enrollmentRequests.length} total</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {instance.enrollmentRequests.map((r) => (
              <li key={r.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                <span className="font-medium">{r.name}</span> ({r.email}) · <span className="font-semibold">{r.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Rounds</h2>
            <span className="status-badge">{instance.rounds.length} configured</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {instance.rounds.map((r) => (
              <li key={r.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                Round {r.number}: <span className="font-semibold">{r.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
