"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_ENTRY_ID, FL, entryById, grinderById, roastById } from "@/lib/catalog";
import { GRINDERS } from "@/lib/data/grinders";
import { ROASTS } from "@/lib/data/roasts";
import { VOLUMES } from "@/lib/data/labels";
import { setVolume } from "@/lib/audio";
import { FGROUPS, emptyRefine, type Filters, type MatchMode } from "@/lib/discover";
import { KEYS, load, loadJSON, save } from "@/lib/storage";
import type { FlavourId, Grinder, HouseMethod, Roast } from "@/lib/types";
import type { Bean, LogEntry } from "@/lib/journal";
import { timer } from "@/lib/timer";
import { bagTastes } from "@/lib/tasting";

const BREWERS = FGROUPS.find((g) => g.id === "brewer")!.opts.map((o) => o.id);

/* ============ coffee setup: persistent facts about what you're brewing ============ */
export type CoffeeForm = "ground" | "beans" | "";
export interface Setup { grinder: Grinder; roast: Roast; flavour: FlavourId | "" }
export interface SetupDraft { grinder: string; roast: string; flavour: string; beans: Bean[]; activeBean: string; form: CoffeeForm }
export interface WelcomeAnswers { brewers: string[]; form: CoffeeForm; grinder?: string }
interface SetupCtx extends Setup {
  hydrated: boolean;
  /** saved bags, and the one you're brewing now ("" = none) */
  beans: Bean[];
  activeBean: Bean | null;
  /** every taste the bag points to, headline first (just the headline when there's no bag with notes) */
  tastes: FlavourId[];
  apply: (next: SetupDraft) => void;
  /** how the coffee comes: ready-ground shows grind in words, never grinder settings */
  form: CoffeeForm;
  words: boolean;
  /** first visit with nothing saved: the welcome screen replaces Recipes until it's answered */
  welcome: boolean;
  finishWelcome: (a: WelcomeAnswers) => void;
  dialog: { open: boolean };
  openSetup: () => void;
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
  /** grind adjustment for a recipe, in C3S steps, from "dial in" */
  grindAdj: (id: string) => number;
  tweak: (id: string, t: { grind?: number; dose?: number }, h?: HouseMethod) => void;
  favs: string[];
  toggleFav: (id: string) => void;
  recent: { id: string; at: string }[];
  recordBrew: (id: string) => void;
  log: Record<string, LogEntry[]>;
  addLog: (e: LogEntry) => void;
  voice: boolean;
  setVoice: (on: boolean) => void;
}
const BrewContext = createContext<BrewCtx | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  /* ---- setup ---- */
  const [grinder, setGrinder] = useState<Grinder>(GRINDERS[0]);
  const [roast, setRoast] = useState<Roast>(ROASTS[2]);
  const [flavour, setFlavour] = useState<FlavourId | "">("");
  const [hydrated, setHydrated] = useState(false);
  const [dialog, setDialog] = useState({ open: false });
  const [beans, setBeans] = useState<Bean[]>([]);
  const [activeBeanId, setActiveBeanId] = useState("");
  const [form, setForm] = useState<CoffeeForm>("");
  const [welcome, setWelcome] = useState(false);

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
  const [grindAdjs, setGrindAdjs] = useState<Record<string, number>>({});
  const [favs, setFavs] = useState<string[]>([]);
  const [recent, setRecent] = useState<{ id: string; at: string }[]>([]);
  const [log, setLog] = useState<Record<string, LogEntry[]>>({});
  const [voice, setVoiceState] = useState(true);

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
    setDoses(loadJSON<Record<string, number>>(KEYS.doses, {}));
    setGrindAdjs(loadJSON<Record<string, number>>(KEYS.grindAdj, {}));
    setFavs(loadJSON<string[]>(KEYS.favs, []).filter((id) => entryById(id)));
    setRecent(loadJSON<{ id: string; at: string }[]>(KEYS.recent, []).filter((r) => entryById(r.id)));
    setLog(loadJSON<Record<string, LogEntry[]>>(KEYS.log, {}));
    setBeans(loadJSON<Bean[]>(KEYS.beans, []));
    setActiveBeanId(load(KEYS.activeBean, ""));
    setVoiceState(load(KEYS.voice, "1") !== "0");
    const fm = load(KEYS.coffeeForm, "");
    setForm(fm === "ground" || fm === "beans" ? fm : "");
    const brewers = loadJSON<string[]>(KEYS.brewers, []).filter((b) => BREWERS.includes(b));
    if (brewers.length) setFilters((f) => ({ ...f, f: { ...f.f, brewer: brewers } }));
    setHydrated(true);
    // First run: nothing saved yet → the welcome screen asks what you brew with.
    if (load(KEYS.setupDone, "") !== "1" && load(KEYS.grinder, "") === "") setWelcome(true);
  }, []);

  // the Brewer filter is remembered, so the brewers you picked stay picked
  const brewerKey = filters.f.brewer.join(",");
  useEffect(() => { if (hydrated) save(KEYS.brewers, JSON.stringify(brewerKey ? brewerKey.split(",") : [])); }, [hydrated, brewerKey]);

  const finishWelcome = useCallback((a: WelcomeAnswers) => {
    setForm(a.form); save(KEYS.coffeeForm, a.form);
    const g = a.grinder ? grinderById(a.grinder) : undefined;
    if (g) { setGrinder(g); save(KEYS.grinder, g.id); }
    setFilters((f) => ({ ...f, f: { ...f.f, brewer: a.brewers, orient: a.brewers.includes("aeropress") ? f.f.orient : [] } }));
    setShown(PAGE);
    save(KEYS.setupDone, "1");
    setWelcome(false);
  }, []);

  const apply = useCallback((next: SetupDraft) => {
    const g = grinderById(next.grinder) ?? GRINDERS[0];
    const r = roastById(next.roast) ?? ROASTS[2];
    const f: FlavourId | "" = next.flavour in FL ? (next.flavour as FlavourId) : "";
    setGrinder(g); setRoast(r); setFlavour(f); setForm(next.form);
    save(KEYS.coffeeForm, next.form);
    save(KEYS.grinder, g.id); save(KEYS.roast, r.id); save(KEYS.flavour, f); save(KEYS.setupDone, "1");
    // the active bag follows whatever roast and flavour you saved
    const bs = next.beans.map((b) => (b.id === next.activeBean ? { ...b, roast: r.id, flavour: f } : b));
    const active = bs.some((b) => b.id === next.activeBean) ? next.activeBean : "";
    setBeans(bs); setActiveBeanId(active);
    save(KEYS.beans, JSON.stringify(bs)); save(KEYS.activeBean, active);
  }, []);
  const openSetup = useCallback(() => setDialog({ open: true }), []);
  const closeSetup = useCallback(() => { save(KEYS.setupDone, "1"); setDialog({ open: false }); }, []);

  const setMode = useCallback((m: MatchMode) => { setModeState(m); save(KEYS.matchMode, m); }, []);

  // anything that finishes on the timer counts as brewed
  const recordBrew = useCallback((id: string) => {
    setRecent((p) => {
      const n = [{ id, at: new Date().toISOString() }, ...p.filter((r) => r.id !== id)].slice(0, 12);
      save(KEYS.recent, JSON.stringify(n));
      return n;
    });
  }, []);
  useEffect(() => timer.onFinish((id) => recordBrew(id)), [recordBrew]);

  const brew = useMemo<BrewCtx>(() => ({
    inverted: (id) => !!invPref[id],
    setInverted: (id, on) => setInvPref((p) => { const n = { ...p, [id]: on }; save(KEYS.inv, JSON.stringify(n)); return n; }),
    dose: (h) => doses[h.id] ?? h.dose,
    setDose: (id, d) => setDoses((p) => { const n = { ...p, [id]: d }; save(KEYS.doses, JSON.stringify(n)); return n; }),
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
    grindAdj: (id) => grindAdjs[id] ?? 0,
    tweak: (id, t, h) => {
      if (t.grind) setGrindAdjs((p) => { const n = { ...p, [id]: (p[id] ?? 0) + t.grind! }; save(KEYS.grindAdj, JSON.stringify(n)); return n; });
      if (t.dose && h) setDoses((p) => {
        const cur = p[id] ?? h.dose;
        const d = Math.max(h.doseMin ?? 1, Math.min(h.doseMax ?? 99, cur + t.dose!));
        const n = { ...p, [id]: d }; save(KEYS.doses, JSON.stringify(n)); return n;
      });
    },
    favs,
    toggleFav: (id) => setFavs((p) => { const n = p.includes(id) ? p.filter((x) => x !== id) : [id, ...p]; save(KEYS.favs, JSON.stringify(n)); return n; }),
    recent, recordBrew,
    log,
    addLog: (e) => setLog((p) => { const n = { ...p, [e.id]: [e, ...(p[e.id] || [])].slice(0, 20) }; save(KEYS.log, JSON.stringify(n)); return n; }),
    voice,
    setVoice: (on) => { setVoiceState(on); save(KEYS.voice, on ? "1" : "0"); },
  }), [invPref, doses, checked, returnTo, lastEntry, volIdx, grindAdjs, favs, recent, recordBrew, log, voice]);

  const activeBean = beans.find((b) => b.id === activeBeanId) ?? null;
  const tastes = useMemo(() => bagTastes(activeBean?.notes, flavour), [activeBean, flavour]);
  const setup = useMemo<SetupCtx>(() => ({ grinder, roast, flavour, hydrated, beans, activeBean, tastes, apply, form, words: form === "ground", welcome, finishWelcome, dialog, openSetup, closeSetup }),
    [grinder, roast, flavour, hydrated, beans, activeBean, tastes, apply, form, welcome, finishWelcome, dialog, openSetup, closeSetup]);
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
