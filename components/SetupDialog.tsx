"use client";
import { useEffect, useRef, useState } from "react";
import { GRINDERS } from "@/lib/data/grinders";
import { ROASTS } from "@/lib/data/roasts";
import { FLAVOURS } from "@/lib/data/flavours";
import { DEFAULT_ENTRY_ID, FL, grinderById, houseById, roastById } from "@/lib/catalog";
import { hGrind } from "@/lib/brew";
import { numG, toGrinder, unitG } from "@/lib/grind";
import { beanStatus, type Bean } from "@/lib/journal";
import type { FlavourId, RoastId } from "@/lib/types";
import { useSetup, type SetupDraft } from "./providers";
import { useModal } from "./useModal";
import { ROAST_SWATCH } from "@/lib/icons";
import { Icon, TasteMark } from "./Icon";
import { BagFlow } from "./BagFlow";
import { toast } from "./Toast";

const BRANDS = Array.from(new Set(GRINDERS.map((g) => g.brand)));

const ROAST_SHORT: Record<RoastId, string> = { light: "Light", medlight: "Med-light", medium: "Medium", meddark: "Med-dark", dark: "Dark" };


/** Grinder, roast, taste and your bean bags. Changes apply only on Save; Cancel, ×, Esc and the backdrop discard them. */
export function SetupDialog() {
  const { grinder, roast, flavour, beans, activeBean, dialog, apply, closeSetup } = useSetup();
  const [draft, setDraft] = useState<SetupDraft>({ grinder: grinder.id, roast: roast.id, flavour, beans, activeBean: activeBean?.id ?? "" });
  const [bagFlow, setBagFlow] = useState<{ edit: Bean | null } | null>(null);
  const ref = useModal(dialog.open, closeSetup);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!dialog.open) return;
    setDraft({ grinder: grinder.id, roast: roast.id, flavour, beans, activeBean: activeBean?.id ?? "" });
    setBagFlow(null);
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
  const removeBag = (id: string) => setDraft((d) => ({ ...d, beans: d.beans.filter((b) => b.id !== id), activeBean: d.activeBean === id ? "" : d.activeBean }));
  /** a bag from the add/edit flow: saved, made active, applied at once (with Undo) */
  const saveBag = (bag: Bean) => {
    const before: SetupDraft = { grinder: grinder.id, roast: roast.id, flavour, beans, activeBean: activeBean?.id ?? "" };
    const isNew = !draft.beans.some((x) => x.id === bag.id);
    const next: SetupDraft = {
      ...draft, roast: bag.roast, flavour: bag.flavour, activeBean: bag.id,
      beans: isNew ? [...draft.beans, bag] : draft.beans.map((x) => (x.id === bag.id ? bag : x)),
    };
    apply(next);
    closeSetup();
    toast(isNew ? "Bag saved. Recipes are ranked for it now." : "Bag updated.", { label: "Undo", run: () => apply(before) });
  };

  return (
    <dialog className="sheetdlg su" id="setupDlg" aria-labelledby="suH" ref={ref}>
      <form className="sheet" id="setupForm" noValidate onSubmit={(e) => {
        e.preventDefault();
        const by = (e.nativeEvent as SubmitEvent).submitter;
        if (bagFlow || by?.id !== "suSave") return; // Enter inside a field never saves the whole setup
        apply(draft);
        closeSetup();
      }}>
        {bagFlow ? (
          <BagFlow key={bagFlow.edit?.id ?? "new"} grinder={g} edit={bagFlow.edit} onSave={saveBag} onExit={() => setBagFlow(null)} />
        ) : (<>
        <div className="sheet-h">
          <h2 id="suH" tabIndex={-1} ref={titleRef}>Your coffee setup</h2>
          <button type="button" className="x" aria-label="Close without saving" onClick={closeSetup}>
            <Icon name="close" />
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
                    {x.id ? <TasteMark id={x.id} /> : <span className="dot none" aria-hidden="true" />}
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
                        <button type="button" className="mini" aria-label={`Edit ${b.name}`} onClick={() => setBagFlow({ edit: b })}>Edit</button>
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
            <button type="button" className="panel-act add-bag" onClick={() => setBagFlow({ edit: null })}>+ Add a bag</button>
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
        </>)}
      </form>
    </dialog>
  );
}
