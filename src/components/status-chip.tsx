const styles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  ENROLLMENT_OPEN: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  ARCHIVED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  OPEN: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  CLOSED: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  DENIED: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  REVOKED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

export function StatusChip({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[value] ?? styles.DRAFT}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
