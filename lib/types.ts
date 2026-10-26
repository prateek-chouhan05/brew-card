export type RoastId = "light" | "medlight" | "medium" | "meddark" | "dark";
export type FlavourId = "fruity" | "citrus" | "floral" | "caramel" | "nutty" | "chocolate" | "bold";
export type SegKind = "pour" | "wait" | "swirl" | "stir" | "press" | "flip";
export type GroupId = "mine" | "drink" | "champ" | "pro" | "fan";

export interface Roast {
  id: RoastId;
  label: string;
  emoji: string;
  temp: number;
  adj: number;
  rank: number;
  note: string;
}

export interface Flavour {
  id: FlavourId;
  emoji: string;
  label: string;
  notes: string;
  beans: string;
  brew: string;
}

export interface Grinder {
  id: string;
  brand: string;
  name: string;
  unit: "clicks" | "dial" | "ode";
  min: number;
  max: number;
  floor?: number;
  /** starting setting per brew method, in METHODS order */
  a: number[];
  r: number[][];
}

/** A timed phase: pour, stir, wait… */
export interface TimedSeg {
  k: SegKind;
  lbl: string;
  det: string;
  dur: number;
}
/** An untimed checklist step (moka pot, cold brew, drinks) */
export interface CheckSeg {
  ic: string;
  lbl: string;
  det: string;
}

/** House method as written in data/house.ts */
export interface RawHouse {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  notes: string;
  grindBase: number;
  dose: number;
  doseMin?: number;
  doseMax?: number;
  ratios: { water?: number; bypass?: number; milk?: number; mixer?: number };
  mixerName?: string;
  bestFor: RoastId[];
  o: "standard" | "moka" | "jar";
  st: string[];
  specs?: [string, string, string][];
  statsNote?: string;
  prep: string;
  invNote?: string;
  timed: boolean;
  segs: (TimedSeg | CheckSeg)[];
  finish?: string;
}

export interface HouseMethod extends RawHouse {
  kind: "house";
  g: "mine";
  fl: FlavourId[];
  why: string;
}

export interface Drink {
  kind: "drink";
  g: "drink";
  o: "none";
  id: string;
  emoji: string;
  name: string;
  aka: string;
  origin: string;
  temp: "hot" | "iced";
  time: string;
  st: string[];
  fl: FlavourId[];
  bestFor: RoastId[];
  why: string;
  desc: string;
  base: { id: string; amt: string }[];
  baseNote: string;
  ing: [string, string][];
  steps: string[];
  tips: string[];
  warn: string;
  alcohol: boolean;
}

export interface LibraryEntry {
  kind: "library";
  id: string;
  name: string;
  author: string;
  source: string;
  g: "champ" | "pro" | "fan";
  year?: number | null;
  country?: string | null;
  url: string;
  o: "standard" | "inverted";
  roast: "light" | "medium" | "dark" | "any";
  st: string[];
  fl: FlavourId[];
  why: string;
  kw?: string;
  /** link-only index entry: the recipe itself lives on its original page */
  link?: boolean;
  // Present only in a private full library:
  dose?: number;
  water?: number;
  byp?: number | null;
  bypT?: string;
  temp?: number;
  grind?: string;
  clicks?: number;
  filter?: string;
  total?: number;
  notes?: string;
  issues?: string;
  fin?: string;
  segs?: [SegKind, string, number][];
  pre?: string;
  add?: string;
  mix?: string;
}

export type Entry = HouseMethod | Drink | LibraryEntry;

export type Orientation = "standard" | "inverted" | "moka" | "jar" | "none";

/** A recipe normalised for the brew console */
export interface Brew {
  id: string;
  name: string;
  emoji: string;
  notes: string;
  timed: boolean;
  segs: TimedSeg[];
  checks: CheckSeg[];
  finish: string;
  o: Orientation;
  inv: boolean;
  src: Entry;
}
