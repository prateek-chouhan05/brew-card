"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { FL } from "@/lib/catalog";
import { grinderShort } from "@/lib/grind";
import { mmss } from "@/lib/brew";
import { useTimer } from "@/lib/timer";
import { useBrewPrefs, useSetup } from "./providers";
import { SetupDialog } from "./SetupDialog";
import { Toaster } from "./Toast";
import { VoiceCues } from "./BrewExtras";
import { useServiceWorker } from "./Pwa";
import { BrandMark, Icon, RoastSwatch, TasteMark } from "./Icon";

type View = "recipes" | "brew" | "guides";
function viewOf(path: string): View {
  if (path.startsWith("/guides")) return "guides";
  if (path.startsWith("/recipes/") || path.startsWith("/brew")) return "brew";
  return "recipes";
}

/** "1:23" with a timer (or pause) icon while a brew is running or paused, so it's never lost while browsing. */
function LiveBadge() {
  const t = useTimer();
  if (!t.active) return null;
  return <span className="live"><Icon name={t.running ? "timer" : "pause"} />{mmss(t.elapsed())}</span>;
}

function useNav() {
  const t = useTimer();
  const { lastEntry } = useBrewPrefs();
  const brewHref = "/recipes/" + (t.active && t.brew ? t.brew.id : lastEntry);
  return [
    { id: "recipes" as const, href: "/", label: "Recipes", icon: "search" as const },
    { id: "brew" as const, href: brewHref, label: "Brew", icon: "timer" as const },
    { id: "guides" as const, href: "/guides", label: "Guides", icon: "guides" as const },
  ];
}

function SetupChip() {
  const { grinder, roast, flavour, words, welcome, openSetup } = useSetup();
  const f = flavour ? FL[flavour] : null;
  // a first visit hasn't picked anything yet, so show no defaults as if they had
  const label = welcome ? "Coffee setup: not set yet. Set up" : `Coffee setup: ${words ? "ready-ground coffee" : grinder.name}, ${roast.label} roast${f ? ", " + f.label + " beans" : ", no flavour preference"}. Change setup`;
  return (
    <button type="button" className="setup-chip" id="setupBtn" aria-haspopup="dialog" aria-label={label} onClick={() => openSetup()}>
      <Icon name="setup" />
      <span className="sc-txt">
        <span className="sc-lbl">Setup</span>{" "}
        {welcome ? <span id="setupSum">Not set yet</span> : <span id="setupSum">
          {words ? "Ground" : grinderShort(grinder)} · <RoastSwatch id={roast.id} />
          <span className="sc-long"> {roast.label}</span>
          {f && (<> · <TasteMark id={f.id} /><span className="sc-long"> {f.label}</span></>)}
        </span>}
      </span>
    </button>
  );
}

let prevPath: string | null = null;
/** The page you were on before this one (inside the app). */
export const previousPath = () => prevPath;

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() || "/";
  const view = viewOf(path);
  const cur = useRef<string | null>(null);
  useEffect(() => { prevPath = cur.current; cur.current = path; }, [path]);
  const nav = useNav();
  useServiceWorker();
  return (
    <>
      <header className="topbar">
        <div className="shell">
          <Link href="/" className="brand" aria-label="Brew Card, go to Recipes">
            <BrandMark />
            <span className="b-name">Brew Card</span>
          </Link>
          <nav className="mainnav" aria-label="Main">
            {nav.map((n) => (
              <Link key={n.id} href={n.href} data-go={n.id} aria-current={view === n.id ? "page" : undefined}>
                <Icon name={n.icon} />
                {n.label}
                {n.id === "brew" && <LiveBadge />}
              </Link>
            ))}
          </nav>
          <SetupChip />
        </div>
      </header>

      <main id="main" className="shell">{children}</main>

      <nav className="tabbar" aria-label="Main">
        {nav.map((n) => (
          <Link key={n.id} href={n.href} data-go={n.id} aria-current={view === n.id ? "page" : undefined}>
            <Icon name={n.icon} />
            <span>
              {n.label}
              {n.id === "brew" && <LiveBadge />}
            </span>
            <span className="tb-dot" />
          </Link>
        ))}
      </nav>
      <SetupDialog />
      <Toaster />
      <VoiceCues />
    </>
  );
}
