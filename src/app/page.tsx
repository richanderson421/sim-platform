import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="app-shell py-14">
        <div className="card overflow-hidden">
          <div className="rounded-lg border border-indigo-100 bg-gradient-to-r from-indigo-50 via-cyan-50 to-violet-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Sim Platform</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">Instructional simulations, built for classrooms</h1>
            <p className="mt-3 max-w-2xl text-slate-700">
              Create game instances, manage enrollment approvals, run rounds, and export grading results in one clean workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-primary">Instructor Dashboard</Link>
              <Link href="/admin" className="btn-secondary">Admin Console</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
