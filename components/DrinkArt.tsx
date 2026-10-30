"use client";
import { useId } from "react";
import type { Entry } from "@/lib/types";
import { InvArt, StdArt } from "./Art";

/* ------------------------------------------------------------------------------------------
   Recipe illustrations, drawn in the same hand as the icons and the app mark: one ink outline
   (round joins), flat fills from the coffee palette, and the crema band from the logo on every
   coffee surface. Glass vessels show their layers; ceramic, steel and clay show only the surface,
   the way you'd see them on the table. Each drink is a vessel plus layers (bottom → top).
   ------------------------------------------------------------------------------------------ */

const C = {
  espresso: "#2e1b10", crema: "#c99a63", coffee: "#3f2416", light: "#7b4a26", coldbrew: "#33200f",
  latte: "#c9a17a", flatwhite: "#b98a5f", kaapi: "#a9764e", frappe: "#c79d74", aulait: "#b07f57",
  milk: "#f6efe5", foam: "#fffaf2", cream: "#fff6e6", icecream: "#f7ebd2", condensed: "#ecd7a6",
  chocolate: "#4a2618", egg: "#efd08b", cola: "#4a1a10", tonic: "#e3eee9", lemonade: "#f1e59b",
  martini: "#3a2217", whiskey: "#5a3219",
} as const;
type Fill = keyof typeof C;
/** surfaces that carry a crema band, like the bowl of the b */
const CREMA_TOP = new Set<Fill>(["espresso", "coffee", "coldbrew", "light", "martini"]);

const CERAMIC = "#fffdfa", STEEL = "#d9dee2", STEEL_LIGHT = "#eef1f3", CLAY = "#c46a3d", WINE = "#8a2846";

type Vessel = "demitasse" | "cup" | "mug" | "latte" | "rocks" | "highball" | "cortado" | "bowl" | "martini" | "irish" | "kaapi" | "jar" | "olla";
interface Spec {
  v: Vessel;
  /** liquid layers, bottom to top, as fractions of the vessel's inside height */
  layers: [Fill, number][];
  ice?: number;
  whip?: boolean;
  scoop?: boolean;
  art?: "heart" | "dust" | "dot" | "swirl";
  garnish?: "lemon" | "orange" | "beans" | "cinnamon";
  straw?: boolean;
  steam?: boolean;
}

/* inside (clip) and outline paths for each vessel, in a 120×120 box. `body` marks an opaque vessel. */
const V: Record<Vessel, { inner: string; outer: string; top: number; bottom: number; x: [number, number]; /** frame [x, y, size] so small vessels fill the tile like tall ones */ vb?: [number, number, number]; body?: string; under?: React.ReactNode; over?: React.ReactNode }> = {
  demitasse: { inner: "M44 63 H76 L72 89 Q60 93 48 89 Z", outer: "M42 60 H78 L73 91 Q60 96 47 91 Z", top: 60, bottom: 92, x: [42, 78], vb: [24, 34, 72], body: CERAMIC,
    under: <><path className="da-ink" d="M77 66 c10 0 10 13 -2 14" fill="none" /><path className="da-ink" d="M33 99 Q60 104 87 99" fill="none" /></> },
  cup: { inner: "M30 53 H90 L83 82 Q60 93 37 82 Z", outer: "M28 50 H92 L84 84 Q60 97 36 84 Z", top: 50, bottom: 90, x: [28, 92], vb: [18, 22, 88], body: CERAMIC,
    under: <><path className="da-ink" d="M90 58 c14 0 13 18 -5 18" fill="none" /><path className="da-ink" d="M20 99 Q60 106 100 99" fill="none" /></> },
  mug: { inner: "M34 39 H80 V87 Q57 91 34 87 Z", outer: "M32 36 H82 V89 Q57 95 32 89 Z", top: 36, bottom: 92, x: [32, 82], vb: [19, 9, 88], body: CERAMIC,
    under: <path className="da-ink" d="M82 47 c17 0 17 30 0 30" fill="none" /> },
  olla: { inner: "M36 41 H84 Q88 68 80 90 Q60 96 40 90 Q32 68 36 41 Z", outer: "M34 38 H86 Q91 68 82 92 Q60 99 38 92 Q29 68 34 38 Z", top: 38, bottom: 94, x: [34, 86], vb: [16, 8, 96], body: CLAY,
    under: <path className="da-ink" d="M87 50 c12 1 11 20 -3 20" fill="none" /> },
  kaapi: { inner: "M44 25 H76 L73 76 H47 Z", outer: "M42 22 H78 L75 78 H45 Z", top: 22, bottom: 78, x: [42, 78], body: STEEL,
    over: <path className="da-ink" d="M24 79 H96 L89 99 H31 Z" fill={STEEL} /> },
  latte: { inner: "M41 25 H79 L76 97 H44 Z", outer: "M38 22 H82 L78 100 H42 Z", top: 25, bottom: 97, x: [41, 79] },
  rocks: { inner: "M33 49 H87 L83 95 H37 Z", outer: "M30 46 H90 L86 98 H34 Z", top: 49, bottom: 95, x: [33, 87], vb: [21, 24, 80] },
  highball: { inner: "M42 15 H78 L76 99 H44 Z", outer: "M39 12 H81 L79 102 H41 Z", top: 15, bottom: 99, x: [42, 78] },
  cortado: { inner: "M43 55 H77 L74 95 H46 Z", outer: "M40 52 H80 L77 98 H43 Z", top: 55, bottom: 95, x: [43, 77], vb: [26, 41, 68] },
  bowl: { inner: "M29 51 H91 Q89 83 60 85 Q31 83 29 51 Z", outer: "M26 48 H94 Q92 88 60 90 Q28 88 26 48 Z", top: 51, bottom: 85, x: [29, 91], vb: [19, 26, 82],
    under: <path className="da-ink" d="M47 89 h26 l3 9 h-32 z" fill="rgba(255,255,255,.7)" /> },
  martini: { inner: "M26 31 H94 L60 64 Z", outer: "M22 28 H98 L60 68 Z", top: 31, bottom: 64, x: [26, 94],
    under: <path className="da-ink" d="M60 68 V99 M44 100 H76" fill="none" /> },
  irish: { inner: "M41 25 H79 L75 75 Q60 81 45 75 Z", outer: "M38 22 H82 L78 78 Q60 85 42 78 Z", top: 25, bottom: 79, x: [41, 79],
    under: <><path className="da-ink" d="M60 84 V99 M46 100 H74" fill="none" /><path className="da-ink" d="M81 32 c13 1 12 21 -3 21" fill="none" /></> },
  jar: { inner: "M37 31 H83 V94 Q60 98 37 94 Z", outer: "M34 28 H86 V96 Q60 101 34 96 Z", top: 31, bottom: 97, x: [37, 83],
    over: <rect className="da-ink" x="31" y="17" width="58" height="11" rx="3" fill="#c8ad80" /> },
};

const DRINK: Record<string, Spec> = {
  affogato: { v: "bowl", layers: [["espresso", 0.35]], scoop: true },
  americano: { v: "mug", layers: [["coffee", 0.9]], steam: true },
  cappuccino: { v: "cup", layers: [["foam", 1]], art: "dust", steam: true },
  latte: { v: "latte", layers: [["latte", 0.72], ["foam", 0.14]], steam: true },
  "flat-white": { v: "cup", layers: [["flatwhite", 1]], art: "heart", steam: true },
  cortado: { v: "cortado", layers: [["espresso", 0.4], ["latte", 0.42], ["foam", 0.06]] },
  macchiato: { v: "demitasse", layers: [["espresso", 1]], art: "dot", steam: true },
  mocha: { v: "mug", layers: [["latte", 1]], whip: true, art: "dust" },
  "con-panna": { v: "demitasse", layers: [["espresso", 1]], whip: true },
  "cafe-bombon": { v: "cortado", layers: [["condensed", 0.42], ["espresso", 0.45]] },
  "spanish-latte-home": { v: "highball", layers: [["condensed", 0.14], ["milk", 0.46], ["coffee", 0.22]], ice: 4, straw: true },
  "iced-latte-home": { v: "highball", layers: [["milk", 0.55], ["coffee", 0.28]], ice: 4, straw: true },
  "iced-americano-home": { v: "highball", layers: [["coffee", 0.86]], ice: 4 },
  "espresso-tonic": { v: "highball", layers: [["tonic", 0.55], ["espresso", 0.28]], ice: 4, garnish: "orange" },
  shakerato: { v: "martini", layers: [["espresso", 0.75], ["crema", 0.2]] },
  "freddo-cappuccino": { v: "rocks", layers: [["espresso", 0.45], ["foam", 0.4]], ice: 3, straw: true },
  "espresso-martini": { v: "martini", layers: [["martini", 0.86]], garnish: "beans" },
  "irish-coffee": { v: "irish", layers: [["whiskey", 0.68], ["cream", 0.24]] },
  "ca-phe-sua-da": { v: "rocks", layers: [["condensed", 0.22], ["coffee", 0.6]], ice: 3 },
  "bac-xiu": { v: "highball", layers: [["condensed", 0.14], ["milk", 0.5], ["coffee", 0.2]], ice: 4, straw: true },
  "egg-coffee": { v: "cup", layers: [["egg", 1]], art: "dust", steam: true },
  "filter-kaapi": { v: "kaapi", layers: [["kaapi", 1]], art: "swirl", steam: true },
  dalgona: { v: "latte", layers: [["milk", 0.6], ["frappe", 0.26]], ice: 3 },
  "cold-brew-drink": { v: "highball", layers: [["coldbrew", 0.86]], ice: 4 },
  "sweet-cream-cold-brew": { v: "highball", layers: [["coldbrew", 0.6], ["cream", 0.24]], ice: 4, straw: true },
  "coffee-lemonade": { v: "highball", layers: [["lemonade", 0.5], ["coffee", 0.32]], ice: 4, garnish: "lemon" },
  "cafe-au-lait": { v: "mug", layers: [["aulait", 1]], steam: true },
  "red-eye": { v: "mug", layers: [["coffee", 1]], art: "dot", steam: true },
  "cafe-de-olla": { v: "olla", layers: [["coffee", 1]], garnish: "cinnamon", steam: true },
  "coffee-frappe": { v: "highball", layers: [["frappe", 0.82]], whip: true, straw: true },
};

const HOUSE_ART: Record<string, Spec | "moka"> = {
  "my-clean": { v: "cup", layers: [["light", 1]], steam: true },
  "my-everyday": { v: "mug", layers: [["coffee", 1]], steam: true },
  "my-bypass": { v: "latte", layers: [["coffee", 0.8]], steam: true },
  "my-milk": { v: "latte", layers: [["latte", 0.7], ["foam", 0.12]], steam: true },
  "my-espresso": { v: "demitasse", layers: [["espresso", 1]], steam: true },
  "my-moka": "moka",
  "my-coldbrew": { v: "jar", layers: [["coldbrew", 0.82]] },
  "my-coke": { v: "highball", layers: [["cola", 0.55], ["coffee", 0.26]], ice: 4 },
};

/** Steam in the same three strokes as the "hot" icon. */
function Steam({ cx, y }: { cx: number; y: number }) {
  return (
    <g className="da-steam" aria-hidden="true">
      {[-9, 0, 9].map((dx, i) => <path key={i} d={`M${cx + dx} ${y - (i === 1 ? 4 : 1)} c-5 -5 5 -9 0 -15`} />)}
    </g>
  );
}

function Glass({ s, title }: { s: Spec; title: string }) {
  const v = V[s.v];
  const id = "da" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const H = v.bottom - v.top;
  let y = v.bottom;
  const rects = s.layers.map(([fill, f], i) => {
    const h = f * H;
    y -= h;
    return <rect key={i} x="0" y={y} width="120" height={h + 0.6} fill={C[fill]} />;
  });
  const surfaceY = y;
  const [x0, x1] = v.x;
  const cx = (x0 + x1) / 2;
  const vb = v.vb ?? [0, 0, 120];
  const topFill: Fill = s.layers.length ? s.layers[s.layers.length - 1][0] : "coffee";

  // ice cubes, tumbling down from the surface
  const cubes = [];
  for (let i = 0; i < (s.ice || 0); i++) {
    const col = i % 3;
    const bx = col === 0 ? x0 + 4 : col === 1 ? x1 - 17 : cx - 6;
    const by = surfaceY - 4 + Math.floor(i / 3) * 15 + col * 7;
    cubes.push(<rect key={i} className="da-ice" x={bx} y={by} width="12" height="11" rx="2.5" transform={`rotate(${(i % 2 ? 1 : -1) * 12} ${bx + 6} ${by + 5})`} />);
  }

  return (
    <svg viewBox={`${vb[0]} ${vb[1]} ${vb[2]} ${vb[2]}`} role="img" aria-label={title} className="drink-art" style={{ strokeWidth: 3 * vb[2] / 120 }}>
      <defs><clipPath id={id}><path d={v.inner} /></clipPath></defs>
      {s.steam && <Steam cx={cx} y={s.whip || s.scoop ? v.top - 10 : v.top - 5} />}
      {v.under}
      {v.body ? (
        <>
          <path d={v.outer} fill={v.body} className="da-ink" />
          {/* the surface, seen from just above, with a crema ring on coffee */}
          <ellipse cx={cx} cy={v.top + 3} rx={(x1 - x0) / 2 - 4} ry="4" fill={C[topFill]}
            stroke={CREMA_TOP.has(topFill) ? C.crema : "none"} strokeWidth="2" />
          {s.art === "heart" && <path d={`M${cx} ${v.top + 5.5} c-5 -2 -7 -5 -3 -6 c2 0 3 1 3 2 c0 -1 1 -2 3 -2 c4 1 2 4 -3 6`} fill={C.foam} />}
          {s.art === "dot" && <ellipse cx={cx} cy={v.top + 3} rx="5" ry="1.8" fill={C.foam} />}
          {s.art === "swirl" && <path d={`M${cx - 10} ${v.top + 2.5} q10 3 20 0`} stroke={C.foam} strokeWidth="2" fill="none" strokeLinecap="round" />}
          {s.art === "dust" && !s.whip && [-8, -3, 1, 6, 10, -5, 4].map((dx, i) => <circle key={i} cx={cx + dx} cy={v.top + 2 + (i % 3)} r="1" fill="#7a4a2a" />)}
        </>
      ) : (
        <>
          <path d={v.outer} className="da-glass" />
          <g clipPath={`url(#${id})`}>
            {rects}
            {CREMA_TOP.has(topFill) && s.layers.length > 0 && <rect x="0" y={surfaceY} width="120" height="3.5" fill={C.crema} />}
            {cubes}
          </g>
          <path d={v.outer} className="da-ink" fill="none" />
        </>
      )}
      {v.over}
      {s.scoop && (
        <g className="da-ink">
          <circle cx="53" cy={v.top + 2} r="13" fill={C.icecream} />
          <circle cx="68" cy={v.top + 5} r="11" fill={C.icecream} />
          <path d={`M47 ${v.top + 9} q11 8 25 1`} stroke={C.espresso} fill="none" />
        </g>
      )}
      {s.whip && (
        <path className="da-ink" d={`M${cx - 22} ${v.top + 2} q1 -10 10 -8 q4 -10 14 -6 q8 -8 14 2 q9 -1 6 12 Z`} fill={C.cream} />
      )}
      {s.whip && s.art === "dust" && [-8, -2, 4, 10].map((dx, i) => <circle key={i} cx={cx + dx} cy={v.top - 5 + (i % 2) * 2} r="1" fill="#7a4a2a" />)}
      {s.straw && <path d={`M${x1 - 9} ${v.bottom - 12} L${x1 + 5} ${v.top - 13}`} stroke={WINE} strokeWidth="4" strokeLinecap="round" />}
      {(s.garnish === "lemon" || s.garnish === "orange") && (
        <g className="da-ink" transform={`translate(${x1 - 1} ${v.top + 3})`}>
          <circle r="9" fill={s.garnish === "lemon" ? "#f2d55a" : "#f0a04b"} />
          <path d="M0 -9 V9 M-9 0 H9 M-6.4 -6.4 L6.4 6.4 M6.4 -6.4 L-6.4 6.4" stroke="#fff3c9" strokeWidth="1.2" />
        </g>
      )}
      {s.garnish === "beans" && [-8, 0, 8].map((dx, i) => (
        <ellipse key={i} cx={cx + dx} cy={surfaceY + 1.5} rx="3.2" ry="2.2" fill="#2e1b10" transform={`rotate(${i * 25 - 25} ${cx + dx} ${surfaceY + 1.5})`} />
      ))}
      {s.garnish === "cinnamon" && <rect className="da-ink" x="66" y={v.top - 18} width="6" height="28" rx="2" fill="#9a5a2e" transform={`rotate(20 69 ${v.top})`} />}
    </svg>
  );
}

/** Moka pot: faceted steel chambers, black handle and knob, on a low flame. */
function MokaArt({ title }: { title: string }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={title} className="drink-art" style={{ strokeWidth: 3 }}>
      <g className="da-ink">
        {/* boiler */}
        <path d="M42 66 H78 L86 97 H34 Z" fill={STEEL} />
        <path d="M54 66 H66 L69 97 H51 Z" fill={STEEL_LIGHT} stroke="none" />
        <path d="M42 66 H78 L86 97 H34 Z" fill="none" />
        {/* waist */}
        <path d="M45 59 H75 V66 H45 Z" fill="#b4bbc1" />
        {/* collector */}
        <path d="M45 59 L37 28 H83 L75 59 Z" fill={STEEL} />
        <path d="M54 59 L52 28 H68 L66 59 Z" fill={STEEL_LIGHT} stroke="none" />
        <path d="M45 59 L37 28 H83 L75 59 Z" fill="none" />
        {/* spout and lid */}
        <path d="M39 33 L26 23 L38 27" fill={STEEL} />
        <path d="M35 28 Q60 15 85 28 Z" fill="#c3c9ce" />
      </g>
      <circle cx="60" cy="16" r="4" fill="var(--da-ink)" />
      <path d="M83 33 h9 a4 4 0 0 1 4 4 v13 a4 4 0 0 1 -4 4 h-12" fill="none" stroke="var(--da-ink)" strokeWidth="6" strokeLinejoin="round" />
      {/* low flame */}
      <g className="da-flame">
        {[44, 60, 76].map((x) => <path key={x} d={`M${x} 106 c-4 0 -5 -4 -2 -7 c0 2 1 3 2 3 c0 -2 1 -4 3 -5 c1 3 3 5 3 6 c0 2 -2 3 -6 3 z`} fill="#e3893a" />)}
      </g>
      <path className="da-ink" d="M28 108 H92" fill="none" />
    </svg>
  );
}

/** The picture for any recipe: a drink in its glass, your method's cup, or an AeroPress for library recipes. */
export function RecipeArt({ entry, className }: { entry: Entry; className?: string }) {
  const title = entry.name;
  let inner: React.ReactNode;
  if (entry.kind === "drink") inner = <Glass s={DRINK[entry.id] ?? { v: "mug", layers: [["coffee", 1]] }} title={title} />;
  else if (entry.kind === "house") {
    const a = HOUSE_ART[entry.id];
    inner = a === "moka" ? <MokaArt title={title} /> : <Glass s={a ?? { v: "mug", layers: [["coffee", 1]] }} title={title} />;
  } else inner = <span className="ap-mini" role="img" aria-label={`${title}, AeroPress ${entry.o === "inverted" ? "inverted" : "on the mug"}`}>{entry.o === "inverted" ? <InvArt /> : <StdArt />}</span>;
  return <span className={"recipe-art" + (className ? " " + className : "")}>{inner}</span>;
}

export const DRINK_IDS_WITH_ART = Object.keys(DRINK);
