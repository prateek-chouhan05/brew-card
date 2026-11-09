/* ------------------------------------------------------------------------------------------
   The text Tesseract read off a bag → the label fields the bag form needs.
   Labels are laid out in columns ("ROAST LEVEL / MEDIUM" under each other), so this works
   from each word's position, not just the text: a value is the words printed under its heading.
   Pure functions, so they run in tests without a browser.
   ------------------------------------------------------------------------------------------ */
import { matchNote, splitNotes } from "./tasting";
import type { LabelRead } from "./scan";

export interface Box { x0: number; y0: number; x1: number; y1: number }
export interface OcrWord { text: string; conf: number; box: Box }
export interface OcrLine { text: string; conf: number; box: Box; words: OcrWord[] }

interface Word extends OcrWord { t: string; line: number }
interface Cell { words: Word[]; text: string; box: Box; h: number; line: number }

const H = (b: Box) => b.y1 - b.y0;
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const letters = (s: string) => (s.match(/[A-Za-z]/g) || []).length;

/** Common Tesseract slips on labels: "MOSAMB!" → MOSAMBI, "|" or "!" inside a word → I. */
function fixWord(t: string): string {
  return t.replace(/(?<=[A-Za-z])[!|]|[!|](?=[A-Za-z])/g, "I").replace(/^[^A-Za-z0-9(&]+|[^A-Za-z0-9)&.%,;]+$/g, "");
}
const wordlike = (w: OcrWord & { t?: string }) => {
  const t = w.t ?? w.text;
  return letters(t) >= 2 && letters(t) / t.length >= 0.7 && w.conf >= 55;
};

/* ---------------- headings ---------------- */
type Field = "roast" | "acidity" | "bitterness" | "date" | "process" | "origin" | "varietal" | "altitude" | "notes";
const HEADS: [Field, string[]][] = [
  ["roast", ["ROAST", "LEVEL"]],
  ["acidity", ["ACIDITY"]],
  ["bitterness", ["BITTERNESS"]],
  ["date", ["ROASTED", "PACKED", "DATE"]],
  ["process", ["PROCESS", "PROCESSING"]],
  ["origin", ["LOCATION", "ORIGIN", "REGION"]],
  ["varietal", ["VARIETAL", "VARIETY", "VARIETIES"]],
  ["altitude", ["ALTITUDE", "ELEVATION"]],
  ["notes", ["NOTES", "TASTING", "FLAVOUR", "FLAVOR"]],
];
/** Words that are never the coffee's name. */
const NOT_NAME = new Set(["ROASTED", "ESPECIALLY", "FOR", "YOU", "NET", "WT", "GMS", "GM", "GRAMS", "ILLUSTRATION", "INSPIRED", "BY", "ART", "STYLE", "ON", "GRIND", "WHOLE", "BEAN", "BEANS", "AEROPRESS", "FILTER", "ESPRESSO", "BEST", "BEFORE"]);

function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
/** Which heading a word is, allowing for a misread letter or two in long words (FRQCESSING). */
function headOf(t: string): Field | null {
  const u = t.toUpperCase().replace(/[^A-Z]/g, "");
  if (u.length < 4 && u !== "ON") return null;
  for (const [f, keys] of HEADS) for (const k of keys) {
    const tol = k.length >= 8 ? 2 : k.length >= 6 ? 1 : 0;
    if (u === k || (tol && Math.abs(u.length - k.length) <= tol && lev(u, k) <= tol)) return f;
  }
  return null;
}

/** A heading word in its line. ROASTED and PACKED only count before ON or DATE ("roasted almond" is a note). */
function headingAt(ws: { t: string; text: string }[], i: number): Field | null {
  const f = headOf(ws[i].t);
  if (f === "date" && /^(ROASTED|PACKED)$/i.test(ws[i].t) && !/:$/.test(ws[i].text) && !(ws[i + 1] && /^(ON|DATE)$/i.test(ws[i + 1].t))) return null;
  return f;
}

/**
 * Tesseract often reads a sideways label as it is, as vertical lines, and reports positions in
 * the photo's own frame. Turn those positions so every line runs left to right, top to bottom.
 */
export function upright(lines: OcrLine[]): OcrLine[] {
  let tall = 0, wide = 0, down = 0, up = 0;
  for (const l of lines) {
    const ws = l.words.filter((w) => letters(w.text) >= 4);
    for (const w of ws) { const wh = w.box.x1 - w.box.x0, hh = w.box.y1 - w.box.y0; if (hh > 1.5 * wh) tall++; else if (wh > 1.5 * hh) wide++; }
    for (let i = 1; i < ws.length; i++) { if (ws[i].box.y0 > ws[i - 1].box.y0) down++; else up++; }
  }
  if (tall <= wide) return lines;
  const maxX = Math.max(...lines.flatMap((l) => [l.box.x1, ...l.words.map((w) => w.box.x1)]));
  const maxY = Math.max(...lines.flatMap((l) => [l.box.y1, ...l.words.map((w) => w.box.y1)]));
  // reading downwards: the label was turned clockwise, so turn it back anticlockwise (and the other way round)
  const turn = down >= up
    ? (b: Box): Box => ({ x0: b.y0, x1: b.y1, y0: maxX - b.x1, y1: maxX - b.x0 })
    : (b: Box): Box => ({ x0: maxY - b.y1, x1: maxY - b.y0, y0: b.x0, y1: b.x1 });
  return lines
    .map((l) => ({ ...l, box: turn(l.box), words: l.words.map((w) => ({ ...w, box: turn(w.box) })) }))
    .sort((a, b) => a.box.y0 - b.box.y0 || a.box.x0 - b.box.x0);
}

/* ---------------- cells: a line split where the gap says a new column starts ---------------- */
export function toCells(lines: OcrLine[]): { words: Word[][]; cells: Cell[] } {
  const words: Word[][] = lines.map((l, li) =>
    l.words.map((w) => ({ ...w, t: fixWord(w.text), line: li })).filter((w) => w.t.length > 0).sort((a, b) => a.box.x0 - b.box.x0));
  const cells: Cell[] = [];
  words.forEach((ws, li) => {
    if (!ws.length) return;
    const h = median(ws.filter(wordlike).map((w) => H(w.box))) || median(ws.map((w) => H(w.box)));
    let cur: Word[] = [];
    const flush = () => {
      // drop low-confidence scraps at the edges (bits of the illustration, the dot scales)
      // keep real words even when Tesseract was unsure of them (it scores some clean words near 0)
      const keep = (w: Word) => wordlike(w) || (letters(w.t) >= 4 && /^[A-Za-z'-]+[,;]?$/.test(w.t) && /[AEIOUaeiou]/.test(w.t)) ||
        /\d/.test(w.t) || !!matchNote(w.t).family || !!headOf(w.t);
      while (cur.length && !keep(cur[0])) cur.shift();
      while (cur.length && !keep(cur[cur.length - 1])) cur.pop();
      if (cur.length) {
        const box = { x0: cur[0].box.x0, y0: Math.min(...cur.map((w) => w.box.y0)), x1: cur[cur.length - 1].box.x1, y1: Math.max(...cur.map((w) => w.box.y1)) };
        const text = cur.map((w) => w.t).join(" ").replace(/([A-Za-z]) 8 ([A-Za-z])/g, "$1 & $2");
        cells.push({ words: cur, text, box, h: median(cur.map((w) => H(w.box))) || h, line: li });
      }
      cur = [];
    };
    ws.forEach((w, i) => {
      if (i && w.box.x0 - ws[i - 1].box.x1 > 1.6 * h) flush();
      cur.push(w);
    });
    flush();
  });
  return { words, cells };
}

/* ---------------- what a label looks like, for picking which way up the photo is ---------------- */
/** Count of confident words that belong on a coffee label: tasting notes and the usual headings. */
export function labelScore(lines: OcrLine[]): number {
  let n = 0;
  for (const l of lines) for (const w of l.words) {
    const t = fixWord(w.text);
    if (w.conf < 60 || letters(t) < 3) continue;
    if (headOf(t) || matchNote(t).family) n += 1;
    else if (wordlike({ ...w, t })) n += 0.15;
  }
  return Math.round(n * 10) / 10;
}

/* ---------------- the fields ---------------- */
const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s(-])([a-z])/g, (_m, a, b) => a + b.toUpperCase());
const DATE_RX = /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\s+[A-Za-z]{3,9}\.?,?\s+\d{2,4}|[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4})\b/;
/** "O5-1O-2026" → "05-10-2026": letters Tesseract confuses with digits, inside date-shaped text. */
const fixDate = (s: string) => s.replace(/[\dOoIl|]{1,4}(?:[-/.][\dOoIl|]{1,4}){2}/g, (m) => m.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1"));
const LEVEL = /^(LIGHT|MEDIUM|DARK|LOW|HIGH|MED|MEDIUM-?(LIGHT|DARK|HIGH|LOW))$/i;

export function readLabel(read: OcrLine[]): LabelRead {
  const lines = upright(read);
  const { words, cells } = toCells(lines);

  // headings and the words printed under (or right after) each one
  const found: Partial<Record<Field, string>> = {};
  const sure: Partial<Record<Field, number>> = {}; // the least confident word in each value
  const usedCells = new Set<Cell>();
  words.forEach((ws, li) => {
    const heads = ws.map((w, i) => ({ w, i, f: headingAt(ws, i) })).filter((x) => x.f);
    // ROASTED + ON / ROAST + DATE belong together; ROAST + LEVEL too
    const groups: { f: Field; x0: number; last: number; h: number }[] = [];
    for (const x of heads) {
      const g = groups[groups.length - 1];
      const field = x.f === "roast" && ws[x.i + 1] && /^DATE$/i.test(ws[x.i + 1].t) ? "date" : x.f!;
      if (g && x.i === g.last + 1 && (g.f === field || (g.f === "date" && field === "roast"))) { g.last = x.i; continue; }
      if (g && g.f === "roast" && field === "date" && x.i === g.last + 1) { g.f = "date"; g.last = x.i; continue; }
      // a misread first word ("EOASY LEVEL") still starts the column: go left to the start of the phrase
      let s0 = x.i;
      while (s0 > 0 && !headingAt(ws, s0 - 1) && ws[s0].box.x0 - ws[s0 - 1].box.x1 < 1.2 * H(x.w.box)) s0--;
      groups.push({ f: field, x0: ws[s0].box.x0, last: x.i, h: H(x.w.box) });
    }
    groups.forEach((g, gi) => {
      if (found[g.f]) return;
      // the rest of the same cell: "ROAST: MEDIUM", "ROASTED ON 05-10-2026"
      const after: Word[] = [];
      for (let i = g.last + 1; i < ws.length; i++) {
        if (headingAt(ws, i) || ws[i].box.x0 - ws[i - 1].box.x1 > 1.6 * g.h) break;
        if (/^ON$/i.test(ws[i].t) && g.f === "date") continue;
        after.push(ws[i]);
      }
      let value = after.map((w) => w.t).join(" ").replace(/^[:\-–\s]+/, "");
      let conf = Math.min(100, ...after.map((w) => w.conf));
      if (!value) {
        // or the line below, within this heading's column
        const end = gi + 1 < groups.length ? groups[gi + 1].x0 - 0.5 * g.h : Infinity;
        for (let lj = li + 1; lj < words.length && lj <= li + 3; lj++) {
          const below = words[lj];
          if (!below.length || below[0].box.y0 - ws[g.last].box.y1 > 3 * g.h) continue;
          const col = below.filter((w) => { const c = (w.box.x0 + w.box.x1) / 2; return c >= g.x0 - g.h && c < end; });
          const run: Word[] = [];
          for (const w of col) { if (run.length && w.box.x0 - run[run.length - 1].box.x1 > 1.6 * g.h) break; run.push(w); }
          const v = run.filter((w, k) => !headingAt(run, k)).map((w) => w.t).join(" ").trim();
          if (v && (letters(v) >= 2 || /\d/.test(v))) { value = v; conf = Math.min(100, ...run.map((w) => w.conf)); break; }
        }
      }
      if (value) { found[g.f] = value; sure[g.f] = conf; }
    });
    const headWords = new Set(heads.map((x) => x.w));
    for (const c of cells) if (c.line === li && c.words.some((w) => headWords.has(w))) usedCells.add(c);
  });

  // tasting notes: the cell with the most note words; a cell under a NOTES heading needs only one
  // (notes split by "|" or wide gaps come out as neighbouring cells on one line: join them)
  const hitsOf = (t: string) => splitNotes(t).filter((p) => matchNote(p).family).length;
  const runs: Cell[] = [];
  let lastIdx = -2;
  cells.forEach((c, i) => {
    if (usedCells.has(c) || !hitsOf(c.text)) return;
    const prev = runs[runs.length - 1];
    if (prev && lastIdx === i - 1 && prev.line === c.line) {
      prev.words = [...prev.words, ...c.words]; prev.text += " | " + c.text;
      prev.box = { ...prev.box, x1: c.box.x1, y1: Math.max(prev.box.y1, c.box.y1) };
    } else runs.push({ ...c, words: [...c.words] });
    lastIdx = i;
  });
  let notesCell: Cell | null = null, best = 0;
  for (const c of runs) {
    const hits = hitsOf(c.text);
    const underNotes = !!found.notes && c.text.includes(found.notes.split(" ")[0]);
    const score = hits + (underNotes ? 1 : 0);
    if (score > best && (hits >= 2 || (hits >= 1 && underNotes))) { best = score; notesCell = c; }
  }
  let notes: string[] = [];
  if (notesCell) {
    // "&" between notes is often read as 8 or A: split there when both sides are notes
    const parts = splitNotes(notesCell.text).flatMap((p) => {
      const bits = p.split(/\s+[8A]\s+/);
      return bits.length > 1 && bits.every((b) => matchNote(b).family) ? bits : [p];
    });
    notes = parts
      .map((p) => p.replace(/[^A-Za-z\s'-]/g, " ").replace(/\s+/g, " ").trim())
      .filter((p) => letters(p) >= 3 && p.split(" ").length <= 4);
  } else if (found.notes) {
    notes = splitNotes(found.notes).filter((p) => matchNote(p).family);
  }

  // the coffee's name: just above the notes, else the largest confident text that isn't a heading
  const nameOk = (c: Cell) => c !== notesCell && !usedCells.has(c) && letters(c.text) >= 4 && !/\d{2}/.test(c.text) &&
    c.words.every((w) => letters(w.t) / w.t.length >= 0.7) && c.words.some((w) => wordlike(w)) && !c.words.some((w) => NOT_NAME.has(w.t.toUpperCase())) && c.words.length <= 6;
  let nameCell: Cell | null = null;
  if (notesCell) {
    nameCell = cells.filter((c) => nameOk(c) && c.box.y1 <= notesCell!.box.y0 + 0.3 * notesCell!.h && notesCell!.box.y0 - c.box.y1 < 3 * notesCell!.h &&
      c.box.x0 < notesCell!.box.x1 && c.box.x1 > notesCell!.box.x0).sort((a, b) => b.box.y1 - a.box.y1)[0] ?? null;
  }
  if (!nameCell) nameCell = cells.filter(nameOk).sort((a, b) => b.h - a.h || a.box.y0 - b.box.y0)[0] ?? null;

  // roast: its heading's value; else "Roast: Medium" anywhere; else the first of a row of levels
  let roast = found.roast && LEVEL.test(found.roast.split(" ")[0]) ? found.roast : null;
  const all = cells.map((c) => c.text).join("\n");
  if (!roast) roast = all.match(/ROAST(?:\s*LEVEL)?\s*[:\-–]?\s*((?:MEDIUM|LIGHT|DARK)(?:[\s-](?:LIGHT|DARK))?)/i)?.[1] ?? null;
  if (!roast) {
    for (const ws of words) {
      const lv = ws.filter((w) => LEVEL.test(w.t.replace(/[.,]$/, "")));
      if (lv.length >= 2 && /^(LIGHT|MEDIUM|DARK|MED)/i.test(lv[0].t)) { roast = lv[0].t.replace(/[.,]$/, ""); break; }
    }
  }

  // roast date: near its heading if there is one, else any date on the label
  const dateFrom = (s?: string) => (s ? fixDate(s).match(DATE_RX)?.[1] ?? null : null);
  const roastedOn = dateFrom(found.date) ?? dateFrom(cells.map((c) => c.text).join("  "));

  // origin, process and the like are only worth showing when they were read cleanly
  const clean = (s?: string, f?: Field) => {
    if (!s || (f && (sure[f] ?? 0) < 70)) return null;
    const v = s.replace(/_/g, " ").replace(/[^A-Za-z0-9\s().,&'-]/g, "").replace(/\s+/g, " ").trim();
    return letters(v) >= 3 || /\d{3}/.test(v) ? v : null;
  };
  const level = (s?: string) => (s && /LOW|MEDIUM|HIGH|MED/i.test(s) ? s.split(" ")[0].replace(/[.,]$/, "") : null);

  const fields = ["roast", "acidity", "bitterness", "date", "process", "origin", "varietal", "altitude"].filter((f) => found[f as Field]).length;
  return {
    isCoffeeBag: notes.length > 0 || fields >= 2 || !!roast,
    name: nameCell ? titleCase(nameCell.text) : null,
    notes,
    roast,
    roastedOn,
    origin: clean(found.origin, "origin") ? titleCase(clean(found.origin, "origin")!) : null,
    process: clean(found.process, "process") ? titleCase(clean(found.process, "process")!) : null,
    varietal: clean(found.varietal, "varietal"),
    altitude: clean(found.altitude, "altitude"),
    bitterness: level(found.bitterness),
    acidity: level(found.acidity),
  };
}
