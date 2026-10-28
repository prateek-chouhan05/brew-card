"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { timer, type TimerBrew } from "@/lib/timer";
import { drawBrewLine, drawChamberClock, drawCount, moment, readPalette, type DrawEnv, type Moment, type Palette } from "@/lib/brewDraw";

export type BrewCanvasKind = "clock" | "line" | "count";

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      try { const q = window.matchMedia("(prefers-reduced-motion: reduce)"); q.addEventListener("change", cb); return () => q.removeEventListener("change", cb); }
      catch { return () => {}; }
    },
    () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } },
    () => false,
  );
}

/**
 * One of the brew drawings, on a canvas that follows the timer.
 *
 * React renders the canvas once. Drawing happens outside React: on every timer change, and on
 * every display frame while the brew runs, the canvas is on screen and motion is allowed.
 * The current phase and seconds left are mirrored on data attributes, for tests and debugging.
 */
export function BrewCanvas({ tb, kind, water, className, label }: { tb: TimerBrew; kind: BrewCanvasKind; water?: number; className?: string; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const tbRef = useRef(tb);
  tbRef.current = tb;
  const reduced = useReducedMotion();

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let w = 0, h = 0, dpr = 1, amb = 0, last = 0, raf = 0, visible = true;
    let P: Palette = readPalette(cv);
    const family = getComputedStyle(document.documentElement).getPropertyValue("--display").trim() || "system-ui, sans-serif";

    const size = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(2.5, window.devicePixelRatio || 1);
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    };
    const now = (): Moment => {
      const b = tbRef.current, owns = timer.owns(b);
      return moment(b.segs, b.o === "inverted", owns ? timer.elapsed() : 0, {
        started: owns && timer.startedAt > 0, finished: owns && timer.finished, running: owns && timer.running, reduced,
      });
    };
    const draw = () => {
      if (!w || !h) return;
      const m = now();
      const env: DrawEnv = { P, family, reduced, amb };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      if (kind === "clock") drawChamberClock(ctx, w, h, m, env);
      else if (kind === "line") drawBrewLine(ctx, w, h, m, env, water);
      else drawCount(ctx, w, h, m, env);
      const phase = m.finished ? "done" : m.started ? m.seg.k : "ready";
      if (cv.dataset.phase !== phase) cv.dataset.phase = phase;
      const left = String(m.left);
      if (cv.dataset.left !== left) cv.dataset.left = left;
    };
    const shouldRun = () => !reduced && visible && timer.owns(tbRef.current) && timer.running;
    const loop = (t: number) => {
      const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
      last = t; amb += dt;
      draw();
      raf = shouldRun() ? requestAnimationFrame(loop) : 0;
      if (!raf) last = 0;
    };
    const kick = () => { if (!raf && shouldRun()) { last = 0; raf = requestAnimationFrame(loop); } };

    const unsub = timer.subscribe(() => { if (!raf) draw(); kick(); });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { size(); draw(); }) : null;
    ro?.observe(cv);
    const io = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((ents) => { visible = !!ents[0]?.isIntersecting; if (visible) { draw(); kick(); } })
      : null;
    io?.observe(cv);
    // redraw once the brand face has loaded, so the numbers are set in it
    document.fonts?.ready.then(() => { P = readPalette(cv); draw(); }).catch(() => {});
    size(); draw(); kick();
    return () => { unsub(); ro?.disconnect(); io?.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [tb.key, kind, water, reduced]);

  return <canvas ref={ref} className={"brew-canvas " + kind + (className ? " " + className : "")} role="img" aria-label={label} />;
}
