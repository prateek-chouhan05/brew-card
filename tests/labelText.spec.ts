import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { labelScore, readLabel, upright, type OcrLine } from "../lib/labelText";

/*
 * What Tesseract read off real bags (saved as JSON), turned into the bag form's fields.
 * No browser needed, so these run in milliseconds. Add a bag here whenever one reads wrongly:
 * localStorage.setItem("brewcard.debugScan", "1") logs the lines to save as a fixture.
 */
const load = (f: string) => JSON.parse(readFileSync(`${__dirname}/fixtures/${f}`, "utf8")) as OcrLine[];

test("Kalledevarapura, photographed sideways and read in the browser", () => {
  const l = readLabel(load("ocr-kalledevarapura-browser.json"));
  expect(l.isCoffeeBag).toBe(true);
  expect(l.name).toBe("Kalledevarapura Estate");
  expect(l.notes).toEqual(["BROWN SUGAR", "ROASTED ALMOND", "RAISIN"]); // "roasted" here is a note, not "ROASTED ON"
  expect(l.roast).toBe("MEDIUM");
  expect(l.roastedOn).toBe("05-10-2026");
  expect(l.bitterness?.toUpperCase()).toBe("LOW");
  expect(l.acidity).toBe("MEDIUM");
});

test("Kalledevarapura, turned upright first", () => {
  const l = readLabel(load("ocr-kalledevarapura.json"));
  expect([l.name, l.roast, l.roastedOn]).toEqual(["Kalledevarapura Estate", "MEDIUM", "05-10-2026"]);
  expect(l.notes).toHaveLength(3);
});

test("Kerehaklu: a small website photo with misread letters (MOSAMB!, & read as 8)", () => {
  for (const f of ["ocr-kerehaklu.json", "ocr-kerehaklu-large.json"]) {
    const l = readLabel(load(f));
    expect(l.name).toBe("Kerehaklu Estate Peaberry Washed");
    expect(l.notes).toEqual(["MOSAMBI", "TOFFEE", "GREEN GRAPE"]);
    expect(l.roast).toBe("LIGHT"); // the first of the level row, even where its heading was misread
    expect(l.roastedOn).toBeNull(); // this bag's date box is empty
  }
});

test("Kerehaklu read in the browser: a barely-read name is kept, & read as A is split", () => {
  const l = readLabel(load("ocr-kerehaklu-browser.json"));
  expect(l.name).toMatch(/^Kereh\w+ Estate Peaberry Washed$/);
  expect(l.notes).toEqual(["MOSAMBI", "TOFFEE", "GREEN GRAPE"]);
  expect(l.roast).toBe("LIGHT");
});

/* A different layout, made up: everything inline, the name in bigger type. */
function lines(rows: [string, number][]): OcrLine[] {
  let y = 0;
  return rows.map(([text, size]) => {
    let x = 0; const top = y; y += size * 1.6;
    const words = text.split(/( {3,}| )/).filter((t) => t.trim() || t.length >= 3).flatMap((t) => {
      if (!t.trim()) { x += size * (t.length >= 3 ? 3 : 0.5); return []; }
      const w = { text: t, conf: 92, box: { x0: x, y0: top, x1: x + t.length * size * 0.6, y1: top + size } };
      x = w.box.x1 + size * 0.4; return [w];
    });
    return { text, conf: 92, box: { x0: 0, y0: top, x1: x, y1: top + size }, words };
  });
}
test("an inline layout: 'Tasting notes:', 'Roast: Medium Dark', 'Roasted on 12/09/2026'", () => {
  const l = readLabel(lines([
    ["Monsoon Malabar AA", 40],
    ["Tasting notes: dark chocolate, cedar, molasses", 18],
    ["Roast: Medium Dark", 18],
    ["Roasted on 12/09/2026", 18],
    ["Net wt 250 g", 14],
  ]));
  expect(l.name).toBe("Monsoon Malabar Aa");
  expect(l.notes?.map((n) => n.toLowerCase())).toEqual(["dark chocolate", "cedar", "molasses"]);
  expect(l.roast).toMatch(/^Medium Dark$/i);
  expect(l.roastedOn).toBe("12/09/2026");
});

test("which way up: sideways text is turned to run left to right, and a label outscores noise", () => {
  const side = load("ocr-kalledevarapura-browser.json");
  const up = upright(side);
  const name = up.find((l) => /KALLEDEVARAPURA/.test(l.text))!, notes = up.find((l) => /BROWN SUGAR/.test(l.text))!;
  expect(name.box.y0).toBeLessThan(notes.box.y0); // the name sits above the notes once upright
  expect(notes.words[1].box.x0).toBeGreaterThan(notes.words[0].box.x0);
  expect(labelScore(side)).toBeGreaterThan(8);
  expect(labelScore(lines([["Hello world, this is a shopping list", 20], ["milk eggs bread", 20]]))).toBeLessThan(3);
  expect(readLabel(lines([["Hello world, this is a shopping list", 20]])).isCoffeeBag).toBe(false);
});
