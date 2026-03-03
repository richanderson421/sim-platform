export function VersionBadge() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_APP_VERSION || "dev";
  const short = sha === "dev" ? sha : sha.slice(0, 7);

  return (
    <div className="fixed bottom-3 right-3 z-50 rounded-full border border-slate-300 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
      v {short}
    </div>
  );
}
