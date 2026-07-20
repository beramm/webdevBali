import { useTranslations } from "next-intl";
import type { Project, Testimonial } from "@/lib/db/schema";
import { Reveal } from "./reveal";
import { WorkRow } from "./work-row";

// DEV PLACEHOLDER: projects without a linked testimonial show this template
// owner + quotes so the branch layout can be developed/reviewed. Remove (or
// return null) before production launch — real testimonials come from the
// admin's "Linked project" select.
function templateOwner(projectId: number): Testimonial {
  return {
    id: -1 * projectId,
    projectId,
    name: "Client name",
    role: "Owner",
    company: "Company name",
    avatarUrl: null,
    featured: false,
    sortOrder: 0,
    createdAt: new Date(0),
    quotes: [
      {
        en: "Template testimony — link a real one to this project in the admin.",
        id: "Contoh testimoni — tautkan testimoni asli ke proyek ini lewat admin.",
      },
      {
        en: "Template testimony — this placeholder shows how the branch layout looks.",
        id: "Contoh testimoni — placeholder ini menunjukkan tampilan tata letak cabang.",
      },
      {
        en: "Template testimony — replace with real client words before launch.",
        id: "Contoh testimoni — ganti dengan kata-kata klien asli sebelum rilis.",
      },
    ],
  };
}

export function PortfolioSection({
  projects,
  testimonials,
  locale,
}: {
  projects: Project[];
  testimonials: Testimonial[];
  locale: string;
}) {
  const t = useTranslations("portfolio");

  // One owner per project — first linked testimonial wins.
  const byProject = new Map<number, Testimonial>();
  for (const item of testimonials) {
    if (!item.projectId || byProject.has(item.projectId)) continue;
    byProject.set(item.projectId, item);
  }

  // Alternate testimonial side only across rows that have testimonials.
  let branchedCount = 0;

  return (
    <section id="work" className="mx-auto max-w-6xl px-6 py-32 sm:py-44">
      <Reveal>
        <h2 className="text-6xl font-bold leading-[0.95] tracking-[-0.03em] text-foreground sm:text-7xl lg:text-8xl">
          {t("title")}
        </h2>
        <p className="mt-5 max-w-xl text-lg text-muted">{t("subtitle")}</p>
      </Reveal>

      {projects.length === 0 ? (
        <Reveal delay={0.1}>
          <p className="mt-16 rounded-2xl border border-dashed border-card-border p-16 text-center text-muted">
            {t("empty")}
          </p>
        </Reveal>
      ) : (
        <div className="mt-14 space-y-16">
          {projects.map((project) => {
            // Real testimonial wins. The template is a dev-only layout aid —
            // never ship placeholder "Client name" quotes as fake proof.
            const owner =
              byProject.get(project.id) ??
              (process.env.NODE_ENV !== "production"
                ? templateOwner(project.id)
                : null);
            const flip =
              !!owner && owner.quotes.length > 0 && branchedCount++ % 2 === 1;
            return (
              <Reveal key={project.id}>
                <WorkRow
                  project={project}
                  owner={owner}
                  description={
                    locale === "id" ? project.descriptionId : project.descriptionEn
                  }
                  visitLabel={t("visit")}
                  flip={flip}
                  locale={locale}
                />
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}
