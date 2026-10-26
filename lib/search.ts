import { ALL, FL, houseById } from "./catalog";
import { totalOf } from "./brew";
import type { Entry } from "./types";

/** One lower-cased haystack per recipe. */
export const HAY: Record<string, string> = {};
for (const e of ALL) {
  const bits: (string | number | null | undefined | false)[] = [e.name, e.g, (e.st || []).join(" ")];
  if (e.kind !== "drink") bits.push(e.notes);
  bits.push(e.o === "inverted" ? "inverted upside down flip" : e.o === "standard" ? "standard on the mug direct" : e.o === "moka" ? "stovetop" : "");
  for (const id of e.fl || []) bits.push(id, FL[id].label);
  if (e.kind === "library" && e.mix) bits.push(e.mix);
  if (e.kind === "house" && e.mixerName) bits.push(e.mixerName, "cola coke soda");
  if (e.kind === "house") {
    bits.push(e.tagline, "my house own mine", e.o, e.bestFor.join(" "));
  } else if (e.kind === "drink") {
    bits.push(e.aka, e.origin, e.desc, e.temp, "drink drinks classic", e.alcohol ? "alcohol cocktail" : "");
    e.ing.forEach((i) => bits.push(i[1]));
    e.steps.forEach((t) => bits.push(t));
    e.base.forEach((b) => { const h = houseById(b.id); if (h) bits.push(h.name); });
  } else {
    bits.push(e.author, e.source, e.country, e.year, e.o, e.roast + " roast", e.filter, e.grind, e.fin, e.kw, e.pre);
    if (e.g === "champ") bits.push("champion championship competition wac");
    if (/World AeroPress/.test(e.source)) bits.push("world");
    (e.segs || []).forEach((s) => bits.push(s[1]));
    if (e.bypT && e.bypT !== "none") bits.push("bypass dilute", e.bypT);
  }
  HAY[e.id] = bits.filter(Boolean).join(" ").toLowerCase();
}

const SYN: Record<string, string[]> = {
  citrus: ["citric", "acid", "acidity", "bright", "kenya", "lemon", "orange", "clementine", "juicy"],
  citric: ["citrus", "acid", "acidity", "bright"],
  acidic: ["acid", "acidity", "citric", "bright"],
  fruity: ["fruit", "juicy", "natural", "berry"],
  fruit: ["fruity", "juicy", "natural"],
  sweet: ["sweetness", "honey", "sugar"],
  chocolate: ["dark roast", "chocolate", "body"],
  strong: ["concentrate", "stronger", "high dose"],
  latte: ["milk", "flat white"],
  milk: ["latte", "flat white"],
  cold: ["iced", "ice ", "chill"],
  iced: ["ice ", "cold", "chill"],
  easy: ["simple", "forgiving", "travel"],
  simple: ["easy", "no stir", "travel"],
  indian: ["india"],
  viet: ["vietnamese"],
  vietnam: ["vietnamese"],
  hoffman: ["hoffmann"],
};

function termMatch(e: Entry, hay: string, t: string): number {
  if (t === "quick" || t === "fast") { const q = totalOf(e); return q > 0 && q <= 100 ? 1 : 0; }
  if (t === "long" || t === "slow") return totalOf(e) >= 240 ? 1 : 0;
  if (hay.includes(t)) return 2;
  const alt = SYN[t];
  if (alt) for (const a of alt) if (hay.includes(a)) return 1;
  return 0;
}

function score(e: Entry, terms: string[]): number {
  const hay = HAY[e.id];
  let s = 0;
  const nm = e.name.toLowerCase();
  for (const t of terms) {
    const m = termMatch(e, hay, t);
    if (!m) return -1;
    if (m === 1) {
      s += 1;
      for (const a of SYN[t] || []) if (nm.includes(a.trim())) { s += 5; break; }
      continue;
    }
    if (nm.includes(t)) s += 6;
    if (e.kind === "library" && e.author.toLowerCase().includes(t)) s += 4;
    if (e.kind === "library" && e.source.toLowerCase().includes(t)) s += 2;
    s += 1;
  }
  return s;
}

/** Search scores for a query: id → score (> 0 means it matches). Empty map for an empty query. */
export function searchScores(q: string): Map<string, number> | null {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return null;
  const ph = q.toLowerCase().trim();
  const out = new Map<string, number>();
  for (const e of ALL) {
    let sc = score(e, terms);
    if (sc > 0 && terms.length > 1) {
      if (e.name.toLowerCase().includes(ph)) sc += 12;
      else if (HAY[e.id].includes(ph)) sc += 6;
    }
    out.set(e.id, sc);
  }
  return out;
}
