import { ListChecks, UsersRound } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatusChip } from "@/components/status-chip";

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="page-title">{instance.title}</h1>
            <p className="page-subtitle">Instance control center for roster approvals and round status.</p>
          </div>
          <StatusChip value={instance.status} />
        </div>

        <section className="card mt-6">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"><UsersRound className="h-4 w-4" /> Enrollment Requests</h2>
            <span className="status-badge">{instance.enrollmentRequests.length} total</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {instance.enrollmentRequests.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <span><span className="font-medium">{r.name}</span> ({r.email})</span>
                <StatusChip value={r.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="card mt-6">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"><ListChecks className="h-4 w-4" /> Rounds</h2>
            <span className="status-badge">{instance.rounds.length} configured</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {instance.rounds.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <span>Round {r.number}</span>
                <StatusChip value={r.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
