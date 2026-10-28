"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { DRINKS, FL, entryById, houseById, roastById } from "@/lib/catalog";
import { ICON, KIND_LABEL, VOLUMES } from "@/lib/data/labels";
import { grindText, libGrind, numG, toGrinder, unitG } from "@/lib/grind";
import { buildBrew, canInvert, cap1, closestHouse, entrySub, flipAtSegs, g1, hBypass, hGrind, hMilk, hMixer, hWater, hostOf, mmss, roastNudge } from "@/lib/brew";
import { tickTone, testTone, ensureAudio } from "@/lib/audio";
import { timer, useTimer, type TimerBrew } from "@/lib/timer";
import type { Brew, Entry, HouseMethod } from "@/lib/types";
import { useBrewPrefs, useSetup } from "./providers";
import { StdArt, InvArt } from "./Art";
import { RecipeArt } from "./DrinkArt";
import { BrewCanvas } from "./BrewCanvas";
import { HandsFree, RateBrew } from "./BrewExtras";
import { beanStatus } from "@/lib/journal";
import { useState } from "react";

const CHAMBER_ML = 250;

export function BrewConsole({ id }: { id: string }) {
  const entry = entryById(id) as Entry;
  const prefs = useBrewPrefs();
  const { grinder, roast, flavour, activeBean } = useSetup();
  const grindAdj = prefs.grindAdj(entry.id);
  const router = useRouter();

  const inverted = prefs.inverted(entry.id);
  const brew = useMemo(() => buildBrew(entry, inverted), [entry, inverted]);
  const dose = entry.kind === "house" ? prefs.dose(entry) : 0;
  const tbKey = `${brew.id}|${brew.inv ? 1 : 0}|${dose}`;
  const timerBrew = useMemo<TimerBrew | null>(
    () => (brew.timed ? { id: brew.id, name: brew.name, emoji: brew.emoji, segs: brew.segs, o: brew.o, key: tbKey } : null),
    [brew, tbKey],
  );
  useSpaceToggle(timerBrew);
  const brewWater = entry.kind === "house" ? (entry.timed ? Math.round(hWater(entry, dose)) : undefined) : entry.kind === "library" ? entry.water : undefined;

  // remember the last recipe opened, for the Brew tab
  const { rememberEntry } = prefs;
  useEffect(() => { rememberEntry(entry.id); }, [entry.id, rememberEntry]);
  // a changed dose or orientation invalidates a run of this recipe
  useEffect(() => { if (timerBrew) timer.invalidate(timerBrew.id, timerBrew.key); }, [timerBrew]);
  // the drink → base → back flow only applies while you're on one of that drink's bases
  const returnDrink = prefs.returnTo ? DRINKS.find((d) => d.id === prefs.returnTo) : undefined;
  const showReturn = !!returnDrink && entry.kind === "house" && returnDrink.base.some((b) => b.id === entry.id);
  // checked when you arrive on a recipe, not while you're on it (setting returnTo then navigating must survive)
  const clearStaleReturn = useRef(() => {});
  clearStaleReturn.current = () => { if (prefs.returnTo && !showReturn) prefs.setReturnTo(null); };
  useEffect(() => { clearStaleReturn.current(); }, [entry.id]);

  const go = (to: string) => router.push(`/recipes/${to}`);

  return (
    <section className={"console" + (brew.timed ? " has-timer" : "")} id="console" aria-labelledby="rName">
      {showReturn && returnDrink && (
        <div className="returnbar" id="returnBar">
          <span><b>{returnDrink.emoji} Making {returnDrink.name}</b> — brew this base (skip any milk or mixer it lists; the drink tells you what to add), then go back to finish it.</span>
          <button type="button" id="returnBtn" onClick={() => { prefs.setReturnTo(null); go(returnDrink.id); }}>↩ Back to {returnDrink.name}</button>
        </div>
      )}
      <div className="console-head with-art">
        <RecipeArt entry={entry} className="head-art" />
        <h2><span id="rName">{brew.name}</span></h2>
        <button type="button" className="fav" id="favBtn" aria-pressed={prefs.favs.includes(entry.id)} onClick={() => prefs.toggleFav(entry.id)}>
          {prefs.favs.includes(entry.id) ? "★ Saved" : "☆ Save"}
        </button>
        {entry.kind !== "house" && <p className="byline" id="rByline">{entrySub(entry)}{entry.kind === "drink" ? " · " + entry.time : ""}</p>}
        {entry.kind === "library" && (
          <p className="cite" id="rCite">
            📖 Recipe by <b>{entry.author}</b> · cited from{" "}
            <a href={entry.url} target="_blank" rel="noopener">{hostOf(entry.url)} ↗</a>
          </p>
        )}
        {brew.notes && <p className="notes" id="rNotes">{brew.notes}</p>}
      </div>

      <Pairing entry={entry} flavour={flavour} />

      {canInvert(entry) && (
        <div className="orient-switch" id="orientSwitch" role="group" aria-label="Brew orientation">
          <button type="button" id="oStd" aria-pressed={!brew.inv} onClick={() => prefs.setInverted(entry.id, false)}>☕ On the mug</button>
          <button type="button" id="oInv" className="inv" aria-pressed={brew.inv} onClick={() => prefs.setInverted(entry.id, true)}>🔄 Inverted</button>
        </div>
      )}
      <OrientSetup brew={brew} />

      {Specs({ entry, dose })}
      {entry.kind === "house" && entry.timed && DoseBar({ h: entry, dose })}
      {Warnings({ entry, brew, dose })}
      {Prep({ entry, onBase: (base) => { prefs.setReturnTo(entry.id); go(base); }, onLoad: go })}

      {timerBrew && <TimerPanel tb={timerBrew} finish={brew.finish} water={brewWater} />}

      {Steps({ brew })}
      {(entry.kind === "house" || (entry.kind === "library" && !entry.link && entry.segs)) && (
        <RateBrew entry={entry} tb={timerBrew} dose={dose} grindNow={grindLabel()} />
      )}
      {Provenance({ entry })}
    </section>
  );

  /* ---------------- pieces (plain render helpers, so they don't remount and lose focus) ---------------- */
  function grindLabel(): string {
    if (entry.kind === "house") return numG(toGrinder(hGrind(entry, roast, grindAdj), grinder), grinder) + " " + unitG(grinder);
    if (entry.kind === "library" && !entry.link) { const lg = libGrind(entry, grinder); return lg.num + " " + lg.unit; }
    return "";
  }
  function Specs({ entry, dose }: { entry: Entry; dose: number }) {
    if (entry.kind === "drink" || (entry.kind === "library" && (entry.link || !entry.segs))) return null;
    const cells: [string, string, string][] = [];
    if (entry.kind === "house") {
      cells.push([grindAdj ? `Grind · dialled ${grindAdj > 0 ? "coarser" : "finer"}` : "Grind", numG(toGrinder(hGrind(entry, roast, grindAdj), grinder), grinder), unitG(grinder)]);
      if (entry.timed) {
        cells.push(["Temp", String(roast.temp), "°C"], ["Dose", String(dose), "g"], ["Water", String(hWater(entry, dose)), "ml"]);
        if (hBypass(entry, dose)) cells.push(["Bypass", String(hBypass(entry, dose)), "ml"]);
        if (hMilk(entry, dose)) cells.push(["Milk", String(hMilk(entry, dose)), "ml"]);
        if (hMixer(entry, dose)) cells.push([entry.mixerName || "Mixer", String(hMixer(entry, dose)), "ml"]);
        cells.push(["Ratio", "1:" + ((entry.ratios.water || 0) + (entry.ratios.bypass || 0)).toFixed(1), ""]);
      } else {
        (entry.specs || []).forEach((c) => cells.push(c));
      }
    } else {
      const e = entry, lg = libGrind(e, grinder);
      cells.push([lg.native ? "Grind ★" : "Grind", lg.num, lg.unit], ["Temp", String(e.temp), "°C"], ["Dose", g1(e.dose ?? 0), "g"], ["Water", String(e.water), "g"]);
      if (e.bypT && e.bypT !== "none") {
        const lab = ({ "hot water": "Bypass", "cold water": "Bypass", ice: "Ice", milk: "Milk", condensed: "Cond. milk", mixer: cap1(e.mix || "") } as Record<string, string>)[e.bypT] || "Bypass";
        if (e.bypT === "condensed") cells.push([lab, e.add || "taste", ""]);
        else if (e.bypT === "mixer") cells.push([lab, e.byp == null ? e.add || "taste" : g1(e.byp), e.byp == null ? "" : "ml"]);
        else cells.push([lab, e.byp == null ? "taste" : g1(e.byp), e.byp == null ? "" : "g"]);
      }
      const liquid = (e.water ?? 0) + ((e.bypT === "hot water" || e.bypT === "cold water") && e.byp ? e.byp : 0);
      cells.push(["Ratio", "1:" + g1(liquid / (e.dose || 1)), ""]);
    }
    return (
      <dl className="specs" id="rSpecs">
        {cells.map(([l, v, u]) => <div key={l}><dt>{l}</dt><dd>{v}{u && <small> {u}</small>}</dd></div>)}
      </dl>
    );
  }

  function DoseBar({ h, dose }: { h: HouseMethod; dose: number }) {
    const parts = [hWater(h, dose) + " ml water"];
    if (hBypass(h, dose)) parts.push(hBypass(h, dose) + " ml bypass");
    if (hMilk(h, dose)) parts.push(hMilk(h, dose) + " ml milk");
    if (hMixer(h, dose)) parts.push(hMixer(h, dose) + " ml " + h.mixerName);
    const bump = (d: number) => { const n = dose + d; if (n >= (h.doseMin ?? 1) && n <= (h.doseMax ?? 99)) prefs.setDose(h.id, n); };
    return (
      <div className="dosebar" id="doseBar">
        <span className="lab">Dose</span>
        <span className="stepper">
          <button type="button" id="doseDown" aria-label="Less coffee" disabled={dose <= (h.doseMin ?? 1)} onClick={() => bump(-1)}>−</button>
          <span className="val" id="doseVal" aria-live="polite">{dose} g</span>
          <button type="button" id="doseUp" aria-label="More coffee" disabled={dose >= (h.doseMax ?? 99)} onClick={() => bump(1)}>+</button>
        </span>
        <span className="hint" id="doseHint">→ {parts.join(" · ")}</span>
      </div>
    );
  }

  function Warnings({ entry, brew, dose }: { entry: Entry; brew: Brew; dose: number }) {
    const msgs: string[] = [];
    if (activeBean && entry.kind !== "drink") {
      const st = beanStatus(activeBean);
      if (st.tone === "rest") msgs.push(`🫘 Your ${activeBean.name} is still resting (day ${st.day}). Expect a muted, uneven cup until about ${st.label.replace(/^Resting · ready in /, "")} from now.`);
    }
    if (entry.kind === "drink") {
      if (entry.alcohol) msgs.push("🍸 Contains alcohol.");
      if (entry.warn) msgs.push(entry.warn);
    } else if (entry.kind === "library") {
      const n = roastNudge(entry, roast);
      if (n) msgs.push(n);
      if (!entry.link && entry.water) {
        if (entry.water > 270) msgs.push(`ℹ️ ${entry.water} g is more than the chamber holds at once — this recipe pours in stages while it drains.`);
        else if (entry.water > CHAMBER_ML) msgs.push(`ℹ️ ${entry.water} g fills the chamber to the brim — pour carefully, or use an AeroPress XL.`);
      }
    } else {
      if (entry.timed) {
        const w = hWater(entry, dose);
        if (w > CHAMBER_ML) msgs.push(`⚠️ ${w} ml won't fit the chamber (about ${CHAMBER_ML} ml). Drop the dose, or brew half and dilute.`);
        else if (brew.inv && w > 230) msgs.push("⚠️ Inverted holds a little less with the plunger in — about 230 ml. Pour slowly and leave a finger's width at the top.");
      }
      if (!entry.bestFor.includes(roast.id)) {
        const names = entry.bestFor.map((r) => roastById(r)?.label.toLowerCase() ?? r).join(", ");
        msgs.push(`💡 This method is built for ${names} roasts. It still works — just expect a different cup.`);
      }
    }
    if (!msgs.length) return null;
    return <div className="warnbar" id="warnBar">{msgs.map((m, i) => <span key={i}>{i > 0 && <br />}{m}</span>)}</div>;
  }

  function Prep({ entry, onBase, onLoad }: { entry: Entry; onBase: (id: string) => void; onLoad: (id: string) => void }) {
    let body: ReactNode = null;
    if (entry.kind === "drink") {
      body = (
        <div className="dk">
          <p className="dk-h">1 · Brew the base</p>
          {entry.base.length > 0 && (
            <div className="dk-bases">
              {entry.base.map((b, i) => {
                const h = houseById(b.id)!;
                return (
                  <button type="button" className="basebtn" key={b.id} data-base={b.id} onClick={() => onBase(b.id)}>
                    <span className="emoji">{h.emoji}</span>
                    <span><b>{h.name}{i === 0 && entry.base.length > 1 ? " · best" : ""}</b><small>{b.amt}</small></span>
                    <span className="go">Brew ›</span>
                  </button>
                );
              })}
            </div>
          )}
          {entry.baseNote && <p className="dk-note">{entry.baseNote}</p>}
          {entry.ing.length > 0 && (
            <>
              <p className="dk-h">2 · You’ll also need</p>
              <ul className="dk-ing">{entry.ing.map((x, i) => <li key={i}><span className="q">{x[0]}</span><span>{x[1]}</span></li>)}</ul>
            </>
          )}
          <p className="dk-h">{entry.ing.length ? "3" : "2"} · Make it</p>
          <p className="dk-note">Tap each step as you go.</p>
        </div>
      );
    } else if (entry.kind === "library" && (entry.link || !entry.segs)) {
      const host = hostOf(entry.url), near = closestHouse(entry);
      body = (
        <>
          <b>📖 This recipe lives on {host}.</b> Open it there for the dose, water, temperature and steps — {entry.o === "inverted" ? "it's brewed 🔄 inverted." : "it's brewed ☕ on the mug."}
          <br /><a className="btn primary linkbtn" href={entry.url} target="_blank" rel="noopener">Open on {host} ↗</a>
          {near && (
            <><br /><span className="near">⏱ Want the timer? Your closest own method is{" "}
              <button type="button" className="nearbtn" data-load={near.id} onClick={() => onLoad(near.id)}>{near.emoji} {near.name}</button></span></>
          )}
        </>
      );
    } else if (entry.kind === "house") {
      const text = entry.prep.replace(/\{\{c:(\d+)\}\}/g, (_m, v) => grindText(+v, grinder));
      body = <><b>📋 Before you start.</b> {text}</>;
    } else {
      const lg = libGrind(entry, grinder);
      body = (
        <>
          {entry.pre && <><b>📋 Before you start.</b> {entry.pre}<br /></>}
          <b>🧻 Filter:</b> {entry.filter}.<br />
          <b>⚙️ Grind as written:</b> <q>{entry.grind}</q> → {lg.native
            ? <><b>{lg.num} {lg.unit}</b> ★ — the author&apos;s own setting on your {grinder.name}.</>
            : <>about <b>{lg.num} {lg.unit}</b> on your {grinder.name}.</>}
        </>
      );
    }
    return <div className="prep" id="rPrep">{body}</div>;
  }

  function Provenance({ entry }: { entry: Entry }) {
    if (entry.kind !== "library" || entry.link || !entry.segs) return null;
    return (
      <div className="provenance" id="provenance">
        <a href={entry.url} target="_blank" rel="noopener">🔗 Source: {entry.name} by {entry.author}, on {hostOf(entry.url)} ↗</a>
        {entry.issues && <details><summary>Transcription notes</summary><p>{entry.issues}</p></details>}
      </div>
    );
  }

  function Steps({ brew }: { brew: Brew }) {
    if (brew.timed) return <TimedSteps tb={timerBrew!} />;
    const src = brew.src;
    return (
      <>
        <div className="steps" id="stepList">
          {brew.checks.map((sg, i) => {
            const key = brew.id + ":" + i, on = !!prefs.checked[key];
            return (
              <button type="button" className="check" key={key} aria-pressed={on}
                onClick={() => {
                  ensureAudio();
                  if (prefs.toggleCheck(key)) {
                    tickTone();
                    const all = brew.checks.every((_, j) => j === i || prefs.checked[brew.id + ":" + j]);
                    if (all) prefs.recordBrew(brew.id);
                  }
                }}>
                <span className="box" aria-hidden="true">✓</span>
                <span><span className="lbl">{sg.ic && <span className="emoji">{sg.ic}</span>} {sg.lbl}</span>{sg.det && <span className="det">{sg.det}</span>}</span>
              </button>
            );
          })}
        </div>
        {src.kind === "drink" && src.tips.length > 0 && <div className="finish" id="finishNote"><b>💡 Tips.</b> {src.tips.join(" ")}</div>}
      </>
    );
  }
}

/* ---------------- orientation explainer ---------------- */
function OrientSetup({ brew }: { brew: Brew }) {
  const e = brew.src;
  if (e.kind === "library" && (e.link || !e.segs)) return null;
  if (brew.o !== "standard" && brew.o !== "inverted") return null;
  if (brew.o === "inverted") {
    const f = flipAtSegs(brew.segs);
    return (
      <div className="setup inv" id="rSetup">
        <span className="setup-art"><InvArt /></span>
        <div>
          <h3>🔄 Inverted — not on the mug yet</h3>
          <ol>
            <li>Push the plunger in just past the rubber, and stand the brewer upside-down on your scale. Rinse the paper in the filter cap and keep it beside you — it goes on at the flip.</li>
            <li>Add the coffee and brew in it like a cup.</li>
            <li>{f != null ? <>At <b>{mmss(f)}</b></> : "When the timer says"}, put the filter cap on, set the mug upside-down on top, and flip both together. Then press.</li>
          </ol>
          <p className="why">
            {e.kind === "house"
              ? (e.invNote || "Nothing drips out early, so it extracts a little more than on the mug. If it tastes heavier or more bitter, go one step coarser.") + " The flip adds 10 s to the timer."
              : "Inverted stops coffee dripping out early, so the whole brew steeps the full time."}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="setup" id="rSetup">
      <span className="setup-art"><StdArt /></span>
      <div>
        <h3>☕ Directly on the mug</h3>
        <ol>
          <li>Paper filter in the cap, cap on, brewer sitting on your mug or server.</li>
          <li>It stays there the whole brew — pour, wait, press. No flipping.</li>
        </ol>
      </div>
    </div>
  );
}

/* ---------------- flavour pairing ---------------- */
function Pairing({ entry, flavour }: { entry: Entry; flavour: string }) {
  if (!entry.fl) return null;
  const f = flavour ? FL[flavour as keyof typeof FL] : null;
  return (
    <div className="pairing" id="rPair">
      <p className="pl">🎯 Best with beans that taste</p>
      <div className="fltags">
        {entry.fl.map((id) => <span key={id} className={"fltag" + (id === flavour ? " on" : "")}><span className="emoji">{FL[id].emoji}</span>{FL[id].label}</span>)}
      </div>
      <p className="why"><b>Why:</b> {entry.why}</p>
      {f && (entry.fl.includes(f.id)
        ? <p className="match yes">✓ A good match for your {f.emoji} {f.label.toLowerCase()} bean.</p>
        : <p className="match no">Not the best match for a {f.emoji} {f.label.toLowerCase()} bean. It still works — Recipes ranks better matches first.</p>)}
    </div>
  );
}

/* ---------------- timer ---------------- */
function phaseState(tb: TimerBrew) {
  const owns = timer.owns(tb);
  const marks: number[] = [];
  let total = 0;
  for (const s of tb.segs) { marks.push(total); total += s.dur; }
  const startedAt = owns ? timer.startedAt : 0;
  const finished = owns && timer.finished;
  const running = owns && timer.running;
  const t = owns ? timer.elapsed() : 0;
  const clamped = Math.min(t, total);
  let idx = 0;
  marks.forEach((m, i) => { if (clamped + 0.0001 >= m) idx = i; });
  return { owns, marks, total, startedAt, finished, running, clamped, idx };
}

function TimerPanel({ tb, finish, water }: { tb: TimerBrew; finish: string; water?: number }) {
  useTimer();
  const prefs = useBrewPrefs();
  const [handsFree, setHandsFree] = useState(false);
  const s = phaseState(tb);
  const sg = tb.segs[s.idx];
  const into = Math.min(sg.dur, Math.max(0, s.clamped - s.marks[s.idx]));
  const left = Math.max(0, sg.dur - into);
  const other = timer.active && !s.owns ? timer.brew : null;

  const status = s.finished ? "Done" : !s.startedAt ? KIND_LABEL[tb.segs[0].k] + " first" : (s.running ? "" : "Paused · ") + KIND_LABEL[sg.k];
  const secs = s.finished ? 0 : !s.startedAt ? tb.segs[0].dur : Math.ceil(left);
  const nxt = tb.segs[s.idx + 1];
  let up = "", alert = false;
  if (s.finished) up = "";
  else if (!s.startedAt) up = tb.o === "inverted" ? "🔄 Brewer upside-down on the scale — not on the mug yet" : "☕ Brewer on the mug — press start as you pour";
  else if (nxt && nxt.k === "flip" && Math.ceil(s.marks[s.idx + 1] - s.clamped) <= 10) {
    up = `🔄 Flip in ${Math.ceil(s.marks[s.idx + 1] - s.clamped)}s — get the cap and mug ready`; alert = true;
  } else if (nxt) up = `Then — ${KIND_LABEL[nxt.k]}: ${nxt.lbl}`;
  else up = "Last phase";
  const finishText = finish.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();

  return (
    <div id="timerUI">
      {other && (
        <p className="other-run">⏱ {other.emoji} {other.name} is {timer.running ? "brewing" : "paused"} ({mmss(timer.elapsed())}). <Link href={`/recipes/${other.id}`}>Go to it</Link> — starting here replaces it.</p>
      )}
      {/* Brew line: what's in the brewer and the mug over the whole brew */}
      <div className="brewline" id="timeline">
        <BrewCanvas tb={tb} kind="line" water={water}
          label={`Brew line: phase ${s.idx + 1} of ${tb.segs.length}, ${mmss(s.clamped)} of ${mmss(s.total)}`} />
      </div>
      <div className="dial-zone">
        {/* Chamber clock: the AeroPress with its moulded numbers lighting up, and the countdown */}
        <div className="clock-wrap" id="clock">
          <BrewCanvas tb={tb} kind="clock" water={water} label={`${status}${s.finished ? "" : `, ${secs} seconds left`}`} />
          <span className="sr-only" id="badge">{status}</span>
        </div>
        <p className="now" id="now" aria-live="polite">{s.finished ? "Brew complete" : sg.lbl}</p>
        <p className="now-detail" id="nowDetail">{s.finished ? finishText : sg.det}</p>
        <p className={"upnext" + (alert ? " alert" : "")} id="upnext">{up}</p>
      </div>
      <div className="controls">
        <button className="btn primary" id="go" type="button" onClick={() => (s.running ? timer.pause() : timer.start(tb))}>
          {s.running ? "Pause" : s.startedAt && !s.finished ? "Resume" : "Start"}
        </button>
        <button className="btn" id="reset" type="button" onClick={() => { if (s.owns) timer.reset(); }}>Reset</button>
        <button className="btn icon" id="mute" type="button" title="Cue volume — tap to change"
          onClick={() => { prefs.cycleVolume(); setTimeout(testTone, 0); }}>{VOLUMES[prefs.volIdx].label}</button>
        <button className="btn icon" id="voice" type="button" aria-pressed={prefs.voice} title="Spoken cues for each phase"
          onClick={() => prefs.setVoice(!prefs.voice)}>{prefs.voice ? "🗣️ Voice" : "🔇 Voice"}</button>
        <button className="btn ghost hf-open" id="handsFreeBtn" type="button" onClick={() => setHandsFree(true)}>⛶ Hands-free</button>
      </div>
      {handsFree && <HandsFree tb={tb} water={water} onClose={() => setHandsFree(false)} />}
    </div>
  );
}

function TimedSteps({ tb }: { tb: TimerBrew }) {
  useTimer();
  const s = phaseState(tb);
  return (
    <div className="steps" id="stepList">
      {tb.segs.map((sg, i) => {
        let cls = "step k-" + sg.k;
        if (s.startedAt && !s.finished && i === s.idx) cls += " active";
        else if (s.finished || (s.startedAt && i < s.idx)) cls += " done";
        return (
          <div className={cls} key={i} id={"step-" + i}>
            <span className="ic emoji">{ICON[sg.k] || ""}</span>
            <span className="at">{mmss(s.marks[i])}–{mmss(s.marks[i] + sg.dur)}</span>
            <span>
              <span className="lbl">{sg.lbl}</span><span className="kind">{sg.dur >= 60 ? mmss(sg.dur) : sg.dur + "s"}</span>
              {sg.det && <span className="det">{sg.det}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Space starts/pauses the timer on a brew page (not while typing or on a control). */
export function useSpaceToggle(tb: TimerBrew | null) {
  useEffect(() => {
    if (!tb) return;
    const on = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (document.querySelector("dialog[open]")) return;
      const tag = (e.target as HTMLElement)?.tagName || "";
      if (["BUTTON", "INPUT", "TEXTAREA", "SELECT", "SUMMARY", "A"].includes(tag)) return;
      e.preventDefault();
      if (timer.running && timer.owns(tb)) timer.pause(); else timer.start(tb);
    };
    document.addEventListener("keydown", on);
    return () => document.removeEventListener("keydown", on);
  }, [tb]);
}

