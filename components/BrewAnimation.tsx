"use client";
import { useId } from "react";
import type { TimedSeg } from "@/lib/types";

/** Where the brew is right now; computed by the timer panel. */
export interface BrewMoment {
  segs: TimedSeg[];
  marks: number[];
  idx: number;
  /** seconds into the current phase */
  into: number;
  started: boolean;
  finished: boolean;
  running: boolean;
  inverted: boolean;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
function mix(c1: string, c2: string, t: number) {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  return "#" + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, "0")).join("");
}

/* Brewer geometry, drawn upright (cap at the bottom). Chamber inside runs from y=62 to y=158. */
const IN_TOP = 62, IN_BOT = 158, IN_H = IN_BOT - IN_TOP;

/**
 * An AeroPress that follows the timer: water fills as you pour, the spoon moves while you stir,
 * the brew darkens while it steeps, it turns over at the flip, and the plunger presses coffee into the mug.
 */
export function BrewAnimation({ m, size = "md" }: { m: BrewMoment; size?: "md" | "lg" }) {
  const { segs, marks, idx, into, started, finished, running, inverted } = m;
  const cur = segs[idx];
  const p = cur && cur.dur ? Math.min(1, into / cur.dur) : 0;

  // how much water is in: share of all pouring time done so far
  const pourTotal = segs.reduce((t, s) => t + (s.k === "pour" ? s.dur : 0), 0) || 1;
  let poured = 0;
  segs.forEach((s, i) => { if (s.k !== "pour") return; if (finished || i < idx) poured += s.dur; else if (i === idx && started) poured += into; });
  const fill = started ? Math.min(1, poured / pourTotal) : 0;

  // pressing and flipping
  const pressIdx = segs.findIndex((s) => s.k === "press");
  const flipIdx = segs.findIndex((s) => s.k === "flip");
  const press = finished || (pressIdx >= 0 && idx > pressIdx) ? 1 : idx === pressIdx && started ? p : 0;
  const preFlip = inverted && flipIdx >= 0 && !finished && (!started || idx < flipIdx);
  const flipping = inverted && started && !finished && idx === flipIdx;
  // the flip phase is mostly getting the cap and mug ready; the brewer turns over in its last third
  const turn = flipping ? Math.max(0, Math.min(1, (p - 0.65) / 0.35)) : 0;
  const angle = preFlip ? 180 : flipping ? 180 * (1 - turn) : 0;
  const upsideDown = preFlip || (flipping && turn < 0.5);
  const onScale = preFlip || (flipping && turn < 0.3);

  // steeping darkens the brew until the press
  const t = started ? (finished ? 1 : (marks[idx] + into) / Math.max(1, pressIdx >= 0 ? marks[pressIdx] : marks[marks.length - 1])) : 0;
  const brew = mix("#cfa877", "#3f2416", Math.min(1, t * 1.15));

  // plunger: hovering above, resting in the top, or travelling down
  const anyPoured = fill > 0.02;
  const sealY = inverted ? lerp(IN_TOP, IN_BOT - 4, press) : !anyPoured ? 28 : lerp(IN_TOP, IN_BOT - 4, press);
  const room = IN_BOT - (sealY + 8);
  let liquidH = Math.min(fill * (IN_H - 8), room);
  if (press >= 1) liquidH = 0;
  // upside-down, the brew rests on the plunger seal (the top end in brewer coordinates)
  const liquidY = upsideDown ? sealY + 8 : IN_BOT - liquidH;
  const groundsH = started && fill > 0.02 ? 0 : 9;

  const mugFill = press * 0.82;
  const k = started && !finished ? cur?.k : null;
  const anim = running ? " on" : "";
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // the visible surface height of the brew, in drawing coordinates (for the stream and spoon)
  const surfaceY = upsideDown ? 124 - liquidH : IN_BOT - liquidH;

  return (
    <svg viewBox="0 0 200 228" className={"brew-anim " + size} role="img"
      aria-label={finished ? "Coffee pressed into the mug" : !started ? (inverted ? "AeroPress upside-down, ready" : "AeroPress on the mug, ready") : `${cur.k} phase`}>
      {/* the surface below: a scale while inverted, then the mug */}
      {onScale && <rect x="44" y="214" width="112" height="8" rx="3" className="ba-scale" />}
      {!onScale && (
        <g>
          <path d="M140 182 q18 0 18 14 q0 13 -18 13" className="ba-mug-line" fill="none" />
          <clipPath id={"bm" + uid}><path d="M62 176 H138 V214 Q100 222 62 214 Z" /></clipPath>
          <path d="M60 174 H140 V215 Q100 224 60 215 Z" className="ba-mug" />
          <rect x="0" y={214 - mugFill * 38} width="200" height={mugFill * 38 + 4} fill="#3f2416" clipPath={`url(#bm${uid})`} />
          {finished && (
            <g className={"ba-steam" + anim + " done"}>
              <path d="M88 168 q-5 -8 0 -16 q5 -8 0 -16" /><path d="M100 164 q-5 -8 0 -16 q5 -8 0 -16" /><path d="M112 168 q-5 -8 0 -16 q5 -8 0 -16" />
            </g>
          )}
        </g>
      )}

      {/* the brewer; rotated 180° while inverted, turning over during the flip */}
      <g transform={`rotate(${angle} 100 97)`}><g className={k === "swirl" ? "ba-wobble" + anim : undefined}>
        <clipPath id={"bi" + uid}><rect x="73" y={IN_TOP} width="54" height={IN_H} /></clipPath>
        <g clipPath={`url(#bi${uid})`}>
          {liquidH > 0.5 && <rect x="73" y={liquidY} width="54" height={liquidH} fill={brew} />}
          {groundsH > 0 && <rect x="73" y={upsideDown ? sealY + 8 : IN_BOT - groundsH} width="54" height={groundsH} fill="#5a3a24" />}
          {k === "wait" && liquidH > 8 && (
            <g className={"ba-bubbles" + anim}>
              <circle cx="86" cy={liquidY + liquidH - 6} r="1.6" /><circle cx="101" cy={liquidY + liquidH - 10} r="1.2" /><circle cx="115" cy={liquidY + liquidH - 5} r="1.4" />
            </g>
          )}
        </g>
        <rect x="70" y="58" width="60" height="102" rx="3" className="ba-chamber" />
        {[80, 100, 120, 140].map((y) => <line key={y} x1="71" x2="78" y1={y} y2={y} className="ba-tick" />)}
        {/* filter cap: on from the start upright; inverted it goes on at the flip */}
        {(!inverted || !preFlip) && <rect x="65" y="158" width="70" height="8" rx="2" className="ba-cap" />}
        {/* plunger: upright it goes in after the pour; inverted it's in from the start */}
        {(inverted || anyPoured) && (
          <>
            <rect x="76" y={sealY - 74} width="48" height="74" rx="2" className="ba-plunger" />
            <rect x="68" y={sealY - 80} width="64" height="7" rx="2" className="ba-flange" />
            <rect x="73.5" y={sealY} width="53" height="8" rx="2" className="ba-seal" />
          </>
        )}
      </g></g>

      {/* kettle and stream while pouring */}
      {k === "pour" && (
        <g className="ba-kettle">
          <path d="M18 8 h40 a6 6 0 0 1 6 6 v20 a6 6 0 0 1 -6 6 h-40 a6 6 0 0 1 -6 -6 v-20 a6 6 0 0 1 6 -6 z" />
          <path d="M64 22 L98 40" className="ba-spout" />
          <line x1="99" y1="42" x2="99" y2={surfaceY} className={"ba-stream" + anim} />
        </g>
      )}
      {/* spoon while stirring */}
      {k === "stir" && (
        <g className={"ba-spoon" + anim}>
          <line x1="100" y1="30" x2="100" y2={surfaceY + 18} />
          <ellipse cx="100" cy={surfaceY + 22} rx="6" ry="4" />
        </g>
      )}
      {/* coffee running into the mug while pressing */}
      {k === "press" && <line x1="100" y1="167" x2="100" y2={212 - mugFill * 38} className={"ba-drip" + anim} />}
    </svg>
  );
}
