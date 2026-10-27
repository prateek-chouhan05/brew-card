import type { FlavourId, HouseMethod, RoastId } from "./types";

/* ============ saved bean bags ============ */
export interface Bean {
  id: string;
  name: string;
  roast: RoastId;
  flavour: FlavourId | "";
  /** roast date from the bag, YYYY-MM-DD */
  roasted?: string;
  /** rest days printed on the bag, if any */
  rest?: number;
}

/**
 * Typical resting windows for filter and AeroPress brewing, by roast. Lighter roasts hold more
 * CO₂ and need longer. A rest time printed on the bag overrides the start of the window.
 */
const WINDOW: Record<RoastId, [number, number]> = {
  light: [10, 35], medlight: [7, 35], medium: [5, 28], meddark: [4, 21], dark: [3, 18],
};

export interface BeanStatus { tone: "rest" | "ready" | "fading" | "old" | "unknown"; label: string; detail: string; day?: number }

export function daysSince(date: string, now = new Date()): number {
  const d = new Date(date + "T00:00:00");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - d.getTime()) / 86400000);
}

export function beanStatus(b: Bean, now = new Date()): BeanStatus {
  if (!b.roasted) return { tone: "unknown", label: "Add the roast date", detail: "Add the roast date from the bag to see when it's at its best." };
  const day = daysSince(b.roasted, now);
  const [from0, to] = WINDOW[b.roast];
  const from = b.rest && b.rest > 0 ? b.rest : from0;
  if (day < 0) return { tone: "unknown", label: "Roast date is in the future", detail: "Check the date on the bag." , day };
  if (day < from) {
    const left = from - day;
    return { tone: "rest", day, label: `Resting · ready in ${left} day${left === 1 ? "" : "s"}`,
      detail: `Day ${day} of roast. Fresh beans are still releasing CO₂, which makes cups muted and uneven. Best from day ${from}.` };
  }
  if (day <= to) return { tone: "ready", day, label: `Ready · day ${day}`, detail: `Day ${day} since roast — in its best window (about day ${from}–${to}).` };
  if (day <= 60) return { tone: "fading", day, label: `Past peak · day ${day}`, detail: "Still good, but aromatics are fading. A slightly finer grind or hotter water helps." };
  return { tone: "old", day, label: `Getting old · day ${day}`, detail: "Expect a flatter cup. Time for a new bag soon." };
}

export const newId = () => Math.random().toString(36).slice(2, 9);

/* ============ ratings, brew log and per-recipe tweaks ============ */
export type Taste = "sour" | "balanced" | "bitter";
export type Strength = "weak" | "right" | "strong";

export interface LogEntry {
  id: string;
  at: string;
  taste: Taste;
  strength: Strength;
  note?: string;
  grind?: string;
  dose?: number;
  bean?: string;
}

/** Per-recipe adjustments you've applied from a rating: grind in C3S steps, dose in grams. */
export interface Tweak { grind?: number; dose?: number }

export interface Advice {
  text: string;
  /** a change the app can make for you on a house method */
  apply?: { label: string; tweak: Tweak };
}

/** One change at a time: fix taste first (grind), then strength (dose). */
export function advise(taste: Taste, strength: Strength, h: HouseMethod | null, dose: number, grindNow?: string): Advice {
  if (taste === "sour") {
    return h
      ? { text: `Under-extracted. Go one step finer next time${grindNow ? ` (you used ${grindNow})` : ""}, keep everything else the same.`,
          apply: { label: "Use 1 step finer next time", tweak: { grind: -1 } } }
      : { text: "Under-extracted. Next time go one step finer — or 2 °C hotter, or steep 15 s longer. Change just one." };
  }
  if (taste === "bitter") {
    return h
      ? { text: `Over-extracted. Go one step coarser next time${grindNow ? ` (you used ${grindNow})` : ""}, and stop pressing at the hiss.`,
          apply: { label: "Use 1 step coarser next time", tweak: { grind: +1 } } }
      : { text: "Over-extracted. Next time go one step coarser — or 2 °C cooler, and press more gently, stopping at the hiss." };
  }
  if (strength === "weak") {
    const canUp = h && h.doseMax !== undefined && dose < h.doseMax;
    return canUp
      ? { text: `Balanced but thin — that's ratio, not extraction. Add 1 g of coffee (${dose + 1} g) and keep the rest.`, apply: { label: `Use ${dose + 1} g next time`, tweak: { dose: +1 } } }
      : { text: "Balanced but thin — that's ratio, not extraction. Add 1 g of coffee and keep the rest." };
  }
  if (strength === "strong") {
    const canDown = h && h.doseMin !== undefined && dose > h.doseMin;
    return canDown
      ? { text: `Balanced but heavy. Use 1 g less coffee (${dose - 1} g), or add a splash of hot water to the cup.`, apply: { label: `Use ${dose - 1} g next time`, tweak: { dose: -1 } } }
      : { text: "Balanced but heavy. Use 1 g less coffee, or add a splash of hot water to the cup." };
  }
  return { text: "Nailed it. Keep these settings — they're saved with this brew." };
}

export const TASTES: { id: Taste; emoji: string; label: string }[] = [
  { id: "sour", emoji: "😬", label: "Sour, thin" },
  { id: "balanced", emoji: "😋", label: "Balanced" },
  { id: "bitter", emoji: "😖", label: "Bitter, harsh" },
];
export const STRENGTHS: { id: Strength; emoji: string; label: string }[] = [
  { id: "weak", emoji: "💧", label: "Weak" },
  { id: "right", emoji: "👌", label: "Just right" },
  { id: "strong", emoji: "💪", label: "Too strong" },
];
