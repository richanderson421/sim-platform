import Link from "next/link";
import { GraduationCap, LayoutDashboard, ShieldCheck } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 md:px-8">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-cyan-500 text-white">
            <GraduationCap className="h-4 w-4" />
          </span>
          Sim Platform
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900">
            <ShieldCheck className="h-4 w-4" /> Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
