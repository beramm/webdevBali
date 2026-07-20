"use client";

import { useState } from "react";
import type { Project, Quote, Testimonial } from "@/lib/db/schema";
import { saveTestimonial } from "@/app/admin/actions";

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

const emptyQuote: Quote = { en: "", id: "" };

export function TestimonialForm({
  testimonial,
  projects,
}: {
  testimonial?: Testimonial;
  projects: Project[];
}) {
  const [quotes, setQuotes] = useState<Quote[]>(
    testimonial?.quotes?.length ? testimonial.quotes : [{ ...emptyQuote }]
  );

  const updateQuote = (index: number, patch: Partial<Quote>) =>
    setQuotes((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );
  const addQuote = () => setQuotes((prev) => [...prev, { ...emptyQuote }]);
  const removeQuote = (index: number) =>
    setQuotes((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );

  // Only quotes with English text are persisted (matches the server action).
  const serialized = JSON.stringify(
    quotes.filter((q) => q.en.trim().length > 0)
  );

  return (
    <form action={saveTestimonial} className="space-y-5">
      {testimonial && <input type="hidden" name="id" value={testimonial.id} />}
      <input type="hidden" name="quotes" value={serialized} />

      <Field label="Linked project (shown beside it on the site)">
        <select
          name="projectId"
          defaultValue={testimonial?.projectId ?? 0}
          className={inputClass}
        >
          <option value={0}>— None (not shown on site) —</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name *">
          <input
            name="name"
            required
            defaultValue={testimonial?.name}
            placeholder="Made Wirawan"
            className={inputClass}
          />
        </Field>
        <Field label="Company">
          <input
            name="company"
            defaultValue={testimonial?.company}
            placeholder="Villa Sunset Ubud"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Role">
          <input
            name="role"
            defaultValue={testimonial?.role}
            placeholder="Owner"
            className={inputClass}
          />
        </Field>
        <Field label="Sort order">
          <input
            name="sortOrder"
            type="number"
            defaultValue={testimonial?.sortOrder ?? 0}
            className={inputClass}
          />
        </Field>
      </div>

      {/* Quotes editor — one owner, many quotes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Quotes from this person *
          </span>
          <button
            type="button"
            onClick={addQuote}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/40"
          >
            + Add quote
          </button>
        </div>

        {quotes.map((quote, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Quote {i + 1}</span>
              <button
                type="button"
                onClick={() => removeQuote(i)}
                disabled={quotes.length === 1}
                className="text-xs text-zinc-500 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Remove quote ${i + 1}`}
              >
                Remove
              </button>
            </div>
            <Field label={i === 0 ? "English *" : "English"}>
              <textarea
                rows={2}
                value={quote.en}
                onChange={(e) => updateQuote(i, { en: e.target.value })}
                placeholder="They shipped a beautiful site in two weeks."
                className={inputClass}
              />
            </Field>
            <Field label="Indonesian">
              <textarea
                rows={2}
                value={quote.id}
                onChange={(e) => updateQuote(i, { id: e.target.value })}
                placeholder="Mereka membuat situs yang indah dalam dua minggu."
                className={inputClass}
              />
            </Field>
          </div>
        ))}
      </div>

      <Field label="Avatar image URL (optional)">
        <input
          name="avatarUrl"
          type="url"
          defaultValue={testimonial?.avatarUrl ?? ""}
          placeholder="https://…/avatar.jpg"
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={testimonial?.featured}
          className="h-4 w-4 accent-amber-400"
        />
        Featured
      </label>

      <button
        type="submit"
        className="rounded-lg bg-amber-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
      >
        {testimonial ? "Save changes" : "Create testimonial"}
      </button>
    </form>
  );
}
