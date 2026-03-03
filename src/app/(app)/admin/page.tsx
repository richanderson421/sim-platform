import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Sparkles, GitBranchPlus } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatusChip } from "@/components/status-chip";
import { Toast } from "@/components/toast";

export const dynamic = "force-dynamic";

async function createProfessor(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  if (!name || !email || !password) redirect("/admin?toast=error&message=Missing+required+fields");

  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash: await bcrypt.hash(password, 10) },
    create: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });

  revalidatePath("/admin");
  redirect("/admin?toast=success&message=Professor+account+saved");
}

async function createGame(formData: FormData) {
  "use server";
  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const ownerEmail = String(formData.get("ownerEmail") || "").trim().toLowerCase();
  const gameTypeVersionId = String(formData.get("gameTypeVersionId") || "").trim();
  if (!title || !slug || !ownerEmail || !gameTypeVersionId) redirect("/admin?toast=error&message=Missing+required+fields");

  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) redirect("/admin?toast=error&message=Professor+email+not+found");

  const instance = await prisma.gameInstance.create({
    data: { title, slug, ownerId: owner.id, gameTypeVersionId, status: "DRAFT" },
  });

  await prisma.roleAssignment.upsert({
    where: { userId_instanceId_role: { userId: owner.id, instanceId: instance.id, role: "OWNER" } },
    update: {},
    create: { userId: owner.id, instanceId: instance.id, role: "OWNER", scope: "INSTANCE" },
  });

  const version = await prisma.gameTypeVersion.findUnique({ where: { id: gameTypeVersionId } });
  if (version) {
    for (let n = 1; n <= version.roundCount; n += 1) {
      await prisma.round.create({ data: { gameInstanceId: instance.id, number: n, status: n === 1 ? "OPEN" : "DRAFT" } });
    }
  }

  await prisma.instanceSettings.create({ data: { gameInstanceId: instance.id } });
  revalidatePath("/admin");
  redirect("/admin?toast=success&message=Game+created+and+linked+to+professor");
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ toast?: "success" | "error" | "warning"; message?: string }>;
}) {
  const sp = await searchParams;
  const gameTypes = await prisma.gameType.findMany({ include: { versions: true } });
  const professors = await prisma.user.findMany({ where: { systemRole: "USER" }, orderBy: { createdAt: "desc" }, take: 15 });
  const instances = await prisma.gameInstance.findMany({ include: { owner: true, gameTypeVersion: { include: { gameType: true } } }, orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <main className="min-h-screen">
      <div className="app-shell">
        {sp.toast && sp.message && <Toast kind={sp.toast} message={decodeURIComponent(sp.message).replaceAll("+", " ")} />}
        <h1 className="page-title">Admin Console</h1>
        <p className="page-subtitle">Create professors, create games, and link professor ownership.</p>

        <section className="card mt-6">
          <h2 className="text-lg font-semibold">Add Professor Account</h2>
          <form action={createProfessor} className="mt-3 grid gap-2 md:grid-cols-4">
            <input name="name" placeholder="Professor name" className="rounded border px-3 py-2" required />
            <input name="email" placeholder="prof@school.edu" type="email" className="rounded border px-3 py-2" required />
            <input name="password" placeholder="Temporary password" type="text" className="rounded border px-3 py-2" required />
            <button className="btn-primary" type="submit">Create Professor</button>
          </form>
          <div className="mt-3 text-xs text-slate-600">Recent professors: {professors.map((p) => p.email).join(" · ")}</div>
        </section>

        <section className="card mt-6">
          <h2 className="text-lg font-semibold">Create Game Instance + Link Professor</h2>
          <form action={createGame} className="mt-3 grid gap-2 md:grid-cols-5">
            <input name="title" placeholder="Game title" className="rounded border px-3 py-2" required />
            <input name="slug" placeholder="game-slug" className="rounded border px-3 py-2" required />
            <input name="ownerEmail" placeholder="owner email" type="email" className="rounded border px-3 py-2" required />
            <select name="gameTypeVersionId" className="rounded border px-3 py-2" required>
              <option value="">Select version</option>
              {gameTypes.flatMap((g) => g.versions.map((v) => (
                <option key={v.id} value={v.id}>{g.name} v{v.versionNumber}</option>
              )))}
            </select>
            <button className="btn-primary" type="submit">Create Game</button>
          </form>
        </section>

        <section className="card mt-6">
          <h2 className="text-lg font-semibold">Recent Games + Professor Links</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {instances.map((inst) => (
              <li key={inst.id} className="flex items-center justify-between rounded border bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <span>
                  <strong>{inst.title}</strong> ({inst.slug}) · {inst.gameTypeVersion.gameType.name} v{inst.gameTypeVersion.versionNumber}
                </span>
                <span className="text-slate-700 dark:text-slate-200">Owner: {inst.owner.email}</span>
              </li>
            ))}
            {!instances.length && <li className="text-slate-600">No games created yet.</li>}
          </ul>
        </section>

        <div className="mt-6 space-y-4">
          {gameTypes.map((gt) => (
            <div key={gt.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{gt.name}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Key: {gt.key}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1"><GitBranchPlus className="h-3.5 w-3.5" /> {gt.versions.length} versions</span>
                    <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> template family</span>
                  </div>
                </div>
                <StatusChip value="IN_PROGRESS" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
