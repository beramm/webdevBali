import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, testimonials } from "@/lib/db/schema";
import { TestimonialForm } from "@/components/testimonial-form";

export const dynamic = "force-dynamic";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const [[testimonial], projectItems] = await Promise.all([
    db.select().from(testimonials).where(eq(testimonials.id, numericId)).limit(1),
    db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.id)),
  ]);

  if (!testimonial) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/admin" className="text-sm text-zinc-400 hover:text-white">
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">
        Edit: {testimonial.name}
      </h1>
      <div className="mt-8">
        <TestimonialForm testimonial={testimonial} projects={projectItems} />
      </div>
    </main>
  );
}
