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
import { VoiceCues } from "./BrewExtras";
import { useServiceWorker } from "./Pwa";

type View = "recipes" | "brew" | "guides";
function viewOf(path: string): View {
  if (path.startsWith("/guides")) return "guides";
  if (path.startsWith("/recipes/") || path.startsWith("/brew")) return "brew";
  return "recipes";
}

/** "⏱ 1:23" while a brew is running or paused, so it's never lost while browsing. */
function LiveBadge() {
  const t = useTimer();
  if (!t.active) return null;
  return <span className="live">{(t.running ? "⏱ " : "⏸ ") + mmss(t.elapsed())}</span>;
}

function useNav() {
  const t = useTimer();
  const { lastEntry } = useBrewPrefs();
  const brewHref = "/recipes/" + (t.active && t.brew ? t.brew.id : lastEntry);
  return [
    { id: "recipes" as const, href: "/", label: "Recipes", emoji: "🔍" },
    { id: "brew" as const, href: brewHref, label: "Brew", emoji: "⏱️" },
    { id: "guides" as const, href: "/guides", label: "Guides", emoji: "📖" },
  ];
}

function SetupChip() {
  const { grinder, roast, flavour, openSetup } = useSetup();
  const f = flavour ? FL[flavour] : null;
  const label = `Coffee setup: ${grinder.name}, ${roast.label} roast${f ? ", " + f.label + " beans" : ", no flavour preference"}. Change setup`;
  return (
    <button type="button" className="setup-chip" id="setupBtn" aria-haspopup="dialog" aria-label={label} onClick={() => openSetup(false)}>
      <span className="emoji" aria-hidden="true">⚙️</span>
      <span className="sc-txt">
        <span className="sc-lbl">Setup</span>{" "}
        <span id="setupSum">
          {grinderShort(grinder)} · {roast.emoji}
          <span className="sc-long"> {roast.label}</span>
          {f && (<> · {f.emoji}<span className="sc-long"> {f.label}</span></>)}
        </span>
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
            <span className="emoji" aria-hidden="true">☕</span>
            <span className="b-name">Brew Card</span>
          </Link>
          <nav className="mainnav" aria-label="Main">
            {nav.map((n) => (
              <Link key={n.id} href={n.href} data-go={n.id} aria-current={view === n.id ? "page" : undefined}>
                <span className="emoji" aria-hidden="true">{n.emoji}</span>
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
            <span className="emoji" aria-hidden="true">{n.emoji}</span>
            <span>
              {n.label}
              {n.id === "brew" && <LiveBadge />}
            </span>
            <span className="tb-dot" />
          </Link>
        ))}
      </nav>
      <SetupDialog />
      <VoiceCues />
    </>
  );
}
