"use client";
import { useEffect, useRef, useState } from "react";
import { GRINDERS } from "@/lib/data/grinders";
import { ROASTS } from "@/lib/data/roasts";
import { FLAVOURS } from "@/lib/data/flavours";
import { FL, grinderById, roastById } from "@/lib/catalog";
import { beanStatus, newId, type Bean } from "@/lib/journal";
import type { FlavourId, RoastId } from "@/lib/types";
import { useSetup, type SetupDraft } from "./providers";
import { useModal } from "./useModal";

const BRANDS = Array.from(new Set(GRINDERS.map((g) => g.brand)));
const FLAVOUR_OPTS = [{ id: "", emoji: "⚪", label: "No preference", notes: "Rank by roast only" }, ...FLAVOURS];
const today = () => new Date().toISOString().slice(0, 10);

/** Grinder, your bean bags, roast and flavour. Changes apply only on Save; Cancel, ×, Esc and the backdrop discard them. */
export function SetupDialog() {
  const { grinder, roast, flavour, beans, activeBean, dialog, apply, closeSetup } = useSetup();
  const [draft, setDraft] = useState<SetupDraft>({ grinder: grinder.id, roast: roast.id, flavour, beans, activeBean: activeBean?.id ?? "" });
  const [form, setForm] = useState<{ id: string; name: string; roasted: string; rest: string } | null>(null);
  const ref = useModal(dialog.open, closeSetup);
  const bodyRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!dialog.open) return;
    setDraft({ grinder: grinder.id, roast: roast.id, flavour, beans, activeBean: activeBean?.id ?? "" });
    setForm(null);
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    try { selRef.current?.focus({ preventScroll: true }); } catch {}
    // the draft resets only when the dialog opens
  }, [dialog.open]);

  const g = grinderById(draft.grinder) ?? GRINDERS[0];
  const grHelp = (g.unit === "clicks"
    ? "Settings are shown in clicks counted out from zero, the finest point where the burrs just touch."
    : "Settings are shown as the numbers printed on the dial.") + " Changing grinder only changes grind numbers — never which recipes are shown.";

  const pickBean = (id: string) => setDraft((d) => {
    const b = d.beans.find((x) => x.id === id);
    return b ? { ...d, activeBean: id, roast: b.roast, flavour: b.flavour } : { ...d, activeBean: "" };
  });
  /** the draft with the bag being edited folded in */
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

  return (
    <dialog className="sheetdlg" id="setupDlg" aria-labelledby="suH" ref={ref}>
      <form className="sheet" id="setupForm" noValidate onSubmit={(e) => {
        e.preventDefault();
        const by = (e.nativeEvent as SubmitEvent).submitter;
        if (form && by?.id !== "suSave") { saveBag(); return; } // Enter inside the bag form saves the bag
        apply(withBag(draft));
        closeSetup();
      }}>
        <div className="sheet-h">
          <h2 id="suH"><span className="emoji" aria-hidden="true">⚙️</span> Your coffee setup</h2>
          <button type="button" className="x" aria-label="Close without saving" onClick={closeSetup}>×</button>
        </div>
        <div className="sheet-b" id="setupBody" ref={bodyRef}>
          <p className="sheet-intro" id="suIntro">
            {dialog.firstRun ? (
              <><b>Welcome.</b> Three quick answers and every grind setting, water temperature and recipe suggestion is fitted to what you&apos;re brewing. You can change this any time from <b>Setup</b> at the top.</>
            ) : (
              <>Saved on this device. Used to convert grind settings and to rank recipes that suit your bag. Clearing recipe filters never changes it.</>
            )}
          </p>

          <div className="fs">
            <h3><label htmlFor="suGrinder">Grinder</label></h3>
            <p className="help" id="suGrHelp">{grHelp}</p>
            <select id="suGrinder" ref={selRef} aria-describedby="suGrHelp" value={draft.grinder}
              onChange={(e) => setDraft((d) => ({ ...d, grinder: e.target.value }))}>
              {BRANDS.map((b) => (
                <optgroup key={b} label={b}>
                  {GRINDERS.filter((x) => x.brand === b).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <fieldset className="fs" id="suBeans">
            <legend>Your beans</legend>
            <p className="help">Save the bags you have. Picking one fills in its roast and flavour below, and the roast date tells you when it&apos;s ready to brew.</p>
            {draft.beans.length > 0 && (
              <div className="radio-cards bags">
                {draft.beans.map((b) => {
                  const st = beanStatus(b);
                  const f = b.flavour ? FL[b.flavour] : null;
                  return (
                    <div className="bag-row" key={b.id}>
                      <label className="rc">
                        <input type="radio" name="suBean" value={b.id} checked={draft.activeBean === b.id} onChange={() => pickBean(b.id)} />
                        <span className="rc-b">
                          <span className="emoji" aria-hidden="true">🫘</span>
                          <span>
                            <b>{b.name}</b>
                            <small>{roastById(b.roast)?.emoji} {roastById(b.roast)?.label}{f ? ` · ${f.emoji} ${f.label}` : ""}</small>
                            <small className={"bean-st " + st.tone}>{st.label}</small>
                          </span>
                        </span>
                      </label>
                      <div className="bag-acts">
                        <button type="button" className="linkbtn" onClick={() => setForm({ id: b.id, name: b.name, roasted: b.roasted ?? "", rest: b.rest ? String(b.rest) : "" })}>Edit</button>
                        <button type="button" className="linkbtn" aria-label={`Remove ${b.name}`} onClick={() => removeBag(b.id)}>Remove</button>
                      </div>
                    </div>
                  );
                })}
                <label className="rc">
                  <input type="radio" name="suBean" value="" checked={!draft.activeBean} onChange={() => pickBean("")} />
                  <span className="rc-b"><span className="emoji" aria-hidden="true">➖</span><span><b>No saved bag</b><small>Just use the roast and flavour below</small></span></span>
                </label>
              </div>
            )}
            {form ? (
              <div className="bag-form">
                <label>Name<input type="text" value={form.name} autoComplete="off" placeholder="e.g. Rossette Yelnoorkhan" enterKeyHint="done"
                  onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></label>
                <div className="bag-form-row">
                  <label>Roasted on<input type="date" value={form.roasted} max={today()} onChange={(e) => setForm({ ...form, roasted: e.target.value })} /></label>
                  <label>Rest days <small>(if on the bag)</small><input type="number" inputMode="numeric" min={0} max={60} value={form.rest} placeholder="optional"
                    onChange={(e) => setForm({ ...form, rest: e.target.value })} /></label>
                </div>
                <p className="help">Uses the roast and flavour you pick below.</p>
                <div className="bag-form-acts">
                  <button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button>
                  <button type="button" className="btn primary" disabled={!form.name.trim()} onClick={saveBag}>Save bag</button>
                </div>
              </div>
            ) : (
              <button type="button" className="panel-act add-bag" onClick={() => setForm({ id: newId(), name: "", roasted: "", rest: "" })}>+ Add a bag</button>
            )}
          </fieldset>

          <fieldset className="fs">
            <legend>Roast level on the bag</legend>
            <p className="help">Sets water temperature and grind for your own methods, and which recipes count as a fit for your bag.</p>
            <div className="radio-cards roast" id="suRoast">
              {ROASTS.map((r) => (
                <label className="rc" key={r.id}>
                  <input type="radio" name="suRoast" value={r.id} checked={draft.roast === r.id}
                    onChange={() => setDraft((d) => ({ ...d, roast: r.id }))} />
                  <span className="rc-b">
                    <span className="emoji" aria-hidden="true">{r.emoji}</span>
                    <span><b>{r.label} · {r.temp} °C</b><small>{r.note}</small></span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="fs">
            <legend>What does your bean taste like?</legend>
            <p className="help">Pick the family closest to the tasting notes on the bag. Recipes tagged for it rank first.</p>
            <div className="radio-cards fl" id="suFlavour">
              {FLAVOUR_OPTS.map((f) => (
                <label className="rc" key={f.id || "none"}>
                  <input type="radio" name="suFlavour" value={f.id} checked={draft.flavour === f.id}
                    onChange={() => setDraft((d) => ({ ...d, flavour: f.id }))} />
                  <span className="rc-b">
                    <span className="emoji" aria-hidden="true">{f.emoji}</span>
                    <span><b>{f.label}</b><small>{f.notes}</small></span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="sheet-f">
          <button type="button" className="btn ghost" id="suCancel" onClick={closeSetup}>{dialog.firstRun ? "Skip for now" : "Cancel"}</button>
          <button type="submit" className="btn primary" id="suSave">Save setup</button>
        </div>
      </form>
    </dialog>
  );
}
