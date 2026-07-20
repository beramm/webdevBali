"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const EASE = [0.76, 0, 0.24, 1] as const;
const MIN_SHOW_MS = 1400;

const SplashContext = createContext({ splashDone: false });

export function useSplash() {
  return useContext(SplashContext);
}

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  // Rendered on the server so the curtain is part of the first HTML paint.
  const [visible, setVisible] = useState(true);
  const [splashDone, setSplashDone] = useState(false);

  // Only the first load of a browser session gets the splash — repeat
  // visits/navigations remove it before paint.
  useLayoutEffect(() => {
    if (sessionStorage.getItem("splash-shown")) {
      setVisible(false);
      setSplashDone(true);
    }
  }, []);

  useEffect(() => {
    if (splashDone) return;
    sessionStorage.setItem("splash-shown", "1");

    const start = performance.now();
    const finish = () => {
      const elapsed = performance.now() - start;
      window.setTimeout(
        () => {
          // Entrance below starts while the curtain lifts.
          setSplashDone(true);
          setVisible(false);
        },
        Math.max(0, MIN_SHOW_MS - elapsed)
      );
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      // Never hold the page hostage on a slow asset.
      const cap = window.setTimeout(finish, 3500);
      return () => {
        window.removeEventListener("load", finish);
        window.clearTimeout(cap);
      };
    }
  }, [splashDone]);

  const letters = "webdev.bali".split("");

  return (
    <SplashContext.Provider value={{ splashDone }}>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="splash"
            exit={
              reduce
                ? { opacity: 0, transition: { duration: 0.4 } }
                : { y: "-100%", transition: { duration: 0.8, ease: EASE } }
            }
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950"
            aria-hidden
          >
            <p className="flex overflow-hidden text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {letters.map((letter, i) => (
                <motion.span
                  key={i}
                  initial={reduce ? { opacity: 0 } : { y: "110%", opacity: 0 }}
                  animate={reduce ? { opacity: 1 } : { y: "0%", opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.15 + i * 0.045,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  className={letter === "." || i > 6 ? "text-amber-400" : ""}
                >
                  {letter}
                </motion.span>
              ))}
            </p>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: MIN_SHOW_MS / 1000, ease: "easeInOut" }}
              className="mt-6 block h-px w-40 origin-left bg-gradient-to-r from-amber-400 to-emerald-400"
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </SplashContext.Provider>
  );
}
