"use client";
import { useEffect, useRef } from "react";

/**
 * Drive a native <dialog> as a modal from React state.
 * Esc and a tap on the backdrop call onDismiss; focus returns to whatever opened it.
 */
export function useModal(open: boolean, onDismiss: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      returnFocus.current = document.activeElement;
      try { d.showModal(); } catch { d.setAttribute("open", ""); }
    } else if (!open && d.open) {
      try { d.close(); } catch { d.removeAttribute("open"); }
      const f = returnFocus.current as HTMLElement | null;
      if (f && f.focus && document.body.contains(f)) { try { f.focus({ preventScroll: true }); } catch {} }
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => { e.preventDefault(); dismiss.current(); };
    const onClick = (e: MouseEvent) => { if (e.target === d) dismiss.current(); };
    d.addEventListener("cancel", onCancel);
    d.addEventListener("click", onClick);
    return () => { d.removeEventListener("cancel", onCancel); d.removeEventListener("click", onClick); };
  }, []);

  return ref;
}
