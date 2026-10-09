"use client";

/**
 * A two-part cursor for the marketing surfaces (landing, auth, 404).
 *
 * The dot tracks the pointer exactly; the ring follows with inertia, swells
 * over anything clickable and, over an element carrying `data-cursor="…"`,
 * turns into a label ("Oku", "Sürükle"). It is deliberately absent from the
 * game screens: a manager scanning a 30-row squad table wants a precise
 * native pointer, not a flourish.
 *
 * Pointer-fine devices only, and never with reduced motion.
 */
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ZONES = ["/", "/login", "/register"];

export function Cursor() {
  const pathname = usePathname();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const ok =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const on = ok && (ZONES.includes(pathname) || !!document.querySelector("[data-cursor-zone]"));
    setEnabled(on);
    document.documentElement.toggleAttribute("data-cursor-on", on);
    return () => document.documentElement.removeAttribute("data-cursor-on");
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { ...pos };
    let raf = 0;
    let hover = false;
    let down = false;
    let visible = false;

    const tick = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      if (dot.current)
        dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${hover ? 0 : 1})`;
      if (ring.current)
        ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%) scale(${down ? 0.85 : 1})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!visible) {
        visible = true;
        ringPos.x = pos.x;
        ringPos.y = pos.y;
        dot.current?.setAttribute("data-visible", "");
        ring.current?.setAttribute("data-visible", "");
      }
      const t = e.target as Element | null;
      const labelled = t?.closest?.("[data-cursor]") as HTMLElement | null;
      const clickable = t?.closest?.("a, button, [role='button'], label, summary, input[type='range']");
      const nextLabel = labelled?.dataset.cursor ?? null;
      hover = !!clickable || !!nextLabel;
      setLabel((prev) => (prev === nextLabel ? prev : nextLabel));
      ring.current?.toggleAttribute("data-hover", hover && !nextLabel);
      ring.current?.toggleAttribute("data-label", !!nextLabel);
      const field = t?.closest?.("input:not([type='range']), textarea, select, [contenteditable]");
      ring.current?.toggleAttribute("data-hidden", !!field);
      dot.current?.toggleAttribute("data-hidden", !!field);
    };
    const onDown = () => (down = true);
    const onUp = () => (down = false);
    const onOut = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      visible = false;
      dot.current?.removeAttribute("data-visible");
      ring.current?.removeAttribute("data-visible");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerout", onOut);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerout", onOut);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden>
        <span>{label}</span>
      </div>
      <div ref={dot} className="cursor-dot" aria-hidden />
    </>
  );
}
