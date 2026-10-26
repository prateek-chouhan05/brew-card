import { expect, test, type Page } from "@playwright/test";

const WIDTHS: [number, number][] = [[320, 640], [375, 740], [430, 900], [1280, 800], [1440, 900]];
const overflow = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const count = async (p: Page) => (await p.locator("#count").innerText()).toLowerCase();
const setupLS = (p: Page) => p.evaluate(() => ({
  g: localStorage.getItem("brewcard.grinder"), r: localStorage.getItem("brewcard.roast"),
  f: localStorage.getItem("brewcard.flavour"), d: localStorage.getItem("brewcard.setupDone"),
}));

for (const [w, h] of WIDTHS) {
  const phone = w < 760, desk = w >= 1024;
  test(`full flow at ${w}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: phone ? 2 : 1, hasTouch: phone });
    const p = await ctx.newPage();
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(String(e)));
    p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await p.goto("/");

    // first run: setup dialog with defaults, fits the screen, scrolls internally
    await expect(p.locator("#setupDlg[open]")).toBeVisible();
    await p.waitForTimeout(300); // let the sheet's slide-in finish before measuring
    const box = (await p.locator("#setupDlg .sheet").boundingBox())!;
    expect(box.x >= 0 && box.y >= 0 && box.x + box.width <= w + 0.5 && box.y + box.height <= h + 0.5).toBe(true);
    await expect(p.locator("#suCancel")).toHaveText("Skip for now");
    await p.locator('#suRoast input[value="medlight"]').check({ force: true });
    await p.locator('#suFlavour input[value="fruity"]').check({ force: true });
    await p.selectOption("#suGrinder", "c40");
    await p.click("#suSave");
    await expect(p.locator("#setupDlg[open]")).toHaveCount(0);
    const ls = await setupLS(p);
    expect(ls).toEqual({ g: "c40", r: "medlight", f: "fruity", d: "1" });
    await expect(p.locator("#setupSum")).toContainText("C40");
    expect(await p.getAttribute("#setupBtn", "aria-label")).toContain("Fruity");
    expect(await overflow(p)).toBeLessThanOrEqual(0);

    // matches first
    await expect(p.locator("#cards li").first().locator(".mbadge")).toContainText("flavour");
    const total = await count(p);

    // search + clear
    await p.fill("#q", "tonic");
    await expect.poll(() => count(p)).toContain(" of ");
    await expect(p.locator("#active")).toContainText("tonic");
    await p.click("#qClear");
    await expect.poll(() => count(p)).toBe(total);

    // collection
    await p.click('#colTrack label:has(input[value="champ"])');
    await expect.poll(() => count(p)).toMatch(/^22 /);

    // refine: phone sheet, desktop sidebar
    const pre = desk ? "d" : "s";
    if (!desk) {
      await expect(p.locator("#filtersBtn")).toBeVisible();
      await expect(p.locator("#refineDesk")).toBeHidden();
      await p.click("#filtersBtn");
      await expect(p.locator("#filterDlg[open]")).toBeVisible();
      await p.waitForTimeout(300);
      const fb = (await p.locator("#filterDlg .sheet").boundingBox())!;
      expect(fb.y >= 0 && fb.y + fb.height <= h + 0.5 && fb.x + fb.width <= w + 0.5).toBe(true);
    } else {
      await expect(p.locator("#refineDesk")).toBeVisible();
      await expect(p.locator("#filtersBtn")).toBeHidden();
    }
    await p.click(`label:has(#${pre}-orient-inverted)`);
    await expect.poll(() => count(p)).not.toMatch(/^22 /);
    await expect(p.locator(`#${pre}-brewer-moka`)).toBeDisabled(); // moka + inverted = nothing
    await p.click(`label:has(#${pre}-orient-inverted)`);
    if (!desk) await p.click("#fdShow");
    await p.click('#colTrack label:has(input[value=""])');
    if (!desk) await p.click("#filtersBtn");
    await p.click(`label:has(#${pre}-brewer-moka)`);
    await expect(p.locator(`#${pre}-orient-inverted`)).toBeDisabled();
    expect(await count(p)).not.toMatch(/^0 /);
    if (!desk) { await p.click("#fdShow"); await expect(p.locator("#filterDlg[open]")).toHaveCount(0); }
    await expect(p.locator("#active")).toContainText("Moka pot");

    // empty state, then clear everything — the coffee setup must survive
    await p.fill("#q", "zzzqqq");
    await expect(p.locator("#empty")).toContainText("No recipes match");
    expect(await p.locator("#empty .acts button").count()).toBeGreaterThanOrEqual(2);
    expect(await overflow(p)).toBeLessThanOrEqual(0);
    await p.locator('#modes input[value="only"]').check({ force: true });
    await p.click("#empty .acts button.primary");
    await expect.poll(() => count(p)).toBe(total);
    expect(await setupLS(p)).toEqual(ls);
    await expect(p.locator('#modes input[value="first"]')).toBeChecked();
    await expect(p.locator("#active")).toHaveCount(0);

    // only matches narrows; show more pages by 12
    await p.locator('#modes input[value="only"]').check({ force: true });
    await expect.poll(() => count(p)).toContain(" of ");
    await p.click("#active .clearall");
    const before = await p.locator("#cards li").count();
    await p.click("#more");
    await expect(p.locator("#cards li")).toHaveCount(before + 12);

    // open a recipe → its own page
    await p.fill("#q", "everyday cup");
    await expect(p.locator("#cards li").first()).toContainText("Everyday");
    await p.locator("#cards li a").first().click();
    await expect(p).toHaveURL(/\/recipes\/my-everyday\/$/);
    await expect(p.locator("#rName")).toHaveText("Everyday Cup");
    expect(await overflow(p)).toBeLessThanOrEqual(0);
    if (desk) expect(await p.locator("#timerUI").evaluate((e) => getComputedStyle(e).position)).toBe("sticky");

    // timer keeps running while you browse; Back returns to the list with the search intact
    await p.click("#go");
    await expect(p.locator("#go")).toHaveText("Pause");
    await p.waitForTimeout(1200);
    await p.click("#backBtn");
    await expect(p).toHaveURL(/\/$/);
    const live = p.locator(phone ? ".tabbar .live" : ".mainnav .live");
    await expect(live).toBeVisible();
    await expect(live).toContainText(":");
    await expect(p.locator("#q")).toHaveValue("everyday cup");
    await p.goForward();
    await expect(p.locator("#go")).toHaveText("Pause");

    // guides follow the setup
    await p.locator(`${phone ? ".tabbar" : ".mainnav"} [data-go="guides"]`).click();
    await expect(p).toHaveURL(/\/guides\/$/);
    await expect(p.locator("#refTitle")).toContainText("C40");
    await expect(p.locator("#flTable .fl-item.hl")).toContainText("Fruity");
    expect(await overflow(p)).toBeLessThanOrEqual(0);

    // keyboard: open setup, change a draft, Esc discards it, focus returns
    await p.focus("#setupBtn");
    await p.keyboard.press("Enter");
    await expect(p.locator("#setupDlg[open]")).toBeVisible();
    await expect(p.locator("#suCancel")).toHaveText("Cancel");
    await p.locator('#suRoast input[value="dark"]').check({ force: true });
    await p.keyboard.press("Escape");
    await expect(p.locator("#setupDlg[open]")).toHaveCount(0);
    expect(await p.evaluate(() => localStorage.getItem("brewcard.roast"))).toBe("medlight");
    expect(await p.evaluate(() => document.activeElement?.id)).toBe("setupBtn");

    // reload: no first-run dialog
    await p.reload();
    await p.waitForTimeout(400);
    await expect(p.locator("#setupDlg[open]")).toHaveCount(0);
    expect(errors).toEqual([]);
    await ctx.close();
  });
}

test("drink → base → back to the drink", async ({ page: p }) => {
  await p.goto("/");
  await p.click("#suCancel");
  await p.goto("/recipes/affogato/");
  await p.locator(".basebtn").first().click();
  await expect(p).toHaveURL(/\/recipes\/my-espresso\/$/);
  await expect(p.locator("#returnBar")).toContainText("Making Affogato");
  await p.click("#returnBtn");
  await expect(p).toHaveURL(/\/recipes\/affogato\/$/);
  await expect(p.locator("#returnBar")).toHaveCount(0);
});

test("link-only recipes point to the original page", async ({ page: p }) => {
  await p.goto("/recipes/wac-2023-1st/");
  await p.click("#suCancel");
  await expect(p.locator("#rPrep a.linkbtn")).toHaveAttribute("href", /aeroprecipe\.com/);
  await p.locator("#rPrep .nearbtn").click();
  await expect(p).toHaveURL(/\/recipes\/my-/);
});

test("inverted switch adds a flip and is remembered", async ({ page: p }) => {
  await p.goto("/recipes/my-everyday/");
  await p.click("#suCancel");
  await p.click("#oInv");
  await expect(p.locator("#stepList")).toContainText("flip onto your mug");
  await expect(p.locator("#rSetup")).toContainText("Inverted");
  await p.reload();
  await expect(p.locator("#oInv")).toHaveAttribute("aria-pressed", "true");
});

test("resize, zoom and keyboard", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 740 } });
  const p = await ctx.newPage();
  await p.goto("/");
  await p.click("#suCancel");
  expect(await p.evaluate(() => localStorage.getItem("brewcard.setupDone"))).toBe("1");
  await p.click("#filtersBtn");
  await p.setViewportSize({ width: 1280, height: 800 });
  await expect(p.locator("#filterDlg[open]")).toHaveCount(0);
  await expect(p.locator("#refineDesk")).toBeVisible();
  for (const ww of [1024, 900, 760, 759, 600, 320, 640]) {
    await p.setViewportSize({ width: ww, height: ww === 640 ? 400 : 800 });
    await p.waitForTimeout(100);
    expect(await overflow(p)).toBeLessThanOrEqual(0);
  }
  await p.setViewportSize({ width: 1280, height: 800 });
  await p.goto("/");
  const seen: string[] = [];
  for (let i = 0; i < 40; i++) {
    await p.keyboard.press("Tab");
    seen.push(await p.evaluate(() => { const a = document.activeElement as HTMLElement; return a.id || (a as HTMLInputElement).name || a.className || a.tagName; }));
  }
  expect(seen).toContain("q");
  expect(seen).toContain("collection");
  expect(seen.some((s) => s.startsWith("d-"))).toBe(true);
  expect(await p.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)).not.toBe("none");
  // Space toggles the timer on a recipe page only
  await p.keyboard.press("Space");
  await p.goto("/recipes/my-clean/");
  await p.click("#rNotes");
  await p.keyboard.press("Space");
  await expect(p.locator("#go")).toHaveText("Pause");
  await ctx.close();
});

test("existing users keep their setup and skip the first-run dialog", async ({ page: p }) => {
  await p.goto("/guides/");
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("brewcard.grinder", "c3s"); localStorage.setItem("brewcard.flavour", "citrus"); });
  await p.reload();
  await p.waitForTimeout(400);
  await expect(p.locator("#setupDlg[open]")).toHaveCount(0);
  expect(await p.getAttribute("#setupBtn", "aria-label")).toContain("Citrus");
});
