"use client";

/**
 * Inertial scrolling for the long-form landing page only.
 *
 * Lenis interpolates the native scroll position, so `position: sticky`,
 * IntersectionObserver and framer-motion's `useScroll` keep working — they
 * all read the real scroll offset. In-page anchors are routed through Lenis
 * so the nav links glide instead of jumping.
 *
 * The game screens deliberately do not get this: they have nested scroll
 * areas (bench lists, chat, tables) where smoothing fights the user.
 */
import Lenis from "lenis";
import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      anchors: { offset: -72 },
    });
    // Smooth scroll on <html> would double-smooth every Lenis frame.
    document.documentElement.classList.add("lenis-on");
    // Hold still while the intro curtain is up.
    const onIntro = () => lenis.start();
    if (!document.documentElement.hasAttribute("data-intro-done")) {
      lenis.stop();
      window.addEventListener("ef:intro-done", onIntro, { once: true });
    }
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("ef:intro-done", onIntro);
      lenis.destroy();
      document.documentElement.classList.remove("lenis-on");
    };
  }, []);
  return null;
}
