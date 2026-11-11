"use client";
import { useEffect, useRef, useState } from "react";
import { GRINDERS } from "@/lib/data/grinders";
import { FGROUPS } from "@/lib/discover";
import { useSetup } from "./providers";
import { Discover } from "./Discover";
import { Icon } from "./Icon";

/** The most common brewers in India first. */
const ORDER = ["instant", "southindian", "frenchpress", "v60", "moka", "aeropress", "coldbrew"];
const OPTS = ORDER.map((id) => FGROUPS.find((g) => g.id === "brewer")!.opts.find((o) => o.id === id)!);
const BRANDS = Array.from(new Set(GRINDERS.map((g) => g.brand)));

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
      <h1 id="wH" tabIndex={-1} ref={headRef}>Better coffee from what you already have</h1>
      <p className="w-lead">Pick how you make it. We&apos;ll give you the recipe and time every step. Free, no sign-up.</p>
      <h2 className="w-q" id="wQ">What do you make coffee with?</h2>
      <p className="w-help">Pick everything you have.</p>
      <div className="w-opts" role="group" aria-labelledby="wQ">
        {OPTS.map((o) => (
          <button type="button" key={o.id} className="w-opt" data-brewer={o.id} aria-pressed={picked.includes(o.id)} onClick={() => toggle(o.id)}>
            <Icon name={o.icon} />{o.label}
          </button>
        ))}
      </div>
      <div className="w-acts">
        <button type="button" className="btn primary" id="wNext" disabled={!picked.length} onClick={next}>Show my recipes</button>
        <button type="button" className="linkbtn" id="wBrowse" onClick={() => finishWelcome({ brewers: [], form: "ground" })}>Just browsing</button>
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
