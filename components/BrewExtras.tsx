"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { VOLUMES, segWord } from "@/lib/data/labels";
import { mmss } from "@/lib/brew";
import { advise, STRENGTHS, TASTES, type Advice, type Strength, type Taste } from "@/lib/journal";
import { timer, useTimer, type TimerBrew } from "@/lib/timer";
import { cueLine, currentVoice, englishVoices, hasNaturalVoice, saveVoice, speak, subscribeVoices, voicesVersion } from "@/lib/speech";
import { testTone } from "@/lib/audio";
import type { Entry, HouseMethod } from "@/lib/types";
import { BrewCanvas } from "./BrewCanvas";
import { useBrewPrefs, useSetup } from "./providers";
import { Icon, ScaleMark, StrengthMark } from "./Icon";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/* ============ rate the cup → a specific fix for next time ============ */
export function RateBrew({ entry, tb, grindNow, dose }: { entry: Entry; tb: TimerBrew | null; grindNow: string; dose: number }) {
  const prefs = useBrewPrefs();
  const { activeBean, words } = useSetup();
  const t = useTimer();
  const [taste, setTaste] = useState<Taste | null>(null);
  const [strength, setStrength] = useState<Strength | null>(null);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<Advice | null>(null);
  const [applied, setApplied] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDetailsElement>(null);
  const finishedHere = !!tb && t.finished && t.owns(tb);

  // open the panel when this recipe's brew finishes
  useEffect(() => { if (finishedHere) { setOpen(true); setResult(null); setApplied(false); } }, [finishedHere]);
  // reset when you move to another recipe
  useEffect(() => { setTaste(null); setStrength(null); setNote(""); setResult(null); setApplied(false); setOpen(false); }, [entry.id]);

  const h: HouseMethod | null = entry.kind === "house" ? entry : null;
  const history = prefs.log[entry.id] || [];
  const last = history[0];

  const submit = () => {
    if (!taste || !strength) return;
    const a = advise(taste, strength, h, dose, grindNow, words);
    prefs.addLog({ id: entry.id, at: new Date().toISOString(), taste, strength, note: note.trim() || undefined, grind: grindNow, dose: h ? dose : undefined, bean: activeBean?.name });
    prefs.recordBrew(entry.id);
    setResult(a);
  };

  return (
    <details className="rate" id="rate" ref={ref} open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>
        <Icon name="note" />How was it?
        {last && <span className="rate-last">Last: {fmtDate(last.at)} · {last.taste}</span>}
      </summary>
      {result ? (
        <div className="rate-result" role="status">
          <p><b>Next time:</b> {result.text}</p>
          {result.apply && h && (
            applied
              ? <p className="rate-applied"><Icon name="check" />Saved — this recipe will show the new setting.</p>
              : <button type="button" className="btn primary" onClick={() => { prefs.tweak(h.id, result.apply!.tweak, h); setApplied(true); }}>{result.apply.label}</button>
          )}
          <button type="button" className="linkbtn" onClick={() => { setResult(null); setTaste(null); setStrength(null); setNote(""); }}>Rate another cup</button>
        </div>
      ) : (
        <div className="rate-form">
          <fieldset>
            <legend>Taste</legend>
            <div className="rate-opts">
              {TASTES.map((o) => (
                <label key={o.id} className="rate-opt"><input type="radio" name="taste" value={o.id} checked={taste === o.id} onChange={() => setTaste(o.id)} />
                  <span><ScaleMark pos={o.pos} />{o.label}</span></label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Strength</legend>
            <div className="rate-opts">
              {STRENGTHS.map((o) => (
                <label key={o.id} className="rate-opt"><input type="radio" name="strength" value={o.id} checked={strength === o.id} onChange={() => setStrength(o.id)} />
                  <span><StrengthMark k={o.k} />{o.label}</span></label>
              ))}
            </div>
          </fieldset>
          <label className="rate-note">Note <small>(optional)</small>
            <input type="text" value={note} maxLength={140} placeholder="e.g. juicy, a bit thin at the end" onChange={(e) => setNote(e.target.value)} />
          </label>
          <button type="button" className="btn primary" disabled={!taste || !strength} onClick={submit}>Save & get a tip</button>
        </div>
      )}
      {history.length > 0 && (
        <ul className="rate-log" aria-label="Your recent brews of this recipe">
          {history.slice(0, 4).map((l, i) => (
            <li key={i}>
              <span>{fmtDate(l.at)}</span>
              <span>{l.taste} · {STRENGTHS.find((x) => x.id === l.strength)?.label.toLowerCase()}</span>
              <span className="muted">{[l.grind, l.dose ? l.dose + " g" : "", l.bean].filter(Boolean).join(" · ")}{l.note ? ` — “${l.note}”` : ""}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="rate-help">Change one thing at a time — then you know what made the difference.</p>
    </details>
  );
}

/* ============ spoken cues ============ */
/** Speaks each phase when voice cues are on and the volume isn't off. Mounted once in the app shell. */
export function VoiceCues() {
  const { voice, volIdx } = useBrewPrefs();
  useEffect(() => timer.onCue((c) => {
    const gain = VOLUMES[volIdx].gain;
    if (voice && gain > 0) speak(cueLine(c), Math.min(1, 0.4 + gain));
  }), [voice, volIdx]);
  return null;
}

const SAMPLE = "Pour to 100 grams, 15 seconds. Slow circles in the middle.";
const isApple = () => typeof navigator !== "undefined" && (/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent));

/** Under the timer while voice cues are on: which voice speaks, and a sample to hear it. */
export function VoicePicker() {
  useSyncExternalStore(subscribeVoices, voicesVersion, () => "");
  const voices = englishVoices();
  const cur = currentVoice();
  if (!voices.length) return null;
  const label = (v: SpeechSynthesisVoice) => `${v.name.replace(/\s*\((?:English|en)[^)]*\)/i, "")} · ${v.lang.replace("_", "-")}`;
  return (
    <div className="voice-pick" id="voicePick">
      <label>
        <span>Voice</span>
        <select value={cur?.voiceURI ?? ""} onChange={(e) => { saveVoice(e.target.value); speak(SAMPLE); }}>
          {voices.slice(0, 12).map((v) => <option key={v.voiceURI} value={v.voiceURI}>{label(v)}</option>)}
        </select>
      </label>
      <button type="button" className="btn ghost" onClick={() => speak(SAMPLE)}><Icon name="voice" />Hear it</button>
      {!hasNaturalVoice() && isApple() && (
        <p className="voice-tip">For a more natural voice, download one marked Enhanced or Premium on your iPhone: Settings › Accessibility › Spoken Content › Voices › English. It shows up here after.</p>
      )}
    </div>
  );
}

/* ============ hands-free: full screen, big type, the animation ============ */
export function HandsFree({ tb, water, onClose }: { tb: TimerBrew; water?: number; onClose: () => void }) {
  useTimer();
  const prefs = useBrewPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const owns = timer.owns(tb);
  const marks: number[] = [];
  let total = 0;
  for (const s of tb.segs) { marks.push(total); total += s.dur; }
  const t = owns ? timer.elapsed() : 0;
  const clamped = Math.min(t, total);
  let idx = 0;
  marks.forEach((m, i) => { if (clamped + 0.0001 >= m) idx = i; });
  const sg = tb.segs[idx];
  const into = Math.min(sg.dur, Math.max(0, clamped - marks[idx]));
  const started = owns && timer.startedAt > 0, finished = owns && timer.finished, running = owns && timer.running;
  const left = Math.ceil(sg.dur - into);
  const nxt = tb.segs[idx + 1];

  useEffect(() => {
    const el = ref.current;
    try { el?.requestFullscreen?.().catch(() => {}); } catch {}
    const prev = document.activeElement as HTMLElement | null;
    el?.querySelector<HTMLButtonElement>(".hf-go")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close.current(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch {}
      prev?.focus?.();
    };
  }, []);

  return (
    <div className="handsfree" ref={ref} role="dialog" aria-modal="true" aria-label={`Hands-free: ${tb.name}`}>
      <div className="hf-top">
        <span className="hf-name"><Icon name={tb.icon} />{tb.name}</span>
        <button type="button" className="x" aria-label="Exit hands-free" onClick={onClose}><Icon name="close" /></button>
      </div>
      <div className="hf-main">
        {/* the brew clock, large: countdown, the brewer, the mug and the scale with its reading */}
        <div className="hf-clock">
          <BrewCanvas tb={tb} kind="clock" water={water}
            label={finished ? "Done" : `${started ? left : tb.segs[0].dur} seconds left`} />
        </div>
        <div className="hf-info">
          {(() => {
            const kind = finished ? "Done" : started ? (running ? segWord(sg) : "Paused · " + segWord(sg)) : segWord(tb.segs[0]) + " first";
            const now = finished ? "Brew complete" : sg.lbl;
            // skip the small label when it would only repeat the step ("Press" over "Press")
            return kind.toLowerCase() === now.toLowerCase() ? null : <p className="hf-kind">{kind}</p>;
          })()}
          <p className="hf-now" aria-live="polite">{finished ? "Brew complete" : sg.lbl}</p>
          {!finished && sg.det && <p className="hf-det">{sg.det}</p>}
          {!finished && nxt && started && <p className="hf-next">Then — {segWord(nxt)}: {nxt.lbl}</p>}
          <p className="hf-total">{mmss(clamped)} / {mmss(total)}</p>
        </div>
      </div>
      <div className="hf-controls">
        <button type="button" className="btn primary hf-go" onClick={() => (running ? timer.pause() : timer.start(tb))}>
          <Icon name={running ? "pause" : "play"} />{running ? "Pause" : started && !finished ? "Resume" : "Start"}
        </button>
        <button type="button" className="btn" onClick={() => { if (owns) timer.reset(); }}><Icon name="reset" />Reset</button>
        <button type="button" className="btn icon" aria-pressed={prefs.voice} onClick={() => prefs.setVoice(!prefs.voice)}><Icon name={prefs.voice ? "voice" : "voiceOff"} />{prefs.voice ? "Voice on" : "Voice off"}</button>
        <button type="button" className="btn icon" onClick={() => { prefs.cycleVolume(); setTimeout(testTone, 0); }}><Icon name={VOLUMES[prefs.volIdx].icon} />{VOLUMES[prefs.volIdx].label}</button>
      </div>
      <p className="hf-hint">Space starts and pauses · Esc exits · the screen stays on while it runs</p>
    </div>
  );
}
