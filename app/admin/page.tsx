import Link from "next/link";
import Image from "next/image";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, testimonials } from "@/lib/db/schema";
import { deleteProject, deleteTestimonial, logout } from "./actions";
import { DeleteButton } from "@/components/delete-project-button";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [projectItems, testimonialItems] = await Promise.all([
    db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.id)),
    db
      .select()
      .from(testimonials)
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.id)),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Site admin</h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-white/40"
          >
            Log out
          </button>
        </form>
      </div>

      {/* Projects */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Projects{" "}
            <span className="text-sm font-normal text-zinc-500">
              ({projectItems.length})
            </span>
          </h2>
          <Link
            href="/admin/projects/new"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
          >
            + New project
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {projectItems.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-zinc-500">
              No projects yet.
            </p>
          )}
          {projectItems.map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                <Image
                  src={project.imageUrl}
                  alt={project.title}
                  fill
                  sizes="96px"
                  className="object-cover object-top"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">
                  {project.title}
                  {project.featured && (
                    <span className="ml-2 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                      featured
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-500">{project.url}</p>
              </div>
              <span className="text-xs text-zinc-500">#{project.sortOrder}</span>
              <Link
                href={`/admin/projects/${project.id}`}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/40"
              >
                Edit
              </Link>
              <DeleteButton
                id={project.id}
                title={project.title}
                action={deleteProject}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mt-14">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Testimonials{" "}
            <span className="text-sm font-normal text-zinc-500">
              ({testimonialItems.length})
            </span>
          </h2>
          <Link
            href="/admin/testimonials/new"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
          >
            + New testimonial
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {testimonialItems.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-zinc-500">
              No testimonials yet.
            </p>
          )}
          {testimonialItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">
                  {item.name}
                  <span className="ml-2 text-xs font-normal text-zinc-500">
                    {[item.role, item.company].filter(Boolean).join(", ")}
                  </span>
                  {item.projectId ? (
                    <span className="ml-2 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      {projectItems.find((p) => p.id === item.projectId)?.title ??
                        "linked"}
                    </span>
                  ) : (
                    <span className="ml-2 rounded-full bg-zinc-500/15 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      not shown
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {item.quotes[0]?.en ? `“${item.quotes[0].en}”` : "No quotes"}
                </p>
              </div>
              <span className="shrink-0 text-xs text-zinc-500">
                {item.quotes.length}{" "}
                {item.quotes.length === 1 ? "quote" : "quotes"}
              </span>
              <Link
                href={`/admin/testimonials/${item.id}`}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/40"
              >
                Edit
              </Link>
              <DeleteButton
                id={item.id}
                title={item.name}
                action={deleteTestimonial}
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
