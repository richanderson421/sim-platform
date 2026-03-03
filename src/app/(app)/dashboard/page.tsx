import Link from "next/link";
import { BarChart3, Users, Layers } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatusChip } from "@/components/status-chip";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const instances = await prisma.gameInstance.findMany({
    include: { enrollments: true, rounds: true },
    take: 20,
  });

  return (
    <main className="min-h-screen">
      <div className="app-shell">
        <h1 className="page-title">Instructor Dashboard</h1>
        <p className="page-subtitle">Manage your simulation instances and monitor participation.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {instances.map((i) => (
            <Link key={i.id} href={`/instances/${i.slug}`} className="card transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{i.title}</div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {i.enrollments.length} students</span>
                    <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {i.rounds.length} rounds</span>
                    <span className="inline-flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> active sim</span>
                  </div>
                </div>
                <StatusChip value={i.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
