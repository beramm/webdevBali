"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { useTranslations } from "next-intl";
import { MagneticButton } from "./magnetic-button";
import { useSplash } from "./splash";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;
const FRAME_COUNT = 60; // /public/hero/seq/001.jpg … 060.jpg

function WordReveal({
  text,
  skipIntro,
  wordClassName,
}: {
  text: string;
  skipIntro: boolean;
  wordClassName?: string;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  return (
    <span>
      {words.map((word, i) => (
        <span
          key={i}
          className={`inline-block overflow-hidden pb-1 align-bottom ${
            i < words.length - 1 ? "mr-[0.28em]" : ""
          }`}
        >
          <motion.span
            className={`inline-block ${wordClassName ?? ""}`}
            initial={
              skipIntro
                ? false
                : reduce
                  ? { opacity: 0 }
                  : { y: "110%", opacity: 0, filter: "blur(8px)" }
            }
            animate={
              reduce
                ? { opacity: 1 }
                : { y: "0%", opacity: 1, filter: "blur(0px)" }
            }
            transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease: EASE }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  const t = useTranslations("hero");
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const curIdxRef = useRef(0);

  // How the hero background renders:
  //  scrub    — desktop: scrub the <video> timeline on scroll (smooth, cheap).
  //  sequence — mobile: draw a preloaded image frame to a <canvas>. Mobile
  //             Safari can't reliably paint a seeked <video>; static images
  //             always paint, so scrubbing works everywhere.
  //  static   — reduced motion: just the poster.
  const [mode, setMode] = useState<"scrub" | "sequence" | "static">("static");
  useLayoutEffect(() => {
    if (reduce) {
      setMode("static");
      return;
    }
    const desktop = window.matchMedia("(min-width: 640px)").matches;
    setMode(desktop ? "scrub" : "sequence");
  }, [reduce]);

  // Draw one sequence frame onto the canvas (object-cover math).
  const drawSeq = useCallback((idx: number) => {
    const c = canvasRef.current;
    const img = framesRef.current[idx];
    if (!c || !img || !img.complete || !img.naturalWidth) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const scale = Math.max(
      c.width / img.naturalWidth,
      c.height / img.naturalHeight
    );
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
  }, []);

  // Preload the frame sequence (mobile only).
  useLayoutEffect(() => {
    if (mode !== "sequence") return;
    const imgs: HTMLImageElement[] = [];
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = `/hero/seq/${String(i).padStart(3, "0")}.jpg`;
      img.onload = () => {
        if (i - 1 === curIdxRef.current) drawSeq(curIdxRef.current);
      };
      imgs.push(img);
    }
    framesRef.current = imgs;
  }, [mode, drawSeq]);

  // Size the canvas device-pixel-sharp and repaint the current frame on resize.
  useLayoutEffect(() => {
    if (mode !== "sequence") return;
    const c = canvasRef.current;
    if (!c) return;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = c.getBoundingClientRect();
      c.width = Math.round(rect.width * dpr);
      c.height = Math.round(rect.height * dpr);
      drawSeq(curIdxRef.current);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    return () => ro.disconnect();
  }, [mode, drawSeq]);

  // Entrance waits for the splash curtain and must not replay when the
  // component mounts mid-scroll (locale switch, fast refresh).
  const { splashDone } = useSplash();
  const [intro, setIntro] = useState<"pending" | "play" | "skip">("pending");
  useLayoutEffect(() => {
    if (!splashDone) return;
    setIntro(window.scrollY > 80 ? "skip" : "play");
  }, [splashDone]);
  const skipIntro = intro === "skip";

  // The section is 300vh tall; the inner stage is sticky, so scrolling
  // through it drives the video timeline instead of moving the page.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // All scroll-driven values are computed in one JS event handler instead
  // of useTransform style bindings: Motion offloads style-bound scroll
  // values to the native ScrollTimeline, whose progress mapping disagrees
  // with the JS one on pinned sections (values bounced back near the end).
  const contentY = useMotionValue("0%");
  const contentOpacity = useMotionValue(1);
  const contentBlurPx = useMotionValue(0);
  const contentBlur = useMotionTemplate`blur(${contentBlurPx}px)`;
  const hintOpacity = useMotionValue(1);
  const darkenOpacity = useMotionValue(0);
  const fadeOpacity = useMotionValue(0);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (reduce) return;
    const ramp = (from: number, to: number) =>
      Math.min(1, Math.max(0, (progress - from) / (to - from)));

    // Scrub the footage across the first 80% of the scroll range.
    const scrub = ramp(0, 0.8);
    if (mode === "scrub") {
      const video = videoRef.current;
      if (video && video.duration) {
        const target = scrub * (video.duration - 0.05);
        if (Math.abs(video.currentTime - target) > 0.01) {
          video.currentTime = target;
        }
      }
    } else if (mode === "sequence") {
      const idx = Math.min(
        FRAME_COUNT - 1,
        Math.round(scrub * (FRAME_COUNT - 1))
      );
      if (idx !== curIdxRef.current) {
        curIdxRef.current = idx;
        drawSeq(idx);
      }
    }

    // Text block: single exit (fade + blur + drift), stays hidden after.
    const exit = ramp(0.08, 0.32);
    contentOpacity.set(1 - exit);
    contentY.set(`${(-24 * exit).toFixed(2)}%`);
    contentBlurPx.set(6 * exit);

    hintOpacity.set(1 - ramp(0, 0.08));

    // Two-stage dissolve: darken toward the page colour, then fade to bg.
    darkenOpacity.set(ramp(0.45, 0.8));
    fadeOpacity.set(ramp(0.75, 0.96));
  });

  return (
    <section ref={sectionRef} id="top" className="relative h-[200vh] sm:h-[300vh]">
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden">
        {/* Background: poster always underneath, so a real frame shows even
            before the video/canvas paints — never a bare colour. */}
        <div className="absolute inset-0 bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero/poster.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          {mode === "scrub" && (
            <video
              ref={videoRef}
              aria-hidden
              tabIndex={-1}
              className="absolute inset-0 h-full w-full object-cover"
              src="/hero/bali.mp4"
              poster="/hero/poster.jpg"
              muted
              playsInline
              preload="auto"
            />
          )}
          {mode === "sequence" && (
            <canvas
              ref={canvasRef}
              aria-hidden
              className="absolute inset-0 h-full w-full"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/30 to-zinc-950/60" />
        </div>

        {intro !== "pending" && (
          <motion.div
            style={
              reduce
                ? undefined
                : { y: contentY, opacity: contentOpacity, filter: contentBlur }
            }
            className="relative z-10 mx-auto max-w-5xl px-6 text-center"
          >
            <motion.p
              initial={skipIntro ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
              className="mb-6 text-xs font-medium uppercase tracking-[0.22em] text-amber-300/90"
            >
              {t("eyebrow")}
            </motion.p>

            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-7xl lg:text-8xl">
              <WordReveal text={t("titleLine1")} skipIntro={skipIntro} />
              <br />
              {/* Marker-highlight band drawn as the text's own background so
                  it hugs each line (box-decoration-break) instead of becoming
                  a full-width slab when the phrase wraps on mobile. */}
              <motion.span
                className="relative inline [-webkit-box-decoration-break:clone] [box-decoration-break:clone]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(251,191,36,0.85) 0 0)",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "0 88%",
                }}
                initial={
                  skipIntro || reduce
                    ? { backgroundSize: "100% 0.32em" }
                    : { backgroundSize: "0% 0.32em" }
                }
                animate={{ backgroundSize: "100% 0.32em" }}
                transition={{ duration: 0.6, delay: 1.05, ease: EASE }}
              >
                <WordReveal text={t("titleHighlight")} skipIntro={skipIntro} />
              </motion.span>
            </h1>

            <motion.p
              initial={skipIntro ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
              className="mx-auto mt-8 max-w-2xl text-base text-zinc-300 sm:text-lg"
            >
              {t("subtitle")}
            </motion.p>

            <motion.div
              initial={skipIntro ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9, ease: EASE }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <MagneticButton href="#work">{t("ctaPrimary")}</MagneticButton>
              <MagneticButton href="#contact" variant="link" tone="dark">
                {t("ctaSecondary")}
              </MagneticButton>
            </motion.div>
          </motion.div>
        )}

        {/* Reduced motion skips the scroll dissolve — keep a static bridge. */}
        {intro !== "pending" && reduce && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[18vh] bg-gradient-to-b from-transparent to-background" />
        )}

        {/* Scroll-driven dissolve: darken toward the page colour, then fade. */}
        <motion.div
          style={{ opacity: reduce ? 0 : darkenOpacity }}
          className="pointer-events-none absolute inset-0 z-20 bg-[var(--hero-dissolve)]"
        />
        <motion.div
          style={{ opacity: reduce ? 0 : fadeOpacity }}
          className="pointer-events-none absolute inset-0 z-20 bg-background"
        />

        <motion.div
          initial={skipIntro ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-zinc-400"
        >
          <motion.div
            style={reduce ? undefined : { opacity: hintOpacity }}
            className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em]"
          >
            <motion.span
              animate={reduce ? undefined : { y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2"
            >
              {t("scroll")}
              <span className="block h-8 w-px bg-gradient-to-b from-zinc-400 to-transparent" />
            </motion.span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
