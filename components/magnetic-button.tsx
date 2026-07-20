"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

export function MagneticButton({
  children,
  href,
  variant = "primary",
  tone = "auto",
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "ghost" | "link";
  /** "dark" pins ghost/link styles to light-on-dark (for use over the hero video) */
  tone?: "auto" | "dark";
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15 });
  const springY = useSpring(y, { stiffness: 200, damping: 15 });

  function onMouseMove(e: React.MouseEvent) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  if (variant === "link") {
    const linkStyles =
      tone === "dark"
        ? "text-white/90 hover:text-white"
        : "text-foreground hover:text-accent";
    return (
      <motion.a
        ref={ref}
        href={href}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        style={{ x: springX, y: springY }}
        className={`group inline-flex items-center gap-2 px-2 py-3.5 text-sm font-semibold tracking-wide transition-colors ${linkStyles}`}
      >
        {children}
        <span
          aria-hidden
          className="transition-transform duration-200 ease-out group-hover:translate-x-1"
        >
          →
        </span>
      </motion.a>
    );
  }

  const styles =
    variant === "primary"
      ? "bg-amber-400 text-zinc-950 hover:bg-amber-300"
      : tone === "dark"
        ? "border border-white/25 text-white hover:border-white/60 backdrop-blur-sm"
        : "border border-card-border text-foreground hover:border-accent backdrop-blur-sm";

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      style={{ x: springX, y: springY }}
      className={`inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold tracking-wide transition-colors ${styles}`}
    >
      {children}
    </motion.a>
  );
}
