import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { TestimonialForm } from "@/components/testimonial-form";

export const dynamic = "force-dynamic";

export default async function NewTestimonialPage() {
  const projectItems = await db
    .select()
    .from(projects)
    .orderBy(asc(projects.sortOrder), asc(projects.id));

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/admin" className="text-sm text-zinc-400 hover:text-white">
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">New testimonial</h1>
      <div className="mt-8">
        <TestimonialForm projects={projectItems} />
      </div>
    </main>
  );
}
