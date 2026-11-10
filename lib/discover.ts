import type { IconName } from "./icons";
import { ALL, IDX, houseById } from "./catalog";
import { canInvert, suits } from "./brew";
import type { Entry, FlavourId, GroupId, Roast } from "./types";

/* ---------------- facets, derived from data the card already has ---------------- */
const BREWER_OF_O: Record<string, string> = { standard: "aeropress", inverted: "aeropress", moka: "moka", jar: "coldbrew", press: "frenchpress", pourover: "v60" };

function brewersOf(e: Entry): string[] {
  if (e.kind === "drink") {
    const out: string[] = [];
    for (const b of e.base) {
      const h = houseById(b.id);
      const br = h && BREWER_OF_O[h.o];
      if (br && !out.includes(br)) out.push(br);
    }
    if (!e.base.length && e.ing.some((i) => /instant coffee/i.test(i[1]))) out.push("instant");
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
  opts: { id: string; label: string; icon: IconName }[];
}
export const FGROUPS: FacetGroup[] = [
  { id: "brewer", label: "Brewer", of: brewersOf, hint: "Coffee drinks count under every brewer that can make their base.",
    opts: [{ id: "aeropress", label: "AeroPress", icon: "aeropress" }, { id: "frenchpress", label: "French press", icon: "frenchpress" }, { id: "v60", label: "V60 pour-over", icon: "v60" },
      { id: "moka", label: "Moka pot", icon: "moka" }, { id: "coldbrew", label: "Cold brew jar", icon: "jar" }, { id: "instant", label: "Instant coffee", icon: "instant" }] },
  { id: "orient", label: "AeroPress orientation", of: orientOf, hint: "Your methods with an inverted switch count as both.",
    opts: [{ id: "standard", label: "On the mug", icon: "aeropress" }, { id: "inverted", label: "Inverted", icon: "inverted" }] },
  { id: "serve", label: "Served", of: serveOf,
    opts: [{ id: "hot", label: "Hot", icon: "hot" }, { id: "iced", label: "Iced or cold", icon: "iced" }] },
  { id: "type", label: "Drink type", of: typesOf,
    opts: [{ id: "black", label: "Black", icon: "cup" }, { id: "milk", label: "With milk", icon: "milk" }, { id: "sweet", label: "Sweet treat", icon: "sweet" },
      { id: "mixer", label: "Mixer & soda", icon: "soda" }, { id: "cocktail", label: "With alcohol", icon: "alcohol" }] },
  { id: "strength", label: "Strength", of: strengthOf,
    opts: [{ id: "full", label: "Full cup", icon: "mug" }, { id: "conc", label: "Concentrate or shot", icon: "concentrate" }] },
];
export const FACETS: Record<string, Record<GroupKey, string[]>> = {};
for (const e of ALL) {
  const f = {} as Record<GroupKey, string[]>;
  for (const g of FGROUPS) f[g.id] = g.of(e);
  FACETS[e.id] = f;
}
export function optOf(g: GroupKey, v: string) {
  return FGROUPS.find((x) => x.id === g)!.opts.find((x) => x.id === v)!;
}

/* ---------------- match my coffee ---------------- */
export type MatchMode = "first" | "only" | "off";
/** The coffee being brewed: its roast, its headline taste, and every taste its notes point to. */
export interface Coffee { roast: Roast; flavour: FlavourId | ""; tastes?: FlavourId[] }

const tastesOf = (c: Coffee): FlavourId[] => (c.tastes?.length ? c.tastes.slice(0, 3) : c.flavour ? [c.flavour] : []);
/**
 * How well a recipe's flavour tags fit the bag. Each shared taste counts by where it sits on
 * both lists: the bag's first taste and the recipe's first tag weigh most (3 × 3 / 3 = 3).
 */
function tasteFit(e: Entry, c: Coffee): { score: number; shared: FlavourId[] } {
  const fl = e.fl || [];
  let score = 0; const shared: FlavourId[] = [];
  tastesOf(c).forEach((t, i) => { const j = fl.indexOf(t); if (j !== -1) { score += ((3 - i) * (3 - j)) / 3; shared.push(t); } });
  return { score, shared };
}
export function isMatch(e: Entry, c: Coffee) {
  const r = suits(e, c.roast);
  return tastesOf(c).length ? r && tasteFit(e, c).shared.length > 0 : r;
}
export function matchScore(e: Entry, c: Coffee) {
  return (suits(e, c.roast) ? 2 : 0) + tasteFit(e, c).score;
}
const SHORT: Record<FlavourId, string> = { fruity: "fruity", citrus: "citrus", floral: "floral", caramel: "caramel", nutty: "nutty", chocolate: "chocolate", bold: "bold" };
/** Badges describe the data, they don't promise a result. Two shared tastes are named. */
export function matchBadge(e: Entry, c: Coffee, mode: MatchMode): string {
  if (mode === "off") return "";
  const r = suits(e, c.roast);
  if (!tastesOf(c).length) return r ? "Roast match" : "";
  const { shared } = tasteFit(e, c);
  if (!shared.length) return "";
  if (shared.length >= 2) {
    const both = `${SHORT[shared[0]]} + ${SHORT[shared[1]]}`;
    return r ? `Roast match · ${both}` : both.charAt(0).toUpperCase() + both.slice(1);
  }
  return r ? "Roast & flavour match" : "Flavour match";
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
