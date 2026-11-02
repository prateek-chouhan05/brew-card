/* Generated from the original Brew Card page. Edit freely — this is now the source of truth. */
import type { RawHouse } from '../types';

export const HOUSE: RawHouse[] = [
  {
    id:"my-clean", icon:"aeropress", name:"Clean & Clear",
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
    finish:"<b>Done.</b> Lean and tea-like by design. If it tastes hollow rather than clean, add a gram of coffee before you touch the grind."
  },
  {
    id:"my-everyday", icon:"cup", name:"Everyday Cup",
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
    finish:"<b>Done.</b> Sour means one step finer; bitter means one step coarser. One change at a time."
  },
  {
    id:"my-bypass", icon:"pour", name:"Bypass Brew",
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
    finish:"<b>Now the bypass.</b> Add about three quarters of the bypass water, taste, then add the rest if it wants it."
  },
  {
    id:"my-milk", icon:"milk", name:"Milk Cup",
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
    finish:"<b>Add the hot milk.</b> Pour it in last so it doesn't cool the concentrate."
  },
  {
    id:"my-espresso", icon:"concentrate", name:"Espresso-Style Concentrate",
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
    finish:"<b>Into hot milk.</b> You should have roughly 45 ml of concentrate."
  },
  {
    id:"my-moka", icon:"moka", name:"Moka Pot",
    tagline:"Cue-driven, no clock",
    notes:"Your ears and eyes run this one, so there is no clock — tap each step as you go. Around 1.5 bar, the closest thing to espresso you own.",
    grindBase:12, dose:0, ratios:{},
    bestFor:["medium","meddark","dark"], o:"moka", st:["milk"],
    specs:[["Water","hot","from kettle"],["Basket","level",""],["Heat","low",""],["Milk","2×","brew"]], statsNote:"stovetop · kettle-hot water",
    prep:"Fill the basket level and never tamp.",
    timed:false,
    segs:[
      {ic:"pour", lbl:"Fill the base with already-hot water", det:"To just under the valve. Less time on the heat means less scorched flavour."},
      {ic:"stovetop", lbl:"Low flame, lid open",                  det:"Watch the spout rather than the clock."},
      {ic:"wait", lbl:"Wait for the stream to turn pale", det:"Dark and syrupy first, then blond and gurgling."},
      {ic:"check", lbl:"Pull it off at the first gurgle",            det:"Sit the base in cold water. The last of the extraction is the bitter part."},
      {ic:"milk", lbl:"Pour into twice as much hot milk",     det:"Roughly 1 part brew to 2 parts milk."}
    ]
  },
  {
    id:"my-coldbrew", icon:"jar", name:"Cold Brew Concentrate",
    tagline:"Overnight in the fridge",
    notes:"Coarse coffee steeped in cold water for 12–18 hours, then filtered. Smooth, sweet and low in acidity, and it keeps for about a week — the base for quick iced drinks.",
    grindBase:25, dose:0, ratios:{},
    bestFor:["medium","meddark","dark"], o:"jar", st:["iced","black","concentrate"],
    specs:[["Coffee","60","g"],["Water","500","ml cold"],["Ratio","1:8",""],["Steep","12–18","hours"]], statsNote:"jar in the fridge · 12–18 h",
    prep:"You need a jar of 750 ml or more, a paper filter (the AeroPress works), and space in the fridge.",
    timed:false,
    segs:[
      {ic:"grind", lbl:"Grind 60 g coarse",                     det:"Like coarse sand — the grind shown above."},
      {ic:"jar", lbl:"Stir into 500 ml cold, filtered water",  det:"Stir until every ground is wet, then cover the jar."},
      {ic:"iced", lbl:"Fridge for 12–18 hours",                 det:"16 hours is a good middle. Longer gets woody; shorter tastes thin."},
      {ic:"filter", lbl:"Filter it",                              det:"Pour through a paper filter. With the AeroPress, filter a few spoonfuls at a time and press gently."},
      {ic:"pour", lbl:"Store and dilute",                       det:"Keeps about a week sealed in the fridge. Serve 1:1 with cold water or milk over ice."}
    ]
  },
  {
    id:"my-frenchpress", icon:"frenchpress", name:"French Press",
    tagline:"James Hoffmann's no-sludge method",
    notes:"James Hoffmann's technique: a long steep, break the crust, skim the foam, then leave it to settle for five minutes. Patience instead of pressure, so you get the press's full body without the mud. Pour 500 g into a 1-litre press; halve the dose for a small one.",
    grindBase:20, dose:30, doseMin:15, doseMax:40, ratios:{water:16.67},
    bestFor:["medlight","medium","meddark","dark"], o:"press", st:["black"],
    prep:"Grind a touch finer than a classic press grind — the long settle keeps it clean. Preheat the press with hot water, tip it out, put the press on the scale and zero it. Have two spoons ready.",
    timed:true,
    segs:[
      {k:"pour",  lbl:"Pour all the water",                det:"Quickly, straight onto the grounds. Make sure everything is wet.", dur:10, to:1},
      {k:"wait",  lbl:"Steep",                             det:"Lid off, hands off. A crust of grounds forms on top.",             dur:230},
      {k:"stir",  lbl:"Break the crust",                   det:"Stir just the top with a spoon. Most of the grounds drop.",       dur:15, short:"Break"},
      {k:"stir",  lbl:"Skim off the foam",                 det:"Scoop the foam and floating bits away with two spoons. This is what makes it clean.", dur:30, short:"Skim"},
      {k:"wait",  lbl:"Let it settle",                     det:"Five minutes, up to eight. The fine grounds sink — the longer, the cleaner.",         dur:300, short:"Settle"},
      {k:"press", lbl:"Plunger to the surface, then pour", det:"Lower the plunger only until it touches the coffee — don't push it down. Pour slowly; the mesh just strains.", dur:20, short:"Pour"}
    ],
    finish:"<b>Done.</b> Leave the last few millimetres in the press — that's the silt. Bitter means one step coarser; thin means one step finer."
  },
  {
    id:"my-v60", icon:"v60", name:"V60 One Cup",
    tagline:"James Hoffmann's five-pour V60",
    notes:"James Hoffmann's “better one-cup” V60: a bloom, then four equal pours ten seconds apart, so a small dose still brews evenly. Clean and bright — the clearest cup on this card. Pour to the gram targets on your scale.",
    grindBase:15, dose:15, doseMin:12, doseMax:20, ratios:{water:16.67},
    bestFor:["light","medlight","medium"], o:"pourover", st:["black"],
    prep:"Rinse the paper filter with hot water and tip the rinse out of the server. Add the coffee, give it a shake to level it, and press a small dip in the middle. V60 and server on the scale, zeroed.",
    timed:true,
    segs:[
      {k:"pour",  lbl:"Bloom: pour to {{w:0.2}} g", det:"Just enough to wet all the grounds.",                         dur:10, to:0.2},
      {k:"swirl", lbl:"Swirl",                      det:"A gentle swirl so no dry clumps are left.",                   dur:5},
      {k:"wait",  lbl:"Let it bloom",               det:"The bed puffs up as the gas escapes.",                        dur:30, short:"Bloom"},
      {k:"pour",  lbl:"Pour to {{w:0.4}} g",        det:"Slow circles in the middle; keep off the paper.",             dur:15, to:0.4},
      {k:"wait",  lbl:"Pause",                      det:"Let it drop a little.",                                       dur:10, short:"Pause"},
      {k:"pour",  lbl:"Pour to {{w:0.6}} g",        det:"Same gentle circles.",                                        dur:10, to:0.6},
      {k:"wait",  lbl:"Pause",                      det:"Let it drop a little.",                                       dur:10, short:"Pause"},
      {k:"pour",  lbl:"Pour to {{w:0.8}} g",        det:"Same gentle circles.",                                        dur:10, to:0.8},
      {k:"wait",  lbl:"Pause",                      det:"Let it drop a little.",                                       dur:10, short:"Pause"},
      {k:"pour",  lbl:"Pour to {{w:1}} g",          det:"The last pour.",                                              dur:10, to:1},
      {k:"swirl", lbl:"Swirl once",                 det:"Gently, so the bed settles flat and drains evenly.",          dur:5},
      {k:"wait",  lbl:"Drawdown",                   det:"Let it drain through. It should finish around 3:00.",         dur:55, short:"Drain"}
    ],
    finish:"<b>Done.</b> Drained well before 3:00 and tastes sour or thin? One step finer. Still dripping after 3:30 and tastes bitter? One step coarser."
  },
  {
    id:"my-46", icon:"v60", name:"4:6 Method",
    tagline:"Tetsu Kasuya's five equal pours",
    notes:"World Brewers Cup champion Tetsu Kasuya's method, as Hario publishes it. The first 40% of the water sets the taste — a smaller first pour is sweeter, a bigger one brighter — and the last 60% sets the strength. Coarse grind, no stirring, very hard to get wrong.",
    grindBase:19, dose:20, doseMin:15, doseMax:25, ratios:{water:15},
    bestFor:["light","medlight","medium"], o:"pourover", st:["black"],
    prep:"Rinse the paper filter with hot water and tip the rinse out of the server. Add the coffee and level it. V60 and server on the scale, zeroed.",
    timed:true,
    segs:[
      {k:"pour", lbl:"Pour to {{w:0.1667}} g", det:"The first 40% sets the taste. This smaller first pour leans sweet.",  dur:10, to:0.1667},
      {k:"wait", lbl:"Let it drain",           det:"Hands off.",                                                       dur:35, short:"Drain"},
      {k:"pour", lbl:"Pour to {{w:0.4}} g",    det:"The second pour finishes the 40%.",                                dur:10, to:0.4},
      {k:"wait", lbl:"Let it drain",           det:"Hands off.",                                                       dur:35, short:"Drain"},
      {k:"pour", lbl:"Pour to {{w:0.6}} g",    det:"The last 60% sets the strength: three pours of {{w:0.2}} g.",      dur:10, to:0.6},
      {k:"wait", lbl:"Let it drain",           det:"Hands off.",                                                       dur:30, short:"Drain"},
      {k:"pour", lbl:"Pour to {{w:0.8}} g",    det:"Fourth pour.",                                                     dur:10, to:0.8},
      {k:"wait", lbl:"Let it drain",           det:"Hands off.",                                                       dur:20, short:"Drain"},
      {k:"pour", lbl:"Pour to {{w:1}} g",      det:"Last pour.",                                                       dur:10, to:1},
      {k:"wait", lbl:"Drawdown",               det:"Lift the V60 off at 3:30, even if a little water is left.",        dur:40, short:"Drain"}
    ],
    finish:"<b>Done.</b> Want it sweeter? Make the first pour smaller and the second bigger. Stronger? Split the last 60% into four pours; lighter, into two."
  },
  {
    id:"my-coke", icon:"soda", name:"Coffee & Coke Zero",
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
    finish:"<b>Build the drink.</b> Once the coffee is cold, pour it slowly over the back of a spoon onto the Coke Zero. Stir once before drinking. A strip of orange or lime peel brightens it."
  }
];
