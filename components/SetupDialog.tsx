"use client";
import { useEffect, useRef, useState } from "react";
import { GRINDERS } from "@/lib/data/grinders";
import { ROASTS } from "@/lib/data/roasts";
import { FLAVOURS } from "@/lib/data/flavours";
import { DEFAULT_ENTRY_ID, FL, grinderById, houseById, roastById } from "@/lib/catalog";
import { hGrind } from "@/lib/brew";
import { numG, toGrinder, unitG } from "@/lib/grind";
import { beanStatus, newId, type Bean } from "@/lib/journal";
import type { FlavourId, RoastId } from "@/lib/types";
import { useSetup, type SetupDraft } from "./providers";
import { useModal } from "./useModal";

const BRANDS = Array.from(new Set(GRINDERS.map((g) => g.brand)));

/** The colour of the beans at each roast level, light to dark. */
export const ROAST_SWATCH: Record<RoastId, string> = { light: "#c49a6c", medlight: "#a8754a", medium: "#87573a", meddark: "#5e3a24", dark: "#35201a" };
const ROAST_SHORT: Record<RoastId, string> = { light: "Light", medlight: "Med-light", medium: "Medium", meddark: "Med-dark", dark: "Dark" };
/** One colour per taste family, for the small dot on each choice. */
const FLAVOUR_DOT: Record<FlavourId, string> = { fruity: "#b8325a", citrus: "#d9a400", floral: "#a77bd0", caramel: "#c98a3a", nutty: "#9a6b3f", chocolate: "#5a3622", bold: "#2e2a28" };

const today = () => new Date().toISOString().slice(0, 10);
const longDate = (iso: string) => {
  try { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso + "T00:00:00")); }
  catch { return iso; }
};
const daysAgo = (iso: string) => Math.round((Date.now() - new Date(iso + "T00:00:00").getTime()) / 86_400_000);

/** Grinder, roast, taste and your bean bags. Changes apply only on Save; Cancel, ×, Esc and the backdrop discard them. */
export function SetupDialog() {
  const { grinder, roast, flavour, beans, activeBean, dialog, apply, closeSetup } = useSetup();
  const [draft, setDraft] = useState<SetupDraft>({ grinder: grinder.id, roast: roast.id, flavour, beans, activeBean: activeBean?.id ?? "" });
  const [form, setForm] = useState<{ id: string; name: string; roasted: string; rest: string } | null>(null);
  const ref = useModal(dialog.open, closeSetup);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!dialog.open) return;
    setDraft({ grinder: grinder.id, roast: roast.id, flavour, beans, activeBean: activeBean?.id ?? "" });
    setForm(null);
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    // focus the title, not a control, so nothing looks selected or in error when the sheet opens
    try { titleRef.current?.focus({ preventScroll: true }); } catch {}
    // the draft resets only when the dialog opens
  }, [dialog.open]);

  const g = grinderById(draft.grinder) ?? GRINDERS[0];
  const r = roastById(draft.roast) ?? ROASTS[2];
  const fl = draft.flavour ? FL[draft.flavour as FlavourId] : null;
  const everyday = houseById(DEFAULT_ENTRY_ID);
  const grindNow = everyday ? `${numG(toGrinder(hGrind(everyday, r), g), g)} ${unitG(g)}` : "";

  const pickBean = (id: string) => setDraft((d) => {
    const b = d.beans.find((x) => x.id === id);
    return b ? { ...d, activeBean: id, roast: b.roast, flavour: b.flavour } : { ...d, activeBean: "" };
  });
  /** the draft with the bag being edited folded in: a bag keeps the roast and taste picked above */
  const withBag = (d: SetupDraft): SetupDraft => {
    if (!form || !form.name.trim()) return d;
    const rest = parseInt(form.rest, 10);
    const bag: Bean = {
      id: form.id, name: form.name.trim(), roast: d.roast as RoastId, flavour: d.flavour as FlavourId | "",
      roasted: form.roasted || undefined, rest: rest > 0 ? rest : undefined,
    };
    return { ...d, activeBean: bag.id, beans: d.beans.some((x) => x.id === bag.id) ? d.beans.map((x) => (x.id === bag.id ? bag : x)) : [...d.beans, bag] };
  };
  const saveBag = () => { setDraft(withBag); setForm(null); };
  const removeBag = (id: string) => setDraft((d) => ({ ...d, beans: d.beans.filter((b) => b.id !== id), activeBean: d.activeBean === id ? "" : d.activeBean }));
  const editBag = (b: Bean) => { pickBean(b.id); setForm({ id: b.id, name: b.name, roasted: b.roasted ?? "", rest: b.rest ? String(b.rest) : "" }); };

  return (
    <dialog className="sheetdlg su" id="setupDlg" aria-labelledby="suH" ref={ref}>
      <form className="sheet" id="setupForm" noValidate onSubmit={(e) => {
        e.preventDefault();
        const by = (e.nativeEvent as SubmitEvent).submitter;
        if (form && by?.id !== "suSave") { saveBag(); return; } // Enter inside the bag form saves the bag
        apply(withBag(draft));
        closeSetup();
      }}>
        <div className="sheet-h">
          <h2 id="suH" tabIndex={-1} ref={titleRef}>Your coffee setup</h2>
          <button type="button" className="x" aria-label="Close without saving" onClick={closeSetup}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="sheet-b" id="setupBody" ref={bodyRef}>
          <p className="sheet-intro" id="suIntro">
            {dialog.firstRun
              ? <>Three quick answers, and every grind setting, temperature and recipe is fitted to your coffee.</>
              : <>Saved on this device. Change it whenever you open a new bag.</>}
          </p>

          <div className="fs">
            <h3><label htmlFor="suGrinder">Grinder</label></h3>
            <p className="help" id="suGrHelp">
              {g.unit === "clicks" ? "Grind settings are shown in clicks on it, counted from fully closed." : "Grind settings are shown as the numbers on its dial."}
            </p>
            <div className="select-wrap">
              <select id="suGrinder" aria-describedby="suGrHelp" value={draft.grinder}
                onChange={(e) => setDraft((d) => ({ ...d, grinder: e.target.value }))}>
                {BRANDS.map((b) => (
                  <optgroup key={b} label={b}>
                    {GRINDERS.filter((x) => x.brand === b).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <fieldset className="fs" aria-describedby="suRoastHelp">
            <legend>Roast level</legend>
            <p className="help" id="suRoastHelp">As printed on the bag. It sets water temperature and grind.</p>
            <div className="roast-scale" id="suRoast">
              {ROASTS.map((x) => (
                <label className="rs" key={x.id}>
                  <input type="radio" name="suRoast" value={x.id} checked={draft.roast === x.id}
                    onChange={() => setDraft((d) => ({ ...d, roast: x.id, activeBean: "" }))} />
                  <span className="rs-b">
                    <span className="rs-sw" style={{ background: ROAST_SWATCH[x.id] }} aria-hidden="true" />
                    <span className="rs-l">{ROAST_SHORT[x.id]}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="pick-note" aria-live="polite"><b>{r.label} · {r.temp} °C.</b> {r.note}</p>
          </fieldset>

          <fieldset className="fs" aria-describedby="suFlHelp">
            <legend>What does it taste like?</legend>
            <p className="help" id="suFlHelp">The closest family to the notes on the bag. Recipes that suit it rank first.</p>
            <div className="tps" id="suFlavour">
              {[{ id: "" as const, label: "No preference" }, ...FLAVOURS].map((x) => (
                <label className="tp" key={x.id || "none"}>
                  <input type="radio" name="suFlavour" value={x.id} checked={draft.flavour === x.id}
                    onChange={() => setDraft((d) => ({ ...d, flavour: x.id, activeBean: "" }))} />
                  <span className="tp-b">
                    <span className={"dot" + (x.id ? "" : " none")} style={x.id ? { background: FLAVOUR_DOT[x.id] } : undefined} aria-hidden="true" />
                    {x.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="pick-note" aria-live="polite">{fl ? <>Notes like {fl.notes}.</> : <>Recipes are ranked by roast only.</>}</p>
          </fieldset>

          <fieldset className="fs" id="suBeans">
            <legend>Your bags <span className="opt">optional</span></legend>
            <p className="help">Save a bag to switch to it in one tap and see when it&apos;s ready to brew.</p>
            {draft.beans.length > 0 && (
              <div className="bags">
                {draft.beans.map((b) => {
                  const st = beanStatus(b);
                  const bf = b.flavour ? FL[b.flavour] : null;
                  const on = draft.activeBean === b.id;
                  return (
                    <div className={"bag-row" + (on ? " on" : "")} key={b.id}>
                      <label className="bag-pick">
                        <input type="radio" name="suBean" value={b.id} checked={on} onChange={() => pickBean(b.id)} />
                        <span className="radio" aria-hidden="true" />
                        <span className="bag-txt">
                          <b>{b.name}</b>
                          <small>
                            <span className="sw" style={{ background: ROAST_SWATCH[b.roast] }} aria-hidden="true" />
                            {roastById(b.roast)?.label}{bf ? ` · ${bf.label}` : ""}
                          </small>
                          <small className={"bean-st " + st.tone}>{st.label}</small>
                        </span>
                      </label>
                      <div className="bag-acts">
                        <button type="button" className="mini" aria-label={`Edit ${b.name}`} onClick={() => editBag(b)}>Edit</button>
                        <button type="button" className="mini" aria-label={`Remove ${b.name}`} onClick={() => removeBag(b.id)}>Remove</button>
                      </div>
                    </div>
                  );
                })}
                <label className="no-bag">
                  <input type="radio" name="suBean" value="" checked={!draft.activeBean} onChange={() => pickBean("")} />
                  <span className="radio" aria-hidden="true" />
                  <span>Don&apos;t use a saved bag</span>
                </label>
              </div>
            )}
            {form ? (
              <div className="bag-form">
                <label className="f">
                  <span className="f-l">Name</span>
                  <input type="text" value={form.name} autoComplete="off" placeholder="e.g. Rossette Yelnoorkhan" enterKeyHint="done"
                    onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
                </label>
                <div className="bag-form-row">
                  <label className="f">
                    <span className="f-l">Roasted on</span>
                    <input type="date" value={form.roasted} max={today()} aria-describedby="suRoastedHint" onChange={(e) => setForm({ ...form, roasted: e.target.value })} />
                    <span className="f-h" id="suRoastedHint">{form.roasted ? `${longDate(form.roasted)} · ${daysAgo(form.roasted)} days ago` : "The date on the bag"}</span>
                  </label>
                  <label className="f">
                    <span className="f-l">Rest days</span>
                    <input type="number" inputMode="numeric" min={0} max={60} value={form.rest} placeholder="e.g. 7" aria-describedby="suRestHint"
                      onChange={(e) => setForm({ ...form, rest: e.target.value })} />
                    <span className="f-h" id="suRestHint">Only if the bag says</span>
                  </label>
                </div>
                <p className="bag-keeps">
                  <span className="sw" style={{ background: ROAST_SWATCH[r.id] }} aria-hidden="true" />
                  Saved with <b>{r.label}{fl ? ` · ${fl.label}` : ""}</b> from above.
                </p>
                <div className="bag-form-acts">
                  <button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button>
                  <button type="button" className="btn primary" disabled={!form.name.trim()} onClick={saveBag}>Save bag</button>
                </div>
              </div>
            ) : (
              <button type="button" className="panel-act add-bag" onClick={() => setForm({ id: newId(), name: "", roasted: "", rest: "" })}>+ Add a bag</button>
            )}
          </fieldset>
        </div>
        <div className="sheet-f">
          <p className="sheet-sum" id="suSummary" aria-live="polite">
            <span className="sw" style={{ background: ROAST_SWATCH[r.id] }} aria-hidden="true" />
            <span>
              <b>{g.name} · {r.label}{fl ? ` · ${fl.label}` : ""}</b>
              {grindNow && <> → Everyday Cup at {grindNow}, {r.temp} °C</>}
            </span>
          </p>
          <div className="sheet-f-acts">
            <button type="button" className="btn ghost" id="suCancel" onClick={closeSetup}>{dialog.firstRun ? "Skip for now" : "Cancel"}</button>
            <button type="submit" className="btn primary" id="suSave">Save setup</button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
