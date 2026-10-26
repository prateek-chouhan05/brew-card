import { VOLUMES } from "./data/labels";
import type { SegKind } from "./types";

/* Cue tones: a triangle wave plus a quieter octave, through a compressor with make-up gain,
   so they cut through on small phone speakers without clipping. */
let ac: AudioContext | null = null;
let master: GainNode | null = null;
let volIdx = 0;

export function ensureAudio() {
  try {
    // Let cues play with the iPhone ringer on silent, where the browser supports it.
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession && nav.audioSession.type !== "playback") nav.audioSession.type = "playback";
  } catch {}
  try {
    if (!ac) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        ac = new AC();
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -18; comp.knee.value = 6; comp.ratio.value = 8;
        comp.attack.value = 0.002; comp.release.value = 0.12;
        master = ac.createGain();
        master.gain.value = VOLUMES[volIdx].gain;
        const makeup = ac.createGain();
        makeup.gain.value = 1.5;
        master.connect(comp); comp.connect(makeup); makeup.connect(ac.destination);
      }
    }
    if (ac && ac.state === "suspended") ac.resume().catch(() => {});
  } catch {
    ac = null; master = null;
  }
}

export function setVolume(i: number) {
  volIdx = i;
  try { if (master) master.gain.value = VOLUMES[i].gain; } catch {}
}
const muted = () => VOLUMES[volIdx].gain === 0;

function beep(freq: number, dur: number, vol: number, delay = 0) {
  if (muted() || !ac || !master) return;
  try {
    const t = ac.currentTime + delay;
    for (const [f, type, mul] of [[freq, "triangle", 1], [freq * 2, "sine", 0.35]] as const) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f;
      const peak = Math.max(0.0002, vol * mul);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
      g.gain.setValueAtTime(peak, t + dur * 0.55);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
    }
  } catch {}
}

export function toneFor(kind: SegKind) {
  ensureAudio();
  if (kind === "wait") beep(784, 0.28, 0.7);
  else if (kind === "flip") { beep(784, 0.18, 0.95); beep(1175, 0.18, 0.95, 0.22); beep(1568, 0.3, 0.95, 0.44); }
  else { beep(1046, 0.18, 0.95); beep(1046, 0.22, 0.95, 0.24); }
}
export const tickTone = () => { ensureAudio(); beep(1318, 0.09, 0.6); };
export const testTone = () => { ensureAudio(); beep(1046, 0.18, 0.95); };
export function endTone() {
  ensureAudio();
  beep(880, 0.2, 0.95, 0); beep(1175, 0.2, 0.95, 0.24); beep(1568, 0.45, 0.95, 0.48); beep(1568, 0.45, 0.95, 1.05);
}

/* ---------------- screen wake lock while brewing ---------------- */
let wake: { release: () => Promise<void> } | null = null;
export function acquireWake() {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((s) => { wake = s; }, () => {});
  } catch {}
}
export function releaseWake() {
  try { wake?.release(); } catch {}
  wake = null;
}
