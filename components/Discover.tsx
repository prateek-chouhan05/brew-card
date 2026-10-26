"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ALL, FL } from "@/lib/catalog";
import { GROUPS } from "@/lib/data/labels";
import { grinderShort } from "@/lib/grind";
import { entryIcon, entryRoastIcon, entryRoastTitle, entryStats, entrySub, entryTime, orientPill } from "@/lib/brew";
import { FACETS, FGROUPS, activeRefineCount, countWhere, emptyRefine, matchBadge, optLabel, orientBlocked, results, type GroupKey, type MatchMode, type Query } from "@/lib/discover";
import { searchScores } from "@/lib/search";
import type { Entry } from "@/lib/types";
import { PAGE, useBrewPrefs, useDiscover, useSetup } from "./providers";
import { useModal } from "./useModal";

const SUGGEST = ["affogato", "vietnamese", "tonic", "hoffmann", "quick"];

export function Discover() {
  const { grinder, roast, flavour, openSetup } = useSetup();
  const { filters, setFilters, mode, setMode, shown, setShown } = useDiscover();
  const brewPrefs = useBrewPrefs();
  const [qText, setQText] = useState(filters.q);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [announce, setAnnounce] = useState("");
  const qRef = useRef<HTMLInputElement>(null);
  const cardsRef = useRef<HTMLUListElement>(null);
  const sheetRef = useModal(sheetOpen, () => setSheetOpen(false));

  // debounce typing into the shared filter state
  useEffect(() => {
    const t = setTimeout(() => {
      if (qText.trim() !== filters.q) { setFilters((f) => ({ ...f, q: qText.trim() })); setShown(PAGE); }
    }, 120);
    return () => clearTimeout(t);
  }, [qText, filters.q, setFilters, setShown]);

  // a phone sheet left open while the window widens closes itself (the sidebar takes over)
  useEffect(() => {
    const mq = window.matchMedia("(min-width:1024px)");
    const on = () => { if (mq.matches) setSheetOpen(false); };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const scores = useMemo(() => searchScores(filters.q), [filters.q]);
  const coffee = useMemo(() => ({ roast, flavour }), [roast, flavour]);
  const query: Query = useMemo(() => ({ filters, scores, mode, coffee }), [filters, scores, mode, coffee]);
  const list = useMemo(() => results(query), [query]);
  const blocked = orientBlocked(filters);
  const nRefine = activeRefineCount(filters);
  const ctx = { grinder, roast, dose: brewPrefs.dose };

  const setQuery = (v: string) => { setQText(v); setFilters((f) => ({ ...f, q: v.trim() })); setShown(PAGE); };
  const update = (fn: (f: typeof filters) => typeof filters) => { setFilters(fn); setShown(PAGE); };
  const toggle = (g: GroupKey, v: string, on: boolean) => update((f) => {
    const next = { ...f.f, [g]: on ? [...f.f[g], v] : f.f[g].filter((x) => x !== v) };
    if (g === "brewer" && next.brewer.length && !next.brewer.includes("aeropress")) next.orient = [];
    return { ...f, f: next };
  });
  const clearRefine = () => { update((f) => ({ ...f, f: emptyRefine() })); setAnnounce("Refine options cleared."); };
  /** Clears search, collection, refine and "only matches". Never touches the saved coffee setup. */
  const clearAll = () => {
    setQText("");
    update(() => ({ q: "", col: "", f: emptyRefine() }));
    if (mode === "only") setMode("first");
    setAnnounce("Filters cleared. Your coffee setup is unchanged.");
    qRef.current?.focus({ preventScroll: true });
  };

  /* ---------- active filter chips ---------- */
  const chips: { label: string; clear: () => void }[] = [];
  if (filters.q) chips.push({ label: `Search: “${filters.q}”`, clear: () => setQuery("") });
  if (filters.col) { const gr = GROUPS.find((x) => x.id === filters.col)!; chips.push({ label: gr.emoji + " " + gr.label, clear: () => update((f) => ({ ...f, col: "" })) }); }
  for (const g of FGROUPS) for (const v of filters.f[g.id]) chips.push({ label: optLabel(g.id, v), clear: () => toggle(g.id, v, false) });
  if (mode === "only") chips.push({ label: "🎯 Only matches", clear: () => setMode("first") });

  /* ---------- refine groups (rendered in the desktop sidebar and the phone sheet) ---------- */
  const refine = (prefix: "d" | "s") => FGROUPS.map((g) => {
    const counts = Object.fromEntries(g.opts.map((o) => [o.id, countWhere(query, g.id, (e) => FACETS[e.id][g.id].includes(o.id))]));
    const hint = g.id === "orient" && blocked ? "Only applies to AeroPress — add AeroPress under Brewer to use this." : g.hint;
    return (
      <fieldset className="fgroup" key={g.id} data-group={g.id}>
        <legend>{g.label}</legend>
        <div className="fopts">
          {g.opts.map((o) => {
            const on = filters.f[g.id].includes(o.id);
            const disabled = (g.id === "orient" && blocked) || (!on && counts[o.id] === 0);
            return (
              <label className="fchip" key={o.id}>
                <input type="checkbox" id={`${prefix}-${g.id}-${o.id}`} value={o.id} checked={on} disabled={disabled}
                  onChange={(e) => toggle(g.id, o.id, e.target.checked)} />
                <span><span className="emoji" aria-hidden="true">{o.emoji}</span>{o.label} <small>{counts[o.id]}</small></span>
              </label>
            );
          })}
        </div>
        {hint && <p className="hint">{hint}</p>}
      </fieldset>
    );
  });

  const f = flavour ? FL[flavour] : null;
  const what = f
    ? <>suit your <b>{roast.label.toLowerCase()}</b> roast and are tagged for <b>{f.label.toLowerCase()}</b> beans</>
    : <>suit your <b>{roast.label.toLowerCase()}</b> roast</>;

  const left = list.length - shown;
  const showMore = () => {
    const first = shown;
    setShown(shown + PAGE);
    requestAnimationFrame(() => {
      const el = cardsRef.current?.children[first]?.querySelector("a") as HTMLElement | null;
      el?.focus({ preventScroll: true });
    });
  };

  return (
    <section className="view" id="view-recipes" aria-labelledby="recH">
      <div className="view-h">
        <h1 id="recH" tabIndex={-1}>Find a recipe</h1>
        <p>Your own methods, 30 classic coffee drinks and {ALL.filter((e) => e.kind === "library").length} AeroPress recipes — ranked for the coffee you&apos;re brewing.</p>
      </div>

      <div className="search" role="search">
        <span className="s-ic emoji" aria-hidden="true">🔍</span>
        <input id="q" ref={qRef} type="search" autoComplete="off" enterKeyHint="search" spellCheck={false}
          placeholder="Drink, brewer, country, flavour…" aria-label="Search recipes" aria-describedby="suggest"
          value={qText} onChange={(e) => setQText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && qText) { e.preventDefault(); setQuery(""); }
            if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
          }} />
        {qText && <button type="button" className="s-clear" id="qClear" aria-label="Clear search" onClick={() => { setQuery(""); qRef.current?.focus(); }}>×</button>}
      </div>
      <p className="suggest" id="suggest"><span>Try</span>
        {SUGGEST.map((s) => <button type="button" key={s} onClick={() => setQuery(s)}>{s}</button>)}
      </p>

      <fieldset className="collections">
        <legend>Collection</legend>
        <div className="seg-track" id="colTrack">
          {GROUPS.map((gr) => (
            <label className="seg-opt" key={gr.id || "all"}>
              <input type="radio" name="collection" value={gr.id} checked={filters.col === gr.id} onChange={() => update((x) => ({ ...x, col: gr.id }))} />
              <span>
                {gr.emoji && <span className="emoji" aria-hidden="true">{gr.emoji}</span>}
                {gr.label} <small>{countWhere(query, "col", (e) => !gr.id || e.g === gr.id)}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="refine-row">
        <button type="button" className="filters-btn" id="filtersBtn" aria-haspopup="dialog" aria-label={"Refine" + (nRefine ? `, ${nRefine} active` : "")} onClick={() => setSheetOpen(true)}>
          <span className="emoji" aria-hidden="true">🎚️</span>Refine {nRefine > 0 && <span className="n" id="filtersN">{nRefine}</span>}
        </button>
      </div>

      <div className="discover-body">
        <aside className="refine-desk" aria-labelledby="refDeskH">
          <div className="refine-title">
            <h2 id="refDeskH">Refine</h2>
            <button type="button" className="linkbtn" disabled={!nRefine} onClick={clearRefine}>Clear</button>
          </div>
          <div id="refineDesk">{refine("d")}</div>
        </aside>

        <div className="results-col">
          <section className="matchbar" aria-labelledby="mbH">
            <div className="mb-top">
              <h2 id="mbH"><span className="emoji" aria-hidden="true">🎯</span>Match my coffee</h2>
              <span className="mb-chips">
                <span className="mb-tag">{roast.emoji} {roast.label}</span>
                {f ? <span className="mb-tag">{f.emoji} {f.label}</span> : <span className="mb-tag muted">Any flavour</span>}
              </span>
              <button type="button" className="linkbtn" aria-label="Edit coffee setup" onClick={() => openSetup(false)}>Edit<span className="wide">&nbsp;setup</span></button>
            </div>
            <fieldset className="modes" id="modes">
              <legend>How your setup affects results</legend>
              {([["first", "Matches first"], ["only", "Only matches"], ["off", "Ignore"]] as [MatchMode, string][]).map(([m, l]) => (
                <label className="seg-opt" key={m}>
                  <input type="radio" name="mmode" value={m} checked={mode === m} onChange={() => { setMode(m); setShown(PAGE); }} />
                  <span>{l}{m === "off" && <span className="wide">&nbsp;setup</span>}</span>
                </label>
              ))}
            </fieldset>
            <p className="mb-sum" id="mbSum">
              {mode === "first" && <>Recipes that {what} are listed first. Nothing is hidden.</>}
              {mode === "only" && <>Showing only recipes that {what}.</>}
              {mode === "off" && <>Your setup isn&apos;t used to rank or hide recipes. Grind settings still follow your {grinderShort(grinder)}.</>}
            </p>
            <details className="mb-how">
              <summary>How matching works</summary>
              <p><b>Roast:</b> your own methods and the coffee drinks list the roasts they&apos;re built for. Library recipes use the roast their author stated (or <i>any</i> when none was given) and count as a fit within one level of your bag. <b>Flavour:</b> every recipe carries up to three bean-flavour tags with a reason, shown on the recipe. <b>Grinder:</b> only converts grind numbers; it never hides or ranks recipes.</p>
            </details>
          </section>

          <div className="results-head" id="resultsTop">
            <p className="count" id="count" aria-live="polite" aria-atomic="true">
              {list.length === ALL.length ? <><b>{ALL.length}</b> recipes</> : <><b>{list.length}</b> of {ALL.length} recipes</>}
            </p>
          </div>

          {chips.length > 0 && (
            <div className="active" id="active">
              <ul className="achips" aria-label="Active filters">
                {chips.map((c) => (
                  <li className="achip" key={c.label}>
                    <span className="at">{c.label}</span>
                    <button type="button" aria-label={"Remove " + c.label} onClick={() => { c.clear(); qRef.current?.focus({ preventScroll: true }); }}>×</button>
                  </li>
                ))}
              </ul>
              <button type="button" className="clearall" onClick={clearAll}>Clear filters</button>
            </div>
          )}

          <ul className="cards" id="cards" aria-label="Recipes" ref={cardsRef}>
            {list.slice(0, shown).map((e) => <Card key={e.id} e={e} badge={matchBadge(e, coffee, mode)} current={e.id === brewPrefs.lastEntry} />)}
          </ul>

          {list.length === 0 && (
            <Empty filters={filters} mode={mode} nRefine={nRefine}
              onFix={(k) => {
                if (k === "q") setQuery("");
                if (k === "col") update((x) => ({ ...x, col: "" }));
                if (k === "refine") update((x) => ({ ...x, f: emptyRefine() }));
                if (k === "only") setMode("first");
                if (k === "all") clearAll();
              }} />
          )}

          {left > 0 && <button type="button" className="more" id="more" onClick={showMore}>Show {Math.min(PAGE, left)} more · {left} left</button>}
        </div>
      </div>

      <dialog className="sheetdlg" id="filterDlg" aria-labelledby="fdH" ref={sheetRef}>
        <div className="sheet">
          <div className="sheet-h">
            <h2 id="fdH">Refine</h2>
            <button type="button" className="x" aria-label="Close" onClick={() => setSheetOpen(false)}>×</button>
          </div>
          <div className="sheet-b" id="refineSheet">
            <p className="sheet-intro">Results update as you choose. Options within a group widen the list; different groups narrow it.</p>
            {refine("s")}
          </div>
          <div className="sheet-f">
            <button type="button" className="btn ghost" disabled={!nRefine} onClick={clearRefine}>Clear</button>
            <button type="button" className="btn primary" id="fdShow" onClick={() => {
              setSheetOpen(false);
              document.getElementById("resultsTop")?.scrollIntoView({ block: "start" });
            }}>
              {list.length ? `Show ${list.length} recipe${list.length === 1 ? "" : "s"}` : "No recipes — loosen a filter"}
            </button>
          </div>
        </div>
      </dialog>
      <p className="sr-only" aria-live="polite">{announce}</p>
    </section>
  );
}

function Card({ e, badge, current }: { e: Entry; badge: string; current: boolean }) {
  const { grinder, roast } = useSetup();
  const prefs = useBrewPrefs();
  const pill = orientPill(e, prefs.inverted(e.id));
  const fl = e.fl || [];
  const flNames = fl.map((id) => FL[id].label).join(", ");
  return (
    <li>
      <Link href={`/recipes/${e.id}`} className="card" aria-current={current ? "true" : undefined}>
        <span className="c-ic emoji" aria-hidden="true">{entryIcon(e)}</span>
        <span className="c-main">
          <span className="c-title">{e.name}</span>
          <span className="c-sub">{entrySub(e)}</span>
          <span className="c-tags">
            <span className={"pill" + (pill.inv ? " inv" : "")}>{pill.text}</span>
            {badge && <span className="mbadge">{badge}</span>}
          </span>
          <span className="c-stats">{entryStats(e, { grinder, roast, dose: prefs.dose })}</span>
        </span>
        <span className="c-side">
          <span className="c-time"><span className="sr-only">Time </span>{entryTime(e)}</span>
          <span className="c-fl">
            <span className="emoji" role="img" aria-label={entryRoastTitle(e)} title={entryRoastTitle(e)}>{entryRoastIcon(e, roast)}</span>
            {fl.length > 0 && <span className="emoji" role="img" aria-label={`Best with ${flNames} beans`} title={"Best with: " + flNames}>{fl.map((id) => FL[id].emoji).join("")}</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}

function Empty({ filters, mode, nRefine, onFix }: { filters: { q: string; col: string }; mode: MatchMode; nRefine: number; onFix: (k: "q" | "col" | "refine" | "only" | "all") => void }) {
  const why: string[] = [];
  const acts: [string, "q" | "col" | "refine" | "only"][] = [];
  if (filters.q) { why.push(`search “${filters.q}”`); acts.push(["Clear search", "q"]); }
  if (filters.col) { const gr = GROUPS.find((x) => x.id === filters.col)!; why.push(`the ${gr.label} collection`); acts.push(["Search all collections", "col"]); }
  if (nRefine) { why.push(`${nRefine} refine option${nRefine > 1 ? "s" : ""}`); acts.push(["Clear refine options", "refine"]); }
  if (mode === "only") { why.push("only matches for your setup"); acts.push(["Show non-matches too", "only"]); }
  const text = why.length > 1 ? why.slice(0, -1).join(", ") + " and " + why[why.length - 1] : why[0] || "these settings";
  return (
    <div className="empty" id="empty">
      <h3>No recipes match</h3>
      <p>Nothing fits {text}.</p>
      {filters.q && <p className="why">Try fewer or broader words — “iced”, “milk”, “inverted”, a country, or a brewer&apos;s name.</p>}
      <div className="acts">
        {acts.map(([l, k]) => <button type="button" key={k} onClick={() => onFix(k)}>{l}</button>)}
        {acts.length > 1 && <button type="button" className="primary" onClick={() => onFix("all")}>Clear all filters</button>}
      </div>
    </div>
  );
}

