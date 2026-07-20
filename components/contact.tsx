"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "./reveal";
import { MagneticButton } from "./magnetic-button";

const EMAIL = "bramraysky232@gmail.com";

export function Contact() {
  const t = useTranslations("contact");

  return (
    <section id="contact" className="mx-auto max-w-4xl px-6 py-32 text-center">
      <Reveal>
        <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted">{t("subtitle")}</p>
      </Reveal>
      <Reveal delay={0.15}>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <MagneticButton href={`mailto:${EMAIL}`}>{t("cta")}</MagneticButton>
          <MagneticButton href="https://wa.me/6285156245709" variant="link">
            {t("whatsapp")}
          </MagneticButton>
        </div>
      </Reveal>
    </section>
  );
}
