import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { evaluateSubmission, validateSubmission } from "@/lib/engine/config-engine";

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

  const config = instance.gameTypeVersion.configJson as { rounds: { roundNumber: number; fields: { key: string; label: string; type: string; options?: { label: string; value: string }[] }[] }[] };
  const currentDef = openRound ? config.rounds.find((r) => r.roundNumber === openRound.number) : null;

  const progress = user
    ? await prisma.result.findMany({ where: { gameInstanceId: instance.id, userId: user.id }, include: { round: true }, orderBy: { round: { number: "asc" } } })
    : [];

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
                <form action={submitDecision} className="mt-3 grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="studentEmail" value={studentEmail} />

                  {currentDef.fields.map((f) => (
                    <label key={f.key} className="flex flex-col gap-1 text-sm">
                      <span>{f.label}</span>
                      {f.type === "select" ? (
                        <select name={f.key} className="rounded border px-3 py-2">
                          {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : (
                        <input name={f.key} type="number" className="rounded border px-3 py-2" required />
                      )}
                    </label>
                  ))}

                  <div className="md:col-span-2">
                    <button className="btn-primary" type="submit">Submit Turn Decision</button>
                  </div>
                </form>
              )}
            </section>

            <section className="card mt-6">
              <h2 className="text-lg font-semibold">My Progress</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {progress.map((p) => {
                  const details = p.details as { summary?: string } | null;
                  return (
                    <li key={p.id} className="rounded border bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span>Round {p.round.number}</span>
                        <strong>{(p.score ?? 0).toFixed(2)}</strong>
                      </div>
                      {details?.summary && <p className="mt-1 text-xs text-slate-600">{details.summary}</p>}
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
