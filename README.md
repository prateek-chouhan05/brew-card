# Brew Card ☕

A brew companion for the AeroPress and moka pot, built with Next.js. You tell it your grinder, your bag's roast and what the beans taste like. It ranks recipes for that coffee, converts every grind setting to your grinder, and runs each recipe on a phase-by-phase timer.

**What's inside:**

- **8 house methods** that adapt water temperature and grind to your roast. Each can switch between "on the mug" and inverted.
- **30 classic coffee drinks**, from affogato to filter kaapi. Each one links to the base you brew for it, and back again.
- **67 championship, barista and enthusiast AeroPress recipes.** These are an index: each recipe links to its original page.
- **A phase timer** with audio cues, a flip warning, and the screen kept awake. It keeps running while you browse other pages.
- **Grind settings for 16 hand grinders**, plus flavour pairing that explains why each recipe suits a bean.

## Stack

- **Framework:** Next.js 16 (App Router), React 19 and TypeScript.
- **Static export:** `npm run build` writes plain HTML, CSS and JS to `out/`. You can host it anywhere: Vercel, Netlify, Cloudflare Pages or GitHub Pages. There is no backend.
- **Pre-built pages:** every recipe has its own page at `/recipes/<id>/`, built ahead of time.
- **Saved settings:** stored in the browser's local storage, under the same keys the original single-page card used.
- **Fonts:** self-hosted from npm (Archivo, JetBrains Mono). There are no third-party requests at runtime.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run build        # static site → out/
npm start            # serve out/ locally
npx playwright install chromium && npm test   # end-to-end tests at 320–1440 px
```

## Project layout

```
app/                     routes
  page.tsx               Recipes: search → collections → refine → match my coffee → results
  recipes/[id]/page.tsx  one static page per recipe, with the brew console and timer
  guides/page.tsx        bean flavours, roast & temperature, your grinder, orientation, milk, fixes
  brew/page.tsx          opens the brew in progress, or the last recipe you opened
components/
  providers.tsx          coffee setup, discovery filters and brew preferences (context + storage)
  AppShell.tsx           top nav / phone tab bar, setup chip, live timer badge
  SetupDialog.tsx        grinder, roast and flavour — applied on Save only
  Discover.tsx           the recipe finder
  BrewConsole.tsx        specs, dose, orientation, steps and the phase timer
  Guides.tsx
lib/
  data/                  roasts, grinders, house methods, flavours, labels
  catalog.ts             every recipe, typed; lookups
  brew.ts                recipe maths: roast fit, ratios, inversion, card text
  grind.ts               grinder conversion (brewmark.io anchors)
  search.ts              search scoring and synonyms
  discover.ts            refine facets, match modes, filtering
  timer.ts               the phase-timer engine (lives outside React so it survives navigation)
  audio.ts               cue tones and the screen wake lock
data/
  drinks.json            the 30 coffee drinks
  library-index.json     the AeroPress recipe index (link-only)
tests/app.spec.ts        Playwright end-to-end tests
```

## About the recipe data

The AeroPress library recipes belong to their authors and the sites that publish them, mostly [aeroprecipe.com](https://aeroprecipe.com/recipes). This project keeps only an index: name, author, event, link, and Brew Card's own flavour tags and notes. Doses, temperatures and steps stay on the original pages.

The console can also show full recipe details when an entry has them, but this repository does not include any.

Grinder settings are derived from [brewmark.io](https://brewmark.io/grinders)'s published charts. The Clean & Clear method follows James Hoffmann's Ultimate AeroPress recipe.
