import { expect, test } from "@playwright/test";
import { dayKey, partOf, today } from "../lib/daily";

/* Coffee of the day: worked out on the phone from its own date and hour. No browser needed. */
const at = (iso: string) => new Date(iso); // read as local time, like the phone

test("the part of the day follows the hour", () => {
  expect([4, 5, 11, 12, 15, 16, 20, 21, 0].map(partOf)).toEqual(["night", "morning", "morning", "afternoon", "afternoon", "evening", "evening", "night", "night"]);
});

test("the day is the phone's own date, not UTC", () => {
  expect(dayKey(at("2026-07-16T00:30:00"))).toBe("2026-07-16");
});

test("the same moment always gives the same pick, and the greeting fits the hour", () => {
  const a = today(at("2026-07-16T07:10:00"), [], [], false)!;
  const b = today(at("2026-07-16T09:45:00"), [], [], false)!;
  expect(a.greeting).toBe("Good morning.");
  expect(a.entry.id).toBe(b.entry.id);
  expect(a.line).toBe("");
  expect(today(at("2026-07-16T22:30:00"), [], [], false)!.entry.id).toBe("my-coldbrew");
});

test("a May afternoon is cold; a December afternoon is not", () => {
  const may = today(at("2026-05-12T14:00:00"), [], [], false)!;
  expect(may.entry.kind === "drink" && may.entry.temp).toBe("iced");
  expect(may.why).toContain("May");
  const dec = today(at("2026-12-12T14:00:00"), [], [], false)!;
  expect(dec.entry.kind === "drink" ? dec.entry.temp : "hot").toBe("hot");
});

test("only what you can make: someone with just instant coffee gets an instant pick", () => {
  for (const d of ["2026-07-16T07:10:00", "2026-05-12T14:00:00", "2026-01-20T08:00:00"]) {
    expect(["instant-coffee", "dalgona", "beaten-coffee"]).toContain(today(at(d), ["instant"], [], false)!.entry.id);
  }
});

test("yesterday's picks are skipped while there is another choice", () => {
  const first = today(at("2026-07-16T07:10:00"), [], [], false)!.entry.id;
  const again = today(at("2026-07-16T07:10:00"), [], [first], false)!.entry.id;
  expect(again).not.toBe(first);
});

test("1 October is International Coffee Day; a first visit gets a line saying where to start", () => {
  const cd = today(at("2026-10-01T08:00:00"), [], [], false)!;
  expect(cd.greeting).toBe("Happy Coffee Day.");
  expect(cd.line).toContain("International Coffee Day");
  expect(today(at("2026-07-16T07:10:00"), [], [], true)!.line).toContain("start with");
});
