/* Generated from the original Brew Card page. Edit freely — this is now the source of truth. */
import type { RawHouse } from '../types';

export const HOUSE: RawHouse[] = [
  {
    id:"my-clean", emoji:"🍵", name:"Clean & Clear",
    tagline:"Hoffmann method · roast-adapted",
    notes:"High ratio, long steep, no stirring. Light body, maximum clarity — the Hoffmann method with water set by your roast. Best on light and medium-light bags.",
    grindBase:13, dose:11, doseMin:9, doseMax:17, ratios:{water:18.2},
    bestFor:["light","medlight"], o:"standard", st:["black"],
    prep:"No rinse, no preheat — neither changes the cup. Load the chamber dry.",
    invNote:"Hoffmann seals the brewer with the plunger so nothing drips, so inverting changes very little here. It mainly adds the flip.",
    timed:true,
    segs:[
      {k:"pour",  lbl:"Pour all the water, then seal", det:"Wet everything, then push the plunger 1 cm in. The vacuum stops it dripping through.", dur:15},
      {k:"wait",  lbl:"Steep",                         det:"Hands off. This is the whole extraction.",                                            dur:105},
      {k:"swirl", lbl:"Swirl the brewer",              det:"Hold brewer and plunger together and swirl gently. Swirling, not stirring.",           dur:5},
      {k:"wait",  lbl:"Settle",                        det:"Let the bed drop before you press.",                                                   dur:25},
      {k:"press", lbl:"Press gently",                  det:"All the way down over 30 seconds. Stop at the hiss.",                                  dur:30}
    ],
    finish:"<b>☕ Done.</b> Lean and tea-like by design. If it tastes hollow rather than clean, add a gram of coffee before you touch the grind."
  },
  {
    id:"my-everyday", emoji:"☕", name:"Everyday Cup",
    tagline:"Fuller body · forgiving",
    notes:"Lower ratio, shorter steep, one stir. Fuller body and more forgiving than the clean method — the default for a normal morning.",
    grindBase:14, dose:15, doseMin:11, doseMax:20, ratios:{water:13.3},
    bestFor:["medlight","medium"], o:"standard", st:["black"],
    prep:"Rinse the paper filter, preheat chamber and mug, dump the water.",
    timed:true,
    segs:[
      {k:"pour",  lbl:"Pour all the water", det:"Steady stream for the full 15 seconds. Wet every ground.", dur:15},
      {k:"wait",  lbl:"Let it settle",      det:"Hands off. The bed degases and evens out.",                dur:15},
      {k:"stir",  lbl:"Stir three times",   det:"Gently, one direction. The step people skip.",             dur:5},
      {k:"wait",  lbl:"Steep",              det:"Leave it alone until the press.",                          dur:55},
      {k:"press", lbl:"Press",              det:"Slow and even. Stop the moment you hear the hiss.",        dur:30}
    ],
    finish:"<b>☕ Done.</b> Sour means one step finer; bitter means one step coarser. One change at a time."
  },
  {
    id:"my-bypass", emoji:"✨", name:"Bypass Brew",
    tagline:"Brew strong, dilute after",
    notes:"Brew small and strong, then dilute. Keeps the aromatics, leaves behind the heavy bitter compounds. Best on fruity and fermented lots.",
    grindBase:12, dose:18, doseMin:12, doseMax:22, ratios:{water:6.67, bypass:5},
    bestFor:["light","medlight","medium"], o:"standard", st:["black"],
    prep:"Rinse the filter and preheat. Keep the bypass water hot and aside — you add it at the end.",
    timed:true,
    segs:[
      {k:"pour",  lbl:"Pour the brew water", det:"All of it, then stir twice as you finish.", dur:12},
      {k:"wait",  lbl:"Steep",               det:"Hands off.",                                dur:63},
      {k:"press", lbl:"Press slowly",        det:"Steady pressure for the full 25 seconds.",  dur:25}
    ],
    finish:"<b>💦 Now the bypass.</b> Add about three quarters of the bypass water, taste, then add the rest if it wants it."
  },
  {
    id:"my-milk", emoji:"🥛", name:"Milk Cup",
    tagline:"Concentrate for milk",
    notes:"A thick concentrate meant to be cut with milk. Darker roasts shine here — the chocolate and caramel notes survive dilution.",
    grindBase:12, dose:18, doseMin:14, doseMax:22, ratios:{water:5, milk:8.33},
    bestFor:["medium","meddark","dark"], o:"standard", st:["milk","concentrate"],
    prep:"Rinse the filter and preheat. Get the milk heating before you start the timer.",
    timed:true,
    segs:[
      {k:"pour",  lbl:"Pour the water",     det:"Cooler than a black brew — roast-forward coffee turns bitter fast.", dur:10},
      {k:"wait",  lbl:"Steep",              det:"Hands off.",                      dur:50},
      {k:"press", lbl:"Press into the mug", det:"Firm and steady for 30 seconds.", dur:30}
    ],
    finish:"<b>🥛 Add the hot milk.</b> Pour it in last so it doesn't cool the concentrate."
  },
  {
    id:"my-espresso", emoji:"⚡", name:"Espresso-Style Concentrate",
    tagline:"Dense shot for milk",
    notes:"Not espresso — the AeroPress reaches well under 1 bar and makes no crema. It is a dense concentrate that works in milk.",
    grindBase:10, dose:20, doseMin:16, doseMax:22, ratios:{water:3, milk:6},
    bestFor:["medium","meddark","dark"], o:"standard", st:["concentrate","milk"],
    prep:"Don't grind finer than about {{c:9}} — the press chokes and the seal can blow past the grounds. If it fights you, go a step coarser.",
    timed:true,
    segs:[
      {k:"pour",  lbl:"Pour the water", det:"Low water, high dose. Stir once.",                    dur:8},
      {k:"wait",  lbl:"Steep",          det:"Hands off.",                                          dur:52},
      {k:"press", lbl:"Press firmly",   det:"A full 40 seconds. Lean into it but keep it steady.", dur:40}
    ],
    finish:"<b>🥛 Into hot milk.</b> You should have roughly 45 ml of concentrate."
  },
  {
    id:"my-moka", emoji:"🔥", name:"Moka Pot",
    tagline:"Cue-driven, no clock",
    notes:"Your ears and eyes run this one, so there is no clock — tap each step as you go. Around 1.5 bar, the closest thing to espresso you own.",
    grindBase:12, dose:0, ratios:{},
    bestFor:["medium","meddark","dark"], o:"moka", st:["milk"],
    specs:[["Water","hot","from kettle"],["Basket","level",""],["Heat","low",""],["Milk","2×","brew"]], statsNote:"stovetop · kettle-hot water",
    prep:"Fill the basket level and never tamp.",
    timed:false,
    segs:[
      {ic:"💧", lbl:"Fill the base with already-hot water", det:"To just under the valve. Less time on the heat means less scorched flavour."},
      {ic:"🔥", lbl:"Low flame, lid open",                  det:"Watch the spout rather than the clock."},
      {ic:"👁️", lbl:"Wait for the stream to turn pale", det:"Dark and syrupy first, then blond and gurgling."},
      {ic:"✋", lbl:"Pull it off at the first gurgle",            det:"Sit the base in cold water. The last of the extraction is the bitter part."},
      {ic:"🥛", lbl:"Pour into twice as much hot milk",     det:"Roughly 1 part brew to 2 parts milk."}
    ]
  },
  {
    id:"my-coldbrew", emoji:"🫙", name:"Cold Brew Concentrate",
    tagline:"Overnight in the fridge",
    notes:"Coarse coffee steeped in cold water for 12–18 hours, then filtered. Smooth, sweet and low in acidity, and it keeps for about a week — the base for quick iced drinks.",
    grindBase:25, dose:0, ratios:{},
    bestFor:["medium","meddark","dark"], o:"jar", st:["iced","black","concentrate"],
    specs:[["Coffee","60","g"],["Water","500","ml cold"],["Ratio","1:8",""],["Steep","12–18","hours"]], statsNote:"jar in the fridge · 12–18 h",
    prep:"You need a jar of 750 ml or more, a paper filter (the AeroPress works), and space in the fridge.",
    timed:false,
    segs:[
      {ic:"⚙️", lbl:"Grind 60 g coarse",                     det:"Like coarse sand — the grind shown above."},
      {ic:"🫙", lbl:"Stir into 500 ml cold, filtered water",  det:"Stir until every ground is wet, then cover the jar."},
      {ic:"🧊", lbl:"Fridge for 12–18 hours",                 det:"16 hours is a good middle. Longer gets woody; shorter tastes thin."},
      {ic:"🧻", lbl:"Filter it",                              det:"Pour through a paper filter. With the AeroPress, filter a few spoonfuls at a time and press gently."},
      {ic:"🥤", lbl:"Store and dilute",                       det:"Keeps about a week sealed in the fridge. Serve 1:1 with cold water or milk over ice."}
    ]
  },
  {
    id:"my-coke", emoji:"🥤", name:"Coffee & Coke Zero",
    tagline:"Iced · concentrate over cola",
    notes:"A small, strong concentrate chilled on ice, then floated on Coke Zero. Cola's caramel and vanilla turn a chocolaty bean into something like a mocha-cola.",
    grindBase:11, dose:20, doseMin:16, doseMax:22, ratios:{water:3, mixer:9}, mixerName:"Coke Zero",
    bestFor:["medium","meddark","dark"], o:"standard", st:["iced","mixer","concentrate"],
    prep:"Put 2–3 ice cubes in a small cup to press onto. Fill a tall glass with ice and pour the Coke Zero in slowly, down the side.",
    timed:true,
    segs:[
      {k:"pour",  lbl:"Pour the water",          det:"Low water, high dose. Stir once.",                         dur:8},
      {k:"wait",  lbl:"Steep",                   det:"Hands off.",                                               dur:52},
      {k:"press", lbl:"Press onto the ice cubes", det:"A steady 30 seconds into the small cup of ice. Stir it cold.", dur:30}
    ],
    finish:"<b>🥤 Build the drink.</b> Once the coffee is cold, pour it slowly over the back of a spoon onto the Coke Zero. Stir once before drinking. A strip of orange or lime peel brightens it."
  }
];
