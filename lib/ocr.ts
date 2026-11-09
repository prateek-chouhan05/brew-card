/* ------------------------------------------------------------------------------------------
   Reading a bag's label on the phone with Tesseract.js. Nothing leaves the device.
   The reader (about 4–5 MB) is fetched from this site the first time someone scans, then the
   browser keeps it. Labels are printed on coloured panels and often photographed sideways, so
   each photo is turned black-and-white against its own surroundings and read every way up
   until it looks like a coffee label.
   ------------------------------------------------------------------------------------------ */
import type { Worker } from "tesseract.js";
import { labelScore, type OcrLine } from "./labelText";

/** Where scripts/copy-ocr.mjs puts the reader's files. Change both together. */
export const OCR_BASE = "/ocr/t7/";

export type OcrStage = "prep" | "load" | "read";
export class OcrError extends Error { constructor(public kind: "load" | "aborted") { super(kind); } }

let workerP: Promise<Worker> | null = null;
let idle: ReturnType<typeof setTimeout> | null = null;
let loaded = false;
/** True once the reader has been fetched in this session (later scans start straight away). */
export const ocrReady = () => loaded;

async function getWorker(onStage?: (s: OcrStage) => void): Promise<Worker> {
  if (idle) { clearTimeout(idle); idle = null; }
  if (!workerP) {
    onStage?.("load");
    workerP = (async () => {
      const { createWorker, OEM, PSM } = await import("tesseract.js");
      const w = await createWorker("eng", OEM.LSTM_ONLY, {
        workerPath: OCR_BASE + "worker.min.js",
        corePath: OCR_BASE,
        langPath: OCR_BASE,
        gzip: true,
      });
      await w.setParameters({ tessedit_pageseg_mode: PSM.AUTO, preserve_interword_spaces: "1" });
      loaded = true;
      return w;
    })();
    workerP.catch(() => { workerP = null; });
  }
  try { return await workerP; } catch { throw new OcrError("load"); }
}
/** Let the reader go a minute after the last scan, to give the phone its memory back. */
function releaseSoon() {
  if (idle) clearTimeout(idle);
  idle = setTimeout(() => { const p = workerP; workerP = null; p?.then((w) => w.terminate()).catch(() => {}); }, 60_000);
}

/* ---------------- the photo ---------------- */
async function bitmapOf(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try { return await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions); }
  catch {
    return await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  }
}
const dims = (src: ImageBitmap | HTMLImageElement) => ("naturalWidth" in src ? [src.naturalWidth, src.naturalHeight] : [src.width, src.height]);

/**
 * The photo turned `turns` quarter-turns anticlockwise, scaled so its long edge is `long` px,
 * and made black-and-white by comparing each pixel with the average around it. A single
 * threshold fails on labels: a mid-blue panel next to cream paper comes out solid black.
 */
function prepare(src: ImageBitmap | HTMLImageElement, turns: number, long: number, offset: number): HTMLCanvasElement {
  const [w0, h0] = dims(src);
  const k = long / Math.max(w0, h0);
  const sw = Math.round(w0 * k), sh = Math.round(h0 * k);
  const side = turns % 2 === 1;
  const c = document.createElement("canvas");
  c.width = side ? sh : sw; c.height = side ? sw : sh;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.imageSmoothingQuality = "high";
  x.translate(c.width / 2, c.height / 2);
  x.rotate((-turns * Math.PI) / 2);
  x.drawImage(src, -sw / 2, -sh / 2, sw, sh);
  x.setTransform(1, 0, 0, 1, 0, 0);

  const W = c.width, Hh = c.height, img = x.getImageData(0, 0, W, Hh), d = img.data;
  const g = new Float32Array(W * Hh);
  for (let i = 0, p = 0; i < g.length; i++, p += 4) g[i] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
  // summed-area table for the local average over a (2r+1)² window
  const S = new Float64Array((W + 1) * (Hh + 1));
  for (let yy = 1; yy <= Hh; yy++) {
    let row = 0;
    for (let xx = 1; xx <= W; xx++) { row += g[(yy - 1) * W + xx - 1]; S[yy * (W + 1) + xx] = S[(yy - 1) * (W + 1) + xx] + row; }
  }
  const r = Math.max(6, Math.round(Math.max(W, Hh) / 100));
  for (let yy = 0; yy < Hh; yy++) {
    const ya = Math.max(0, yy - r), yb = Math.min(Hh, yy + r + 1);
    for (let xx = 0; xx < W; xx++) {
      const xa = Math.max(0, xx - r), xb = Math.min(W, xx + r + 1);
      const sum = S[yb * (W + 1) + xb] - S[ya * (W + 1) + xb] - S[yb * (W + 1) + xa] + S[ya * (W + 1) + xa];
      const v = g[yy * W + xx] > sum / ((yb - ya) * (xb - xa)) - offset ? 255 : 0;
      const p = (yy * W + xx) * 4; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}

/* ---------------- reading ---------------- */
const debug = (...a: unknown[]) => { try { if (localStorage.getItem("brewcard.debugScan")) console.info("brewcard ocr", ...a); } catch {} };
type Page = { blocks?: { paragraphs: { lines: { text: string; confidence: number; bbox: OcrLine["box"]; words: { text: string; confidence: number; bbox: OcrLine["box"] }[] }[] }[] }[] | null };
function linesOf(page: Page): OcrLine[] {
  const out: OcrLine[] = [];
  for (const b of page.blocks ?? []) for (const p of b.paragraphs) for (const l of p.lines)
    out.push({ text: l.text.trim(), conf: Math.round(l.confidence), box: l.bbox, words: l.words.map((w) => ({ text: w.text, conf: Math.round(w.confidence), box: w.bbox })) });
  return out;
}
async function readCanvas(w: Worker, c: HTMLCanvasElement): Promise<OcrLine[]> {
  const { data } = await w.recognize(c, {}, { blocks: true, text: false });
  return linesOf(data as unknown as Page);
}

/**
 * Read the label: upright first, then on its sides and upside down, keeping whichever reads
 * most like a coffee label; a second, larger pass if the best one is thin.
 */
export async function readBag(file: Blob, opts: { signal?: AbortSignal; onStage?: (s: OcrStage) => void } = {}): Promise<OcrLine[]> {
  const { signal, onStage } = opts;
  const check = () => { if (signal?.aborted) throw new OcrError("aborted"); };
  onStage?.("prep");
  const src = await bitmapOf(file);
  check();
  const w = await getWorker(onStage);
  check();
  onStage?.("read");
  try {
    const tries: string[] = [];
    let best: { lines: OcrLine[]; score: number; turns: number } = { lines: [], score: -1, turns: 0 };
    // Tesseract reads text turned a quarter either way by itself, so the other ways up are only
    // worth trying when the photo as taken reads like nothing
    for (const turns of [0, 1, 3, 2]) {
      const lines = await readCanvas(w, prepare(src, turns, 1600, 25));
      check();
      const score = labelScore(lines);
      tries.push(`${turns}:${score}`);
      if (score > best.score) best = { lines, score, turns };
      if (best.score >= 4) break;
    }
    // small print: once more, larger and with a gentler threshold
    if (best.score >= 2 && best.score < 10) {
      const lines = await readCanvas(w, prepare(src, best.turns, 2200, 15));
      check();
      const score = labelScore(lines);
      tries.push(`big:${score}`);
      if (score > best.score) best = { lines, score, turns: best.turns };
    }
    debug("tries", tries.join(" "));
    return best.lines;
  } finally {
    if ("close" in src) src.close();
    releaseSoon();
  }
}
