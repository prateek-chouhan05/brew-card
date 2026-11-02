"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

interface Msg { id: number; text: string; action?: { label: string; run: () => void } }
let seq = 0;

/** Show a short message at the bottom of the screen, with an optional action such as Undo. */
export function toast(text: string, action?: Msg["action"]) {
  window.dispatchEvent(new CustomEvent<Msg>("bc:toast", { detail: { id: ++seq, text, action } }));
}

export function Toaster() {
  const [msg, setMsg] = useState<Msg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const on = (e: Event) => {
      const m = (e as CustomEvent<Msg>).detail;
      setMsg(m);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMsg((cur) => (cur?.id === m.id ? null : cur)), 6000);
    };
    window.addEventListener("bc:toast", on);
    return () => { window.removeEventListener("bc:toast", on); if (timer.current) clearTimeout(timer.current); };
  }, []);
  return (
    <div className="toast-zone" role="status" aria-live="polite">
      {msg && (
        <div className="toast" key={msg.id}>
          <Icon name="check" />
          <span>{msg.text}</span>
          {msg.action && <button type="button" onClick={() => { msg.action!.run(); setMsg(null); }}>{msg.action.label}</button>}
        </div>
      )}
    </div>
  );
}
