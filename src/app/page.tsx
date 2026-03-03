import Link from "next/link";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="app-shell py-14">
        <div className="card overflow-hidden">
          <div className="rounded-lg border border-indigo-100 bg-gradient-to-r from-indigo-50 via-cyan-50 to-violet-50 p-6 dark:border-indigo-900/40 dark:from-indigo-950/60 dark:via-cyan-950/30 dark:to-violet-950/40">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Sim Platform</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Instructional simulations, built for classrooms</h1>
            <p className="mt-3 max-w-2xl text-slate-700 dark:text-slate-300">
              Create game instances, manage enrollment approvals, run rounds, and export grading results in one clean workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-primary">Instructor Dashboard <ArrowRight className="ml-1 h-4 w-4" /></Link>
              <Link href="/admin" className="btn-secondary">Admin Console</Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"><Users className="h-4 w-4 text-cyan-600" /> Built for instructors + students</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Clear role boundaries, enrollment workflows, and roster controls.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"><ShieldCheck className="h-4 w-4 text-indigo-600" /> Designed for safe iteration</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Versioned game templates, auditable actions, and exportable outcomes.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
