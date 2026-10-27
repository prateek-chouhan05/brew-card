"use client";
import { useEffect, useState } from "react";

/** Offline support: register the service worker in production builds. */
export function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
}

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** "Install app" on browsers that support it; a short how-to on iPhone/iPad. Hidden once installed. */
export function InstallButton() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showHow, setShowHow] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) { setInstalled(true); return; }
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    const onInstalled = () => { setInstalled(true); setEvt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (installed || (!evt && !ios)) return null;
  return (
    <p className="install">
      {evt ? (
        <button type="button" className="panel-act" onClick={async () => { await evt.prompt(); setEvt(null); }}>📲 Install Brew Card</button>
      ) : (
        <>
          <button type="button" className="panel-act" aria-expanded={showHow} onClick={() => setShowHow(!showHow)}>📲 Add to Home Screen</button>
          {showHow && <span className="install-how">In Safari, tap <b>Share</b> → <b>Add to Home Screen</b>. It opens full-screen and works offline for recipes you&apos;ve viewed.</span>}
        </>
      )}
    </p>
  );
}
