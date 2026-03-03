import Link from "next/link";
import { prisma } from "@/lib/db";

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
                  <div className="text-lg font-semibold text-slate-900">{i.title}</div>
                  <div className="mt-2 text-sm text-slate-600">
                    {i.enrollments.length} students · {i.rounds.length} rounds
                  </div>
                </div>
                <span className="status-badge">{i.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
