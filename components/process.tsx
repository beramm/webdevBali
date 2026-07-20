"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useTranslations } from "next-intl";
import { Reveal } from "./reveal";

const STEPS = ["discover", "build", "seo", "launch"] as const;

function StepBlock({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-[19rem]">
      <span className="font-mono text-xs text-accent">
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

// Just the grid lines — the reveal mask is applied dynamically (cursor-follow).
// Lines are stronger than the global --grid token so they read inside the pool.
const GRID_LINE = "color-mix(in oklab, var(--foreground) 14%, transparent)";
const GRID_STYLE: React.CSSProperties = {
  backgroundImage: `linear-gradient(to right, ${GRID_LINE} 1px, transparent 1px), linear-gradient(to bottom, ${GRID_LINE} 1px, transparent 1px)`,
  backgroundSize: "44px 44px",
};

// Radius of the revealed pool of grid around the cursor.
const GLOW = 280;

type Pt = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Seg = { d: string; start: Pt; end: Pt };

// Distance a segment endpoint clears the block edge (dot sits here).
const GAP = 22;
// How far the safety mask is padded around each text block.
const MASK_PAD = 8;
// Corner radius on the elbow turns.
const RADIUS = 16;

// One connector: drop straight down out of the block, round the corner, run
// horizontally into the next block's near side. Right-angle elbow, one rounded
// turn — matches the hand-drawn routing.
function elbow(s: Pt, e: Pt): string {
  const f = (n: number) => n.toFixed(1);
  const drop = e.y - s.y; // always downward between rows
  const run = e.x - s.x;
  if (Math.abs(run) < 1 || Math.abs(drop) < 1) {
    return `M ${f(s.x)} ${f(s.y)} L ${f(e.x)} ${f(e.y)}`;
  }
  const dx = run >= 0 ? 1 : -1;
  const r = Math.min(RADIUS, Math.abs(drop), Math.abs(run));
  return (
    `M ${f(s.x)} ${f(s.y)} ` +
    `L ${f(s.x)} ${f(e.y - r)} ` +
    `Q ${f(s.x)} ${f(e.y)} ${f(s.x + dx * r)} ${f(e.y)} ` +
    `L ${f(e.x)} ${f(e.y)}`
  );
}

// A single connector line + its two endpoint dots. Draw and dots are driven by
// this connector's own scroll progress, so each one animates independently and
// only once its destination block is in view — reversing when you scroll back.
function Connector({
  seg,
  length,
  progress,
  startFrac,
  span,
  reduce,
}: {
  seg: Seg;
  length: number;
  progress: MotionValue<number>;
  startFrac: number;
  span: number;
  reduce: boolean;
}) {
  // Remap the shared section progress to this connector's own slice, so it only
  // draws after the previous one has finished (and reverses in the same order).
  const local = useTransform(progress, (p) =>
    Math.min(1, Math.max(0, (p - startFrac) / span))
  );
  const dashOffset = useTransform(local, (lp) => (reduce ? 0 : length * (1 - lp)));
  const startOpacity = useTransform(local, (lp) =>
    reduce || lp > 0.001 ? 1 : 0
  );
  const endOpacity = useTransform(local, (lp) => (reduce || lp >= 0.985 ? 1 : 0));

  return (
    <>
      {/* faint full track */}
      <path
        d={seg.d}
        fill="none"
        stroke="var(--accent)"
        strokeOpacity={0.12}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      {/* scroll-drawn line */}
      <motion.path
        d={seg.d}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeDasharray={length}
        style={{ strokeDashoffset: dashOffset }}
      />
      <motion.circle
        cx={seg.start.x}
        cy={seg.start.y}
        r={3.5}
        fill="var(--accent)"
        style={{ opacity: startOpacity }}
      />
      <motion.circle
        cx={seg.end.x}
        cy={seg.end.y}
        r={3.5}
        fill="var(--accent)"
        style={{ opacity: endOpacity }}
      />
    </>
  );
}

export function Process() {
  const t = useTranslations("process");
  const reduce = useReducedMotion() ?? false;
  const uid = useId();
  const maskId = `${uid}-mask`;
  const containerRef = useRef<HTMLDivElement>(null);
  const block0 = useRef<HTMLDivElement>(null);
  const block1 = useRef<HTMLDivElement>(null);
  const block2 = useRef<HTMLDivElement>(null);
  const block3 = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const firstDotRef = useRef<HTMLSpanElement>(null);
  const lastDotRef = useRef<HTMLSpanElement>(null);
  const [mLine, setMLine] = useState({ top: 0, height: 0 });

  const [segs, setSegs] = useState<Seg[]>([]);
  const [segLens, setSegLens] = useState<number[]>([]);
  const [maskRects, setMaskRects] = useState<Rect[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const hovering = useRef(false);
  const inView = useRef(false);

  // Cursor-follow reveal for the grid. Defaults to (and springs back to) the
  // section centre, so it reads as a soft centred glow when idle / on touch.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 150, damping: 30, mass: 0.6 });
  const smy = useSpring(my, { stiffness: 150, damping: 30, mass: 0.6 });
  const gridMask = useMotionTemplate`radial-gradient(circle ${GLOW}px at ${smx}px ${smy}px, #000 0%, #000 48%, transparent 82%)`;
  // Soft accent-tinted pool behind the grid so the moving light reads clearly.
  const glowBg = useMotionTemplate`radial-gradient(circle ${GLOW}px at ${smx}px ${smy}px, color-mix(in oklab, var(--accent) 12%, transparent) 0%, transparent 70%)`;

  // Snap the glow to centre instantly (no spring animation) — used while the
  // layout settles / on resize so the idle glow never drifts on its own.
  const centerNow = useCallback(() => {
    const cx = size.w / 2;
    const cy = size.h / 2;
    mx.jump(cx);
    my.jump(cy);
    smx.jump(cx);
    smy.jump(cy);
  }, [mx, my, smx, smy, size.w, size.h]);

  // Keep the idle glow centred as the section is measured / resized.
  useEffect(() => {
    if (!hovering.current) centerNow();
  }, [centerNow]);

  // Pause the idle roam while the section is off-screen (no wasted frames).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
      },
      { rootMargin: "100px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // When no cursor is over the section, the pool roams on its own along a slow
  // Lissajous path — noticeable, but calm. Cursor takes over on hover.
  useAnimationFrame((t) => {
    if (reduce || hovering.current || !size.w || !inView.current) return;
    const s = t / 1000;
    mx.set(size.w / 2 + Math.sin(s * 1.1) * size.w * 0.28);
    my.set(size.h / 2 + Math.cos(s * 1.5) * size.h * 0.26);
  });

  // One scroll progress for the whole diagram; each connector animates within a
  // contiguous slice of it, so they draw strictly one after another.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.7", "end 0.6"],
  });

  const total = segLens.reduce((a, l) => a + l, 0) || 1;
  const ranges: { start: number; span: number }[] = [];
  {
    let cum = 0;
    for (const len of segLens) {
      ranges.push({ start: cum / total, span: Math.max(len / total, 0.0001) });
      cum += len;
    }
  }

  // Mobile: a single vertical line that draws in sync with scroll.
  const { scrollYProgress: mobileProgress } = useScroll({
    target: mobileRef,
    offset: ["start 0.85", "end 0.65"],
  });
  const mobileFill = useTransform(mobileProgress, (p) =>
    Math.min(1, Math.max(0, p))
  );

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container || window.innerWidth < 640) {
      setSegs([]);
      setMaskRects([]);
      return;
    }
    const c = container.getBoundingClientRect();
    const center = c.width / 2;
    const boxes = [block0, block1, block2, block3].map((ref) => {
      const el = ref.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - c.left;
      return {
        left: r.left - c.left,
        right: r.right - c.left,
        top: r.top - c.top,
        bottom: r.bottom - c.top,
        cx,
        cy: r.top + r.height / 2 - c.top,
        isRight: cx > center,
      };
    });
    if (boxes.some((b) => !b)) return;
    const b = boxes as NonNullable<(typeof boxes)[number]>[];

    // Exit each block from below; arrive at the next block's near side at
    // mid-height. The line lives in the empty band between rows and never
    // crosses the text.
    const exitOf = (blk: (typeof b)[number]): Pt => ({
      x: blk.cx,
      y: blk.bottom + GAP,
    });
    const entryOf = (blk: (typeof b)[number]): Pt => ({
      x: blk.isRight ? blk.left - GAP : blk.right + GAP,
      y: blk.cy,
    });

    const nextSegs: Seg[] = [];
    for (let i = 0; i < b.length - 1; i++) {
      const start = exitOf(b[i]);
      const end = entryOf(b[i + 1]);
      nextSegs.push({ d: elbow(start, end), start, end });
    }

    setSegs(nextSegs);
    setMaskRects(
      b.map((r) => ({
        x: r.left - MASK_PAD,
        y: r.top - MASK_PAD,
        w: r.right - r.left + MASK_PAD * 2,
        h: r.bottom - r.top + MASK_PAD * 2,
      }))
    );
    setSize({ w: c.width, h: c.height });
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // Measure the mobile line's extent (first dot centre → last dot centre).
  useLayoutEffect(() => {
    const measureLine = () => {
      const c = mobileRef.current;
      const a = firstDotRef.current;
      const b = lastDotRef.current;
      if (!c || !a || !b) return;
      const cr = c.getBoundingClientRect();
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const top = ar.top + ar.height / 2 - cr.top;
      const bottom = br.top + br.height / 2 - cr.top;
      setMLine({ top, height: Math.max(0, bottom - top) });
    };
    measureLine();
    const ro = new ResizeObserver(measureLine);
    if (mobileRef.current) ro.observe(mobileRef.current);
    window.addEventListener("resize", measureLine);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureLine);
    };
  }, []);

  // Measure each connector's length for its dash animation.
  useEffect(() => {
    if (segs.length === 0) {
      setSegLens([]);
      return;
    }
    const tmp = document.createElementNS("http://www.w3.org/2000/svg", "path");
    setSegLens(
      segs.map((s) => {
        tmp.setAttribute("d", s.d);
        return tmp.getTotalLength();
      })
    );
  }, [segs]);

  const ready = segs.length > 0 && segLens.length === segs.length;

  return (
    <section id="process" className="mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-xl text-muted">{t("subtitle")}</p>
      </Reveal>

      {/* Desktop: each connector draws as its next step scrolls into view */}
      <div
        ref={containerRef}
        className="relative mt-16 hidden sm:block"
        onPointerMove={(e) => {
          if (reduce) return;
          const rect = e.currentTarget.getBoundingClientRect();
          hovering.current = true;
          mx.set(e.clientX - rect.left);
          my.set(e.clientY - rect.top);
        }}
        onPointerLeave={() => {
          hovering.current = false;
          // Animate smoothly back to centre (spring), unlike the instant snap.
          mx.set(size.w / 2);
          my.set(size.h / 2);
        }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: glowBg }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            ...GRID_STYLE,
            maskImage: gridMask,
            WebkitMaskImage: gridMask,
          }}
        />

        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        >
          <defs>
            {/* Punch the text blocks out of the line so it reads as passing
                behind the text — never over or under it. */}
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <rect x={0} y={0} width={size.w} height={size.h} fill="white" />
              {maskRects.map((r, i) => (
                <rect
                  key={i}
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  rx={12}
                  fill="black"
                />
              ))}
            </mask>
          </defs>

          {ready && (
            <g mask={`url(#${maskId})`}>
              {segs.map((seg, i) => (
                <Connector
                  key={i}
                  seg={seg}
                  length={segLens[i]}
                  progress={scrollYProgress}
                  startFrac={ranges[i].start}
                  span={ranges[i].span}
                  reduce={reduce}
                />
              ))}
            </g>
          )}
        </svg>

        <div className="grid grid-cols-2 gap-x-12 gap-y-32">
          <div ref={block0} className="col-start-1 row-start-1 justify-self-start">
            <Reveal>
              <StepBlock index={0} title={t("steps.discover.title")} description={t("steps.discover.description")} />
            </Reveal>
          </div>
          <div ref={block1} className="col-start-2 row-start-2 justify-self-center">
            <Reveal delay={0.1}>
              <StepBlock index={1} title={t("steps.build.title")} description={t("steps.build.description")} />
            </Reveal>
          </div>
          <div ref={block2} className="col-start-1 row-start-3 justify-self-start">
            <Reveal delay={0.1}>
              <StepBlock index={2} title={t("steps.seo.title")} description={t("steps.seo.description")} />
            </Reveal>
          </div>
          <div ref={block3} className="col-start-2 row-start-4 justify-self-center">
            <Reveal delay={0.1}>
              <StepBlock index={3} title={t("steps.launch.title")} description={t("steps.launch.description")} />
            </Reveal>
          </div>
        </div>
      </div>

      {/* Mobile: vertical flow */}
      <div ref={mobileRef} className="relative mt-12 sm:hidden">
        {/* faint full track */}
        <span
          aria-hidden
          className="absolute left-[5px] w-px bg-accent/20"
          style={{ top: mLine.top, height: mLine.height }}
        />
        {/* scroll-synced fill */}
        <motion.span
          aria-hidden
          className="absolute left-[5px] w-px origin-top bg-accent"
          style={{
            top: mLine.top,
            height: mLine.height,
            scaleY: reduce ? 1 : mobileFill,
          }}
        />
        {STEPS.map((key, i) => (
          <div key={key} className="relative pb-10 pl-8 last:pb-0">
            <span
              ref={
                i === 0
                  ? firstDotRef
                  : i === STEPS.length - 1
                    ? lastDotRef
                    : undefined
              }
              aria-hidden
              className="absolute left-0 top-[7px] h-2.5 w-2.5 rounded-full bg-accent"
            />
            <Reveal delay={i * 0.05}>
              <StepBlock
                index={i}
                title={t(`steps.${key}.title`)}
                description={t(`steps.${key}.description`)}
              />
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}
