"use client";
import { useEffect, useRef, useState } from "react";
import { GRINDERS } from "@/lib/data/grinders";
import { ROASTS } from "@/lib/data/roasts";
import { FLAVOURS } from "@/lib/data/flavours";
import { grinderById } from "@/lib/catalog";
import { useSetup } from "./providers";
import { useModal } from "./useModal";

const BRANDS = Array.from(new Set(GRINDERS.map((g) => g.brand)));
const FLAVOUR_OPTS = [{ id: "", emoji: "⚪", label: "No preference", notes: "Rank by roast only" }, ...FLAVOURS];

/** Grinder, roast and bean flavour. Changes apply only on Save; Cancel, ×, Esc and the backdrop discard them. */
export function SetupDialog() {
  const { grinder, roast, flavour, dialog, apply, closeSetup } = useSetup();
  const [draft, setDraft] = useState({ grinder: grinder.id, roast: roast.id as string, flavour: flavour as string });
  const ref = useModal(dialog.open, closeSetup);
  const bodyRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!dialog.open) return;
    setDraft({ grinder: grinder.id, roast: roast.id, flavour });
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    try { selRef.current?.focus({ preventScroll: true }); } catch {}
    // the draft resets only when the dialog opens
  }, [dialog.open]);

  const g = grinderById(draft.grinder) ?? GRINDERS[0];
  const grHelp = (g.unit === "clicks"
    ? "Settings are shown in clicks counted out from zero, the finest point where the burrs just touch."
    : "Settings are shown as the numbers printed on the dial.") + " Changing grinder only changes grind numbers — never which recipes are shown.";

  return (
    <dialog className="sheetdlg" id="setupDlg" aria-labelledby="suH" ref={ref}>
      <form className="sheet" id="setupForm" noValidate onSubmit={(e) => { e.preventDefault(); apply(draft); closeSetup(); }}>
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
