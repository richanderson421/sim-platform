import { Sparkles, GitBranchPlus } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatusChip } from "@/components/status-chip";

export default async function AdminPage() {
  const gameTypes = await prisma.gameType.findMany({ include: { versions: true } });

  return (
    <main className="min-h-screen">
      <div className="app-shell">
        <h1 className="page-title">Admin Console</h1>
        <p className="page-subtitle">Define reusable game templates and publish immutable versions.</p>

        <div className="mt-6 space-y-4">
          {gameTypes.map((gt) => (
            <div key={gt.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{gt.name}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Key: {gt.key}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1"><GitBranchPlus className="h-3.5 w-3.5" /> {gt.versions.length} versions</span>
                    <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> template family</span>
                  </div>
                </div>
                <StatusChip value="IN_PROGRESS" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
