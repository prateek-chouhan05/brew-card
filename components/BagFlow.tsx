"use client";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ROASTS } from "@/lib/data/roasts";
import { FLAVOURS } from "@/lib/data/flavours";
import { DEFAULT_ENTRY_ID, FL, houseById } from "@/lib/catalog";
import { hGrind } from "@/lib/brew";
import { numG, toGrinder, unitG } from "@/lib/grind";
import { ROAST_SWATCH } from "@/lib/icons";
import { beanStatus, daysSince, newId, type Bean } from "@/lib/journal";
import { splitNotes, suggest, tasteFamily, type Hints } from "@/lib/tasting";
import { fromLabel, preparePhoto, scanAvailable, scanLabel, type ScanError } from "@/lib/scan";
import type { FlavourId, Grinder, RoastId } from "@/lib/types";
import { Icon, TasteMark } from "./Icon";

type View = "choose" | "scanning" | "form" | "error";
type Source = "scan" | "type" | "edit";
interface Form {
  id: string; name: string; notes: string[]; draft: string;
  roast: RoastId | ""; flavour: FlavourId | ""; auto: boolean;
  roasted: string; rest: string; origin: string; hints: Hints;
  dateAsk: { printed: string; first: string; second: string } | null;
}

const ROAST_SHORT: Record<RoastId, string> = { light: "Light", medlight: "Med-light", medium: "Medium", meddark: "Med-dark", dark: "Dark" };
const today = () => new Date().toISOString().slice(0, 10);
const shortDate = (iso: string) => {
  try { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(iso + "T00:00:00")); } catch { return iso; }
};
const blank = (): Form => ({ id: newId(), name: "", notes: [], draft: "", roast: "", flavour: "", auto: true, roasted: "", rest: "", origin: "", hints: {}, dateAsk: null });
const fromBean = (b: Bean): Form => ({
  id: b.id, name: b.name, notes: b.notes ?? [], draft: "", roast: b.roast, flavour: b.flavour, auto: !(b.notes?.length),
  roasted: b.roasted ?? "", rest: b.rest ? String(b.rest) : "", origin: b.origin ?? "", hints: {}, dateAsk: null,
});

const ERRORS: Record<ScanError, { title: string; text: string }> = {
  unreadable: { title: "We couldn't read the label", text: "The photo was too blurry, dark or far away to make out the tasting notes. Nothing was saved." },
  not_coffee: { title: "This doesn't look like a coffee bag", text: "Try the side of the bag with the tasting notes and roast date." },
  offline: { title: "Scanning needs a connection", text: "You're offline. Type the notes from the bag instead; it works without internet." },
  limit: { title: "That's today's scans", text: "Type the notes in, or scan again tomorrow." },
  timeout: { title: "That took too long", text: "The connection may be slow. Try again, or type the notes in." },
  unavailable: { title: "Scanning isn't working right now", text: "Type the notes from the bag instead. Nothing was saved." },
};

/** Before a roast is picked, the date alone: how long ago it was roasted. */
function roastedAgo(iso: string) {
  const d = daysSince(iso);
  if (d < 0) return "That date is in the future";
  return d === 0 ? "Roasted today" : `Roasted ${d} day${d === 1 ? "" : "s"} ago`;
}

/** Add or edit a bag: scan the label, or type the notes, then check and save. Lives inside the setup sheet. */
export function BagFlow({ grinder, edit, onSave, onExit }: { grinder: Grinder; edit: Bean | null; onSave: (b: Bean) => void; onExit: () => void }) {
  const canScan = scanAvailable();
  const [view, setView] = useState<View>(edit ? "form" : canScan ? "choose" : "form");
  const [source, setSource] = useState<Source>(edit ? "edit" : "type");
  const [form, setForm] = useState<Form>(() => (edit ? fromBean(edit) : blank()));
  const [changing, setChanging] = useState(false);
  const [photo, setPhoto] = useState("");
  const [stage, setStage] = useState<"prep" | "read">("prep");
  const [err, setErr] = useState<ScanError>("unreadable");
  const [online, setOnline] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    const on = () => setOnline(navigator.onLine !== false);
    on(); window.addEventListener("online", on); window.addEventListener("offline", on);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", on); };
  }, []);
  useEffect(() => { try { titleRef.current?.focus({ preventScroll: true }); } catch {} }, [view]);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);

  /* ---------- the taste family, live ---------- */
  const all = useMemo(() => [...form.notes, ...(form.draft.trim().length > 2 ? [form.draft.trim()] : [])], [form.notes, form.draft]);
  const taste = useMemo(() => tasteFamily(all, form.hints), [all, form.hints]);
  const flavour: FlavourId | "" = form.auto ? (taste.best ?? "") : form.flavour;
  const lastWord = form.draft.split(/\s+/).pop() ?? "";
  const ideas = suggest(lastWord).filter((s) => !form.notes.includes(s));

  const set = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));
  const commit = (text: string, keep = "") => {
    const add = splitNotes(text).map((n) => n.toLowerCase()).filter((n) => !form.notes.includes(n));
    setForm((f) => ({ ...f, notes: [...f.notes, ...add], draft: keep }));
  };
  const onNoteChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // a comma, a bar or a pasted line commits every finished note and keeps typing the last one
    const parts = v.split(/[,|;\n]|\s+I\s+/);
    if (parts.length > 1) commit(parts.slice(0, -1).join(","), parts[parts.length - 1].replace(/^\s+/, ""));
    else set({ draft: v });
  };
  const pickIdea = (word: string) => {
    const words = form.draft.split(/\s+/); words[words.length - 1] = word;
    commit(words.join(" ")); noteRef.current?.focus();
  };

  /* ---------- scanning ---------- */
  const startScan = () => fileRef.current?.click();
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
    setView("scanning"); setStage("prep");
    abort.current?.abort();
    const ctrl = new AbortController(); abort.current = ctrl;
    let b64 = "";
    try { b64 = await preparePhoto(file); } catch { setErr("unreadable"); setView("error"); return; }
    if (ctrl.signal.aborted) return;
    setStage("read");
    const r = await scanLabel(b64, ctrl.signal);
    if (ctrl.signal.aborted) return;
    if (!r.ok) { setErr(r.error); setView("error"); return; }
    const v = fromLabel(r.label);
    setForm({ ...blank(), ...v, auto: true });
    setSource("scan"); setChanging(false); setView("form");
  };
  const cancelScan = () => { abort.current?.abort(); setView("choose"); };
  const typeIt = () => { abort.current?.abort(); setForm((f) => (source === "scan" ? f : blank())); setSource("type"); setView("form"); };

  /* ---------- saving ---------- */
  const ready = !!form.name.trim() && !!form.roast && !form.dateAsk;
  const save = () => {
    if (!ready) return;
    const notes = form.draft.trim() ? [...form.notes, ...splitNotes(form.draft).map((n) => n.toLowerCase())] : form.notes;
    const rest = parseInt(form.rest, 10);
    onSave({
      id: form.id, name: form.name.trim(), roast: form.roast as RoastId, flavour,
      roasted: form.roasted || undefined, rest: rest > 0 ? rest : undefined,
      notes: notes.length ? notes : undefined, origin: form.origin || undefined,
    });
  };
  const roastObj = ROASTS.find((x) => x.id === form.roast);
  const everyday = houseById(DEFAULT_ENTRY_ID);
  const grindNow = everyday && roastObj ? `${numG(toGrinder(hGrind(everyday, roastObj), grinder), grinder)} ${unitG(grinder)}` : "";
  const status = form.roasted && form.roast ? beanStatus({ id: form.id, name: form.name, roast: form.roast, flavour, roasted: form.roasted, rest: parseInt(form.rest, 10) || undefined }) : null;

  const back = () => {
    if (view === "scanning") return cancelScan();
    if (view === "error" || (view === "form" && source !== "edit" && canScan)) return setView("choose");
    onExit();
  };
  const title = view === "choose" ? "Add a bag" : view === "form" ? (source === "scan" ? "Check what we read" : source === "edit" ? "Edit bag" : "Type it in") : "Scan the bag";

  return (
    <>
      <div className="sheet-h bf-h">
        <button type="button" className="x bf-back" aria-label={view === "choose" || source === "edit" ? "Back to your coffee setup" : "Back"} onClick={back}><Icon name="back" /></button>
        <h2 tabIndex={-1} ref={titleRef} id="bfTitle">{title}</h2>
        {view === "form" && source === "scan" && photo && <img className="bf-thumb" src={photo} alt="Your photo of the bag" />}
        {view === "form" && source === "type" && canScan && (
          <button type="button" className="bf-switch" onClick={startScan} disabled={!online}><Icon name="camera" />Scan instead</button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} id="bfFile" />

      <div className="sheet-b bf-b" id="bagFlow">
        {view === "choose" && (
          <div className="bf-choose">
            <p className="bf-lede">Fill it in from the label on the bag. You can change anything before you save.</p>
            <button type="button" className="bf-opt main" id="bfScan" onClick={startScan} disabled={!online}>
              <span className="bf-ic"><Icon name="camera" /></span>
              <span className="bf-t"><b>Scan the bag</b><small>Take or choose a photo of the label. We read the tasting notes, roast and roast date.</small></span>
              <Icon name="chevron" />
            </button>
            <button type="button" className="bf-opt" id="bfType" onClick={typeIt}>
              <span className="bf-ic"><Icon name="note" /></span>
              <span className="bf-t"><b>Type it in</b><small>Enter the tasting notes as written. We match them to a taste family as you type.</small></span>
              <Icon name="chevron" />
            </button>
            <p className="bf-fine"><Icon name="info" />
              {online ? "Scanning needs a connection. The photo is read and then thrown away; nothing is kept." : "You're offline, so scanning is off. Typing works without internet."}
            </p>
          </div>
        )}

        {view === "scanning" && (
          <div className="bf-scan">
            <div className="bf-photo">
              {photo && <img src={photo} alt="Your photo of the bag's label" />}
              <span className="bf-line" aria-hidden="true" />
              <span className="bf-pill"><span className="bf-spin" aria-hidden="true" />Reading the label…</span>
            </div>
            <div className="bf-steps" role="status" aria-live="polite">
              <p className={stage === "prep" ? "now" : "done"}>{stage === "prep" ? <span className="bf-dot" aria-hidden="true" /> : <Icon name="check" />}<span>Straightening and resizing your photo</span></p>
              <p className={stage === "read" ? "now" : ""}>{stage === "read" ? <span className="bf-dot" aria-hidden="true" /> : <span className="bf-dot off" aria-hidden="true" />}<span>Reading the name, tasting notes, roast and roast date</span></p>
            </div>
            <p className="bf-fine">Usually takes 2–5 seconds. You&apos;ll check everything before it&apos;s saved.</p>
          </div>
        )}

        {view === "error" && (
          <div className="bf-scan">
            {photo && <div className="bf-photo small"><img src={photo} alt="Your photo of the bag" /></div>}
            <div role="alert" className="bf-err">
              <h3>{ERRORS[err].title}</h3>
              <p>{ERRORS[err].text}</p>
            </div>
            {(err === "unreadable" || err === "not_coffee") && (
              <div className="bf-tips">
                <b>For a clearer photo</b>
                <p>Fill the frame with just the label</p>
                <p>Press the bag flat with your hand</p>
                <p>Tilt it away from lights to avoid glare</p>
              </div>
            )}
          </div>
        )}

        {view === "form" && (
          <div className="bf-form">
            <label className="f">
              <span className="f-l">Coffee</span>
              <input type="text" id="bfName" value={form.name} autoComplete="off" placeholder="e.g. Kalledevarapura Estate" enterKeyHint="next"
                onChange={(e) => set({ name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); noteRef.current?.focus(); } }} />
            </label>

            <div className="f">
              <label className="f-l" htmlFor="bfNotes">{source === "scan" ? "Tasting notes on the bag" : "Tasting notes, as written on the bag"}</label>
              {form.notes.length > 0 && (
                <ul className="bf-chips" aria-label="Tasting notes">
                  {taste.notes.slice(0, form.notes.length).map((m) => (
                    <li key={m.note} className={m.family ? "" : "unknown"}>
                      {m.note}
                      <button type="button" aria-label={`Remove ${m.note}`} onClick={() => set({ notes: form.notes.filter((n) => n !== m.note) })}><Icon name="close" /></button>
                    </li>
                  ))}
                </ul>
              )}
              <input ref={noteRef} id="bfNotes" type="text" value={form.draft} autoComplete="off" autoCapitalize="none" enterKeyHint="done"
                placeholder={form.notes.length ? "Add another note" : "e.g. brown sugar, roasted almond, raisin"}
                onChange={onNoteChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); if (form.draft.trim()) commit(form.draft); }
                  if (e.key === "Backspace" && !form.draft && form.notes.length) set({ notes: form.notes.slice(0, -1) });
                }}
                onBlur={() => { if (form.draft.trim().length > 1) commit(form.draft); }} />
              {ideas.length > 0 && (
                <p className="bf-ideas"><span>Did you mean</span>{ideas.map((w) => <button type="button" key={w} onMouseDown={(e) => e.preventDefault()} onClick={() => pickIdea(w)}>{w}</button>)}</p>
              )}
            </div>

            <div className={"bf-fam" + (flavour ? " on" : "")} role="status" aria-live="polite">
              {flavour ? (
                <div className="bf-fam-top">
                  <TasteMark id={flavour} className="bf-fam-ic" />
                  <span className="bf-fam-t"><small>{form.auto ? (all.length ? "Tastes most like" : "") : "You picked"}</small><b id="bfFamily">{FL[flavour].label}</b></span>
                  <button type="button" className="bf-change" aria-expanded={changing} onClick={() => setChanging(!changing)}>{changing ? "Done" : "Change"}</button>
                </div>
              ) : (
                <div className="bf-fam-top">
                  <span className="bf-fam-t"><small>Taste family</small><b>{all.length ? "No match yet" : "Add the notes to see it"}</b></span>
                  <button type="button" className="bf-change" aria-expanded={changing} onClick={() => setChanging(!changing)}>{changing ? "Done" : "Pick one"}</button>
                </div>
              )}
              {taste.notes.length > 0 && !changing && (
                <dl className="bf-why">
                  {taste.notes.map((m, i) => (
                    <div key={m.note + i}>
                      <dt>{m.note}{i === 0 && m.family ? <small> · first note</small> : null}</dt>
                      <dd className={m.family && m.family === flavour ? "best" : ""}>{m.family ? FL[m.family].label : "not recognised"}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {taste.hint && !changing && <p className="bf-hint">{taste.hint}</p>}
              {changing && (
                <div className="tps bf-pick" role="radiogroup" aria-label="Taste family">
                  {FLAVOURS.map((x) => (
                    <label className="tp" key={x.id}>
                      <input type="radio" name="bfFlavour" value={x.id} checked={flavour === x.id} onChange={() => set({ flavour: x.id, auto: false })} />
                      <span className="tp-b"><TasteMark id={x.id} />{x.label}</span>
                    </label>
                  ))}
                  {!form.auto && taste.best && <button type="button" className="linkbtn" onClick={() => set({ auto: true })}>Use the suggestion ({FL[taste.best].label})</button>}
                </div>
              )}
            </div>

            <fieldset className="fs bf-roast">
              <legend>Roast{source === "scan" && form.roast ? <span className="opt">from the bag</span> : <span className="opt">as printed on the bag</span>}</legend>
              <div className="roast-scale" id="bfRoast">
                {ROASTS.map((x) => (
                  <label className="rs" key={x.id}>
                    <input type="radio" name="bfRoast" value={x.id} checked={form.roast === x.id} onChange={() => set({ roast: x.id })} />
                    <span className="rs-b"><span className="rs-sw" style={{ background: ROAST_SWATCH[x.id] }} aria-hidden="true" /><span className="rs-l">{ROAST_SHORT[x.id]}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>

            {form.dateAsk ? (
              <div className="bf-ask" role="group" aria-labelledby="bfAskQ">
                <p id="bfAskQ"><Icon name="warning" /><span><b>Roasted on {form.dateAsk.printed}.</b> Is that {shortDate(form.dateAsk.first)} or {shortDate(form.dateAsk.second)}?</span></p>
                <div>
                  <button type="button" className="yes" onClick={() => set({ roasted: form.dateAsk!.first, dateAsk: null })}>{shortDate(form.dateAsk.first)}</button>
                  <button type="button" onClick={() => set({ roasted: form.dateAsk!.second, dateAsk: null })}>{shortDate(form.dateAsk.second)}</button>
                </div>
              </div>
            ) : (
              <div className="bag-form-row">
                <label className="f">
                  <span className="f-l">Roasted on</span>
                  <input type="date" id="bfRoasted" value={form.roasted} max={today()} onChange={(e) => set({ roasted: e.target.value })} />
                  <span className={"f-h" + (status ? " bean-st " + status.tone : "")}>{status ? status.label : form.roasted ? roastedAgo(form.roasted) : "Optional. Shows when it's ready."}</span>
                </label>
                <label className="f">
                  <span className="f-l">Rest days</span>
                  <input type="number" inputMode="numeric" min={0} max={60} value={form.rest} placeholder="e.g. 7" onChange={(e) => set({ rest: e.target.value })} />
                  <span className="f-h">Only if the bag says</span>
                </label>
              </div>
            )}

            {form.origin && <p className="bf-fine bf-origin">Also on the bag: {form.origin}</p>}
          </div>
        )}
      </div>

      {view === "scanning" && (
        <div className="sheet-f"><div className="sheet-f-acts">
          <button type="button" className="btn ghost" onClick={cancelScan}>Cancel</button>
          <button type="button" className="btn ghost" onClick={typeIt}>Type it in instead</button>
        </div></div>
      )}
      {view === "error" && (
        <div className="sheet-f"><div className="sheet-f-acts">
          <button type="button" className="btn ghost" onClick={typeIt}>Type it in</button>
          {err !== "limit" && err !== "offline" && <button type="button" className="btn primary" onClick={startScan}>Take another photo</button>}
        </div></div>
      )}
      {view === "form" && (
        <div className="sheet-f">
          <p className="sheet-sum" aria-live="polite">
            {roastObj ? <span className="sw" style={{ background: ROAST_SWATCH[roastObj.id] }} aria-hidden="true" /> : null}
            <span>
              {!form.name.trim() ? "Add the coffee's name to save it." : !roastObj ? "Pick the roast to save the bag." : form.dateAsk ? "Confirm the roast date to save." :
                <><b>{roastObj.label}{flavour ? ` · ${FL[flavour].label}` : ""}</b>{grindNow && <> → Everyday Cup at {grindNow}, {roastObj.temp} °C</>}</>}
            </span>
          </p>
          <div className="sheet-f-acts">
            <button type="button" className="btn primary" id="bfSave" disabled={!ready} onClick={save}>{source === "edit" ? "Save changes" : "Save bag and use it"}</button>
          </div>
        </div>
      )}
    </>
  );
}
