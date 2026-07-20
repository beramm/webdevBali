import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Services } from "@/components/services";
import { Process } from "@/components/process";
import { PortfolioSectionAsync } from "@/components/portfolio-section-async";
import { PortfolioSkeleton } from "@/components/skeletons";
import { Faq } from "@/components/faq";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <main id="main" className="flex-1">
        <Hero />
        <Services />
        <Process />
        <Suspense fallback={<PortfolioSkeleton />}>
          <PortfolioSectionAsync locale={locale} />
        </Suspense>
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
