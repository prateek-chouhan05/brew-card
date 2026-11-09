/* ------------------------------------------------------------------------------------------
   Spoken cues: what to say at each step, said the way a person would say it, in the most
   natural voice the phone has. Uses the phone's own speech engine, so it is free and offline.
   ------------------------------------------------------------------------------------------ */
import type { TimedSeg } from "./types";

/* ---------------- what to say ---------------- */

/** Units and symbols as words: "100 g" → "100 grams", "92 °C" → "92 degrees". */
export function speakable(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/(\d+(?:\.\d+)?)\s?°\s?C\b/g, "$1 degrees")
    .replace(/(\d+(?:\.\d+)?)\s?ml\b/gi, "$1 millilitres")
    .replace(/(\d+(?:\.\d+)?)\s?cm\b/g, "$1 centimetres")
    .replace(/(\d+(?:\.\d+)?)\s?g\b/g, (_m, n) => `${n} ${n === "1" ? "gram" : "grams"}`)
    .replace(/\b1:(\d+(?:\.\d+)?)/g, "1 to $1")
    .replace(/\s*[—–·]\s*/g, ", ")
    .replace(/\s*&\s*/g, " and ")
    .replace(/[“”"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "3 minutes 50", "5 minutes", "45 seconds" — how you'd read a timer out loud. */
export function durationWords(sec: number): string {
  const s = Math.round(sec);
  if (s < 60) return `${s} seconds`;
  const m = Math.floor(s / 60), r = s % 60;
  const mins = `${m} minute${m === 1 ? "" : "s"}`;
  return r ? `${mins} ${r}` : mins;
}

const firstSentence = (t: string) => (t.match(/^[^.!?]*[.!?]/)?.[0] ?? t).trim();
const end = (t: string) => (/[.!?]$/.test(t) ? t : t + ".");

/**
 * One step, spoken. Short steps get just their name, so the next cue never cuts them off;
 * longer ones get how long they last, and the first sentence of the how-to when there is time.
 */
export function stepLine(seg: TimedSeg): string {
  const lbl = speakable(seg.lbl);
  let line = seg.dur >= 8 ? `${lbl}, ${durationWords(seg.dur)}` : lbl;
  line = end(line);
  const tip = speakable(firstSentence(seg.det || ""));
  // the tip, unless it only repeats the time ("Five minutes, up to eight")
  if (seg.dur >= 15 && tip && tip.length <= 80 && seg.k !== "flip" && !/\b(second|minute)s?\b|^\w+ minutes?\b/i.test(tip)) line += " " + end(tip);
  return line;
}

export type SpokenCue = { type: "phase" | "flipSoon" | "soon" | "done"; seg: TimedSeg };
export function cueLine(c: SpokenCue): string {
  if (c.type === "done") return "Done. Enjoy your coffee.";
  if (c.type === "flipSoon") return "Flip in ten seconds. Get the cap and the mug ready.";
  if (c.type === "soon") return `Coming up: ${speakable(c.seg.lbl).replace(/^./, (x) => x.toLowerCase())}.`;
  return stepLine(c.seg);
}

/* ---------------- which voice ---------------- */

// Apple's novelty and robotic voices, and the eSpeak family: never the default choice.
const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley)\b/i;

/** Higher is more natural. Premium and Enhanced voices first, then network voices, then the local English that matches the phone. */
export function voiceScore(v: { name: string; lang: string; localService?: boolean; default?: boolean }, langs: readonly string[] = []): number {
  if (!/^en\b|^en[-_]/i.test(v.lang)) return -1;
  let s = 10;
  if (/premium/i.test(v.name)) s += 60;
  else if (/enhanced|neural|natural/i.test(v.name)) s += 45;
  else if (/^Google\b/i.test(v.name)) s += 35;
  else if (/Microsoft .*Online/i.test(v.name)) s += 40;
  if (NOVELTY.test(v.name)) s -= 50;
  if (/compact|espeak/i.test(v.name)) s -= 30;
  const lang = v.lang.replace("_", "-").toLowerCase();
  const i = langs.findIndex((l) => l.toLowerCase() === lang);
  if (i >= 0) s += 12 - Math.min(i, 6);
  if (v.default) s += 3;
  return s;
}

const PICK_KEY = "brewcard.voicePick";
const synth = () => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null);
const userLangs = () => (typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : []);

/** English voices on this device, most natural first. */
export function englishVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  const langs = userLangs();
  return s.getVoices()
    .map((v) => [v, voiceScore(v, langs)] as const)
    .filter(([, sc]) => sc >= 0)
    .sort((a, b) => b[1] - a[1] || a[0].name.localeCompare(b[0].name))
    .map(([v]) => v);
}
export function savedVoice(): string {
  try { return localStorage.getItem(PICK_KEY) || ""; } catch { return ""; }
}
export function saveVoice(uri: string) {
  try { if (uri) localStorage.setItem(PICK_KEY, uri); else localStorage.removeItem(PICK_KEY); } catch {}
  voiceListeners.forEach((f) => f());
}
/** The voice to speak with: the one you picked, else the most natural one. */
export function currentVoice(): SpeechSynthesisVoice | null {
  const all = englishVoices(), pick = savedVoice();
  return all.find((v) => v.voiceURI === pick) ?? all[0] ?? null;
}
export const hasNaturalVoice = () => englishVoices().some((v) => /premium|enhanced|neural|natural|^Google\b|Online/i.test(v.name));

/* voices arrive late on most browsers: subscribe to the list */
const voiceListeners = new Set<() => void>();
let voiceVersion = 0;
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.addEventListener?.("voiceschanged", () => { voiceVersion++; voiceListeners.forEach((f) => f()); });
}
export const subscribeVoices = (f: () => void) => { voiceListeners.add(f); return () => { voiceListeners.delete(f); }; };
export const voicesVersion = () => voiceVersion + "|" + savedVoice();

/* ---------------- speaking ---------------- */
let holding: SpeechSynthesisUtterance | null = null; // Chrome drops events for utterances it can garbage-collect

export function speak(text: string, volume = 1) {
  const s = synth();
  if (!s || !text) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    const v = currentVoice();
    if (v) { u.voice = v; u.lang = v.lang; }
    // network voices already speak at a natural pace; local ones sound better a touch slower
    u.rate = v && !v.localService ? 1 : 0.95;
    u.pitch = 1;
    u.volume = Math.max(0, Math.min(1, volume));
    holding = u;
    u.onend = () => { if (holding === u) holding = null; };
    if (s.speaking || s.pending) {
      // a new step cuts the old line short; Safari drops a line spoken in the same tick as cancel()
      s.cancel();
      setTimeout(() => s.speak(u), 60);
    } else {
      s.speak(u); // straight away, so the first line still counts as part of the tap that started the brew (iOS)
    }
  } catch {}
}
