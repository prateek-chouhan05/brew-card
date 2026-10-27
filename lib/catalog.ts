import drinksJson from "@/data/drinks.json";
import libraryJson from "@/data/library.json";
import { HOUSE as RAW_HOUSE } from "./data/house";
import { FLAVOURS, HOUSE_PAIR } from "./data/flavours";
import { ROASTS } from "./data/roasts";
import { GRINDERS } from "./data/grinders";
import type { Drink, Entry, Flavour, FlavourId, Grinder, HouseMethod, LibraryEntry, Roast } from "./types";

export const HOUSE: HouseMethod[] = RAW_HOUSE.map((h) => {
  const [fl, why] = HOUSE_PAIR[h.id];
  return { ...h, kind: "house", g: "mine", fl, why };
});

export const DRINKS: Drink[] = (drinksJson as Omit<Drink, "kind" | "g" | "o">[]).map((d) => ({
  ...d,
  kind: "drink",
  g: "drink",
  o: "none",
}));

export const LIBRARY: LibraryEntry[] = (libraryJson as Omit<LibraryEntry, "kind">[]).map((r) => ({
  ...r,
  kind: "library",
}));

/** Every recipe, in the card's display order: your methods, coffee drinks, then the library. */
export const ALL: Entry[] = [...HOUSE, ...DRINKS, ...LIBRARY];

const BY_ID = new Map<string, Entry>(ALL.map((e) => [e.id, e]));
if (BY_ID.size !== ALL.length) throw new Error("Duplicate recipe ids");
export const IDX = new Map<string, number>(ALL.map((e, i) => [e.id, i]));

export function entryById(id: string): Entry | undefined {
  return BY_ID.get(id);
}
export function houseById(id: string): HouseMethod | undefined {
  const e = BY_ID.get(id);
  return e && e.kind === "house" ? e : undefined;
}

export const FL: Record<FlavourId, Flavour> = Object.fromEntries(FLAVOURS.map((f) => [f.id, f])) as Record<FlavourId, Flavour>;

export function roastById(id: string | null | undefined): Roast | undefined {
  return ROASTS.find((r) => r.id === id);
}
export function grinderById(id: string | null | undefined): Grinder | undefined {
  return GRINDERS.find((g) => g.id === id);
}

export const DEFAULT_ENTRY_ID = "my-everyday";
