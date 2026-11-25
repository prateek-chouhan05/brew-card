"use client";
import { useEffect, useRef, useState } from "react";
import { GRINDERS } from "@/lib/data/grinders";
import { FGROUPS } from "@/lib/discover";
import { entryById } from "@/lib/catalog";
import type { Entry } from "@/lib/types";
import { useSetup } from "./providers";
import { Discover } from "./Discover";
import { Icon } from "./Icon";
import { RecipeArt } from "./DrinkArt";

/** The most common brewers in India first. */
const ORDER = ["instant", "southindian", "frenchpress", "v60", "moka", "aeropress", "coldbrew"];
const OPTS = ORDER.map((id) => FGROUPS.find((g) => g.id === "brewer")!.opts.find((o) => o.id === id)!);
const BRANDS = Array.from(new Set(GRINDERS.map((g) => g.brand)));
/** Any library recipe brewed on the mug: its drawing is the plain AeroPress (Everyday Cup's own picture is the mug it ends in). */
const AEROPRESS = "wac-2014-1st";
/** Each brewer is drawn with the house recipe (or drink) that uses it. */
const ART: Record<string, string> = {
  instant: "instant-coffee", southindian: "my-kaapi", frenchpress: "my-frenchpress", v60: "my-v60",
  moka: "my-moka", aeropress: AEROPRESS, coldbrew: "my-coldbrew",
};
const EXAMPLE = entryById(AEROPRESS) as Entry;
/** The example card: Everyday Cup on an AeroPress, Timemore C3S, medium roast, 1:05 into the brew. */
const EX_STEPS: [string, string, "done" | "on" | ""][] = [
  ["0:00", "Pour all the water", "done"], ["0:15", "Let it settle", "done"], ["0:30", "Stir three times", "done"],
  ["0:35", "Steep", "on"], ["1:30", "Press, stop at the hiss", ""],
];

/** Recipes, or the welcome on a first visit with nothing saved. */
export function RecipesHome() {
  const { welcome } = useSetup();
  return welcome ? <Welcome /> : <Discover />;
}

function Welcome() {
  const { finishWelcome } = useSetup();
  const [step, setStep] = useState<"brewers" | "coffee">("brewers");
  const [picked, setPicked] = useState<string[]>([]);
  const [form, setForm] = useState<"ground" | "beans" | "">("");
  const [grinder, setGrinder] = useState(GRINDERS[0].id);
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headRef.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [step]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const next = () => {
    // instant needs no grind, so there's nothing more to ask
    if (picked.every((b) => b === "instant")) finishWelcome({ brewers: picked, form: "ground" });
    else setStep("coffee");
  };
  const done = () => {
    const own = form === "beans" && grinder !== "other";
    finishWelcome({ brewers: picked, form: own ? "beans" : "ground", grinder: own ? grinder : undefined });
  };

  if (step === "brewers") return (
    <section className="view welcome" aria-labelledby="wH">
      <div className="w-head">
        <h1 id="wH" tabIndex={-1} ref={headRef}>Better coffee from the brewer you already own</h1>
        <p className="w-lead">Tell it what you brew with. You get a recipe matched to your beans, the grind setting for your grinder and a timer for every step. Free, no sign-up.</p>
      </div>
      <aside className="w-card" aria-label="Example brew card">
        <div className="ex">
          <div className="ex-h">
            <div><h3>Everyday Cup</h3><p>Example for an AeroPress, a Timemore C3S and a medium roast</p></div>
            <span className="ex-art">{EXAMPLE && <RecipeArt entry={EXAMPLE} level="scene" />}</span>
          </div>
          <dl className="ex-specs">
            <div><dt>Coffee</dt><dd>15<small>g</small></dd></div>
            <div><dt>Water</dt><dd>200<small>g</small></dd></div>
            <div><dt>Grind</dt><dd>14<small>clicks</small></dd></div>
            <div><dt>Water at</dt><dd>92<small>°C</small></dd></div>
          </dl>
          <div className="ex-timer"><span className="ex-now">Steep, hands off</span><span className="ex-clock">1:05 <span>/ 2:00</span></span></div>
          <div className="ex-bar" aria-hidden="true"><i /></div>
          <ol className="ex-steps">
            {EX_STEPS.map(([t, l, st]) => (
              <li key={t} className={st || undefined} aria-current={st === "on" ? "step" : undefined}><span className="t">{t}</span>{l}</li>
            ))}
          </ol>
        </div>
      </aside>
      <div className="w-pick">
        <div className="w-q"><h2 id="wQ">What do you make coffee with?</h2><p className="w-help">Pick everything you have</p></div>
        <div className="w-opts" role="group" aria-labelledby="wQ">
          {OPTS.map((o) => {
            const e = entryById(ART[o.id]);
            return (
              <button type="button" key={o.id} className="w-opt" data-brewer={o.id} aria-pressed={picked.includes(o.id)} onClick={() => toggle(o.id)}>
                <span className="w-art">{e ? <RecipeArt entry={e} /> : <Icon name={o.icon} />}</span>
                <span className="w-name">{o.label}</span>
                <span className="w-box" aria-hidden="true"><Icon name="check" /></span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="w-acts">
        <button type="button" className="btn primary" id="wNext" disabled={!picked.length} onClick={next}>
          Show my recipes{picked.length > 0 && <span className="w-count">{picked.length}</span>}
        </button>
        <button type="button" className="linkbtn" id="wBrowse" onClick={() => finishWelcome({ brewers: [], form: "ground" })}>Just browsing</button>
        <p className="w-status" aria-live="polite">
          {picked.length === 0 ? "Pick at least one brewer" : picked.length === 1 ? "1 brewer picked" : `${picked.length} brewers picked`}
        </p>
      </div>
    </section>
  );

  return (
    <section className="view welcome" aria-labelledby="wH">
      <h1 id="wH" tabIndex={-1} ref={headRef}>How do you get your coffee?</h1>
      <p className="w-lead">So we can tell you how fine to grind it, in a way that makes sense for you.</p>
      <div className="w-forms" role="radiogroup" aria-labelledby="wH">
        <button type="button" role="radio" className="w-form" id="wGround" aria-checked={form === "ground"} onClick={() => setForm("ground")}>
          <b>It&apos;s already ground</b>
          <span>From the shop, or ground for you. We&apos;ll say which grind to ask for, in words.</span>
        </button>
        <button type="button" role="radio" className="w-form" id="wBeans" aria-checked={form === "beans"} onClick={() => setForm("beans")}>
          <b>I grind whole beans</b>
          <span>Pick your grinder and we&apos;ll give the exact setting on it.</span>
        </button>
      </div>
      {form === "beans" && (
        <div className="w-grinder">
          <label htmlFor="wGrinder">Your grinder</label>
          <div className="select-wrap">
            <select id="wGrinder" value={grinder} onChange={(e) => setGrinder(e.target.value)}>
              {BRANDS.map((b) => (
                <optgroup key={b} label={b}>
                  {GRINDERS.filter((x) => x.brand === b).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </optgroup>
              ))}
              <option value="other">Something else</option>
            </select>
          </div>
          <p className="w-help">Not listed? Pick “Something else” and we&apos;ll describe the grind instead.</p>
        </div>
      )}
      <p className="w-help">You can change this any time under Setup.</p>
      <div className="w-acts">
        <button type="button" className="btn primary" id="wDone" disabled={!form} onClick={done}>Show my recipes</button>
        <button type="button" className="linkbtn" onClick={() => setStep("brewers")}><Icon name="back" />Back</button>
      </div>
    </section>
  );
}
