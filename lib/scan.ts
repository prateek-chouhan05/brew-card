/* ------------------------------------------------------------------------------------------
   Scan a bag: shrink the photo on the phone, send it to the scan function, and turn what the
   model read into the bag form. The model only reads the label; the taste family is decided
   on the phone by lib/tasting.ts, the same way as for typed notes.
   ------------------------------------------------------------------------------------------ */
import type { RoastId } from "./types";
import { readBagDate, readRoast, splitNotes, type Hints } from "./tasting";

/** Set at build time (Vercel env). Without it, scanning is not offered. */
export const SCAN_URL = process.env.NEXT_PUBLIC_SCAN_URL || "";
const SCAN_KEY = process.env.NEXT_PUBLIC_SCAN_KEY || "";
export const scanAvailable = () => !!SCAN_URL;

/** What the scan function returns: the label as printed, nothing interpreted. */
export interface LabelRead {
  isCoffeeBag: boolean;
  name?: string | null; roaster?: string | null;
  notes?: string[] | null;
  roast?: string | null; roastedOn?: string | null; restDays?: number | null;
  origin?: string | null; process?: string | null; varietal?: string | null; altitude?: string | null;
  bitterness?: string | null; acidity?: string | null;
}
export type ScanError = "offline" | "unreadable" | "not_coffee" | "limit" | "unavailable" | "timeout";
export type ScanResult = { ok: true; label: LabelRead } | { ok: false; error: ScanError };

/** Straighten (EXIF) and shrink to 1600 px on the long edge as a JPEG: fast to send, cheap to read. */
export async function preparePhoto(file: Blob, max = 1600): Promise<string> {
  let src: ImageBitmap | HTMLImageElement;
  try { src = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions); }
  catch {
    src = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  }
  const w = "naturalWidth" in src ? src.naturalWidth : src.width, h = "naturalHeight" in src ? src.naturalHeight : src.height;
  const k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82).split(",")[1];
}

export async function scanLabel(jpegBase64: string, signal?: AbortSignal): Promise<ScanResult> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { ok: false, error: "offline" };
  if (!SCAN_URL) return { ok: false, error: "unavailable" };
  const timer = new AbortController();
  const t = setTimeout(() => timer.abort(), 25_000);
  signal?.addEventListener("abort", () => timer.abort());
  try {
    const res = await fetch(SCAN_URL, {
      method: "POST", signal: timer.signal,
      headers: { "content-type": "application/json", ...(SCAN_KEY ? { authorization: `Bearer ${SCAN_KEY}`, apikey: SCAN_KEY } : {}) },
      body: JSON.stringify({ image: jpegBase64, mediaType: "image/jpeg" }),
    });
    const j = await res.json().catch(() => null);
    if (res.status === 429) return { ok: false, error: "limit" };
    if (!res.ok || !j) return { ok: false, error: "unavailable" };
    if (j.ok === false) return { ok: false, error: (["unreadable", "not_coffee", "limit"].includes(j.error) ? j.error : "unavailable") as ScanError };
    const label = j.label as LabelRead;
    if (!label?.isCoffeeBag) return { ok: false, error: "not_coffee" };
    if (!label.notes?.length && !label.name && !label.roast) return { ok: false, error: "unreadable" };
    return { ok: true, label };
  } catch {
    if (signal?.aborted) return { ok: false, error: "unavailable" };
    return { ok: false, error: typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "timeout" };
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
