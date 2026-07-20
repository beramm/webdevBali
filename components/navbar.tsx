"use client";

import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./theme-toggle";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const tc = useTranslations("contact");
  const locale = useLocale();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const otherLocale = locale === "en" ? "id" : "en";

  // Over the hero video the navbar stays light-on-dark regardless of theme;
  // once past the hero — or with the mobile menu open — it adopts the theme.
  const { scrollY } = useScroll();
  const [pastHero, setPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    setPastHero(y > window.innerHeight * 1.5);
  });

  const solid = pastHero || menuOpen;
  const links = [
    { href: "#work", label: t("work") },
    { href: "#services", label: t("services") },
    { href: "#contact", label: t("contact") },
  ];
  const linkClass = solid
    ? "text-muted hover:text-foreground"
    : "text-zinc-300 hover:text-white";

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-x-0 top-0 z-50"
    >
      {/* Progressive blur: strongest at the top, dissolves toward the
          bottom edge instead of ending in a hard line. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[150%] backdrop-blur-lg"
        style={{
          maskImage:
            "linear-gradient(to bottom, black 0%, black 45%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 45%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[150%] bg-gradient-to-b to-transparent transition-colors ${
          solid ? "from-background/80" : "from-zinc-950/40"
        }`}
      />
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="#top"
          onClick={() => setMenuOpen(false)}
          className={`text-sm font-bold tracking-tight ${
            solid ? "text-foreground" : "text-white"
          }`}
        >
          webdev<span className="text-amber-400">.bali</span>
        </a>

        <div className="flex items-center gap-6 text-sm">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`hidden transition-colors sm:block ${linkClass}`}
            >
              {link.label}
            </a>
          ))}
          <Link
            href={pathname}
            locale={otherLocale}
            aria-label={otherLocale === "id" ? "Bahasa Indonesia" : "English"}
            className={`inline-flex min-h-11 items-center rounded-full border px-3.5 text-xs font-semibold uppercase transition-colors ${
              solid
                ? "border-card-border text-foreground hover:border-accent"
                : "border-white/20 text-white hover:border-white/50"
            }`}
          >
            {otherLocale}
          </Link>
          <ThemeToggle
            className={solid ? "" : "border-white/20 text-white hover:border-white/60"}
          />

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className={`flex h-11 w-11 items-center justify-center sm:hidden ${
              solid ? "text-foreground" : "text-white"
            }`}
          >
            <span className="relative block h-3.5 w-5">
              <span
                className={`absolute left-0 block h-0.5 w-full bg-current transition-all duration-200 ${
                  menuOpen ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-full bg-current transition-opacity duration-200 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-full bg-current transition-all duration-200 ${
                  menuOpen ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="relative overflow-hidden border-b border-card-border bg-background sm:hidden"
          >
            <div className="flex flex-col px-6 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-card-border py-3.5 text-base font-medium text-foreground last:border-0"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="mailto:bramraysky232@gmail.com"
                onClick={() => setMenuOpen(false)}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-amber-400 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
              >
                {tc("cta")}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
