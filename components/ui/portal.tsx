"use client";

/**
 * Renders children into <body>.
 *
 * A `position: fixed` overlay anchors to the nearest ancestor with a
 * transform, filter or animation in flight — page-entrance animations and
 * hover lifts included — so an inline modal could open inside its card
 * instead of over the screen. Portalled, it always covers the viewport.
 */
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Portal({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setEl(document.body), []);
  return el ? createPortal(children, el) : null;
}
