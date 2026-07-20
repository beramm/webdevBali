import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, testimonials } from "@/lib/db/schema";
import { PortfolioSection } from "./portfolio-section";

export async function PortfolioSectionAsync({ locale }: { locale: string }) {
  const [projectItems, testimonialItems] = await Promise.all([
    db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.id)),
    db
      .select()
      .from(testimonials)
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.id)),
  ]);

  return (
    <PortfolioSection
      projects={projectItems}
      testimonials={testimonialItems}
      locale={locale}
    />
  );
}
