# Brew Card ☕

**Live: [brew-card.vercel.app](https://brew-card.vercel.app)**

A brew companion for the AeroPress and moka pot. Tell it your grinder, your beans and what they taste like. It picks recipes that suit that coffee, converts every grind setting to your grinder, and walks you through each brew with an animated, phase-by-phase timer.

## What it does

**Find a recipe**
- **105 recipes:** 8 house methods that adapt to your roast, 30 classic coffee drinks (affogato, Vietnamese iced coffee, filter kaapi, espresso tonic…), and 67 championship, barista and enthusiast AeroPress recipes you can brew with the timer, each credited to its author and source.
- **Search and filter:** search with synonyms ("citrus", "iced", "quick"), collections, and refine options for brewer, AeroPress orientation, hot/iced, drink type and strength.
- **Match my coffee:** ranks or filters recipes by your roast and bean flavour.
- **Illustrations:** every recipe has one — each drink in its own glass with its layers, plus your methods and the AeroPress.

**Brew it**
- **Chamber clock:** an AeroPress that follows the timer, with the big countdown beside it. It fills as you pour, stirs, darkens while it steeps, flips over (inverted recipes, standing on a scale until then) and presses coffee into a glass mug. The numbers 1–4 moulded on the chamber light up as each quarter of the brew passes.
- **Brew line:** above the timer, a chart of how much is in the brewer and in your mug over the whole brew, coloured by how long it has steeped, with a playhead for now.
- **Phase timer:** audio cues, a 10-second flip warning, the screen kept awake, and Space to start or pause. It keeps running while you browse other pages.
- **Hands-free mode:** full-screen, with the countdown drawn as **Count in coffee**: the numbers fill with water as you pour, darken as it steeps, slosh when you stir, turn over at the flip and drain as you press. Optional spoken cues ("Pour all the water. 15 seconds.").
- **Adjustable recipes:** a dose stepper, an on-the-mug or inverted switch for your methods, and drinks that send you to brew their base and then bring you back to finish.

**Get better cups**
- **Rate & dial in:** after a brew, say if it was sour, balanced or bitter, and weak, right or strong. You get one specific fix, such as "1 step finer". On your own methods, one tap applies it, and every brew is logged.
- **My beans:** save your bags with their roast date. The app shows when a bag has rested enough to brew ("Resting · ready in 3 days" / "Ready · day 12") and warns you if you brew it too early.
- **Favourites and recently brewed:** both sit at the top of Recipes.

**Reference:** Guides for bean flavours, roast & water temperature, your grinder's settings for every method (16 grinders), on-the-mug vs inverted, milk & foam, and troubleshooting.

**Works like an app:** you can install it to your home screen. It runs full-screen and keeps working offline for pages you've opened. Everything is stored in your browser, and there are no accounts.

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript.
- **Hosting:** a static export (`output: "export"`) on Vercel; every push to `main` deploys.
- **Pre-built pages:** one per recipe at `/recipes/<id>/`.
- **No image files:** the illustrations and the brew animation are hand-built SVG drawn in code. Animations respect *reduced motion*.
- **Offline:** a service worker (`public/sw.js`) and a web app manifest.
- **Fonts:** self-hosted from npm (Archivo, JetBrains Mono).
- **Tests:** Playwright end-to-end tests at 320, 375, 430, 1280 and 1440 px.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run build        # static site → out/
npm start            # serve out/ locally
npx playwright install chromium && npm test
```

## Project layout

```
app/
  page.tsx               Recipes: shelf → search → collections → refine → match my coffee → results
  recipes/[id]/page.tsx  one static page per recipe: console, animated timer, rating
  guides/page.tsx        reference guides
  brew/page.tsx          opens the brew in progress, or the last recipe you opened
components/
  providers.tsx          setup, beans, discovery filters, favourites, brew log (context + local storage)
  AppShell.tsx           top nav / phone tab bar, setup chip, live timer badge
  SetupDialog.tsx        grinder, saved bean bags, roast and flavour
  Discover.tsx           the recipe finder and your shelf
  BrewConsole.tsx        specs, dose, orientation, steps and the timer panel
  BrewCanvas.tsx         canvas drawings that follow the timer: Chamber clock, Brew line, Count in coffee
  BrewExtras.tsx         rate & dial in, hands-free mode, spoken cues
  DrinkArt.tsx           illustrations for every drink and method
  Guides.tsx, Pwa.tsx, Art.tsx, BackLink.tsx, useModal.ts
lib/
  data/                  roasts, grinders, house methods, flavours, labels
  catalog.ts             every recipe, typed
  brew.ts                recipe maths: roast fit, ratios, inversion, card text
  grind.ts               grinder conversion (brewmark.io anchors)
  search.ts, discover.ts search scoring; refine facets and match modes
  journal.ts             bean rest windows, ratings and dial-in advice
  brewDraw.ts            the three brew drawings, as pure functions of one moment of the brew
  timer.ts               the timer engine (outside React, so it survives navigation) + cue events
  audio.ts               cue tones and the screen wake lock
data/                    drinks.json, library.json
public/                  icons, manifest.webmanifest, sw.js
tests/                   app.spec.ts (layout, discovery, keyboard), features.spec.ts (new features)
```

## Saved in your browser

Settings use `localStorage` keys starting with `brewcard.`. The setup, roast, flavour and volume keys are the same ones the original single-page card used. The newer ones are:

- **Beans:** `beans`, `activeBean`
- **Favourites and history:** `favs`, `recent`, `log`
- **Dial-in:** `grindAdj`, `doses`
- **Voice cues:** `voice`

## Notes on the advice

- **Bean rest windows** are typical starting points for filter and AeroPress brewing, by roast. They run from about 3 days for dark roasts to about 10 for light ones. A rest time printed on the bag overrides them.
- **Dial-in tips** follow the usual extraction rules, and change one thing at a time.

## About the recipe data

The AeroPress library recipes belong to their authors and the sites that publish them, mostly [aeroprecipe.com](https://aeroprecipe.com/recipes). Brew Card shows each recipe's dose, water, temperature, grind and timed steps (summarised in its own words) so you can brew it with the timer, and credits the author with a link to the original page on every recipe. The flavour tags and notes are Brew Card's own.

Grinder settings are derived from [brewmark.io](https://brewmark.io/grinders)'s published charts. The Clean & Clear method follows James Hoffmann's Ultimate AeroPress recipe.
