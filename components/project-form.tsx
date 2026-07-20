import type { Project } from "@/lib/db/schema";
import { saveProject } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-300/60";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}

export function ProjectForm({ project }: { project?: Project }) {
  return (
    <form action={saveProject} className="space-y-5">
      {project && <input type="hidden" name="id" value={project.id} />}

      <Field label="Title *">
        <input
          name="title"
          required
          defaultValue={project?.title}
          placeholder="Villa Sunset Bali"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Slug (auto from title if empty)">
          <input
            name="slug"
            defaultValue={project?.slug}
            placeholder="villa-sunset-bali"
            className={inputClass}
          />
        </Field>
        <Field label="Sort order">
          <input
            name="sortOrder"
            type="number"
            defaultValue={project?.sortOrder ?? 0}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Live site URL *">
        <input
          name="url"
          type="url"
          required
          defaultValue={project?.url}
          placeholder="https://example.com"
          className={inputClass}
        />
      </Field>

      <Field label="Screenshot image URL *">
        <input
          name="imageUrl"
          type="url"
          required
          defaultValue={project?.imageUrl}
          placeholder="https://…/screenshot.png"
          className={inputClass}
        />
      </Field>

      <Field label="Description (English)">
        <textarea
          name="descriptionEn"
          rows={3}
          defaultValue={project?.descriptionEn}
          className={inputClass}
        />
      </Field>

      <Field label="Description (Indonesian)">
        <textarea
          name="descriptionId"
          rows={3}
          defaultValue={project?.descriptionId}
          className={inputClass}
        />
      </Field>

      <Field label="Tags (comma separated)">
        <input
          name="tags"
          defaultValue={project?.tags.join(", ")}
          placeholder="Next.js, E-commerce"
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={project?.featured}
          className="h-4 w-4 accent-amber-400"
        />
        Featured
      </label>

      <button
        type="submit"
        className="rounded-lg bg-amber-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
      >
        {project ? "Save changes" : "Create project"}
      </button>
    </form>
  );
}
