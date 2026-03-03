import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ListChecks, UsersRound } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatusChip } from "@/components/status-chip";
import { Toast } from "@/components/toast";

async function addStudent(formData: FormData) {
  "use server";
  const instanceId = String(formData.get("instanceId") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const slug = String(formData.get("slug") || "");
  if (!instanceId || !name || !email) redirect(`/instances/${slug}?toast=error&message=Missing+student+fields`);
  await prisma.enrollmentRequest.create({ data: { gameInstanceId: instanceId, name, email, status: "PENDING" } });
  revalidatePath(`/instances/${slug}`);
  redirect(`/instances/${slug}?toast=success&message=Student+added+to+approval+queue`);
}

async function reviewRequest(formData: FormData) {
  "use server";
  const requestId = String(formData.get("requestId") || "");
  const decision = String(formData.get("decision") || "PENDING") as "APPROVED" | "DENIED";
  const slug = String(formData.get("slug") || "");
  const req = await prisma.enrollmentRequest.findUnique({ where: { id: requestId } });
  if (!req) redirect(`/instances/${slug}?toast=error&message=Request+not+found`);

  await prisma.enrollmentRequest.update({ where: { id: requestId }, data: { status: decision, reviewedAt: new Date() } });

  if (decision === "APPROVED") {
    let user = await prisma.user.findUnique({ where: { email: req.email } });
    if (!user) user = await prisma.user.create({ data: { email: req.email, name: req.name } });

    await prisma.enrollment.upsert({
      where: { gameInstanceId_userId: { gameInstanceId: req.gameInstanceId, userId: user.id } },
      update: { status: "APPROVED", approvedAt: new Date() },
      create: { gameInstanceId: req.gameInstanceId, userId: user.id, status: "APPROVED", approvedAt: new Date() },
    });

    await prisma.roleAssignment.upsert({
      where: { userId_instanceId_role: { userId: user.id, instanceId: req.gameInstanceId, role: "PLAYER" } },
      update: {},
      create: { userId: user.id, instanceId: req.gameInstanceId, role: "PLAYER", scope: "INSTANCE" },
    });
  }

  revalidatePath(`/instances/${slug}`);
  redirect(`/instances/${slug}?toast=success&message=Enrollment+request+updated`);
}

async function controlTurn(formData: FormData) {
  "use server";
  const instanceId = String(formData.get("instanceId") || "");
  const slug = String(formData.get("slug") || "");
  const action = String(formData.get("action") || "");

  const rounds = await prisma.round.findMany({ where: { gameInstanceId: instanceId }, orderBy: { number: "asc" } });
  if (!rounds.length) redirect(`/instances/${slug}?toast=error&message=No+rounds+configured`);

  const open = rounds.find((r) => r.status === "OPEN");

  if (action === "advance") {
    if (!open) redirect(`/instances/${slug}?toast=warning&message=No+open+turn+to+advance`);

    const approvedCount = await prisma.enrollment.count({ where: { gameInstanceId: instanceId, status: "APPROVED" } });
    const submittedCount = await prisma.decisionSubmission.count({ where: { roundId: open.id } });

    if (approvedCount > 0 && submittedCount < approvedCount) {
      redirect(`/instances/${slug}?toast=warning&message=Cannot+advance%3A+not+all+approved+students+submitted+for+this+turn`);
    }

    await prisma.round.update({ where: { id: open.id }, data: { status: "CLOSED", closeAt: new Date() } });
    const next = rounds.find((r) => r.number === (open.number + 1));
    if (next) await prisma.round.update({ where: { id: next.id }, data: { status: "OPEN", openAt: new Date() } });

    revalidatePath(`/instances/${slug}`);
    redirect(`/instances/${slug}?toast=success&message=Turn+advanced`);
  }

  if (action === "regress") {
    if (open) await prisma.round.update({ where: { id: open.id }, data: { status: "DRAFT" } });
    const prev = rounds.find((r) => r.number === ((open?.number ?? 2) - 1));
    if (prev) await prisma.round.update({ where: { id: prev.id }, data: { status: "OPEN", reopenedCount: { increment: 1 } } });

    revalidatePath(`/instances/${slug}`);
    redirect(`/instances/${slug}?toast=warning&message=Turn+regressed`);
  }

  redirect(`/instances/${slug}?toast=error&message=Invalid+turn+action`);
}

export default async function InstancePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ toast?: "success" | "error" | "warning"; message?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const instance = await prisma.gameInstance.findUnique({
    where: { slug },
    include: {
      rounds: { orderBy: { number: "asc" } },
      enrollmentRequests: { orderBy: { createdAt: "desc" } },
      results: { include: { user: true } },
    },
  });

  if (!instance) return <main className="app-shell">Not found</main>;

  const performance = Object.values(instance.results.reduce<Record<string, { email: string; score: number }>>((acc, r) => {
    const key = r.user?.email ?? "unknown";
    if (!acc[key]) acc[key] = { email: key, score: 0 };
    acc[key].score += r.score ?? 0;
    return acc;
  }, {})).sort((a, b) => b.score - a.score);

  return (
    <main className="min-h-screen">
      <div className="app-shell">
        {sp.toast && sp.message && <Toast kind={sp.toast} message={decodeURIComponent(sp.message).replaceAll("+", " ")} />}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="page-title">{instance.title}</h1>
            <p className="page-subtitle">Professor controls: students, approvals, performance, and turn flow.</p>
          </div>
          <StatusChip value={instance.status} />
        </div>

        <section className="card mt-6">
          <h2 className="text-lg font-semibold">Add Student</h2>
          <form action={addStudent} className="mt-3 grid gap-2 md:grid-cols-4">
            <input type="hidden" name="instanceId" value={instance.id} />
            <input type="hidden" name="slug" value={slug} />
            <input name="name" placeholder="Student name" className="rounded border px-3 py-2" required />
            <input name="email" placeholder="student@school.edu" type="email" className="rounded border px-3 py-2" required />
            <a className="btn-secondary text-center" href={`/play/${slug}`}>Open Student Workspace</a>
            <button className="btn-primary" type="submit">Add to Queue</button>
          </form>
        </section>

        <section className="card mt-6">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"><UsersRound className="h-4 w-4" /> Enrollment Requests</h2>
            <span className="status-badge">{instance.enrollmentRequests.length} total</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {instance.enrollmentRequests.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <span><span className="font-medium">{r.name}</span> ({r.email})</span>
                <div className="flex items-center gap-2">
                  <StatusChip value={r.status} />
                  {r.status === "PENDING" && (
                    <>
                      <form action={reviewRequest}><input type="hidden" name="requestId" value={r.id} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="decision" value="APPROVED" /><button className="btn-secondary" type="submit">Approve</button></form>
                      <form action={reviewRequest}><input type="hidden" name="requestId" value={r.id} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="decision" value="DENIED" /><button className="btn-secondary" type="submit">Deny</button></form>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card mt-6">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"><ListChecks className="h-4 w-4" /> Turns / Rounds</h2>
            <div className="flex gap-2">
              <form action={controlTurn}><input type="hidden" name="instanceId" value={instance.id} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="action" value="regress" /><button className="btn-secondary" type="submit">Regress Turn</button></form>
              <form action={controlTurn}><input type="hidden" name="instanceId" value={instance.id} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="action" value="advance" /><button className="btn-primary" type="submit">Advance Turn</button></form>
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {instance.rounds.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <span>Round {r.number}</span>
                <StatusChip value={r.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="card mt-6">
          <h2 className="text-lg font-semibold">Student Performance (Game)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {performance.map((p, idx) => (
              <li key={p.email} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <span>#{idx + 1} {p.email}</span>
                <strong>{p.score.toFixed(2)}</strong>
              </li>
            ))}
            {!performance.length && <li className="text-slate-600">No performance data yet.</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}
