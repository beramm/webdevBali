"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

// Reveal on scroll, but never gate content on the observer firing: a fallback
// timer forces the reveal so background tabs / headless renders / no-IO
// environments still show everything. Enhancement, not a visibility gate.
function useReveal(margin: string) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: margin as `${number}px` });
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setFallback(true), 1000);
    return () => clearTimeout(id);
  }, []);
  return { ref, show: inView || fallback };
}

export function SlideIn({
  children,
  from,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  from: "left" | "right";
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const offset = from === "left" ? -80 : 80;
  const { ref, show } = useReveal("-60px");
  const shown = show || reduce;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: offset }}
      animate={
        shown
          ? { opacity: 1, x: 0 }
          : reduce
            ? { opacity: 0 }
            : { opacity: 0, x: offset }
      }
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { ref, show } = useReveal("-80px");
  const shown = show || reduce;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
      animate={
        shown
          ? { opacity: 1, y: 0 }
          : reduce
            ? { opacity: 0 }
            : { opacity: 0, y: 32 }
      }
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
