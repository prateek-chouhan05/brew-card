import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: { default: "Brew Card", template: "%s · Brew Card" },
  description:
    "AeroPress and moka pot brew card: recipes matched to your bean's roast and flavour, grind settings for 16 grinders, and a phase-by-phase timer.",
  appleWebApp: { capable: true, title: "Brew Card" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf7f8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>
            {children}
            <footer className="site-foot">
              <p>
                The recipe library is an index: each recipe links to its original page on{" "}
                <a href="https://aeroprecipe.com/recipes" target="_blank" rel="noopener">aeroprecipe.com</a> (or aeropress.com), where the full recipe
                and its author&apos;s credit live. The flavour tags and notes are my own. Grinder settings are derived from{" "}
                <a href="https://brewmark.io/grinders" target="_blank" rel="noopener">brewmark.io</a>&apos;s published charts. The Clean &amp; Clear method
                follows James Hoffmann&apos;s Ultimate AeroPress recipe, with water temperature set by your roast. Every setting is a starting point, not a rule.
              </p>
            </footer>
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
