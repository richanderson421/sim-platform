import { prisma } from "@/lib/db";

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
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{gt.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">Key: {gt.key}</p>
                </div>
                <span className="status-badge">{gt.versions.length} versions</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
