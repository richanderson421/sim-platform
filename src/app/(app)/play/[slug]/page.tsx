import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { evaluateSubmission, validateSubmission } from "@/lib/engine/config-engine";
import { initialBusinessState } from "@/lib/engine/business-sim";

async function submitDecision(formData: FormData) {
  "use server";
  const slug = String(formData.get("slug") || "");
  const studentEmail = String(formData.get("studentEmail") || "").trim().toLowerCase();
  if (!slug || !studentEmail) return;

  const instance = await prisma.gameInstance.findUnique({ where: { slug }, include: { rounds: true, gameTypeVersion: true } });
  if (!instance) return;

  const user = await prisma.user.findUnique({ where: { email: studentEmail } });
  if (!user) return;

  const enrollment = await prisma.enrollment.findFirst({ where: { gameInstanceId: instance.id, userId: user.id, status: "APPROVED" } });
  if (!enrollment) return;

  const openRound = instance.rounds.find((r) => r.status === "OPEN");
  if (!openRound) return;

  const roundDef = (instance.gameTypeVersion.configJson as { rounds: { roundNumber: number; fields: { key: string }[] }[] }).rounds.find((r) => r.roundNumber === openRound.number);
  if (!roundDef) return;

  const payload: Record<string, unknown> = {};
  for (const field of roundDef.fields) {
    payload[field.key] = formData.get(field.key);
  }

  const validated = validateSubmission(instance.gameTypeVersion.configJson, openRound.number, payload);
  const jsonPayload = validated as Prisma.InputJsonValue;

  await prisma.decisionSubmission.upsert({
    where: { roundId_userId: { roundId: openRound.id, userId: user.id } },
    update: { payload: jsonPayload, submittedAt: new Date() },
    create: { gameInstanceId: instance.id, roundId: openRound.id, userId: user.id, payload: jsonPayload },
  });

  const score = evaluateSubmission(instance.gameTypeVersion.configJson, openRound.number, validated as Record<string, unknown>);
  await prisma.result.create({ data: { gameInstanceId: instance.id, roundId: openRound.id, userId: user.id, score: score.score, details: score } });

  revalidatePath(`/play/${slug}?student=${encodeURIComponent(studentEmail)}`);
}

export default async function PlayPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ student?: string }> }) {
  const { slug } = await params;
  const { student } = await searchParams;
  const studentEmail = (student || "").trim().toLowerCase();

  const instance = await prisma.gameInstance.findUnique({ where: { slug }, include: { rounds: { orderBy: { number: "asc" } }, gameTypeVersion: true } });
  if (!instance) return <main className="app-shell">Game not found.</main>;

  const user = studentEmail ? await prisma.user.findUnique({ where: { email: studentEmail } }) : null;
  const enrollment = user ? await prisma.enrollment.findFirst({ where: { gameInstanceId: instance.id, userId: user.id, status: "APPROVED" } }) : null;
  const openRound = instance.rounds.find((r) => r.status === "OPEN");

  const config = instance.gameTypeVersion.configJson as {
    rounds: {
      roundNumber: number;
      scenario?: string;
      briefing?: {
        background?: string;
        marketActors?: { name: string; description: string; likelyMove: string }[];
        focusQuestions?: string[];
        metricHints?: {
          marketAveragePrice?: number;
          typicalCogsPerUnit?: number;
          staffingProductivityRule?: string;
          machineryProductivityRule?: string;
        };
      };
      fields: {
        key: string;
        label: string;
        type: string;
        options?: { label: string; value: string }[];
        description?: string;
        impact?: string;
      }[];
    }[];
  };
  const currentDef = openRound ? config.rounds.find((r) => r.roundNumber === openRound.number) : null;

  const progress = user
    ? await prisma.result.findMany({ where: { gameInstanceId: instance.id, userId: user.id }, include: { round: true }, orderBy: { round: { number: "asc" } } })
    : [];

  const latestState = (progress.at(-1)?.details as { state?: typeof initialBusinessState } | null)?.state ?? initialBusinessState;
  const recentKpis = progress
    .map((p) => (p.details as { kpis?: { unitsSold?: number; employees?: number; machines?: number; cogsPerUnit?: number; avgMarketPrice?: number } } | null)?.kpis)
    .filter(Boolean) as { unitsSold?: number; employees?: number; machines?: number; cogsPerUnit?: number; avgMarketPrice?: number }[];

  const avgProductivity = recentKpis.length
    ? recentKpis.reduce((acc, k) => acc + ((k.unitsSold ?? 0) / Math.max(1, k.employees ?? 1)), 0) / recentKpis.length
    : null;

  const avgMachineOutput = recentKpis.length
    ? recentKpis.reduce((acc, k) => acc + ((k.unitsSold ?? 0) / Math.max(1, k.machines ?? 1)), 0) / recentKpis.length
    : null;

  const latestMarketPrice = recentKpis.at(-1)?.avgMarketPrice;
  const latestCogs = recentKpis.at(-1)?.cogsPerUnit;

  return (
    <main className="min-h-screen">
      <div className="app-shell">
        <h1 className="page-title">{instance.title} · Student Workspace</h1>
        <p className="page-subtitle">Enter your approved student email to play current turn and track progress.</p>

        {!studentEmail && <div className="card mt-6">Use URL format: <code>/play/{slug}?student=student@school.edu</code></div>}
        {studentEmail && !enrollment && <div className="card mt-6">You are not approved for this game yet.</div>}

        {studentEmail && enrollment && (
          <>
            <section className="card mt-6">
              <h2 className="text-lg font-semibold">Current Turn</h2>
              {!openRound && <p className="mt-2 text-sm">No round is currently open.</p>}

              {openRound && currentDef && (
                <>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
                      <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Decision Context (Month {openRound.number})</p>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{currentDef.briefing?.background ?? currentDef.scenario ?? "Review your prior results and balance growth, cash flow, and risk."}</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                        <p className="text-sm font-semibold">Your Current Organization Snapshot</p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                          <li>Cash: <strong>${Math.round(latestState.cash).toLocaleString()}</strong></li>
                          <li>Inventory: <strong>{Math.round(latestState.inventory)}</strong> units</li>
                          <li>Employees: <strong>{Math.round(latestState.employees)}</strong></li>
                          <li>Machines: <strong>{Math.round(latestState.machines)}</strong></li>
                          <li>Debt: <strong>${Math.round(latestState.debt).toLocaleString()}</strong></li>
                          <li>Brand Strength: <strong>{Math.round(latestState.brand)}</strong>/100</li>
                        </ul>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                        <p className="text-sm font-semibold">Reference Metrics</p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                          <li>Current market avg price: <strong>${Math.round(latestMarketPrice ?? currentDef.briefing?.metricHints?.marketAveragePrice ?? 35)}</strong></li>
                          <li>Typical COGS / unit: <strong>${Math.round(latestCogs ?? currentDef.briefing?.metricHints?.typicalCogsPerUnit ?? 12)}</strong></li>
                          <li>Observed units per staff: <strong>{avgProductivity ? avgProductivity.toFixed(1) : "n/a"}</strong></li>
                          <li>Observed units per machine: <strong>{avgMachineOutput ? avgMachineOutput.toFixed(1) : "n/a"}</strong></li>
                        </ul>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{currentDef.briefing?.metricHints?.staffingProductivityRule}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{currentDef.briefing?.metricHints?.machineryProductivityRule}</p>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:col-span-2">
                        <p className="text-sm font-semibold">Market Actors to Watch</p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                          {(currentDef.briefing?.marketActors ?? []).map((a) => (
                            <li key={a.name}>
                              <p className="font-medium">{a.name}</p>
                              <p>{a.description}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Likely move: {a.likelyMove}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {!!currentDef.briefing?.focusQuestions?.length && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Before You Submit, Ask:</p>
                        <ul className="mt-1 list-disc pl-5 text-sm text-slate-700 dark:text-slate-200">
                          {currentDef.briefing.focusQuestions.map((q) => <li key={q}>{q}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  <form action={submitDecision} className="mt-3 grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="studentEmail" value={studentEmail} />

                  {currentDef.fields.map((f) => (
                    <div key={f.key} className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium">{f.label}</span>
                        {f.description && <span className="text-xs text-slate-600 dark:text-slate-300">{f.description}</span>}
                        {f.type === "select" ? (
                          <select name={f.key} className="rounded border px-3 py-2">
                            {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <input name={f.key} type="number" className="rounded border px-3 py-2" required />
                        )}
                      </label>
                      {f.impact && (
                        <details className="mt-2 text-xs text-slate-700 dark:text-slate-200">
                          <summary className="cursor-pointer select-none font-medium text-indigo-700 dark:text-indigo-300">How this decision affects your business</summary>
                          <p className="mt-1">{f.impact}</p>
                        </details>
                      )}
                    </div>
                  ))}

                  <div className="md:col-span-2">
                    <button className="btn-primary" type="submit">Submit Turn Decision</button>
                  </div>
                </form>
                </>
              )}
            </section>

            <section className="card mt-6">
              <h2 className="text-lg font-semibold">My Progress</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {progress.map((p) => {
                  const details = p.details as { summary?: string; drivers?: string[] } | null;
                  return (
                    <li key={p.id} className="rounded border bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span>Round {p.round.number}</span>
                        <strong>{(p.score ?? 0).toFixed(2)}</strong>
                      </div>
                      {details?.summary && <p className="mt-1 text-xs text-slate-600">{details.summary}</p>}
                      {!!details?.drivers?.length && (
                        <details className="mt-2 text-xs text-slate-700">
                          <summary className="cursor-pointer font-semibold text-indigo-700">Why your result changed</summary>
                          <ul className="mt-1 list-disc pl-5">
                            {details.drivers.map((d) => <li key={d}>{d}</li>)}
                          </ul>
                        </details>
                      )}
                    </li>
                  );
                })}
                {!progress.length && <li className="text-slate-600">No submissions yet.</li>}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
