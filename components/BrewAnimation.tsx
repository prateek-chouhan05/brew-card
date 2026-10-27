"use client";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { timer, type TimerBrew } from "@/lib/timer";

/*
 * An AeroPress that follows the timer: water fills as you pour, the spoon moves while you stir,
 * the brew darkens while it steeps, it turns over at the flip, and the plunger presses coffee into the mug.
 *
 * Performance: React renders the drawing only when the phase changes. Between phases a
 * requestAnimationFrame loop writes transforms and opacities straight onto a few SVG groups,
 * so nothing is laid out or re-rendered per frame. The loop runs only while the brew runs,
 * the drawing is on screen and the tab is visible. Under reduced motion it never runs and the
 * drawing shows each step already done, changing only from phase to phase.
 */

/* Brewer geometry, drawn upright (cap at the bottom). Chamber inside runs from y=62 to y=158. */
const IN_TOP = 62, IN_BOT = 158, IN_H = IN_BOT - IN_TOP;
/* The brewer turns about this point; 180° maps y to 194 − y. */
const PIVOT_X = 100, PIVOT_Y = 97;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
/** quart in-out: for something that travels while you watch it (the flip) */
const easeInOut = (x: number) => (x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2);

interface Geo {
  idx: number;
  k: string | null;
  started: boolean;
  finished: boolean;
  running: boolean;
  inverted: boolean;
  preFlip: boolean;
  angle: number;
  /** liquid in brewer coordinates */
  liquidTop: number;
  liquidH: number;
  /** 0 = fresh pale water, 1 = fully steeped */
  dark: number;
  sealY: number;
  plungerOp: number;
  groundsY: number;
  groundsOp: number;
  mugFill: number;
  scaleOp: number;
  /** top of the brew on screen, for the kettle stream and the spoon */
  surfaceY: number;
}

/** Where the brew is right now, read straight from the timer. */
function geometry(tb: TimerBrew, reduced: boolean): Geo {
  const owns = timer.owns(tb);
  const segs = tb.segs;
  const marks: number[] = [];
  let total = 0;
  for (const s of segs) { marks.push(total); total += s.dur; }
  const started = owns && timer.startedAt > 0;
  const finished = owns && timer.finished;
  const running = owns && timer.running;
  let t = Math.min(owns ? timer.elapsed() : 0, total);
  let idx = 0;
  marks.forEach((m, i) => { if (t + 0.0001 >= m) idx = i; });
  // reduced motion: no travel inside a phase — each step is shown as it will look when done
  if (reduced && started && !finished) t = Math.min(total, marks[idx] + segs[idx].dur) - 0.001;
  const cur = segs[idx];
  const into = Math.min(cur.dur, Math.max(0, t - marks[idx]));
  const p = cur.dur ? into / cur.dur : 0;
  const inverted = tb.o === "inverted";

  const pourTotal = segs.reduce((a, s) => a + (s.k === "pour" ? s.dur : 0), 0) || 1;
  let poured = 0;
  segs.forEach((s, i) => { if (s.k !== "pour") return; if (finished || i < idx) poured += s.dur; else if (i === idx && started) poured += into; });
  const fill = started ? Math.min(1, poured / pourTotal) : 0;

  const pressIdx = segs.findIndex((s) => s.k === "press");
  const flipIdx = segs.findIndex((s) => s.k === "flip");
  const press = finished || (pressIdx >= 0 && idx > pressIdx) ? 1 : idx === pressIdx && started ? p : 0;
  const preFlip = inverted && flipIdx >= 0 && !finished && (!started || idx < flipIdx);
  const flipping = inverted && started && !finished && idx === flipIdx;
  // the flip phase is mostly getting the cap and mug ready; the brewer turns over in its last third
  const turn = flipping ? easeInOut(clamp01((p - 0.65) / 0.35)) : 0;
  const angle = preFlip ? 180 : flipping ? 180 * (1 - turn) : 0;
  const upsideDown = preFlip || (flipping && turn < 0.5);

  const steep = started ? (finished ? 1 : t / Math.max(1, pressIdx >= 0 ? marks[pressIdx] : total)) : 0;

  const anyPoured = fill > 0.02;
  const sealY = lerp(IN_TOP, IN_BOT - 4, press);
  const room = IN_BOT - (sealY + 8);
  let liquidH = Math.max(0, Math.min(fill * (IN_H - 8), room));
  if (press >= 1) liquidH = 0;
  // upside-down, the brew rests on the plunger seal (the top end in brewer coordinates)
  const liquidTop = upsideDown ? sealY + 8 : IN_BOT - liquidH;
  const surfaceY = upsideDown ? 2 * PIVOT_Y - (liquidTop + liquidH) : liquidTop;

  return {
    idx, k: started && !finished ? cur.k : null, started, finished, running, inverted, preFlip,
    angle, liquidTop, liquidH, dark: Math.min(1, steep * 1.15), sealY,
    plungerOp: inverted ? 1 : clamp01((fill - 0.02) / 0.04),
    groundsY: upsideDown ? sealY + 8 : IN_BOT - 9, groundsOp: started && anyPoured ? 0 : 1,
    mugFill: press * 0.82,
    scaleOp: preFlip ? 1 : flipping ? 1 - clamp01((turn - 0.15) / 0.3) : 0,
    surfaceY,
  };
}

/** Changes only when the drawing's structure changes: who owns the timer, run state, phase. */
function structureKey(tb: TimerBrew) {
  const owns = timer.owns(tb);
  if (!owns) return "idle";
  let idx = 0;
  const t = timer.elapsed();
  timer.marks.forEach((m, i) => { if (t + 0.0001 >= m) idx = i; });
  return `${timer.startedAt > 0 ? 1 : 0}${timer.finished ? 1 : 0}${timer.running ? 1 : 0}:${idx}`;
}

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

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const T = {
  brewer: (g: Geo) => `rotate(${g.angle} ${PIVOT_X} ${PIVOT_Y})`,
  liquid: (g: Geo) => `translate(0 ${g.liquidTop}) scale(1 ${g.liquidH})`,
  bubbles: (g: Geo) => `translate(0 ${g.liquidTop + g.liquidH})`,
  grounds: (g: Geo) => `translate(0 ${g.groundsY})`,
  plunger: (g: Geo) => `translate(0 ${g.sealY})`,
  // the coffee in the mug: a tall rect slid up as the mug fills
  mug: (g: Geo) => `translate(0 ${38 - g.mugFill * 38})`,
  // clips that end the kettle stream at the brew surface and the drip at the coffee in the mug
  stream: (g: Geo) => `translate(0 42) scale(1 ${Math.max(0.01, g.surfaceY - 42)})`,
  spoon: (g: Geo) => `translate(0 ${g.surfaceY})`,
};

export function BrewAnimation({ tb, size = "md" }: { tb: TimerBrew; size?: "md" | "lg" }) {
  const reduced = useReducedMotion();
  // re-render on phase changes only; the frames in between are written directly below
  useSyncExternalStore(timer.subscribe, () => structureKey(tb), () => "idle");
  const g = geometry(tb, reduced);

  const svgRef = useRef<SVGSVGElement>(null);
  const r = {
    brewer: useRef<SVGGElement>(null), liquid: useRef<SVGGElement>(null), dark: useRef<SVGRectElement>(null),
    bubbles: useRef<SVGGElement>(null), grounds: useRef<SVGGElement>(null), plunger: useRef<SVGGElement>(null),
    mug: useRef<SVGRectElement>(null), scale: useRef<SVGGElement>(null), cup: useRef<SVGGElement>(null),
    stream: useRef<SVGRectElement>(null), spoon: useRef<SVGGElement>(null),
  };

  const apply = useCallback(() => {
    const n = geometry(tb, reduced);
    // skip writes that would not move anything visibly (under a fifth of a drawing unit), so a
    // still phase costs nothing and a slow pour touches the DOM only when the level really moves
    const set = (el: Element | null, attr: string, v: string | number) => {
      if (!el) return;
      const str = typeof v === "number" ? v.toFixed(2) : v.replace(/-?\d+\.?\d*/g, (x) => (Math.round(+x * 5) / 5).toString());
      if (el.getAttribute(attr) !== str) el.setAttribute(attr, str);
    };
    set(r.brewer.current, "transform", T.brewer(n));
    set(r.liquid.current, "transform", T.liquid(n));
    set(r.dark.current, "opacity", n.dark);
    set(r.bubbles.current, "transform", T.bubbles(n));
    set(r.grounds.current, "transform", T.grounds(n));
    set(r.grounds.current, "opacity", n.groundsOp);
    set(r.plunger.current, "transform", T.plunger(n));
    set(r.plunger.current, "opacity", n.plungerOp);
    set(r.mug.current, "transform", T.mug(n));
    set(r.mug.current, "opacity", n.mugFill > 0.002 ? 1 : 0);
    set(r.scale.current, "opacity", n.scaleOp);
    set(r.cup.current, "opacity", 1 - n.scaleOp);
    set(r.stream.current, "transform", T.stream(n));
    set(r.spoon.current, "transform", T.spoon(n));
  }, [tb, reduced]);

  // bring every moving part up to date after each render (phase change, pause, reset)
  useIsoLayoutEffect(() => { apply(); });

  // the frame loop: only while running, on screen, with motion allowed
  const running = g.running;
  useEffect(() => {
    if (!running || reduced) return;
    let id = 0;
    const loop = () => { apply(); id = requestAnimationFrame(loop); };
    const start = () => { if (!id) id = requestAnimationFrame(loop); };
    const stop = () => { if (id) cancelAnimationFrame(id); id = 0; };
    const el = svgRef.current;
    let io: IntersectionObserver | null = null;
    if (el && typeof IntersectionObserver !== "undefined") {
      // off screen: stop the frame loop and pause the CSS loops too
      io = new IntersectionObserver((entries) => {
        const vis = !!entries[0]?.isIntersecting;
        el.classList.toggle("ba-off", !vis);
        if (vis) start(); else { stop(); apply(); }
      });
      io.observe(el);
    } else start();
    return () => { stop(); io?.disconnect(); el?.classList.remove("ba-off"); };
  }, [running, reduced, apply]);

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const on = g.running ? " on" : "";
  const k = g.k;

  return (
    // the phase is announced by the timer's live text; this drawing is decorative
    <svg ref={svgRef} viewBox="0 0 200 228" className={"brew-anim " + size} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={"bm" + uid}><path d="M62 176 H138 V214 Q100 222 62 214 Z" /></clipPath>
        <clipPath id={"bi" + uid}><rect x="73" y={IN_TOP} width="54" height={IN_H} /></clipPath>
        <clipPath id={"bs" + uid}><rect ref={r.stream} x="80" y="0" width="40" height="1" transform={T.stream(g)} /></clipPath>
        <clipPath id={"bd" + uid}><rect x="80" y="167" width="40" height="50" /></clipPath>
      </defs>

      {/* the surface below: a scale while inverted, then the mug (crossfaded during the flip) */}
      <g ref={r.scale} opacity={g.scaleOp}>
        <rect x="44" y="214" width="112" height="8" rx="3" className="ba-scale" />
      </g>
      <g ref={r.cup} opacity={1 - g.scaleOp}>
        <path d="M140 182 q18 0 18 14 q0 13 -18 13" className="ba-mug-line" fill="none" />
        <path d="M60 174 H140 V215 Q100 224 60 215 Z" className="ba-mug" />
        {/* coffee running into the mug while pressing; the mug's coffee covers it below the surface */}
        {k === "press" && (
          <g clipPath={`url(#bd${uid})`}>
            <line x1="100" y1="145" x2="100" y2="216" className={"ba-drip" + on} />
          </g>
        )}
        {/* the clip sits on a still wrapper: a clip on the moving rect would move with it */}
        <g clipPath={`url(#bm${uid})`}>
          <rect ref={r.mug} x="0" y="176" width="200" height="48" fill="#3f2416"
            transform={T.mug(g)} opacity={g.mugFill > 0.002 ? 1 : 0} />
        </g>
        {g.finished && (
          <g className="ba-steam">
            <path d="M88 168 q-5 -8 0 -16 q5 -8 0 -16" /><path d="M100 164 q-5 -8 0 -16 q5 -8 0 -16" /><path d="M112 168 q-5 -8 0 -16 q5 -8 0 -16" />
          </g>
        )}
      </g>

      {/* the brewer; rotated 180° while inverted, turning over during the flip */}
      <g ref={r.brewer} transform={T.brewer(g)}>
        <g className={k === "swirl" ? "ba-wobble" + on : undefined}>
          <g clipPath={`url(#bi${uid})`}>
            {/* water: a unit-high rect scaled to the level, with the steeped colour faded in over it */}
            <g ref={r.liquid} transform={T.liquid(g)}>
              <rect x="73" y="0" width="54" height="1" fill="#cfa877" />
              <rect ref={r.dark} x="73" y="0" width="54" height="1" fill="#3f2416" opacity={g.dark} />
            </g>
            <g ref={r.grounds} transform={T.grounds(g)} opacity={g.groundsOp}>
              <rect x="73" y="0" width="54" height="9" fill="#5a3a24" />
            </g>
            {k === "wait" && g.liquidH > 8 && (
              <g ref={r.bubbles} transform={T.bubbles(g)}>
                <g className={"ba-bubbles" + on}>
                  <circle cx="86" cy="-6" r="1.6" /><circle cx="101" cy="-10" r="1.2" /><circle cx="115" cy="-5" r="1.4" />
                </g>
              </g>
            )}
          </g>
          <rect x="70" y="58" width="60" height="102" rx="3" className="ba-chamber" />
          {[80, 100, 120, 140].map((y) => <line key={y} x1="71" x2="78" y1={y} y2={y} className="ba-tick" />)}
          {/* filter cap: on from the start upright; inverted it goes on at the flip */}
          {(!g.inverted || !g.preFlip) && <rect x="65" y="158" width="70" height="8" rx="2" className="ba-cap" />}
          {/* plunger, drawn with its seal at y=0 and slid into place */}
          <g ref={r.plunger} transform={T.plunger(g)} opacity={g.plungerOp}>
            <rect x="76" y="-74" width="48" height="74" rx="2" className="ba-plunger" />
            <rect x="68" y="-80" width="64" height="7" rx="2" className="ba-flange" />
            <rect x="73.5" y="0" width="53" height="8" rx="2" className="ba-seal" />
          </g>
        </g>
      </g>

      {/* kettle and stream while pouring; the stream is clipped to end at the brew surface */}
      {k === "pour" && (
        <g className="ba-kettle">
          <path d="M18 8 h40 a6 6 0 0 1 6 6 v20 a6 6 0 0 1 -6 6 h-40 a6 6 0 0 1 -6 -6 v-20 a6 6 0 0 1 6 -6 z" />
          <path d="M64 22 L98 40" className="ba-spout" />
          <g clipPath={`url(#bs${uid})`}>
            <line x1="99" y1="20" x2="99" y2="170" className={"ba-stream" + on} />
          </g>
        </g>
      )}
      {/* spoon while stirring, riding on the brew surface */}
      {k === "stir" && (
        <g ref={r.spoon} transform={T.spoon(g)}>
          <g className={"ba-spoon" + on}>
            <line x1="100" y1="-34" x2="100" y2="18" />
            <ellipse cx="100" cy="22" rx="6" ry="4" />
          </g>
        </g>
      )}
    </svg>
  );
}
