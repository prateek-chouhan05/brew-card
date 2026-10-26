import { HOUSE, houseById } from "./catalog";
import { LIB_ROAST_RANK, LIB_ROAST_EMOJI } from "./data/roasts";
import { GROUP_EMOJI } from "./data/labels";
import { grindText, libGrind } from "./grind";
import type { Brew, CheckSeg, Entry, Grinder, HouseMethod, LibraryEntry, Roast, TimedSeg } from "./types";

/* ---------------- formatting ---------------- */
export function mmss(s: number): string {
  s = Math.max(0, s);
  const m = Math.floor(s / 60), x = Math.floor(s % 60);
  return m + ":" + (x < 10 ? "0" : "") + x;
}
export const g1 = (n: number) => (Math.round(n * 10) / 10).toString();
export const cap1 = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : "");
export function hostOf(u: string): string {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "the original site"; }
}
const shortItem = (t: string) => String(t).replace(/\s*\(.*?\)/g, "").split(/[,—]/)[0].trim();

/* ---------------- roast ---------------- */
export function suits(e: Entry, roast: Roast): boolean {
  if (e.kind === "house" || e.kind === "drink") return e.bestFor.includes(roast.id);
  const r = LIB_ROAST_RANK[e.roast];
  return r === undefined || Math.abs(r - roast.rank) <= 1;
}
export function roastNudge(e: LibraryEntry, roast: Roast): string {
  const r = LIB_ROAST_RANK[e.roast];
  if (r === undefined) return "";
  const diff = roast.rank - r;
  const built = e.roast + " roasts";
  const bag = roast.emoji + " " + roast.label.toLowerCase();
  if (diff >= 2) return `💡 Built for ${built}. With your ${bag} bag, drop the water 3–5 °C and go 1–2 steps coarser.`;
  if (diff <= -2) return `💡 Built for ${built}. With your ${bag} bag, raise the water 2–4 °C (up to 99) and go a step finer.`;
  return "";
}

/* ---------------- house method numbers ---------------- */
export const hGrind = (h: HouseMethod, roast: Roast) => Math.max(6, h.grindBase + roast.adj);
export const hWater = (h: HouseMethod, dose: number) => (h.ratios.water ? Math.round(dose * h.ratios.water) : 0);
export const hBypass = (h: HouseMethod, dose: number) => (h.ratios.bypass ? Math.round(dose * h.ratios.bypass) : 0);
export const hMilk = (h: HouseMethod, dose: number) => (h.ratios.milk ? Math.round(dose * h.ratios.milk) : 0);
export const hMixer = (h: HouseMethod, dose: number) => (h.ratios.mixer ? Math.round(dose * h.ratios.mixer) : 0);
export const hTotal = (h: HouseMethod) => (h.segs as TimedSeg[]).reduce((t, s) => t + (s.dur || 0), 0);
export function totalOf(e: Entry): number {
  if (e.kind === "house") return e.timed ? hTotal(e) : 0;
  if (e.kind === "library") return e.total ?? 0;
  return 0;
}

/* ---------------- orientation ---------------- */
export const FLIP_HINT = "Filter cap on, mug upside-down on top. Hold both and turn over in one smooth motion, then press.";
export function canInvert(e: Entry | undefined): e is HouseMethod {
  return !!e && e.kind === "house" && e.timed && e.o === "standard";
}
export function invertSegs(segs: TimedSeg[]): TimedSeg[] {
  const out = segs.map((s) => ({ ...s }));
  for (const s of out) {
    if (s.k === "pour" && /seal/i.test(s.lbl)) {
      s.lbl = "Pour all the water";
      s.det = "Wet everything. No seal needed — upside-down, nothing can drip.";
    }
    if (s.k === "press" && /into the mug/i.test(s.lbl)) s.lbl = "Press";
  }
  let pi = -1;
  out.forEach((s, i) => { if (s.k === "press") pi = i; });
  if (pi < 0) pi = out.length;
  out.splice(pi, 0, { k: "flip", lbl: "Cap on, flip onto your mug", det: FLIP_HINT, dur: 10 });
  return out;
}
export function flipAtSegs(segs: TimedSeg[]): number | null {
  let t = 0;
  for (const s of segs) { if (s.k === "flip") return t; t += s.dur; }
  return null;
}
function libFlipAt(e: LibraryEntry): number | null {
  if (e.o !== "inverted" || !e.segs) return null;
  let t = 0;
  for (const s of e.segs) { if (s[0] === "flip") return t; t += s[2]; }
  return null;
}
/** The orientation pill shown on cards: label text and whether it's the inverted style. */
export function orientPill(e: Entry, inverted: boolean): { text: string; inv: boolean } {
  if (e.kind === "drink") return { text: `🥄 Assemble · ${e.temp === "hot" ? "hot" : "iced"}${e.alcohol ? " · 🍸 alcohol" : ""}`, inv: false };
  if (e.o === "moka") return { text: "🔥 Stovetop", inv: false };
  if (e.o === "jar") return { text: "🫙 Jar · overnight", inv: false };
  if (e.kind === "library" && e.o === "inverted") {
    const f = libFlipAt(e);
    return { text: "🔄 Inverted" + (f != null ? " · flip at " + mmss(f) : ""), inv: true };
  }
  if (canInvert(e)) {
    return inverted
      ? { text: "🔄 Inverted · flip at " + mmss(flipAtSegs(invertSegs(e.segs as TimedSeg[])) ?? 0), inv: true }
      : { text: "☕ On the mug · or inverted", inv: false };
  }
  return { text: "☕ On the mug", inv: false };
}

/** For a link-only library entry: the closest of your own timed methods by flavour and drink style. */
export function closestHouse(e: Entry): HouseMethod | null {
  let best: HouseMethod | null = null, bestScore = -1;
  for (const h of HOUSE) {
    if (!h.timed) continue;
    let sc = 0;
    (e.fl || []).forEach((f, i) => { if (h.fl.includes(f)) sc += 3 - Math.min(i, 2); });
    for (const k of ["milk", "iced", "mixer", "concentrate"]) {
      const a = (e.st || []).includes(k), b = (h.st || []).includes(k);
      if (a && b) sc += 3; else if (a !== b) sc -= 2;
    }
    if (sc > bestScore) { bestScore = sc; best = h; }
  }
  return best;
}

/** Normalise any entry for the brew console. */
export function buildBrew(e: Entry, inverted: boolean): Brew {
  if (e.kind === "drink") {
    return {
      id: e.id, name: e.name, emoji: e.emoji, notes: e.desc, timed: false, segs: [],
      checks: e.steps.map((t, i) => ({ ic: "", lbl: `${i + 1}. ${t}`, det: "" })),
      finish: "", o: "none", inv: false, src: e,
    };
  }
  if (e.kind === "house") {
    const inv = canInvert(e) && inverted;
    return {
      id: e.id, name: e.name, emoji: e.emoji, notes: e.notes, timed: e.timed,
      segs: e.timed ? (inv ? invertSegs(e.segs as TimedSeg[]) : (e.segs as TimedSeg[])) : [],
      checks: e.timed ? [] : (e.segs as CheckSeg[]),
      finish: e.finish || "", o: inv ? "inverted" : e.o, inv, src: e,
    };
  }
  if (e.link || !e.segs) {
    return { id: e.id, name: e.name, emoji: GROUP_EMOJI[e.g], notes: "", timed: false, segs: [], checks: [], finish: "", o: e.o, inv: false, src: e };
  }
  const segs = e.segs.map(([k, text, dur]) => ({
    k,
    lbl: k === "flip" ? text.replace(/\s*at \d+:\d\d( immersion)?/gi, "").replace(/\s+,/g, ",").trim() : text,
    det: k === "flip" ? FLIP_HINT : "",
    dur,
  }));
  const icon = e.bypT === "milk" || e.bypT === "condensed" ? "🥛" : e.bypT === "ice" ? "🧊" : e.bypT === "mixer" ? "🥤" : "💦";
  return {
    id: e.id, name: e.name, emoji: GROUP_EMOJI[e.g], notes: e.notes || "", timed: true, segs, checks: [],
    finish: e.fin ? `<b>${icon} After pressing.</b> ${esc(e.fin)}` : "", o: e.o, inv: false, src: e,
  };
}

export function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/* ---------------- card text ---------------- */
export interface Ctx { grinder: Grinder; roast: Roast; dose: (h: HouseMethod) => number }

export function entryStats(e: Entry, c: Ctx): string {
  if (e.kind === "drink") {
    const bs = e.base.map((b) => { const h = houseById(b.id); return h ? h.emoji + " " + h.name.replace(" Concentrate", "") : ""; }).filter(Boolean);
    const bpart = bs.length ? "Base: " + bs.slice(0, 2).join(" or ") : "Instant coffee";
    const extra = e.ing.filter((i) => i[0] !== "optional").slice(0, 2).map((i) => shortItem(i[1]));
    return bpart + (extra.length ? " · + " + extra.join(", ") : "");
  }
  if (e.kind === "library" && (e.link || !e.segs)) return "Full recipe on " + hostOf(e.url) + " ↗";
  if (e.kind === "house") {
    if (!e.timed) return grindText(hGrind(e, c.roast), c.grinder) + " · " + (e.statsNote || "");
    const d = c.dose(e), w = hWater(e, d), b = hBypass(e, d), m = hMilk(e, d), x = hMixer(e, d);
    let vol = w + (b ? "+" + b : "") + " g";
    if (m) vol += " + " + m + " ml milk";
    if (x) vol += " + " + x + " ml " + e.mixerName;
    return `${d} g → ${vol} · ${c.roast.temp} °C · ${grindText(hGrind(e, c.roast), c.grinder)}`;
  }
  const water = e.water ?? 0;
  let vol2 = water + (e.byp ? "+" + g1(e.byp) : "") + " g";
  if (e.bypT === "milk") vol2 = `${water} g + ${e.byp ? e.byp + " g " : ""}milk`;
  if (e.bypT === "ice") vol2 = `${water} g + ${e.byp ? e.byp + " g " : ""}ice`;
  if (e.bypT === "condensed") vol2 = `${water} g + condensed milk`;
  if (e.bypT === "mixer") vol2 = `${water} g + ${e.byp ? e.byp + " ml " : ""}${e.mix}`;
  const lg = libGrind(e, c.grinder);
  return `${g1(e.dose ?? 0)} g → ${vol2} · ${e.temp} °C · ${lg.num} ${lg.unit}${lg.native ? " ★" : ""}`;
}

export function entrySub(e: Entry): string {
  if (e.kind === "house") return e.tagline + " · adapts to your roast";
  if (e.kind === "drink") return [e.aka, e.origin, e.temp === "hot" ? "Hot" : "Iced"].filter(Boolean).join(" · ");
  const bits: (string | number | null | undefined)[] = [e.author];
  if (e.g === "champ") bits.push(e.source); else if (e.source) bits.push(e.source.split(" · ")[0]);
  if (e.country && (e.g !== "champ" || !e.source.includes(e.country))) bits.push(e.country);
  if (e.year && !String(e.source).includes(String(e.year))) bits.push(e.year);
  return bits.filter(Boolean).join(" · ");
}

export function entryTime(e: Entry): string {
  if (e.kind === "drink") return e.time;
  if (e.kind === "library") return e.link || !e.total ? "↗" : mmss(e.total);
  return e.timed ? mmss(hTotal(e)) : "—";
}

export function entryRoastIcon(e: Entry, roast: Roast): string {
  if (e.kind === "drink") return e.temp === "hot" ? "♨️" : "🧊";
  if (e.kind === "house") return roast.emoji;
  return LIB_ROAST_EMOJI[e.roast] || LIB_ROAST_EMOJI.any;
}

export function entryRoastTitle(e: Entry): string {
  if (e.kind === "drink") return e.temp === "hot" ? "Served hot" : "Served iced";
  if (e.kind === "house") return "Uses your roast";
  return e.roast === "any" ? "Any roast" : e.roast + " roast";
}

export function entryIcon(e: Entry): string {
  return e.kind === "library" ? GROUP_EMOJI[e.g] : e.emoji;
}
