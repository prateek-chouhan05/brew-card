"use client";
import { useSyncExternalStore } from "react";
import { acquireWake, endTone, ensureAudio, releaseWake, tickTone, toneFor } from "./audio";
import type { Orientation, TimedSeg } from "./types";

export interface Cue { type: "phase" | "flipSoon" | "done"; seg: TimedSeg; idx: number }

/** What the timer is running: a snapshot of one recipe's phases. */
export interface TimerBrew {
  id: string;
  name: string;
  emoji: string;
  segs: TimedSeg[];
  o: Orientation;
  /** changes when dose or orientation changes, so a stale run is reset */
  key: string;
}

/**
 * One phase timer for the whole app. It lives outside React so a brew keeps running while you
 * browse other pages; components subscribe to it for re-renders.
 */
class TimerEngine {
  brew: TimerBrew | null = null;
  marks: number[] = [];
  total = 0;
  running = false;
  finished = false;
  startedAt = 0;
  pausedAccum = 0;
  pausedAt = 0;
  private firedIdx = -1;
  private lastCountdown = -1;
  private tickId: ReturnType<typeof setInterval> | null = null;
  private version = 0;
  private listeners = new Set<() => void>();
  private finishers = new Set<(id: string) => void>();
  private cueFns = new Set<(c: Cue) => void>();
  private flipWarned = false;
  /** called with the recipe id when a run completes */
  onFinish = (fn: (id: string) => void) => { this.finishers.add(fn); return () => { this.finishers.delete(fn); }; };
  /** phase changes, the flip warning and the end — for spoken cues */
  onCue = (fn: (c: Cue) => void) => { this.cueFns.add(fn); return () => { this.cueFns.delete(fn); }; };
  private cue(c: Cue) { this.cueFns.forEach((f) => f(c)); }

  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  getVersion = () => this.version;
  private emit() { this.version++; this.listeners.forEach((l) => l()); }

  /** True when this brew (same recipe, dose and orientation) is the one loaded in the timer. */
  owns(b: TimerBrew) { return !!this.brew && this.brew.key === b.key; }
  /** A run is in progress (started and not finished), for any recipe. */
  get active() { return !!this.brew && this.startedAt > 0 && !this.finished; }

  elapsed(): number {
    if (!this.startedAt) return 0;
    const base = this.running ? performance.now() : this.pausedAt;
    return (base - this.startedAt - this.pausedAccum) / 1000;
  }
  segIndexAt(t: number) {
    let idx = 0;
    this.marks.forEach((m, i) => { if (t + 0.0001 >= m) idx = i; });
    return idx;
  }

  private load(b: TimerBrew) {
    this.stopInterval();
    this.brew = b;
    this.marks = [];
    this.total = 0;
    for (const s of b.segs) { this.marks.push(this.total); this.total += s.dur; }
    this.running = false; this.finished = false; this.startedAt = 0; this.pausedAccum = 0; this.pausedAt = 0;
    this.firedIdx = -1; this.lastCountdown = -1; this.flipWarned = false;
    releaseWake();
  }

  start(b: TimerBrew) {
    ensureAudio();
    if (!this.owns(b) || this.finished) this.load(b);
    if (!this.startedAt) {
      this.startedAt = performance.now(); this.pausedAccum = 0; this.firedIdx = 0; this.lastCountdown = -1;
      toneFor(b.segs[0].k);
      this.cue({ type: "phase", seg: b.segs[0], idx: 0 });
    } else {
      this.pausedAccum += performance.now() - this.pausedAt;
    }
    this.running = true;
    acquireWake();
    this.stopInterval();
    this.tickId = setInterval(this.tick, 100);
    this.emit();
  }
  pause() {
    if (!this.running) return;
    this.running = false; this.pausedAt = performance.now();
    this.stopInterval(); releaseWake(); this.emit();
  }
  /** Reset to the beginning (keeps the recipe loaded). */
  reset() {
    if (this.brew) this.load(this.brew);
    this.emit();
  }
  /** Drop the run if it belongs to this recipe but its dose/orientation changed. */
  invalidate(id: string, key: string) {
    if (this.brew && this.brew.id === id && this.brew.key !== key) {
      this.load(this.brew);
      this.brew = null;
      this.emit();
    }
  }

  private stopInterval() { if (this.tickId) { clearInterval(this.tickId); this.tickId = null; } }

  private tick = () => {
    const b = this.brew;
    if (!b) return;
    const t = this.elapsed(), idx = this.segIndexAt(Math.min(t, this.total));
    if (t < this.total && idx > this.firedIdx) { this.firedIdx = idx; this.lastCountdown = -1; toneFor(b.segs[idx].k); this.cue({ type: "phase", seg: b.segs[idx], idx }); }
    const nxt = b.segs[idx + 1];
    if (!this.flipWarned && nxt && nxt.k === "flip" && this.marks[idx + 1] - t <= 10 && this.marks[idx + 1] - t > 0) {
      this.flipWarned = true;
      this.cue({ type: "flipSoon", seg: nxt, idx: idx + 1 });
    }
    if (!this.finished && t < this.total) {
      const sg = b.segs[idx], left = Math.ceil(this.marks[idx] + sg.dur - t);
      if (sg.k !== "wait" && left <= 3 && left >= 1 && left !== this.lastCountdown) { this.lastCountdown = left; tickTone(); }
    }
    if (!this.finished && t >= this.total) {
      this.finished = true; this.running = false;
      this.stopInterval(); releaseWake(); endTone();
      this.cue({ type: "done", seg: b.segs[b.segs.length - 1], idx: b.segs.length - 1 });
      this.finishers.forEach((f) => f(b.id));
    }
    this.emit();
  };
}

export const timer = new TimerEngine();

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && timer.running) acquireWake();
  });
}

/** Re-render on every timer change. */
export function useTimer() {
  useSyncExternalStore(timer.subscribe, timer.getVersion, () => 0);
  return timer;
}
