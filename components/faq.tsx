"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Reveal } from "./reveal";

const KEYS = ["price", "timeline", "included", "maintenance", "location"] as const;

export function Faq() {
  const t = useTranslations("faq");
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-28">
      <Reveal>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h2>
      </Reveal>

      <div className="mt-10 border-t border-card-border">
        {KEYS.map((key) => {
          const isOpen = open === key;
          return (
            <div key={key} className="border-b border-card-border">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : key)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${key}`}
                id={`faq-trigger-${key}`}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-base font-medium text-foreground sm:text-lg">
                  {t(`items.${key}.question`)}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
                  className="shrink-0 text-lg text-accent"
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-panel-${key}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${key}`}
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduce ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[62ch] pb-6 text-sm leading-relaxed text-muted">
                      {t(`items.${key}.answer`)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
