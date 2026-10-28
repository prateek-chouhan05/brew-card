import { expect, test, type Page } from "@playwright/test";

async function skipSetup(p: Page, url = "/") {
  await p.goto("/guides/");
  await p.evaluate(() => { localStorage.setItem("brewcard.setupDone", "1"); localStorage.setItem("brewcard.grinder", "c3s"); localStorage.setItem("brewcard.roast", "medium"); });
  await p.goto(url);
}
const isoDaysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

test("every recipe card has an illustration", async ({ page: p }) => {
  await skipSetup(p);
  const cards = p.locator("#cards li");
  await expect(cards.first()).toBeVisible();
  const n = await cards.count();
  expect(await p.locator("#cards li .c-ic svg").count()).toBe(n);
  await p.goto("/recipes/affogato/");
  await expect(p.locator(".console-head .head-art svg")).toBeVisible();
});

test("favourites appear on the shelf and on cards", async ({ page: p }) => {
  await skipSetup(p, "/recipes/latte/");
  await p.click("#favBtn");
  await expect(p.locator("#favBtn")).toHaveAttribute("aria-pressed", "true");
  await p.goto("/");
  await expect(p.locator(".shelf")).toContainText("Caffè Latte");
  await p.fill("#q", "latte");
  await expect(p.locator("#cards li", { hasText: "Caffè Latte" }).locator(".c-fav")).toBeVisible();
  await expect(p.locator(".shelf")).toBeHidden(); // the shelf steps aside while you search
  await p.reload();
  await expect(p.locator(".shelf")).toContainText("Caffè Latte"); // favourites persist
});

test("the chamber clock and brew line follow the timer, and a finished brew asks for a rating", async ({ page: p }) => {
  await p.clock.install();
  await skipSetup(p, "/recipes/my-espresso/");
  await p.clock.runFor(500);
  const clock = p.locator("#clock canvas"), line = p.locator("#timeline canvas");
  await expect(clock).toBeVisible();
  await expect(line).toBeVisible();
  await expect(clock).toHaveAttribute("data-phase", "ready");
  const before = await clock.screenshot();
  await p.click("#go");
  await p.clock.runFor(2000);
  await expect(clock).toHaveAttribute("data-phase", "pour");
  await expect(line).toHaveAttribute("data-phase", "pour");
  expect((await clock.screenshot()).equals(before)).toBe(false); // the drawing moved on
  await p.clock.runFor(70_000);
  await expect(clock).toHaveAttribute("data-phase", "press");
  await p.clock.runFor(40_000);
  await expect(clock).toHaveAttribute("data-phase", "done");
  await expect(p.locator("#badge")).toHaveText("Done");
  await expect(p.locator("#rate")).toHaveAttribute("open", "");
  await p.goto("/");
  await expect(p.locator(".shelf")).toContainText("Espresso-Style Concentrate");
});

test("inverted brew: the whole flow end to end, with the flip", async ({ page: p }) => {
  await p.clock.install();
  await skipSetup(p, "/recipes/my-everyday/");
  await p.clock.runFor(500);
  await p.click("#oInv");
  const clock = p.locator("#clock canvas");
  // pour 15 · settle 15 · stir 5 · steep 55 · flip 10 · press 30 = 2:10
  await expect(clock).toHaveAttribute("data-left", "15");
  await p.click("#go");
  const at = async (sec: number, phase: string, left?: string) => {
    await p.clock.runFor(sec * 1000);
    await expect(clock).toHaveAttribute("data-phase", phase);
    if (left) await expect(clock).toHaveAttribute("data-left", left);
  };
  await at(5, "pour", "10");
  await at(15, "wait");                 // 0:20, settling
  await at(12, "stir");                 // 0:32
  await at(20, "wait");                 // 0:52, steeping
  await expect(p.locator("#now")).toHaveText("Steep");
  await at(40, "flip");                 // 1:32
  const midFlip = await clock.screenshot();
  await p.clock.runFor(7000);           // the brewer turns over in the last part of the flip
  expect((await clock.screenshot()).equals(midFlip)).toBe(false);
  await at(5, "press");                 // 1:44
  // pause holds the drawing still
  await p.click("#go");
  const paused = await clock.screenshot();
  await p.clock.runFor(5000);
  expect((await clock.screenshot()).equals(paused)).toBe(true);
  await expect(p.locator("#badge")).toContainText("Paused");
  await p.click("#go");
  await at(30, "done", "0");
  await expect(p.locator("#timeline canvas")).toHaveAttribute("data-phase", "done");
});

test("rate & dial in gives a fix and can apply it", async ({ page: p }) => {
  await skipSetup(p, "/recipes/my-everyday/");
  const grind = async () => Number((await p.locator("#rSpecs div").first().locator("dd").innerText()).split(/\s/)[0]);
  const before = await grind();
  await p.locator("#rate summary").click();
  await p.locator('.rate-opt:has(input[value="sour"])').click();
  await p.locator('.rate-opt:has(input[value="right"])').click();
  await p.getByRole("button", { name: "Save & get a tip" }).click();
  await expect(p.locator(".rate-result")).toContainText("finer");
  await p.getByRole("button", { name: /finer next time/ }).click();
  await expect(p.locator(".rate-applied")).toBeVisible();
  expect(await grind()).toBe(before - 1);
  await expect(p.locator("#rSpecs")).toContainText("dialled finer");
  await expect(p.locator(".rate-log li")).toHaveCount(1);
  await p.reload();
  expect(await grind()).toBe(before - 1);
  await expect(p.locator(".rate-last")).toContainText("sour");
});

test("saved bean bags show rest status and drive roast & flavour", async ({ page: p }) => {
  await skipSetup(p);
  await p.click("#setupBtn");
  await p.locator('#suRoast input[value="medlight"]').check({ force: true });
  await p.locator('#suFlavour input[value="fruity"]').check({ force: true });
  await p.getByRole("button", { name: "+ Add a bag" }).click();
  await p.getByLabel("Name").fill("Yelnoorkhan");
  await p.getByLabel("Roasted on").fill(isoDaysAgo(3));
  await p.getByRole("button", { name: "Save bag" }).click();
  await expect(p.locator(".bag-row")).toContainText("Resting");
  await p.click("#suSave");
  await expect(p.locator(".mb-tag.bean")).toContainText("Yelnoorkhan");
  await expect(p.locator(".mb-tag.bean")).toContainText("ready in");
  expect(await p.evaluate(() => localStorage.getItem("brewcard.roast"))).toBe("medlight");
  await p.goto("/recipes/my-bypass/");
  await expect(p.locator("#warnBar")).toContainText("still resting");
  // a second, rested bag: switching bags switches roast and flavour
  await p.click("#setupBtn");
  await p.getByRole("button", { name: "+ Add a bag" }).click();
  await p.locator('#suRoast input[value="dark"]').check({ force: true });
  await p.locator('#suFlavour input[value="chocolate"]').check({ force: true });
  await p.getByLabel("Name").fill("Truffle Twilight");
  await p.getByLabel("Roasted on").fill(isoDaysAgo(12));
  await p.click("#suSave");
  expect(await p.evaluate(() => localStorage.getItem("brewcard.roast"))).toBe("dark");
  await p.click("#setupBtn");
  await p.locator('.bag-row input[type="radio"]').first().check({ force: true });
  await p.click("#suSave");
  expect(await p.evaluate(() => localStorage.getItem("brewcard.roast"))).toBe("medlight");
  expect(await p.evaluate(() => localStorage.getItem("brewcard.flavour"))).toBe("fruity");
});

test("hands-free mode and voice toggle", async ({ page: p }) => {
  await skipSetup(p, "/recipes/my-clean/");
  await p.click("#handsFreeBtn");
  const hf = p.locator(".handsfree");
  await expect(hf).toBeVisible();
  const clock = hf.locator(".hf-clock canvas");
  await expect(clock).toBeVisible();
  await expect(clock).toHaveAttribute("data-phase", "ready");
  await hf.locator(".hf-go").click();
  await expect(hf.locator(".hf-go")).toHaveText("Pause");
  await expect(clock).toHaveAttribute("data-phase", "pour");
  await hf.getByRole("button", { name: /Voice/ }).click();
  expect(await p.evaluate(() => localStorage.getItem("brewcard.voice"))).toBe("0");
  await p.keyboard.press("Escape");
  await expect(hf).toHaveCount(0);
  await expect(p.locator("#go")).toHaveText("Pause"); // the brew keeps running
});

test("installable: manifest, icons and offline worker", async ({ page: p }) => {
  await skipSetup(p);
  const href = await p.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBe("/manifest.webmanifest");
  const res = await p.request.get(href!);
  const m = await res.json();
  expect(m.display).toBe("standalone");
  for (const icon of m.icons) expect((await p.request.get(icon.src)).ok()).toBe(true);
  const scope = await p.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/$/);
});
