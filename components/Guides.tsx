"use client";
import { ALL } from "@/lib/catalog";
import { FLAVOURS } from "@/lib/data/flavours";
import { METHODS } from "@/lib/data/grinders";
import { OFFBOIL, ROASTS } from "@/lib/data/roasts";
import { numG, roundG, stepWord, toGrinder } from "@/lib/grind";
import { useSetup } from "./providers";
import { InvArt, StdArt } from "./Art";

const TOC = [
  ["g-flavour", "😋 Bean flavours"],
  ["g-roast", "🌡️ Roast & temperature"],
  ["g-grinder", "⚙️ Your grinder"],
  ["g-orient", "🔄 On the mug or inverted"],
  ["g-milk", "🥛 Milk & foam"],
  ["g-fix", "🔧 If the cup is off"],
] as const;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Guides() {
  const { grinder, roast, flavour, openSetup } = useSetup();

  const jump = (id: string) => {
    const s = document.getElementById(id);
    if (!s) return;
    s.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    const h = s.querySelector("h2");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  };

  return (
    <section className="view" id="view-guides" aria-labelledby="gdH">
      <div className="view-h">
        <h1 id="gdH" tabIndex={-1}>Guides</h1>
        <p>Reference for your beans, roast, grinder and technique. The highlighted rows follow your coffee setup.</p>
      </div>
      <div className="guides">
        <nav className="toc" id="toc" aria-label="Guide sections">
          <span className="toc-label">On this page</span>
          {TOC.map(([id, label]) => <button type="button" key={id} data-sec={id} onClick={() => jump(id)}>{label}</button>)}
        </nav>
        <div className="guide-col">
          <section className="panel" id="g-flavour">
            <h2><span className="emoji">😋</span><span>Bean flavour guide</span></h2>
            <p className="lede">Read the tasting notes on your bag and pick the closest family in your coffee setup. Every recipe is tagged with the families it brings out best, with the reason. The tags are my judgement from each recipe&apos;s temperature, ratio and agitation, and the beans its author used.</p>
            <button type="button" className="panel-act" onClick={() => openSetup(false)}>Set your bean flavour</button>
            <div className="fl-guide" id="flTable">
              {FLAVOURS.map((f) => {
                const n = ALL.filter((e) => (e.fl || []).includes(f.id)).length;
                const mine = f.id === flavour;
                return (
                  <div className={"fl-item" + (mine ? " hl" : "")} key={f.id}>
                    <h3><span className="emoji">{f.emoji}</span><span>{f.label}</span>{mine && <span className="you">Your bean</span>}<span className="count">{n} recipes</span></h3>
                    <p><span className="k">Bag says</span>{f.notes}</p>
                    <p><span className="k">Typical beans</span>{f.beans}</p>
                    <p><span className="k">Suits</span>{f.brew}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel" id="g-roast">
            <h2><span className="emoji">🌡️</span><span>Roast dictates temperature</span></h2>
            <p className="lede">Darker roasts are more soluble and give up bitterness faster, so they want cooler water. Your own methods follow this automatically; library recipes keep the brewer&apos;s original temperature and show a nudge when your roast is far from theirs.</p>
            <div className="scroll">
              <table>
                <thead><tr><th>Roast</th><th>Water</th><th>Off the boil</th><th>Grind shift</th></tr></thead>
                <tbody id="roastTable">
                  {ROASTS.map((r) => {
                    const d = roundG(toGrinder(13 + r.adj, grinder), grinder) - roundG(toGrinder(13, grinder), grinder);
                    let shift: string;
                    if (r.adj === 0) shift = "—";
                    else if (Math.abs(d) < 1e-6) shift = r.adj > 0 ? "a touch coarser" : "a touch finer";
                    else shift = numG(Math.abs(d), grinder.unit === "ode" ? grinder : { ...grinder, unit: "clicks" }) + " " + stepWord(d, grinder) + (d > 0 ? " coarser" : " finer");
                    return (
                      <tr key={r.id} className={r.id === roast.id ? "hl" : undefined}>
                        <td>{r.emoji} {r.label}{r.id === roast.id && <> <span className="you">Yours</span></>}</td>
                        <td className="num">{r.temp} °C</td>
                        <td>{OFFBOIL[r.temp] || ""}</td>
                        <td className="num">{shift}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="lede">Timings assume a kettle in a normal room, lid off. Calibrate once if you ever get a thermometer.</p>
            <button type="button" className="panel-act" onClick={() => openSetup(false)}>Change roast</button>
          </section>

          <section className="panel" id="g-grinder">
            <h2><span className="emoji">⚙️</span><span id="refTitle">{grinder.name} reference</span></h2>
            <p className="lede">{grinder.unit === "clicks" ? "Settings in clicks counted out from zero, the finest point where the burrs just touch." : "Settings are the numbers printed on the dial."}</p>
            <div className="aside" id="zeroAside">
              {grinder.unit === "clicks" ? (
                <><b>🎯 Find your zero before trusting any number.</b> Turn the dial until the burrs just touch, then count clicks out from there. Every grinder sits slightly differently. {grinder.floor ? `Don't grind finer than about ${grinder.floor} clicks with the burrs turning — it dulls them.` : ""}</>
              ) : (
                <><b>🎯 Use the numbers on the dial.</b> No counting needed. Treat every setting here as a starting point and move one step at a time.</>
              )}
            </div>
            <p className="lede">Starting settings for every brew method on your grinder. The two rows you&apos;ll use most are highlighted.</p>
            <div className="scroll">
              <table>
                <thead><tr><th>Method</th><th>Start</th><th>Range</th></tr></thead>
                <tbody id="grTable">
                  {METHODS.map((m, i) => (
                    <tr key={m} className={i === 1 || i === 2 ? "hl" : undefined}>
                      <td>{m}</td>
                      <td className="num">{numG(grinder.a[i], grinder)}</td>
                      <td className="num">{numG(grinder.r[i][0], grinder)}–{numG(grinder.r[i][1], grinder)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="lede">Your methods&apos; grind settings are converted between grinders by matching brew methods on brewmark.io&apos;s shared grind scale. Treat every number as a starting point and expect to move a step or two.</p>
            <button type="button" className="panel-act" onClick={() => openSetup(false)}>Change grinder</button>
          </section>

          <section className="panel" id="g-orient">
            <h2><span className="emoji">🔄</span><span>On the mug or inverted?</span></h2>
            <p className="lede">Every recipe says which one it uses, at the top of the recipe and on its search result. This is what each means.</p>
            <div className="orient-grid">
              <div className="orient-card">
                <span className="orient-art" aria-hidden="true"><StdArt /></span>
                <div>
                  <h3>☕ Directly on the mug</h3>
                  <p>Also called standard. Filter cap on, brewer sitting on your mug from the start, press at the end. Simplest, and nothing to spill.</p>
                  <p>A little coffee drips through during the steep. Some recipes stop that by pushing the plunger in a centimetre right after pouring.</p>
                  <p className="when">Used by Hoffmann, Wendelboe, Alan Adler, and most roasters&apos; house recipes.</p>
                </div>
              </div>
              <div className="orient-card inv">
                <span className="orient-art" aria-hidden="true"><InvArt /></span>
                <div>
                  <h3>🔄 Inverted</h3>
                  <p>The brewer stands upside-down on its plunger, so nothing drips out and every drop steeps the full time. You flip it onto the mug just before pressing.</p>
                  <p>The timer warns you 10 seconds before the flip, and shows the flip time on the recipe.</p>
                  <p className="when">Used by most championship winners, Blue Bottle, and Lance Hedrick&apos;s concentrates.</p>
                </div>
              </div>
            </div>
            <p className="lede">⚠️ Inverted means hot water sitting on a rubber seal. Use a flat, stable surface, leave a finger&apos;s width at the top, and flip away from yourself.</p>
          </section>

          <section className="panel" id="g-milk">
            <h2><span className="emoji">🥛</span><span>Milk &amp; foam without a machine</span></h2>
            <p className="lede">Heat milk to 60–65 °C: steaming and too hot to sip, never boiling. Hotter than that and it loses its sweetness and won&apos;t foam.</p>
            <div className="milk-list">
              <div><b>Silky milk</b> — latte, café au lait. Froth briefly (10–15 French press pumps) for a thin layer of foam.</div>
              <div><b>Velvety microfoam</b> — flat white, cortado. Just 8–10 pumps, then swirl the jug until the milk looks glossy like wet paint.</div>
              <div><b>Thick foam</b> — cappuccino, macchiato. 20–30 pumps until the milk roughly doubles, rest 30 s, tap to pop big bubbles.</div>
              <div><b>Cold foam</b> — freddo cappuccino, sweet cream. Froth cold milk straight from the fridge; low-fat milk foams best cold.</div>
              <div><b>Tools</b> — a French press (pump the plunger), a handheld frother, or a jar: shake cold milk hard for 30 s, then microwave it with the lid off for 30 s.</div>
            </div>
          </section>

          <section className="panel" id="g-fix">
            <h2><span className="emoji">🔧</span><span>If the cup is off</span></h2>
            <p className="lede">Change one thing, brew again, taste. Two changes at once and you learn nothing.</p>
            <div className="scroll">
              <table>
                <thead><tr><th>It tastes</th><th>That means</th><th>Do this</th></tr></thead>
                <tbody>
                  <tr><td>😬 Sour, thin, empty finish</td><td>Under-extracted</td><td className="fix">1 step finer, or +2 °C, or +15 s steep</td></tr>
                  <tr><td>😖 Bitter, drying, harsh</td><td>Over-extracted</td><td className="fix">1 step coarser, or −2 °C, press slower</td></tr>
                  <tr><td>💧 Weak but not sour</td><td>Ratio, not extraction</td><td className="fix">+1 g coffee, keep the rest</td></tr>
                  <tr><td>🔚 Harsh only at the end</td><td>Pressed past the hiss</td><td className="fix">Stop at the hiss next time</td></tr>
                  <tr><td>😐 Muted, closed, slightly gassy</td><td>Too fresh</td><td className="fix">Wait — check the roast date</td></tr>
                  <tr><td>📄 Flat and papery</td><td>Stale</td><td className="fix">Nothing fixes this; new bag</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
