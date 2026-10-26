import { GRINDERS, NATIVE } from "./data/grinders";
import type { Grinder, LibraryEntry } from "./types";

/** Every recipe's grind is stored on the Timemore C3S scale. */
const BASE_A = GRINDERS[0].a;

/** C3S clicks → the same spot on another grinder, matching brew methods piece by piece (brewmark.io anchors). */
export function toGrinder(x: number, g: Grinder): number {
  if (g.id === "c3s") return x;
  const A = BASE_A, B = g.a;
  let i: number;
  if (x <= A[0]) i = 0;
  else if (x >= A[A.length - 1]) i = A.length - 2;
  else {
    for (i = 0; i < A.length - 1; i++) if (x <= A[i + 1]) break;
  }
  const t = (x - A[i]) / (A[i + 1] - A[i]);
  const v = B[i] + t * (B[i + 1] - B[i]);
  return Math.max(g.min, Math.min(g.max, v));
}

export function roundG(v: number, g: Grinder): number {
  return g.unit === "ode" ? Math.round(v * 3) / 3 : Math.round(v);
}

/** A setting as text: whole clicks/numbers, or thirds on the Fellow Ode. */
export function numG(v: number, g: Grinder): string {
  v = roundG(v, g);
  if (g.unit === "ode") {
    let w = Math.floor(v + 1e-9);
    let f = Math.round((v - w) * 3);
    if (f === 3) { w += 1; f = 0; }
    const frac = f === 1 ? "⅓" : f === 2 ? "⅔" : "";
    return w === 0 && frac ? frac : String(w) + frac;
  }
  return String(v);
}

export function unitG(g: Grinder): string {
  return g.unit === "clicks" ? "clicks" : "on dial";
}

/** "13 clicks" / "14 on dial" for a C3S value */
export function grindText(c3s: number, g: Grinder): string {
  return numG(toGrinder(c3s, g), g) + " " + unitG(g);
}

/** Where a recipe's author gave a setting for a specific grinder, show their number on that grinder. */
export function libGrind(e: LibraryEntry, g: Grinder): { num: string; unit: string; native: boolean } {
  const n = NATIVE[e.id]?.[g.id];
  if (n) return { num: n, unit: unitG(g), native: true };
  return { num: numG(toGrinder(e.clicks ?? 15, g), g), unit: unitG(g), native: false };
}

export function stepWord(n: number, g: Grinder): string {
  const one = Math.abs(Math.abs(n) - 1) < 1e-6 || Math.abs(n) < 1;
  return g.unit === "clicks" ? (one ? "click" : "clicks") : one ? "step" : "steps";
}

export function grinderShort(g: Grinder): string {
  return g.name.startsWith(g.brand + " ") ? g.name.slice(g.brand.length + 1) : g.name;
}
