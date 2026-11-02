/* ------------------------------------------------------------------------------------------
   Tasting notes → taste family. Bags never use the app's seven family names; they print notes
   like "brown sugar, roasted almond, raisin". This turns those words into a ranked family with
   its reasons, the same way every time, on the phone, with no network.
   ------------------------------------------------------------------------------------------ */
import type { FlavourId, RoastId } from "./types";

/** term → [family, weight]. Weight 1 is a clear signal; lower is a hint (raisin is fruit, but dried and sweet). */
const LEX: Record<string, [FlavourId, number]> = {};
const add = (f: FlavourId, w: number, terms: string) => terms.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => { LEX[t] = [f, w]; });

add("fruity", 1, "berry, berries, blueberry, strawberry, raspberry, blackberry, blackcurrant, cherry, red cherry, black cherry, plum, grape, red grape, wine, winey, red wine, jam, jammy, tropical, tropical fruit, mango, pineapple, passion fruit, passionfruit, papaya, peach, apricot, nectarine, stone fruit, apple, green apple, red apple, pear, cranberry, pomegranate, guava, lychee, litchi, melon, watermelon, kiwi, fruity, fruit, red fruit, ripe fruit, fermented, boozy, jackfruit");
add("fruity", 0.7, "raisin, raisins, prune, prunes, fig, figs, dried fruit, currant, currants, sultana, date jam, banana, kokum, tamarind");
add("citrus", 1, "lemon, lime, orange, grapefruit, citrus, mandarin, tangerine, clementine, yuzu, kumquat, sweet lime, mosambi, lemon zest, orange zest, zesty, citric, lemonade");
add("citrus", 0.6, "bright, crisp, tangy, lemongrass");
add("floral", 1, "jasmine, rose, hibiscus, lavender, floral, flowers, flowery, honeysuckle, orange blossom, coffee blossom, blossom, bergamot, black tea, earl grey, chamomile, elderflower, violet, lily, tea-like, tea like");
add("floral", 0.6, "tea, green tea, delicate, perfumed");
add("caramel", 1, "caramel, brown sugar, cane sugar, sugarcane, sugar cane, molasses, toffee, butterscotch, honey, jaggery, gur, panela, maple, maple syrup, syrup, date, dates, dulce de leche, candy, candied, treacle, demerara, muscovado, burnt sugar, golden syrup, palm sugar");
add("caramel", 0.6, "sweet, sweetness, vanilla, rum, biscuit, cookie, shortbread, praline");
add("nutty", 1, "almond, almonds, hazelnut, peanut, peanuts, walnut, cashew, pecan, macadamia, pistachio, nut, nuts, nutty, malt, malty, marzipan, nougat, groundnut, chikki, peanut brittle, roasted nut, roasted nuts");
add("nutty", 0.6, "sesame, cereal, toast, toasted, bread, grain, oat, oats");
add("chocolate", 1, "chocolate, dark chocolate, milk chocolate, bittersweet chocolate, cocoa, cacao, cocoa nib, cocoa nibs, cacao nib, cacao nibs, fudge, brownie, mocha, chocolatey, chocolaty");
add("bold", 1, "smoky, smoke, smoked, roasty, woody, wood, cedar, tobacco, leather, earthy, earth, charred, burnt, ash, robusta, bittersweet, dark roast, full body, heavy body, licorice, liquorice");
add("bold", 0.6, "spice, spices, spicy, clove, pepper, black pepper, cardamom, cinnamon, nutmeg, ginger, whiskey, whisky, bold, strong, intense");

const TERMS = Object.keys(LEX).sort((a, b) => b.length - a.length);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RX = TERMS.map((t) => [t, new RegExp(`(^|[^a-z])${esc(t)}([^a-z]|$)`)] as const);

/** Split a line of notes the way bags print them: commas, bars, slashes, "and", "&", new lines. */
export function splitNotes(text: string): string[] {
  return text
    .split(/[,|/\n;•·]+|\s+&\s+|\s+and\s+|\s+\bI\b\s+/i)
    .map((s) => s.trim().replace(/^(notes? of|hints? of|with)\s+/i, "").replace(/\.$/, ""))
    .filter((s) => s.length > 1);
}

export interface NoteMatch { note: string; family: FlavourId | null; term?: string; weight: number }
export interface Hints { bitterness?: "low" | "medium" | "high"; acidity?: "low" | "medium" | "high"; roast?: RoastId }
export interface TasteResult { best: FlavourId | null; ranked: { id: FlavourId; score: number }[]; notes: NoteMatch[]; hint?: string }

/** One note → the longest lexicon term it contains ("roasted almond" → almond → Nutty). */
export function matchNote(note: string): NoteMatch {
  const n = " " + note.toLowerCase().replace(/[^a-z\s-]/g, " ").replace(/\s+/g, " ") + " ";
  for (const [t, rx] of RX) if (rx.test(n)) return { note, family: LEX[t][0], term: t, weight: LEX[t][1] };
  return { note, family: null, weight: 0 };
}

/** Rank the families for a bag. The first note counts most; the bag's own scales nudge the result. */
export function tasteFamily(notes: string[], hints: Hints = {}): TasteResult {
  const matched = notes.map(matchNote);
  const score: Partial<Record<FlavourId, number>> = {};
  matched.forEach((m, i) => { if (m.family) score[m.family] = (score[m.family] ?? 0) + m.weight * Math.max(0.45, 1 - i * 0.2); });
  let hint: string | undefined;
  if (Object.keys(score).length) {
    if (hints.bitterness === "low") { score.bold = (score.bold ?? 0) - 0.3; if (score.caramel !== undefined) score.caramel += 0.2; hint = "Low bitterness on the bag also points to sweet over bold."; }
    if (hints.bitterness === "high") { score.bold = (score.bold ?? 0) + 0.3; hint = "High bitterness on the bag leans it bolder."; }
    if (hints.acidity === "high") { for (const f of ["citrus", "fruity"] as FlavourId[]) if (score[f] !== undefined) score[f]! += 0.2; hint = hint ?? "High acidity on the bag favours the bright families."; }
  }
  const ranked = (Object.entries(score) as [FlavourId, number][]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([id, s]) => ({ id, score: s }));
  return { best: ranked[0]?.id ?? null, ranked, notes: matched, hint };
}

/** Lexicon words that start with what's being typed: "rai" → raisin. */
export function suggest(partial: string, n = 3): string[] {
  const p = partial.trim().toLowerCase();
  if (p.length < 2) return [];
  return Object.keys(LEX).filter((t) => t.startsWith(p) && t !== p && !t.includes(" ")).sort((a, b) => a.length - b.length).slice(0, n);
}

/* ---------------- dates as printed on bags ---------------- */
const iso = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? dt.toISOString().slice(0, 10) : null;
};
/**
 * "05-10-2026" could be 5 Oct or 10 May. Read day-first (as bags in India print it); offer the other
 * reading when both are real dates in the past year, and drop a reading that lies in the future.
 */
export function readBagDate(text: string, today = new Date()): { date: string | null; other?: string } {
  const t = text.trim();
  const now = today.toISOString().slice(0, 10), yearAgo = new Date(today.getTime() - 366 * 864e5).toISOString().slice(0, 10);
  const ok = (d: string | null) => !!d && d <= now && d >= yearAgo;
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) { const d = iso(+m[1], +m[2], +m[3]); return { date: ok(d) ? d : null }; }
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) {
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    const dayFirst = iso(y, +m[2], +m[1]), monthFirst = iso(y, +m[1], +m[2]);
    const a = ok(dayFirst) ? dayFirst : null, b = ok(monthFirst) && monthFirst !== dayFirst ? monthFirst : null;
    if (a && b) return { date: a, other: b };
    return { date: a ?? b };
  }
  const d = new Date(t);
  if (!isNaN(d.getTime())) { const s = iso(d.getFullYear(), d.getMonth() + 1, d.getDate()); return { date: ok(s) ? s : null }; }
  return { date: null };
}

/** Roast words on bags → the app's five levels. */
export function readRoast(text: string | undefined | null): RoastId | null {
  const t = (text || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!t) return null;
  if (/mediumlight|lightmedium|medlight|cinnamon|city$/.test(t)) return "medlight";
  if (/mediumdark|darkmedium|meddark|fullcity|vienna/.test(t)) return "meddark";
  if (/light|nordic|filter/.test(t)) return "light";
  if (/dark|french|italian|espresso/.test(t)) return "dark";
  if (/medium|med|city|balanced/.test(t)) return "medium";
  return null;
}
