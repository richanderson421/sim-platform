export function Toast({ kind, message }: { kind: "success" | "error" | "warning"; message: string }) {
  const styles: Record<string, string> = {
    success: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
    error: "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
    warning: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  };

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${styles[kind]}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
