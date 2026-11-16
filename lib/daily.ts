/* Coffee of the day: one pick for this moment, chosen on the phone from the local date and hour.
   No server, no loop: the pick is fixed for a part of the day and changes between visits, never while you read. */
import { entryById } from "./catalog";
import { FACETS } from "./discover";
import type { Entry } from "./types";

export type Part = "morning" | "afternoon" | "evening" | "night";

export function partOf(hour: number): Part {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 16) return "afternoon";
  if (hour >= 16 && hour < 21) return "evening";
  return "night";
}

const GREETING: Record<Part, string> = {
  morning: "Good morning.",
  afternoon: "Good afternoon.",
  evening: "Good evening.",
  night: "Up late?",
};

interface Candidate {
  id: string;
  parts: Part[];
  /** months it suits, 1–12; all year when left out */
  months?: number[];
  /** "{month}" becomes the month's name */
  why: string;
  facts: string;
  cta?: string;
  /** anyone can make it, whatever brewers they picked */
  anyKit?: boolean;
}

const HOT = [3, 4, 5, 6, 7, 8, 9];
const COOL = [10, 11, 12, 1, 2];

const CANDIDATES: Candidate[] = [
  { id: "filter-kaapi", parts: ["morning"], why: "A {month} morning cup: hot, milky and strong.", facts: "About 10 minutes with a steel filter or a moka pot." },
  { id: "instant-coffee", parts: ["morning", "afternoon"], why: "The instant coffee you already have, made properly: a cold paste first, then hot water.", facts: "3 minutes." },
  { id: "my-frenchpress", parts: ["morning"], months: [6, 7, 8, 9, 10, 11, 12, 1, 2], why: "A slow, full cup for a {month} morning.", facts: "About 10 minutes, mostly waiting." },
  { id: "my-everyday", parts: ["morning"], why: "A fuller cup that forgives a rushed morning.", facts: "2 minutes with an AeroPress." },
  { id: "my-v60", parts: ["morning"], why: "A clean, bright cup to start the day.", facts: "3 minutes with a V60 and a scale." },
  { id: "dalgona", parts: ["afternoon"], months: HOT, why: "{month} afternoons want something cold. This one needs only instant coffee.", facts: "8 minutes, no machine." },
  { id: "iced-latte-home", parts: ["afternoon"], months: HOT, why: "Coffee over ice and cold milk for a {month} afternoon.", facts: "3 minutes with a moka pot or AeroPress." },
  { id: "beaten-coffee", parts: ["afternoon", "evening"], months: COOL, why: "Whipped by hand with sugar, the way many Indian homes make it.", facts: "8 minutes with instant coffee." },
  { id: "cappuccino", parts: ["afternoon"], months: COOL, why: "A small, foamy cup for a cool {month} afternoon.", facts: "4 minutes with a moka pot or espresso." },
  { id: "cafe-au-lait", parts: ["evening"], why: "Half coffee, half hot milk. An easy one for the evening.", facts: "4 minutes with a French press or moka pot." },
  { id: "my-milk", parts: ["evening"], why: "A small, milky cup for the evening.", facts: "About 2 minutes with an AeroPress." },
  { id: "my-coldbrew", parts: ["night"], why: "Steep it tonight and tomorrow's coffee is waiting in the fridge.", facts: "5 minutes now, then 12 to 18 hours in the fridge.", cta: "Start tonight", anyKit: true },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The phone's own date, "2026-07-16": India gets a new pick at its midnight, not at 5:30 am. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface Today {
  part: Part;
  greeting: string;
  /** a second line, only when it says something: Coffee Day, or a first visit */
  line: string;
  entry: Entry;
  why: string;
  facts: string;
  cta: string;
}

/**
 * The pick for `now`. Keyed to recipe ids (not list positions), so adding a recipe never reshuffles
 * other days. `recent` holds ids picked on the last few days and is skipped when there's another choice.
 * `brewers` (the Brewer filter) keeps the pick to something the person can make.
 */
export function today(now: Date, brewers: string[], recent: string[], firstVisit: boolean): Today | null {
  const part = partOf(now.getHours());
  const month = now.getMonth() + 1;
  const month$ = MONTHS[now.getMonth()];
  const fit = (c: Candidate) => c.anyKit || !brewers.length || FACETS[c.id]?.brewer.some((b) => brewers.includes(b));

  if (month === 10 && now.getDate() === 1) {
    const e = entryById("beaten-coffee");
    if (e) return { part: part === "night" ? "night" : "morning", greeting: "Happy Coffee Day.", line: "1 October is International Coffee Day.", entry: e,
      why: "Whipped by hand with sugar, the way many Indian homes make it.", facts: "8 minutes with instant coffee.", cta: "Make it" };
  }

  const inSeason = CANDIDATES.filter((c) => c.parts.includes(part) && (!c.months || c.months.includes(month)) && entryById(c.id));
  let pool = inSeason.filter(fit);
  if (!pool.length) pool = inSeason;
  if (!pool.length) return null;
  const fresh = pool.filter((c) => !recent.includes(c.id));
  const from = fresh.length ? fresh : pool;
  const c = from[hash(dayKey(now) + part) % from.length];
  return {
    part, greeting: GREETING[part],
    line: firstVisit ? "Here's one to start with, or search for your own below." : "",
    entry: entryById(c.id)!, why: c.why.replace("{month}", month$), facts: c.facts, cta: c.cta ?? "Make it",
  };
}
