import { redirect } from "next/navigation";
import { Toast } from "@/components/toast";
import { prisma } from "@/lib/db";

async function requestAccess(formData: FormData) {
  "use server";
  const slug = String(formData.get("slug") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!slug || !name || !email) redirect("/student?toast=error&message=Please+fill+all+fields");

  const instance = await prisma.gameInstance.findUnique({ where: { slug } });
  if (!instance) redirect("/student?toast=error&message=Game+not+found+for+that+slug");

  await prisma.enrollmentRequest.create({
    data: { gameInstanceId: instance.id, name, email, status: "PENDING" },
  });

  redirect(`/student?toast=success&message=Request+submitted+for+${encodeURIComponent(slug)}`);
}

export default async function StudentAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ toast?: "success" | "error" | "warning"; message?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main className="min-h-screen">
      <div className="app-shell">
        {sp.toast && sp.message && <Toast kind={sp.toast} message={decodeURIComponent(sp.message).replaceAll("+", " ")} />}
        <h1 className="page-title">Student Access Request</h1>
        <p className="page-subtitle">Enter the game slug your professor gave you and request access.</p>

        <section className="card mt-6 max-w-2xl">
          <form action={requestAccess} className="grid gap-3">
            <label className="text-sm">
              Game slug
              <input name="slug" className="mt-1 w-full rounded border px-3 py-2" placeholder="biz-sim-12m" required />
            </label>
            <label className="text-sm">
              Your name
              <input name="name" className="mt-1 w-full rounded border px-3 py-2" placeholder="Student Name" required />
            </label>
            <label className="text-sm">
              Your email
              <input name="email" type="email" className="mt-1 w-full rounded border px-3 py-2" placeholder="you@school.edu" required />
            </label>
            <button className="btn-primary" type="submit">Request Access</button>
          </form>
        </section>
      </div>
    </main>
  );
}
