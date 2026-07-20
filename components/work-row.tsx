"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { Project, Testimonial } from "@/lib/db/schema";
import { ProjectCard } from "./project-card";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

function OwnerCaption({ owner }: { owner: Testimonial }) {
  const meta = [owner.role, owner.company].filter(Boolean).join(" · ");
  return (
    <figcaption className="flex items-center gap-3">
      {owner.avatarUrl && (
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-card">
          <Image
            src={owner.avatarUrl}
            alt={owner.name}
            fill
            sizes="36px"
            className="object-cover"
          />
        </span>
      )}
      <span className="text-sm leading-tight">
        <span className="block font-semibold text-foreground">{owner.name}</span>
        {meta && <span className="block text-xs text-muted">{meta}</span>}
      </span>
    </figcaption>
  );
}

function QuoteBubble({
  text,
  index,
  reduce,
  bubbleRef,
}: {
  text: string;
  index: number;
  reduce: boolean;
  bubbleRef: (el: HTMLElement | null) => void;
}) {
  return (
    <motion.blockquote
      ref={bubbleRef}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: 0.5 + index * 0.12, ease: EASE }}
      className="rounded-xl border border-card-border bg-card p-5 text-sm leading-relaxed text-foreground"
    >
      “{text}”
    </motion.blockquote>
  );
}

/**
 * A work row: project card on one side, its client's testimony on the other —
 * one owner (name/role/company) with several short quotes, joined by curved SVG
 * branches (a stem forking from the card to each quote). Sides alternate per row
 * via `flip`. Connector geometry is measured from the real DOM so it works for
 * any card/bubble sizes and either direction.
 */
export function WorkRow({
  project,
  owner,
  description,
  visitLabel,
  testimonialLabel,
  flip,
  locale,
}: {
  project: Project;
  owner: Testimonial | null;
  description: string;
  visitLabel: string;
  testimonialLabel: string;
  flip: boolean;
  locale: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const maskId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<(HTMLElement | null)[]>([]);
  const [paths, setPaths] = useState<string[]>([]);
  const [dots, setDots] = useState<{ x: number; y: number }[]>([]);

  // Draw the branches in sync with scroll (reversible), not a one-time reveal.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "start 0.3"],
  });
  const draw = useTransform(scrollYProgress, (p) =>
    Math.min(1, Math.max(0, p))
  );
  const dotOpacity = useTransform(scrollYProgress, [0.02, 0.14], [0, 1]);

  // Cap at 4 so a chatty owner never lopsides the row against the card.
  const quotes =
    owner?.quotes
      .map((q) => (locale === "id" && q.id ? q.id : q.en))
      .filter(Boolean)
      .slice(0, 4) ?? [];

  const measure = useCallback(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card || quotes.length === 0) return;
    // Connector only exists on the two-column layout.
    if (window.innerWidth < 640) {
      setPaths([]);
      setDots([]);
      return;
    }

    const cRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    // Lines float free of the boxes: offset both endpoints by a gap.
    const GAP = 32;
    const dxRow = flip ? -1 : 1;
    const startX =
      (flip ? cardRect.left : cardRect.right) - cRect.left + dxRow * GAP;

    // Collect each bubble's entry point first.
    const ends: { x: number; y: number }[] = [];
    for (const el of bubbleRefs.current) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      ends.push({
        x: (flip ? rect.right : rect.left) - cRect.left - dxRow * GAP,
        y: rect.top + rect.height / 2 - cRect.top,
      });
    }
    if (ends.length === 0) {
      setPaths([]);
      setDots([]);
      return;
    }
    // Fork from the centre of the bubble GROUP, not the card — the owner
    // caption below the bubbles offsets the card centre otherwise.
    const startY = ends.reduce((sum, e) => sum + e.y, 0) / ends.length;

    const nextPaths: string[] = [];
    const nextDots: { x: number; y: number }[] = [{ x: startX, y: startY }];

    for (const { x: endX, y: endY } of ends) {
      // Orthogonal elbow: out of the card, turn at the column midpoint,
      // then straight into the bubble. Rounded corners.
      const bendX = (startX + endX) / 2;
      const dx = endX > startX ? 1 : -1;
      const dy = endY > startY ? 1 : -1;
      const r = Math.min(10, Math.abs(endY - startY) / 2);

      if (Math.abs(endY - startY) < 2) {
        nextPaths.push(`M ${startX} ${startY} L ${endX} ${endY}`);
      } else {
        nextPaths.push(
          `M ${startX} ${startY} ` +
            `L ${bendX - dx * r} ${startY} ` +
            `Q ${bendX} ${startY} ${bendX} ${startY + dy * r} ` +
            `L ${bendX} ${endY - dy * r} ` +
            `Q ${bendX} ${endY} ${bendX + dx * r} ${endY} ` +
            `L ${endX} ${endY}`
        );
      }
      nextDots.push({ x: endX, y: endY });
    }

    setPaths(nextPaths);
    setDots(nextDots);
  }, [flip, quotes.length]);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  if (!owner || quotes.length === 0) {
    return (
      <div>
        <ProjectCard
          project={project}
          description={description}
          visitLabel={visitLabel}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative grid items-center gap-6 sm:grid-cols-[4fr_3fr_5fr] sm:gap-0"
    >
      <div ref={cardRef} className={flip ? "sm:order-3" : "sm:order-1"}>
        <ProjectCard
          project={project}
          description={description}
          visitLabel={visitLabel}
        />
      </div>

      {/* Spacer column the branches travel through */}
      <div className="hidden sm:order-2 sm:block" aria-hidden />

      <figure
        className={`relative m-0 flex flex-col justify-center gap-4 ${
          flip ? "sm:order-1" : "sm:order-3"
        }`}
      >
        {/* Mobile lacks the branch connectors, so a label + quote mark make it
            clear these are the project's client testimonials. */}
        <div className="flex items-center gap-2 sm:hidden">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4 text-accent"
            aria-hidden
          >
            <path d="M9.5 5C6.5 5 4 7.5 4 10.5c0 2.8 2 5 4.7 5 .2 0 .3.2.2.4-.5 1.2-1.5 2.2-2.9 2.8-.3.1-.2.6.1.6 3.8-.4 6.9-3.6 6.9-7.8V10.5C13 7.5 12.5 5 9.5 5Zm9 0C15.5 5 13 7.5 13 10.5c0 2.8 2 5 4.7 5 .2 0 .3.2.2.4-.5 1.2-1.5 2.2-2.9 2.8-.3.1-.2.6.1.6 3.8-.4 6.9-3.6 6.9-7.8V10.5C22 7.5 21.5 5 18.5 5Z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {testimonialLabel}
          </span>
        </div>
        <OwnerCaption owner={owner} />
        {quotes.map((text, i) => (
          <QuoteBubble
            key={i}
            text={text}
            index={i}
            reduce={reduce}
            bubbleRef={(el) => {
              bubbleRefs.current[i] = el;
            }}
          />
        ))}
      </figure>

      {/* Branch connector (desktop only) */}
      {paths.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
          aria-hidden
        >
          {paths.map((d, i) => (
            <g key={i}>
              {/* The dashed line itself is static; a solid path drawn inside
                  a mask reveals it, keeping the draw animation while the
                  visible stroke stays striped. */}
              <mask id={`${maskId}-${i}`} maskUnits="userSpaceOnUse">
                <motion.path
                  d={d}
                  fill="none"
                  stroke="white"
                  strokeWidth={6}
                  style={{ pathLength: reduce ? 1 : draw }}
                />
              </mask>
              <path
                d={d}
                fill="none"
                stroke="var(--accent)"
                strokeOpacity={0.6}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                strokeLinecap="round"
                mask={`url(#${maskId}-${i})`}
              />
            </g>
          ))}
          {dots.map((dot, i) => (
            <motion.circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={3}
              fill="var(--accent)"
              style={{ opacity: reduce ? 1 : dotOpacity }}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
