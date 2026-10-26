import { ALL, IDX, houseById } from "./catalog";
import { canInvert, suits } from "./brew";
import type { Entry, FlavourId, GroupId, Roast } from "./types";

/* ---------------- facets, derived from data the card already has ---------------- */
const BREWER_OF_O: Record<string, string> = { standard: "aeropress", inverted: "aeropress", moka: "moka", jar: "coldbrew" };

function brewersOf(e: Entry): string[] {
  if (e.kind === "drink") {
    const out: string[] = [];
    for (const b of e.base) {
      const h = houseById(b.id);
      const br = h && BREWER_OF_O[h.o];
      if (br && !out.includes(br)) out.push(br);
    }
    return out;
  }
  return BREWER_OF_O[e.o] ? [BREWER_OF_O[e.o]] : [];
}
function orientOf(e: Entry): string[] {
  if (e.kind === "drink") return [];
  if (canInvert(e)) return ["standard", "inverted"];
  return e.o === "standard" || e.o === "inverted" ? [e.o] : [];
}
function serveOf(e: Entry): string[] {
  if (e.kind === "drink") return [e.temp === "hot" ? "hot" : "iced"];
  return (e.st || []).includes("iced") ? ["iced"] : ["hot"];
}
function typesOf(e: Entry): string[] {
  const st = e.st || [], out: string[] = [];
  if (st.includes("milk")) out.push("milk");
  if (st.includes("dessert")) out.push("sweet");
  if (st.includes("mixer")) out.push("mixer");
  if (st.includes("alcohol")) out.push("cocktail");
  if (!out.length) out.push("black");
  return out;
}
const strengthOf = (e: Entry) => ((e.st || []).includes("concentrate") ? ["conc"] : ["full"]);

export type GroupKey = "brewer" | "orient" | "serve" | "type" | "strength";
export interface FacetGroup {
  id: GroupKey;
  label: string;
  hint?: string;
  of: (e: Entry) => string[];
  opts: { id: string; label: string; emoji: string }[];
}
export const FGROUPS: FacetGroup[] = [
  { id: "brewer", label: "Brewer", of: brewersOf, hint: "Coffee drinks count under every brewer that can make their base.",
    opts: [{ id: "aeropress", label: "AeroPress", emoji: "☕" }, { id: "moka", label: "Moka pot", emoji: "🔥" }, { id: "coldbrew", label: "Cold brew jar", emoji: "🫙" }] },
  { id: "orient", label: "AeroPress orientation", of: orientOf, hint: "Your methods with an inverted switch count as both.",
    opts: [{ id: "standard", label: "On the mug", emoji: "☕" }, { id: "inverted", label: "Inverted", emoji: "🔄" }] },
  { id: "serve", label: "Served", of: serveOf,
    opts: [{ id: "hot", label: "Hot", emoji: "♨️" }, { id: "iced", label: "Iced or cold", emoji: "🧊" }] },
  { id: "type", label: "Drink type", of: typesOf,
    opts: [{ id: "black", label: "Black", emoji: "☕" }, { id: "milk", label: "With milk", emoji: "🥛" }, { id: "sweet", label: "Sweet treat", emoji: "🍨" },
      { id: "mixer", label: "Mixer & soda", emoji: "🥤" }, { id: "cocktail", label: "With alcohol", emoji: "🍸" }] },
  { id: "strength", label: "Strength", of: strengthOf,
    opts: [{ id: "full", label: "Full cup", emoji: "🫖" }, { id: "conc", label: "Concentrate or shot", emoji: "⚡" }] },
];
export const FACETS: Record<string, Record<GroupKey, string[]>> = {};
for (const e of ALL) {
  const f = {} as Record<GroupKey, string[]>;
  for (const g of FGROUPS) f[g.id] = g.of(e);
  FACETS[e.id] = f;
}
export function optLabel(g: GroupKey, v: string) {
  const o = FGROUPS.find((x) => x.id === g)!.opts.find((x) => x.id === v)!;
  return o.emoji + " " + o.label;
}

/* ---------------- match my coffee ---------------- */
export type MatchMode = "first" | "only" | "off";
export interface Coffee { roast: Roast; flavour: FlavourId | "" }

const flIdx = (e: Entry, c: Coffee) => (c.flavour ? (e.fl || []).indexOf(c.flavour) : -1);
export function isMatch(e: Entry, c: Coffee) {
  const r = suits(e, c.roast);
  return c.flavour ? r && flIdx(e, c) !== -1 : r;
}
export function matchScore(e: Entry, c: Coffee) {
  const i = flIdx(e, c);
  return (suits(e, c.roast) ? 2 : 0) + (i !== -1 ? 3 - i : 0);
}
/** Badges describe the data, they don't promise a result. */
export function matchBadge(e: Entry, c: Coffee, mode: MatchMode): string {
  if (mode === "off") return "";
  const r = suits(e, c.roast), i = flIdx(e, c);
  if (c.flavour) {
    if (r && i !== -1) return "✓ Roast & flavour match";
    if (i !== -1) return "✓ Flavour match";
    return "";
  }
  return r ? "✓ Roast match" : "";
}

/* ---------------- filtering ---------------- */
export interface Filters {
  q: string;
  col: GroupId | "";
  f: Record<GroupKey, string[]>;
}
export const emptyRefine = (): Record<GroupKey, string[]> => ({ brewer: [], orient: [], serve: [], type: [], strength: [] });
export const orientBlocked = (f: Filters) => f.f.brewer.length > 0 && !f.f.brewer.includes("aeropress");
export const activeRefineCount = (f: Filters) => FGROUPS.reduce((n, g) => n + f.f[g.id].length, 0);

function passGroup(e: Entry, f: Filters, gid: GroupKey) {
  const sel = f.f[gid];
  if (!sel.length) return true;
  const v = FACETS[e.id][gid];
  return sel.some((s) => v.includes(s));
}

export interface Query {
  filters: Filters;
  scores: Map<string, number> | null;
  mode: MatchMode;
  coffee: Coffee;
}

/** skip leaves one dimension out, for "how many would this option give" counts. */
export function passes(e: Entry, q: Query, skip?: "col" | GroupKey | "only"): boolean {
  if (q.scores && !((q.scores.get(e.id) ?? -1) > 0)) return false;
  if (skip !== "col" && q.filters.col && e.g !== q.filters.col) return false;
  for (const g of FGROUPS) if (g.id !== skip && !passGroup(e, q.filters, g.id)) return false;
  if (skip !== "only" && q.mode === "only" && !isMatch(e, q.coffee)) return false;
  return true;
}

export function results(q: Query): Entry[] {
  const out = ALL.filter((e) => passes(e, q));
  const useMatch = q.mode !== "off";
  const ms = new Map<string, number>();
  if (useMatch) for (const e of out) ms.set(e.id, matchScore(e, q.coffee));
  return out.sort((a, b) => {
    if (q.scores) { const d = q.scores.get(b.id)! - q.scores.get(a.id)!; if (d) return d; }
    if (useMatch) { const m = ms.get(b.id)! - ms.get(a.id)!; if (m) return m; }
    return IDX.get(a.id)! - IDX.get(b.id)!;
  });
}

export function countWhere(q: Query, skip: "col" | GroupKey, test: (e: Entry) => boolean): number {
  let n = 0;
  for (const e of ALL) if (passes(e, q, skip) && test(e)) n++;
  return n;
}
