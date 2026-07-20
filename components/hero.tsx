"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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

  // Paint the current video frame onto the canvas (object-cover math). The
  // canvas always renders, sidestepping iOS refusing to paint a seeked <video>.
  const drawFrame = useCallback(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || !v.videoWidth) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const scale = Math.max(c.width / v.videoWidth, c.height / v.videoHeight);
    const dw = v.videoWidth * scale;
    const dh = v.videoHeight * scale;
    ctx.drawImage(v, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
  }, []);

  // Entrance waits for the splash curtain and must not replay when the
  // component mounts mid-scroll (locale switch, fast refresh).
  const { splashDone } = useSplash();
  const [intro, setIntro] = useState<"pending" | "play" | "skip">("pending");
  useLayoutEffect(() => {
    if (!splashDone) return;
    setIntro(window.scrollY > 80 ? "skip" : "play");
  }, [splashDone]);
  const skipIntro = intro === "skip";

  // Scroll drives the video timeline on every device; reduced motion shows the
  // static poster.
  const [mode, setMode] = useState<"scrub" | "static">("static");
  useLayoutEffect(() => {
    setMode(reduce ? "static" : "scrub");
  }, [reduce]);

  // iOS blanks a seeked <video> that has never played, so "prime" the decoder
  // once (muted play → pause) before scrubbing. Harmless on desktop.
  useLayoutEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (mode === "static") {
      v.pause();
      v.currentTime = 0;
      return;
    }
    let cancelled = false;
    const prime = () => {
      v.play()
        .then(() => {
          if (!cancelled) v.pause();
        })
        .catch(() => {});
    };
    if (v.readyState >= 2) prime();
    else v.addEventListener("loadeddata", prime, { once: true });
    return () => {
      cancelled = true;
      v.removeEventListener("loadeddata", prime);
    };
  }, [mode]);

  // Size the canvas to its box (device-pixel-sharp) and repaint on resize.
  useLayoutEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = c.getBoundingClientRect();
      c.width = Math.round(rect.width * dpr);
      c.height = Math.round(rect.height * dpr);
      drawFrame();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    return () => ro.disconnect();
  }, [drawFrame]);

  // Repaint the canvas whenever the video has a new frame to show.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const draw = () => drawFrame();
    v.addEventListener("seeked", draw);
    v.addEventListener("loadeddata", draw);
    v.addEventListener("timeupdate", draw);
    return () => {
      v.removeEventListener("seeked", draw);
      v.removeEventListener("loadeddata", draw);
      v.removeEventListener("timeupdate", draw);
    };
  }, [drawFrame]);

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

    // Video scrub across the first 80% of the scroll range (desktop only).
    const video = videoRef.current;
    if (mode === "scrub" && video && video.duration) {
      const target = ramp(0, 0.8) * (video.duration - 0.05);
      if (Math.abs(video.currentTime - target) > 0.01) {
        video.currentTime = target;
      }
    }

    // Text block: single exit (fade + blur + drift), stays hidden after.
    const exit = ramp(0.08, 0.32);
    contentOpacity.set(1 - exit);
    contentY.set(`${(-24 * exit).toFixed(2)}%`);
    contentBlurPx.set(6 * exit);

    hintOpacity.set(1 - ramp(0, 0.08));

    // Two-stage dissolve: darken the video first, then fade to the page
    // background — a straight fade to a light background reads as a milky
    // wash over the dark video.
    darkenOpacity.set(ramp(0.45, 0.8));
    fadeOpacity.set(ramp(0.75, 0.96));
  });

  return (
    <section ref={sectionRef} id="top" className="relative h-[200vh] sm:h-[300vh]">
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden">
        {/* Video decodes off-screen (opacity 0); the canvas is what paints,
            so iOS can't blank the seeked frame. Gradient shows only until the
            first frame draws. */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-zinc-950 to-amber-950">
          <video
            ref={videoRef}
            aria-hidden
            tabIndex={-1}
            className="absolute inset-0 h-full w-full object-cover opacity-0"
            src="/hero/bali.mp4"
            poster="/hero/poster.jpg"
            muted
            playsInline
            preload="auto"
          />
          <canvas
            ref={canvasRef}
            aria-hidden
            className="absolute inset-0 h-full w-full"
          />
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

        {/* Reduced motion skips the scroll dissolve — keep a static bridge.
            Gated on `intro` (set post-mount) so SSR and first client render
            match and reduced-motion users don't hit a hydration mismatch. */}
        {intro !== "pending" && reduce && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[18vh] bg-gradient-to-b from-transparent to-background" />
        )}

        {/* Scroll-driven dissolve: first stage resolves toward the page colour
            (near-black in dark, page-white in light — so light mode fades to
            white instead of flashing to black), then a second fade to bg. */}
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
