"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_ENTRY_ID, FL, entryById, grinderById, roastById } from "@/lib/catalog";
import { GRINDERS } from "@/lib/data/grinders";
import { ROASTS } from "@/lib/data/roasts";
import { VOLUMES } from "@/lib/data/labels";
import { setVolume } from "@/lib/audio";
import { emptyRefine, type Filters, type MatchMode } from "@/lib/discover";
import { KEYS, load, loadJSON, save } from "@/lib/storage";
import type { FlavourId, Grinder, HouseMethod, Roast } from "@/lib/types";

/* ============ coffee setup: persistent facts about what you're brewing ============ */
export interface Setup { grinder: Grinder; roast: Roast; flavour: FlavourId | "" }
interface SetupCtx extends Setup {
  hydrated: boolean;
  apply: (next: { grinder: string; roast: string; flavour: string }) => void;
  dialog: { open: boolean; firstRun: boolean };
  openSetup: (firstRun?: boolean) => void;
  closeSetup: () => void;
}
const SetupContext = createContext<SetupCtx | null>(null);

/* ============ discovery: search + filters survive moving between pages ============ */
interface DiscoverCtx {
  filters: Filters;
  setFilters: (f: Filters | ((f: Filters) => Filters)) => void;
  mode: MatchMode;
  setMode: (m: MatchMode) => void;
  shown: number;
  setShown: (n: number) => void;
}
const DiscoverContext = createContext<DiscoverCtx | null>(null);
export const PAGE = 12;

/* ============ brew preferences: orientation, dose, checklist, drink → base flow ============ */
interface BrewCtx {
  inverted: (id: string) => boolean;
  setInverted: (id: string, on: boolean) => void;
  dose: (h: HouseMethod) => number;
  setDose: (id: string, d: number) => void;
  checked: Record<string, boolean>;
  toggleCheck: (key: string) => boolean;
  returnTo: string | null;
  setReturnTo: (id: string | null) => void;
  lastEntry: string;
  rememberEntry: (id: string) => void;
  volIdx: number;
  cycleVolume: () => void;
}
const BrewContext = createContext<BrewCtx | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  /* ---- setup ---- */
  const [grinder, setGrinder] = useState<Grinder>(GRINDERS[0]);
  const [roast, setRoast] = useState<Roast>(ROASTS[2]);
  const [flavour, setFlavour] = useState<FlavourId | "">("");
  const [hydrated, setHydrated] = useState(false);
  const [dialog, setDialog] = useState({ open: false, firstRun: false });

  /* ---- discovery ---- */
  const [filters, setFilters] = useState<Filters>({ q: "", col: "", f: emptyRefine() });
  const [mode, setModeState] = useState<MatchMode>("first");
  const [shown, setShown] = useState(PAGE);

  /* ---- brew ---- */
  const [invPref, setInvPref] = useState<Record<string, boolean>>({});
  const [doses, setDoses] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [lastEntry, setLastEntry] = useState(DEFAULT_ENTRY_ID);
  const [volIdx, setVolIdx] = useState(0);

  useEffect(() => {
    setGrinder(grinderById(load(KEYS.grinder, "c3s")) ?? GRINDERS[0]);
    setRoast(roastById(load(KEYS.roast, "medium")) ?? ROASTS[2]);
    const fl = load(KEYS.flavour, "");
    setFlavour(fl in FL ? (fl as FlavourId) : "");
    const m = load(KEYS.matchMode, "first");
    setModeState(m === "only" || m === "off" ? m : "first");
    setInvPref(loadJSON<Record<string, boolean>>(KEYS.inv, {}));
    let last = load(KEYS.entry, "");
    const legacy = load(KEYS.legacyRecipe, "");
    if (!last && legacy) last = "my-" + legacy;
    if (last && entryById(last)) setLastEntry(last);
    let v = load(KEYS.volume, "");
    if (!v && load(KEYS.muted, "0") === "1") v = "off";
    const vi = Math.max(0, VOLUMES.findIndex((x) => x.id === v));
    setVolIdx(vi); setVolume(vi);
    setHydrated(true);
    // First run: nothing saved yet → ask, with sensible defaults preselected.
    if (load(KEYS.setupDone, "") !== "1" && load(KEYS.grinder, "") === "") {
      setTimeout(() => setDialog({ open: true, firstRun: true }), 250);
    }
  }, []);

  const apply = useCallback((next: { grinder: string; roast: string; flavour: string }) => {
    const g = grinderById(next.grinder) ?? GRINDERS[0];
    const r = roastById(next.roast) ?? ROASTS[2];
    const f = next.flavour in FL ? (next.flavour as FlavourId) : "";
    setGrinder(g); setRoast(r); setFlavour(f);
    save(KEYS.grinder, g.id); save(KEYS.roast, r.id); save(KEYS.flavour, f); save(KEYS.setupDone, "1");
  }, []);
  const openSetup = useCallback((firstRun = false) => setDialog({ open: true, firstRun }), []);
  const closeSetup = useCallback(() => { save(KEYS.setupDone, "1"); setDialog({ open: false, firstRun: false }); }, []);

  const setMode = useCallback((m: MatchMode) => { setModeState(m); save(KEYS.matchMode, m); }, []);

  const brew = useMemo<BrewCtx>(() => ({
    inverted: (id) => !!invPref[id],
    setInverted: (id, on) => setInvPref((p) => { const n = { ...p, [id]: on }; save(KEYS.inv, JSON.stringify(n)); return n; }),
    dose: (h) => doses[h.id] ?? h.dose,
    setDose: (id, d) => setDoses((p) => ({ ...p, [id]: d })),
    checked,
    toggleCheck: (key) => { const on = !checked[key]; setChecked((p) => ({ ...p, [key]: on })); return on; },
    returnTo, setReturnTo,
    lastEntry,
    rememberEntry: (id) => { setLastEntry(id); save(KEYS.entry, id); },
    volIdx,
    cycleVolume: () => {
      const i = (volIdx + 1) % VOLUMES.length;
      setVolIdx(i); setVolume(i); save(KEYS.volume, VOLUMES[i].id);
    },
  }), [invPref, doses, checked, returnTo, lastEntry, volIdx]);

  const setup = useMemo<SetupCtx>(() => ({ grinder, roast, flavour, hydrated, apply, dialog, openSetup, closeSetup }),
    [grinder, roast, flavour, hydrated, apply, dialog, openSetup, closeSetup]);
  const discover = useMemo<DiscoverCtx>(() => ({ filters, setFilters, mode, setMode, shown, setShown }), [filters, mode, setMode, shown]);

  return (
    <SetupContext.Provider value={setup}>
      <DiscoverContext.Provider value={discover}>
        <BrewContext.Provider value={brew}>{children}</BrewContext.Provider>
      </DiscoverContext.Provider>
    </SetupContext.Provider>
  );
}

function need<T>(v: T | null, name: string): T {
  if (!v) throw new Error(name + " must be used inside <Providers>");
  return v;
}
export const useSetup = () => need(useContext(SetupContext), "useSetup");
export const useDiscover = () => need(useContext(DiscoverContext), "useDiscover");
export const useBrewPrefs = () => need(useContext(BrewContext), "useBrewPrefs");
