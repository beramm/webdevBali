import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { ProjectForm } from "@/components/project-form";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, numericId))
    .limit(1);

  if (!project) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/admin" className="text-sm text-zinc-400 hover:text-white">
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">
        Edit: {project.title}
      </h1>
      <div className="mt-8">
        <ProjectForm project={project} />
      </div>
    </main>
  );
}
