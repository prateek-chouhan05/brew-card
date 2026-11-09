/* ------------------------------------------------------------------------------------------
   Scan a bag: read the label on the phone (lib/ocr.ts), pick out the fields (lib/labelText.ts),
   and turn them into the bag form. The taste family is then decided by lib/tasting.ts, the same
   way as for typed notes. Nothing is sent anywhere.
   ------------------------------------------------------------------------------------------ */
import type { RoastId } from "./types";
import { readBagDate, readRoast, splitNotes, type Hints } from "./tasting";
import { readLabel } from "./labelText";
import { OcrError, readBag, type OcrStage } from "./ocr";

/** Scanning needs WebAssembly and workers; every current phone browser has both. */
export const scanAvailable = () => typeof WebAssembly === "object" && typeof Worker === "function";

/** What was read off the label, as printed: nothing interpreted yet. */
export interface LabelRead {
  isCoffeeBag: boolean;
  name?: string | null; roaster?: string | null;
  notes?: string[] | null;
  roast?: string | null; roastedOn?: string | null; restDays?: number | null;
  origin?: string | null; process?: string | null; varietal?: string | null; altitude?: string | null;
  bitterness?: string | null; acidity?: string | null;
}
export type ScanError = "unreadable" | "not_coffee" | "load" | "timeout";
export type ScanResult = { ok: true; label: LabelRead } | { ok: false; error: ScanError };
export type ScanStage = OcrStage;

export async function scanBag(file: Blob, opts: { signal?: AbortSignal; onStage?: (s: ScanStage) => void } = {}): Promise<ScanResult> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 90_000);
  const outer = opts.signal;
  outer?.addEventListener("abort", () => ctrl.abort());
  try {
    const lines = await readBag(file, { signal: ctrl.signal, onStage: opts.onStage });
    const label = readLabel(lines);
    // for tuning on real bags: localStorage.setItem("brewcard.debugScan", "1") logs what was read
    try { if (localStorage.getItem("brewcard.debugScan")) console.info("brewcard scan", JSON.stringify({ lines, label })); } catch {}
    const anyText = lines.some((l) => l.conf >= 60 && /[A-Za-z]{3}/.test(l.text));
    if (!label.isCoffeeBag) return { ok: false, error: anyText ? "not_coffee" : "unreadable" };
    if (!label.notes?.length && !label.name && !label.roast) return { ok: false, error: "unreadable" };
    return { ok: true, label };
  } catch (e) {
    if (e instanceof OcrError && e.kind === "load") return { ok: false, error: "load" };
    if (ctrl.signal.aborted && !outer?.aborted) return { ok: false, error: "timeout" };
    return { ok: false, error: "unreadable" };
  } finally { clearTimeout(t); }
}

const lvl = (s?: string | null): Hints["bitterness"] => {
  const t = (s || "").toLowerCase();
  return /low|light|mild/.test(t) ? "low" : /high|strong|intense/.test(t) ? "high" : /med/.test(t) ? "medium" : undefined;
};

/** The label → values for the bag form. Dates printed both ways round come back with the other reading. */
export function fromLabel(l: LabelRead) {
  const notes = (l.notes ?? []).flatMap((n) => splitNotes(n)).map((n) => n.toLowerCase());
  const roast: RoastId | "" = readRoast(l.roast) ?? "";
  const when = l.roastedOn ? readBagDate(l.roastedOn) : { date: null };
  const extra = [l.origin, l.process?.replace(/_/g, " "), l.varietal, l.altitude].filter(Boolean).map((s) => String(s).trim()).join(" · ");
  return {
    name: (l.name || l.roaster || "").trim(),
    notes, roast,
    roasted: when.date ?? "",
    dateAsk: when.other ? { printed: l.roastedOn as string, first: when.date as string, second: when.other } : null,
    rest: l.restDays && l.restDays > 0 ? String(l.restDays) : "",
    origin: extra,
    hints: { bitterness: lvl(l.bitterness), acidity: lvl(l.acidity) } as Hints,
  };
}
