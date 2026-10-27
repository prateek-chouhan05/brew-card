/** Browser storage that never throws (private mode, blocked storage, server render). */
export function load(key: string, fallback: string): string {
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}
export function save(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Storage keys — the same names the original single-page card used, so saved settings carry over. */
export const KEYS = {
  grinder: "brewcard.grinder",
  roast: "brewcard.roast",
  flavour: "brewcard.flavour",
  setupDone: "brewcard.setupDone",
  matchMode: "brewcard.matchMode",
  entry: "brewcard.entry",
  legacyRecipe: "brewcard.recipe",
  inv: "brewcard.inv",
  volume: "brewcard.volume",
  muted: "brewcard.muted",
  doses: "brewcard.doses",
  grindAdj: "brewcard.grindAdj",
  favs: "brewcard.favs",
  recent: "brewcard.recent",
  log: "brewcard.log",
  beans: "brewcard.beans",
  activeBean: "brewcard.activeBean",
  voice: "brewcard.voice",
} as const;
