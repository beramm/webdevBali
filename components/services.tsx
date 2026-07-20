"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "./reveal";

const KEYS = ["design", "development", "care"] as const;

export function Services() {
  const t = useTranslations("services");

  return (
    <section id="services" className="mx-auto max-w-6xl px-6 pb-32 pt-6">
      <Reveal>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h2>
      </Reveal>

      <div className="mt-10 border-t border-card-border">
        {KEYS.map((key, i) => (
          <Reveal key={key} delay={i * 0.1}>
            <div className="group grid gap-2 border-b border-card-border py-9 sm:grid-cols-[3.5rem_1.1fr_1.6fr] sm:items-baseline sm:gap-8">
              <span className="font-mono text-xs text-muted">0{i + 1}</span>
              <h3 className="text-xl font-semibold tracking-tight text-foreground transition-transform duration-300 ease-out group-hover:translate-x-1.5 sm:text-2xl">
                {t(`items.${key}.title`)}
              </h3>
              <p className="max-w-prose text-sm leading-relaxed text-muted">
                {t(`items.${key}.description`)}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
