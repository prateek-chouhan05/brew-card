/*
 * Canvas drawings that follow the brew timer: the Chamber clock (brew screen), the Brew line
 * (the timeline above it) and Count in coffee (hands-free). Pure functions of one moment of the
 * brew, so the same moment always draws the same picture.
 */
import type { SegKind, TimedSeg } from "./types";

export interface Moment {
  segs: TimedSeg[];
  marks: number[];
  total: number;
  /** clock time, for the countdown and the quarter markers */
  t: number;
  idx: number;
  seg: TimedSeg;
  left: number;
  started: boolean;
  finished: boolean;
  running: boolean;
  inverted: boolean;
  /** what the picture shows (under reduced motion, each step already done) */
  k: SegKind | null;
  p: number;
  fill: number;
  press: number;
  turn: number;
  capOn: boolean;
  dark: number;
  level: number;
  mug: number;
  /** a wait straight after pouring: the bloom, with its foam */
  bloom: boolean;
  pressStart: number;
}

export type Palette = Record<"bg" | "surface" | "raised" | "fg" | "muted" | "line" | "accent" | "accentSoft" | "onAccent" | "steel" | "plunger" | "cap" | "pale" | "coffee" | "grounds" | "crema" | "water", string>;

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t);
const easeInOut = (x: number) => (x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2);
const easeOut = (x: number) => 1 - (1 - x) ** 5;
export const mmss = (s: number) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

export const KIND_SHORT: Record<SegKind, string> = { pour: "Pour", wait: "Wait", swirl: "Swirl", stir: "Stir", press: "Press", flip: "Flip" };
/** A long wait reads as a steep, a short one as a wait. */
export const shortName = (g: TimedSeg) => (g.k === "wait" && g.dur >= 30 ? "Steep" : KIND_SHORT[g.k]);

export function moment(segs: TimedSeg[], inverted: boolean, tRaw: number, o: { started: boolean; finished: boolean; running: boolean; reduced: boolean }): Moment {
  const marks: number[] = [];
  let total = 0;
  for (const s of segs) { marks.push(total); total += s.dur; }
  const idxAt = (t: number) => { let i = 0; marks.forEach((m, j) => { if (t + 1e-4 >= m) i = j; }); return i; };
  const finished = o.finished;
  const t = finished ? total : clamp(tRaw, 0, total);
  const idx = idxAt(t), seg = segs[idx];
  const started = o.started || finished;
  const left = finished ? 0 : started ? Math.max(0, Math.ceil(seg.dur - (t - marks[idx]) - 1e-6)) : segs[0].dur;

  // geometry time: under reduced motion nothing travels inside a step; it is shown already done
  const tg = finished ? total : o.reduced && started ? Math.min(total, marks[idx] + seg.dur) - 0.001 : t;
  const gi = idxAt(tg), g = segs[gi], into = Math.min(g.dur, Math.max(0, tg - marks[gi]));
  const p = g.dur ? into / g.dur : 0;

  const pourTotal = segs.reduce((a, s) => a + (s.k === "pour" ? s.dur : 0), 0) || 1;
  let poured = 0;
  segs.forEach((s, i) => { if (s.k !== "pour") return; if (finished || i < gi) poured += s.dur; else if (i === gi && started) poured += into; });
  const fill = started ? clamp(poured / pourTotal) : 0;

  let pressIdx = -1; segs.forEach((s, i) => { if (s.k === "press") pressIdx = i; });
  const flipIdx = segs.findIndex((s) => s.k === "flip");
  const pressStart = pressIdx >= 0 ? marks[pressIdx] : total;
  const press = pressIdx < 0 ? (finished ? 1 : 0) : clamp((tg - marks[pressIdx]) / segs[pressIdx].dur);
  let turn = 1, capOn = true;
  if (inverted && flipIdx >= 0) {
    const f0 = marks[flipIdx];
    turn = !started || tg < f0 ? 0 : gi === flipIdx ? easeInOut(clamp((p - 0.55) / 0.45)) : 1;
    capOn = started && tg >= f0 + 0.3 * segs[flipIdx].dur;
  } else if (inverted) { turn = 0; capOn = false; }
  const dark = started ? clamp(tg / Math.max(1, pressStart)) ** 0.85 : 0;
  return {
    segs, marks, total, t, idx, seg, left, started, finished, running: o.running, inverted,
    k: started && !finished ? g.k : null, p, fill, press, turn, capOn, dark,
    level: fill * (1 - press), mug: press, bloom: g.k === "wait" && gi > 0 && segs[gi - 1].k === "pour",
    pressStart,
  };
}

/* ---------- colour helpers ---------- */
const hex = (c: string) => { const h = c.replace("#", "").trim(); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const mix = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return "rgb(" + x.map((v, i) => Math.round(lerp(v, y[i], t))).join(",") + ")"; };
const alpha = (c: string, a: number) => { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; };
const brew = (P: Palette, d: number) => mix(P.pale, P.coffee, d);
const pourColour = (P: Palette, fill: number) => mix(P.water, P.pale, 0.6 + 0.4 * fill);

export function readPalette(el: Element): Palette {
  const s = getComputedStyle(el);
  const v = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
  return {
    bg: v("--bg", "#faf7f8"), surface: v("--surface", "#ffffff"), raised: v("--raised", "#f3eef0"), fg: v("--fg", "#1c1619"),
    muted: v("--muted", "#6b5f64"), line: v("--line", "#e6dde0"), accent: v("--accent", "#8a2846"), accentSoft: v("--accent-soft", "#f7e9ee"),
    onAccent: v("--bc-on-accent", "#ffffff"), steel: v("--bc-steel", "#5b4a50"), plunger: v("--bc-plunger", "#ece6e8"), cap: v("--bc-cap", "#2b2326"),
    pale: v("--bc-pale", "#cfa877"), coffee: v("--bc-coffee", "#3f2416"), grounds: v("--bc-grounds", "#5a3a24"), crema: v("--bc-crema", "#c99a63"), water: v("--bc-water", "#8fbad6"),
  };
}

type Ctx = CanvasRenderingContext2D;
export interface DrawEnv { P: Palette; family: string; reduced: boolean; amb: number }
const F = (e: DrawEnv, weight: number, px: number) => `${weight} ${px}px ${e.family}`;
function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
function wrapText(c: Ctx, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" "); let line = "", yy = y;
  for (const wd of words) { const t = line ? line + " " + wd : wd; if (c.measureText(t).width > maxW && line) { c.fillText(line, x, yy); line = wd; yy += lh; } else line = t; }
  if (line) c.fillText(line, x, yy);
}
function statusLabel(m: Moment) {
  if (m.finished) return "Enjoy your cup";
  if (!m.started) return shortName(m.segs[0]) + " first";
  return (m.running ? "" : "Paused · ") + shortName(m.seg);
}

/* =====================================================================
   Chamber clock: the AeroPress, its moulded numbers 1–4 lighting up a quarter of the brew at a time
   ===================================================================== */
export function drawChamberClock(c: Ctx, w: number, h: number, m: Moment, e: DrawEnv) {
  const { P, amb } = e;
  const S = Math.min(w, h);
  const cx = w * 0.6, cw = S * 0.24, chH = S * 0.34, y1 = h * 0.7, y0 = y1 - chH;
  const capH = S * 0.024, lipH = S * 0.016, L = S * 0.26, sealH = S * 0.02;
  const ground = y1 + capH + S * 0.012;
  const py = (ground + y0 - L) / 2;
  const swirl = m.k === "swirl" && !e.reduced ? Math.sin(amb * 12) * 0.06 : 0;
  const angle = (m.inverted ? -Math.PI * (1 - m.turn) : 0) + swirl;
  const upside = m.inverted && m.turn < 0.5;
  const x0 = cx - cw / 2;

  // countdown and what's happening, top left
  c.textBaseline = "alphabetic"; c.textAlign = "left"; c.fillStyle = P.fg;
  const big = m.finished ? "Done" : m.left >= 60 ? mmss(m.left) : String(m.left);
  c.font = F(e, 800, S * 0.17); c.fillText(big, w * 0.05, h * 0.21);
  if (!m.finished && m.left < 60) { const bw = c.measureText(big).width; c.font = F(e, 600, S * 0.06); c.fillStyle = P.muted; c.fillText("s", w * 0.05 + bw + S * 0.012, h * 0.21); }
  c.font = F(e, 600, S * 0.05); c.fillStyle = m.started && !m.running && !m.finished ? P.muted : P.fg;
  wrapText(c, statusLabel(m), w * 0.05, h * 0.285, Math.max(S * 0.2, x0 - w * 0.1), S * 0.06);

  // the scale while inverted, the glass mug after the flip
  const scaleA = m.inverted ? 1 - clamp((m.turn - 0.15) / 0.3) : 0;
  const mugSurface = glassMug(c, { x: cx - S * 0.15, y: ground, w: S * 0.3, h: S * 0.17 }, m.mug, S, 1 - scaleA, m.finished, e);
  if (scaleA > 0) kitchenScale(c, cx, ground, S, scaleA, e);

  // the brewer, in its own turning frame
  c.save();
  c.translate(cx, py); c.rotate(angle); c.translate(-cx, -py);
  const sealY = lerp(y0, y1 - sealH, m.press);
  c.fillStyle = alpha(P.steel, 0.07); c.fillRect(x0, y0, cw, chH);
  c.save(); c.beginPath(); c.rect(x0, y0, cw, chH); c.clip();
  const plugged = m.inverted || m.t >= m.pressStart - 0.01;
  const pluggedTop = plugged ? sealY + sealH : y0;
  let lh = Math.min(m.fill * chH * 0.86, y1 - pluggedTop); if (m.press >= 1) lh = 0;
  const top = upside ? sealY + sealH : y1 - lh;
  if (lh > 0.5) {
    c.fillStyle = m.k === "pour" ? pourColour(P, m.fill) : brew(P, m.dark);
    c.fillRect(x0, top, cw, lh);
    c.fillStyle = alpha(P.crema, m.bloom ? 0.9 : 0.55);
    c.fillRect(x0, upside ? top + lh - S * 0.012 : top, cw, S * 0.012);
    if (m.k === "wait") bubbles(c, x0, top, cw, lh, upside, S, e);
  }
  const gA = 1 - clamp(m.fill / 0.06);
  if (gA > 0) { c.globalAlpha = gA; c.fillStyle = P.grounds; c.fillRect(x0, upside ? sealY + sealH : y1 - S * 0.03, cw, S * 0.03); c.globalAlpha = 1; }
  c.restore();
  // wall and the flared top lip with its wings
  c.strokeStyle = P.steel; c.lineWidth = S * 0.01; c.lineJoin = "round";
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.lineTo(x0 + cw, y1); c.lineTo(x0 + cw, y0); c.stroke();
  c.fillStyle = P.surface;
  c.beginPath(); c.moveTo(x0 - S * 0.045, y0 - lipH); c.lineTo(x0 + cw + S * 0.045, y0 - lipH); c.lineTo(x0 + cw + S * 0.03, y0); c.lineTo(x0 - S * 0.03, y0); c.closePath(); c.fill(); c.stroke();
  // filter cap with grip notches
  if (!m.inverted || m.capOn) {
    c.fillStyle = P.cap; rr(c, x0 - S * 0.018, y1, cw + S * 0.036, capH, S * 0.006); c.fill();
    c.fillStyle = alpha(P.surface, 0.25); for (let i = 1; i < 8; i++) c.fillRect(x0 - S * 0.018 + (cw + S * 0.036) * i / 8, y1 + capH * 0.3, S * 0.004, capH * 0.4);
  }
  // plunger: inverted it is in from the start; on the mug it slides in over the last 3 s before the press
  const ins = m.inverted ? 1 : m.started ? easeOut(clamp((m.t - (m.pressStart - 3)) / 3)) : 0;
  if (ins > 0) {
    const lift = (1 - ins) * S * 0.14;
    c.globalAlpha = Math.min(1, ins * 1.4);
    c.fillStyle = P.plunger; c.strokeStyle = P.steel; c.lineWidth = S * 0.008;
    rr(c, x0 + S * 0.01, sealY - L + S * 0.02 - lift, cw - S * 0.02, L - S * 0.02, S * 0.006); c.fill(); c.stroke();
    rr(c, x0 - S * 0.035, sealY - L - lift, cw + S * 0.07, S * 0.022, S * 0.008); c.fill(); c.stroke();
    c.fillStyle = P.cap; rr(c, x0 + S * 0.003, sealY - lift, cw - S * 0.006, sealH, S * 0.006); c.fill();
    c.globalAlpha = 1;
  }
  c.restore();

  // the moulded numbers 1–4, a quarter of the brew each; they ride with the chamber but stay upright
  const q = (m.t / m.total) * 4, rad = S * 0.024;
  const rot = (x: number, y: number) => { const dx = x - cx, dy = y - py, co = Math.cos(angle), sn = Math.sin(angle); return [cx + dx * co - dy * sn, py + dx * sn + dy * co]; };
  for (let k = 1; k <= 4; k++) {
    const uy = y1 - chH * (k / 5);
    const [mx, my] = rot(x0 + S * 0.038, uy), [tx1, ty1] = rot(x0 + S * 0.068, uy), [tx2, ty2] = rot(x0 + S * 0.1, uy);
    const done = q >= k, cur = !done && q > k - 1;
    c.strokeStyle = done || cur ? P.accent : alpha(P.steel, 0.55); c.lineWidth = S * 0.006; c.lineCap = "round";
    c.beginPath(); c.moveTo(tx1, ty1); c.lineTo(tx2, ty2); c.stroke();
    c.beginPath(); c.arc(mx, my, rad, 0, Math.PI * 2);
    c.fillStyle = done ? P.accent : P.surface; c.fill();
    c.strokeStyle = done ? P.accent : cur ? alpha(P.accent, 0.35) : alpha(P.steel, 0.55); c.stroke();
    if (cur) { c.strokeStyle = P.accent; c.lineWidth = S * 0.008; c.beginPath(); c.arc(mx, my, rad, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (q - (k - 1))); c.stroke(); }
    c.fillStyle = done ? P.onAccent : cur ? P.accent : P.muted;
    c.font = F(e, 700, S * 0.028); c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(k), mx, my + S * 0.001);
  }
  c.textAlign = "left"; c.textBaseline = "alphabetic"; c.lineCap = "butt";

  const openTop = upside ? 2 * py - y1 : y0;
  const surf = upside ? 2 * py - (sealY + sealH + lh) : y1 - lh;
  if (m.k === "pour") { const tx = cx + S * 0.02, ty = openTop - S * 0.075; gooseneck(c, tx, ty, S, e); stream(c, tx, ty + S * 0.006, surf, S, e, P.water, 0.011); }
  if (m.k === "stir") paddle(c, cx, openTop, surf, S, e);
  if (m.k === "press" && m.press > 0) stream(c, cx, y1 + capH, mugSurface, S, e, P.coffee, 0.009);
}

function bubbles(c: Ctx, x0: number, top: number, cw: number, lh: number, upside: boolean, S: number, e: DrawEnv) {
  c.fillStyle = alpha(e.P.surface, 0.55);
  for (let i = 0; i < 6; i++) {
    const ph = e.reduced ? 0.4 : (e.amb * 0.35 + i / 6) % 1;
    const bx = x0 + cw * (0.15 + 0.7 * ((i * 0.37) % 1));
    const by = upside ? top + lh * (0.1 + 0.85 * ph) : top + lh * (0.95 - 0.85 * ph);
    c.globalAlpha = Math.sin(ph * Math.PI) * 0.9;
    c.beginPath(); c.arc(bx, by, S * (0.004 + 0.003 * (i % 3)), 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}
function steam(c: Ctx, x: number, y: number, S: number, e: DrawEnv) {
  c.save(); c.strokeStyle = e.P.muted; c.lineWidth = S * 0.009; c.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const ph = e.reduced ? 0.5 : (e.amb * 0.4 + i / 3) % 1;
    c.globalAlpha = Math.sin(ph * Math.PI) * 0.7;
    const bx = x + (i - 1) * S * 0.06, by = y - ph * S * 0.05;
    c.beginPath(); c.moveTo(bx, by); c.bezierCurveTo(bx - S * 0.03, by - S * 0.04, bx + S * 0.03, by - S * 0.06, bx, by - S * 0.1); c.stroke();
  }
  c.restore();
}
/** A clear glass mug, so you can watch it fill. Returns the coffee surface's y. */
function glassMug(c: Ctx, mg: { x: number; y: number; w: number; h: number }, fill: number, S: number, a: number, done: boolean, e: DrawEnv) {
  const { P } = e, { x, y, w, h } = mg;
  if (a <= 0) return y + h;
  const inset = S * 0.012, base = S * 0.02, taper = S * 0.018;
  const body = () => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w - taper, y + h); c.lineTo(x + taper, y + h); c.closePath(); };
  c.save(); c.globalAlpha = a;
  c.strokeStyle = P.steel; c.lineWidth = S * 0.022; c.lineCap = "round";
  c.beginPath(); c.moveTo(x + w - S * 0.01, y + h * 0.22);
  c.bezierCurveTo(x + w + S * 0.085, y + h * 0.18, x + w + S * 0.075, y + h * 0.8, x + w - taper * 0.6, y + h * 0.76); c.stroke();
  c.strokeStyle = P.surface; c.lineWidth = S * 0.008; c.stroke();
  body(); c.fillStyle = alpha(P.steel, 0.08); c.fill();
  const innerTop = y + inset, innerBot = y + h - base;
  const lvl = clamp(fill) * 0.86 * (innerBot - innerTop), surface = innerBot - lvl;
  if (lvl > 0.5) {
    c.save(); body(); c.clip();
    c.fillStyle = P.coffee; c.fillRect(x, surface, w, innerBot - surface);
    c.fillStyle = alpha(P.crema, 0.95); c.fillRect(x, surface, w, Math.min(S * 0.012, lvl));
    c.restore();
  }
  c.save(); body(); c.clip(); c.fillStyle = alpha(P.steel, 0.28); c.fillRect(x, y + h - base, w, base); c.restore();
  body(); c.strokeStyle = P.steel; c.lineWidth = S * 0.009; c.lineJoin = "round"; c.stroke();
  c.fillStyle = alpha(P.surface, 0.5); c.fillRect(x + S * 0.03, y + S * 0.025, S * 0.008, h * 0.55);
  if (done) steam(c, x + w / 2, y - S * 0.015, S, e);
  c.restore();
  return surface;
}
function kitchenScale(c: Ctx, cx: number, top: number, S: number, a: number, e: DrawEnv) {
  const { P } = e;
  c.save(); c.globalAlpha = a;
  const w = S * 0.46, x = cx - w / 2;
  c.fillStyle = P.steel; rr(c, x + S * 0.02, top, w - S * 0.04, S * 0.012, S * 0.004); c.fill();
  c.fillStyle = P.raised; c.strokeStyle = P.steel; c.lineWidth = S * 0.006;
  rr(c, x, top + S * 0.012, w, S * 0.06, S * 0.014); c.fill(); c.stroke();
  c.fillStyle = P.cap; rr(c, cx - S * 0.075, top + S * 0.024, S * 0.15, S * 0.036, S * 0.006); c.fill();
  c.restore();
}
function gooseneck(c: Ctx, tx: number, ty: number, S: number, e: DrawEnv) {
  const { P } = e;
  const bx = tx + S * 0.2, by = ty - S * 0.02, bw = S * 0.17, bh = S * 0.12;
  c.save(); c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = P.steel; c.lineWidth = S * 0.02;
  c.beginPath(); c.moveTo(bx + S * 0.01, by + bh * 0.85);
  c.bezierCurveTo(bx - S * 0.06, by + bh * 0.8, bx - S * 0.05, ty - S * 0.05, tx + S * 0.015, ty - S * 0.012);
  c.lineTo(tx, ty); c.stroke();
  c.strokeStyle = P.plunger; c.lineWidth = S * 0.009; c.stroke();
  c.strokeStyle = P.steel; c.lineWidth = S * 0.016;
  c.beginPath(); c.moveTo(bx + bw - S * 0.01, by + S * 0.02); c.bezierCurveTo(bx + bw + S * 0.07, by, bx + bw + S * 0.07, by + bh, bx + bw - S * 0.01, by + bh * 0.85); c.stroke();
  c.fillStyle = P.plunger; c.strokeStyle = P.steel; c.lineWidth = S * 0.008;
  c.beginPath(); c.moveTo(bx + S * 0.012, by); c.lineTo(bx + bw - S * 0.012, by); c.lineTo(bx + bw, by + bh); c.lineTo(bx, by + bh); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(bx + S * 0.03, by); c.quadraticCurveTo(bx + bw / 2, by - S * 0.035, bx + bw - S * 0.03, by); c.stroke();
  c.fillStyle = P.steel; c.beginPath(); c.arc(bx + bw / 2, by - S * 0.024, S * 0.01, 0, Math.PI * 2); c.fill();
  c.restore();
}
function stream(c: Ctx, x: number, ya: number, yb: number, S: number, e: DrawEnv, col: string, lw: number) {
  if (yb <= ya + 1) return;
  c.save(); c.lineCap = "round"; c.strokeStyle = col; c.lineWidth = S * lw;
  const sway = e.reduced ? 0 : Math.sin(e.amb * 6) * S * 0.003;
  c.beginPath(); c.moveTo(x, ya); c.quadraticCurveTo(x + sway, (ya + yb) / 2, x, yb); c.stroke();
  if (!e.reduced) {
    const ph = (e.amb * 2.2) % 1, hy = ya + (yb - ya) * ph;
    c.strokeStyle = alpha(e.P.surface, 0.6); c.lineWidth = S * lw * 0.4;
    c.beginPath(); c.moveTo(x - S * 0.0015, hy); c.lineTo(x - S * 0.0015, Math.min(yb, hy + S * 0.04)); c.stroke();
  }
  c.strokeStyle = alpha(col, 0.6); c.lineWidth = S * 0.005;
  const r = e.reduced ? 0.5 : (e.amb * 3) % 1;
  c.globalAlpha = 1 - r;
  c.beginPath(); c.ellipse(x, yb, S * (0.02 + 0.03 * r), S * (0.005 + 0.006 * r), 0, 0, Math.PI * 2); c.stroke();
  c.restore();
}
function paddle(c: Ctx, x: number, openTop: number, surf: number, S: number, e: DrawEnv) {
  const a = e.reduced ? 0 : Math.sin(e.amb * 9) * 0.22;
  const pivotY = openTop - S * 0.09;
  c.save(); c.translate(x, pivotY); c.rotate(a);
  const len = Math.max(S * 0.12, surf - pivotY + S * 0.05);
  c.fillStyle = e.P.cap;
  rr(c, -S * 0.007, 0, S * 0.014, len - S * 0.05, S * 0.007); c.fill();
  rr(c, -S * 0.022, len - S * 0.06, S * 0.044, S * 0.07, S * 0.01); c.fill();
  c.restore();
}

/* =====================================================================
   Brew line: how much is in the brewer and in the mug, second by second, coloured by the steep
   ===================================================================== */
export function drawBrewLine(c: Ctx, w: number, h: number, m: Moment, e: DrawEnv, water?: number) {
  const { P } = e;
  const L = 2, Rm = 2, T = 22, B = 22, gap = 8;
  const W = w - L - Rm;
  const laneA = (h - T - B - gap) * 0.62, laneB = (h - T - B - gap) * 0.38;
  const yA0 = T + laneA, yB0 = T + laneA + gap + laneB;
  const X = (t: number) => L + (t / m.total) * W;
  const at = (t: number) => moment(m.segs, m.inverted, t, { started: t > 0, finished: t >= m.total, running: false, reduced: false });

  c.font = F(e, 600, 12); c.textBaseline = "alphabetic";
  c.fillStyle = P.muted; c.textAlign = "left";
  c.fillText("In the brewer" + (water ? ` · ${water} g` : ""), L, 13);
  c.textAlign = "right"; c.fillText(mmss(m.t) + " / " + mmss(m.total), w - Rm, 13);
  c.textAlign = "left";

  // phase dividers (dashed, a chart grid) and names
  c.save(); c.setLineDash([3, 4]); c.strokeStyle = P.line; c.lineWidth = 1;
  m.marks.forEach((mk, i) => { if (!i) return; c.beginPath(); c.moveTo(Math.round(X(mk)) + 0.5, T); c.lineTo(Math.round(X(mk)) + 0.5, yB0); c.stroke(); });
  c.restore();
  c.font = F(e, 600, 12); c.textAlign = "center";
  m.segs.forEach((g, i) => {
    const x1 = X(m.marks[i]), x2 = X(m.marks[i] + g.dur), name = shortName(g);
    if (c.measureText(name).width + 6 > x2 - x1) return;
    c.fillStyle = m.started && i === m.idx && !m.finished ? P.fg : P.muted;
    c.fillText(name, (x1 + x2) / 2, h - 5);
  });
  c.textAlign = "left";

  // the plan, dashed
  const steps = Math.max(40, Math.round(W / 4));
  const plan: { a: number; b: number }[] = [];
  for (let i = 0; i <= steps; i++) { const mm = at((i / steps) * m.total); plan.push({ a: mm.level, b: mm.mug }); }
  c.save(); c.setLineDash([4, 4]); c.lineWidth = 1.5; c.strokeStyle = P.muted;
  c.beginPath(); plan.forEach((v, i) => { const x = L + (i / steps) * W, y = yA0 - v.a * laneA * 0.92; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke();
  c.beginPath(); plan.forEach((v, i) => { const x = L + (i / steps) * W, y = yB0 - v.b * laneB * 0.92; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke();
  c.restore();
  c.fillStyle = P.line; c.fillRect(L, yA0, W, 1); c.fillRect(L, yB0, W, 1);
  c.font = F(e, 600, 11); c.fillStyle = P.muted; c.fillText("In your mug", L + 2, yB0 - laneB + 11);

  // the past, filled; each slice coloured by how long it had steeped
  const tNow = m.started ? m.t : 0, xNow = X(tNow);
  for (let x = L; x < xNow; x += 2) {
    const mm = at(((x - L) / W) * m.total);
    const hA = mm.level * laneA * 0.92, hB = mm.mug * laneB * 0.92, sw = Math.min(2, xNow - x) + 0.5;
    if (hA > 0) { c.fillStyle = mm.k === "pour" ? pourColour(P, mm.fill) : brew(P, mm.dark); c.fillRect(x, yA0 - hA, sw, hA); }
    if (hB > 0) { c.fillStyle = P.coffee; c.fillRect(x, yB0 - hB, sw, hB); }
  }
  if (m.started) {
    const now = at(tNow);
    c.fillStyle = P.accent; c.fillRect(Math.round(xNow) - 1, T - 4, 2, yB0 - T + 4);
    const yy = yA0 - now.level * laneA * 0.92;
    c.beginPath(); c.arc(xNow, yy, 4, 0, Math.PI * 2); c.fill();
    if (now.mug > 0) { c.beginPath(); c.arc(xNow, yB0 - now.mug * laneB * 0.92, 4, 0, Math.PI * 2); c.fill(); }
    if (water) {
      c.font = F(e, 600, 12); c.fillStyle = P.fg;
      const lab = Math.round(now.level * water) + " g", lw = c.measureText(lab).width;
      c.fillText(lab, xNow + 8 + lw > w - Rm ? xNow - 8 - lw : xNow + 8, Math.max(T + 12, yy - 6));
    }
  }
}

/* =====================================================================
   Count in coffee: the countdown numbers are the cup
   ===================================================================== */
export function drawCount(c: Ctx, w: number, h: number, m: Moment, e: DrawEnv) {
  const { P, amb, reduced } = e;
  const text = m.finished ? "Done" : m.left >= 60 ? mmss(m.left) : String(m.left);
  const cx = w / 2, cy = h / 2;
  let size = h * 0.9;
  c.font = F(e, 900, size);
  const tw = c.measureText(text).width;
  if (tw > w * 0.92) size *= (w * 0.92) / tw;
  const font = F(e, 900, size);
  let sy = 1;
  if (m.inverted && m.k === "flip") sy = Math.cos(Math.PI * m.turn) || 0.001;
  const sy2 = Math.sign(sy) * Math.max(0.03, Math.abs(sy));
  const capH = size * 0.72, bot = cy + capH / 2;
  const lv = m.finished ? 1 : m.level;
  const surface = bot - lv * capH;
  let amp = 0, freq = 2.2, speed = 2;
  if (!reduced) {
    if (m.k === "pour") { amp = size * 0.03; freq = 3.2; speed = 5; }
    else if (m.k === "wait") { amp = size * (m.bloom ? 0.01 : 0.006); speed = 1.2; }
    else if (m.k === "stir" || m.k === "swirl") { amp = size * 0.06; freq = 1.4; speed = 7; }
    else if (m.k === "flip") { amp = size * 0.05 * (1 - Math.abs(sy)); freq = 1.2; speed = 4; }
    else if (m.k === "press") { amp = size * 0.01; }
  }
  const glyphs = () => { c.save(); c.translate(cx, cy); c.scale(1, sy2); c.font = font; c.textAlign = "center"; c.textBaseline = "alphabetic"; };
  if (lv > 0.001) {
    c.fillStyle = m.finished ? P.coffee : m.k === "pour" ? pourColour(P, m.fill) : brew(P, m.dark);
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 6) c.lineTo(x, surface + Math.sin((x / w) * Math.PI * 2 * freq + amb * speed) * amp);
    c.lineTo(w, h); c.closePath(); c.fill();
    if (m.finished || m.k === "press") { c.fillStyle = P.crema; c.fillRect(0, surface - size * 0.006, w, size * 0.03); }
  }
  c.globalCompositeOperation = "destination-in";
  glyphs(); c.fillStyle = "#000"; c.fillText(text, 0, capH / 2); c.restore();
  c.globalCompositeOperation = "destination-over";
  glyphs(); c.fillStyle = P.raised; c.fillText(text, 0, capH / 2); c.restore();
  c.globalCompositeOperation = "source-over";
  glyphs(); c.lineWidth = Math.max(1.5, size * 0.008); c.strokeStyle = P.steel; c.lineJoin = "round"; c.strokeText(text, 0, capH / 2); c.restore();
}
