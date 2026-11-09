/* Copies the label reader (Tesseract.js worker, its WebAssembly core and the English data)
   into public/ocr/t7/, so the site serves it itself: no CDN, and it works offline once fetched.
   Runs before every build and dev start. The folder is not committed. */
import { copyFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const pkgDir = (name) => dirname(require.resolve(`${name}/package.json`));
const OUT = "public/ocr/t7"; // keep in step with OCR_BASE in lib/ocr.ts

const tess = pkgDir("tesseract.js"), core = pkgDir("tesseract.js-core"), eng = pkgDir("@tesseract.js-data/eng");
const major = JSON.parse(readFileSync(join(tess, "package.json"), "utf8")).version.split(".")[0];
if (major !== "7") throw new Error(`copy-ocr: expected tesseract.js 7, found ${major}. Update OUT here and OCR_BASE in lib/ocr.ts.`);

const files = [
  [join(tess, "dist/worker.min.js"), "worker.min.js"],
  // LSTM-only cores: plain, SIMD and relaxed-SIMD; the worker picks what the phone supports
  ...["tesseract-core-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js", "tesseract-core-relaxedsimd-lstm.wasm.js"].map((f) => [join(core, f), f]),
  [join(eng, "4.0.0_best_int/eng.traineddata.gz"), "eng.traineddata.gz"],
];
mkdirSync(OUT, { recursive: true });
for (const [from, to] of files) {
  if (!existsSync(from)) throw new Error(`copy-ocr: missing ${from}`);
  copyFileSync(from, join(OUT, to));
}
console.log(`copy-ocr: ${files.length} files → ${OUT}`);
