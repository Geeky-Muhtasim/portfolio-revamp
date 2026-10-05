"use client";

import { useEffect } from "react";
import { hasFinePointer } from "../device";
import { motion } from "../tokens";

const CLICKABLE = "a[href], button:not(:disabled), [role='button'], label, summary";

/**
 * A thin blade edge replaces the pointer on desktop. Fast movement leaves
 * an ink trail that dries and fades over about 900 ms. Over anything
 * clickable the edge turns jade. Touch devices keep their own behaviour.
 */
export function BladeCursor({ trail }: { trail: boolean }) {
  useEffect(() => {
    if (!hasFinePointer()) return;
    const root = document.documentElement;
    const edge = document.createElement("div");
    edge.className = "cursor-edge";
    edge.setAttribute("aria-hidden", "true");
    const canvas = document.createElement("canvas");
    canvas.className = "cursor-trail";
    canvas.setAttribute("aria-hidden", "true");
    document.body.append(canvas, edge);
    root.classList.add("blade-cursor");

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    type P = { x: number; y: number; t: number; w: number };
    let points: P[] = [];
    let last: P | null = null;
    let raf = 0;

    const paint = () => {
      raf = 0;
      if (!ctx) return;
      const now = performance.now();
      points = points.filter((p) => now - p.t < motion.trailFadeMs);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = "round";
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]!, b = points[i]!;
        if (b.t - a.t > 80) continue;
        const age = (now - b.t) / motion.trailFadeMs;
        // Wet ink reads warm and full; as it dries it cools to steel and thins.
        const wet = 1 - age;
        ctx.strokeStyle = `rgba(${Math.round(138 + 99 * wet)}, ${Math.round(145 + 85 * wet)}, ${Math.round(150 + 64 * wet)}, ${0.38 * wet * wet})`;
        ctx.lineWidth = b.w * (0.4 + 0.6 * wet);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      if (points.length) raf = requestAnimationFrame(paint);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const now = performance.now();
      edge.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      edge.classList.add("is-visible");
      const target = e.target instanceof Element ? e.target.closest(CLICKABLE) : null;
      edge.classList.toggle("is-action", Boolean(target));
      if (trail && last) {
        const dt = Math.max(1, now - last.t);
        const speed = Math.hypot(e.clientX - last.x, e.clientY - last.y) / dt;
        if (speed > 0.9) {
          points.push({ x: e.clientX, y: e.clientY, t: now, w: Math.min(3, 0.6 + speed * 0.5) });
          if (!raf) raf = requestAnimationFrame(paint);
        }
      }
      last = { x: e.clientX, y: e.clientY, t: now, w: 0 };
    };
    const onLeave = () => edge.classList.remove("is-visible");
    const onDown = () => edge.classList.add("is-pressed");
    const onUp = () => edge.classList.remove("is-pressed");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("resize", resize);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", resize);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      root.classList.remove("blade-cursor");
      edge.remove();
      canvas.remove();
    };
  }, [trail]);

  return null;
}
