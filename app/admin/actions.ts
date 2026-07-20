"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { projects, testimonials } from "@/lib/db/schema";
import { clearSessionCookie, getSession } from "@/lib/auth/session";

async function requireAdmin() {
  const session = await getSession();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!session || session.email !== adminEmail) {
    redirect("/admin/login");
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-");
}

function parseProjectForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!title || !url || !imageUrl) {
    throw new Error("Title, URL and image URL are required.");
  }

  const slugInput = String(formData.get("slug") ?? "").trim();

  return {
    title,
    slug: slugify(slugInput || title),
    url,
    imageUrl,
    descriptionEn: String(formData.get("descriptionEn") ?? "").trim(),
    descriptionId: String(formData.get("descriptionId") ?? "").trim(),
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    featured: formData.get("featured") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
  };
}

export async function saveProject(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id") ?? 0);
  const values = parseProjectForm(formData);

  if (id > 0) {
    await db.update(projects).set(values).where(eq(projects.id, id));
  } else {
    await db.insert(projects).values(values);
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id") ?? 0);
  if (id > 0) {
    await db.delete(projects).where(eq(projects.id, id));
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin");
}

function parseQuotes(raw: string): { en: string; id: string }[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    parsed = [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((q) => ({
      en: typeof q?.en === "string" ? q.en.trim() : "",
      id: typeof q?.id === "string" ? q.id.trim() : "",
    }))
    .filter((q) => q.en.length > 0);
}

function parseTestimonialForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const quotes = parseQuotes(String(formData.get("quotes") ?? ""));
  if (!name || quotes.length === 0) {
    throw new Error("Name and at least one English quote are required.");
  }

  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const projectId = Number(formData.get("projectId") ?? 0);

  return {
    projectId: projectId > 0 ? projectId : null,
    name,
    company: String(formData.get("company") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim(),
    quotes,
    avatarUrl: avatarUrl || null,
    featured: formData.get("featured") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
  };
}

export async function saveTestimonial(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id") ?? 0);
  const values = parseTestimonialForm(formData);

  if (id > 0) {
    await db.update(testimonials).set(values).where(eq(testimonials.id, id));
  } else {
    await db.insert(testimonials).values(values);
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function deleteTestimonial(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id") ?? 0);
  if (id > 0) {
    await db.delete(testimonials).where(eq(testimonials.id, id));
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/admin/login");
}
