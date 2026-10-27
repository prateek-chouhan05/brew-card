"use client";
import { useId } from "react";
import type { Entry } from "@/lib/types";
import { InvArt, StdArt } from "./Art";

/* ------------------------------------------------------------------------------------------
   Drink illustrations. Each drink is described as a vessel plus layers (bottom → top), so all
   38 pictures share one style. Glass vessels show their layers; ceramic and steel ones show
   only the surface, the way you'd see them on the table.
   ------------------------------------------------------------------------------------------ */

const C = {
  espresso: "#2e1b10", crema: "#b5743c", coffee: "#4a2c1a", light: "#7b4a26", coldbrew: "#3a2214",
  latte: "#c9a17a", flatwhite: "#b98a5f", kaapi: "#a9764e", frappe: "#c79d74", aulait: "#b07f57",
  milk: "#f6efe5", foam: "#fcf9f3", cream: "#fff8ec", icecream: "#f7ebd2", condensed: "#efdcb0",
  chocolate: "#4a2618", egg: "#efd08b", cola: "#2b130b", tonic: "#e6efeb", lemonade: "#f1e59b",
  martini: "#3a2217", whiskey: "#4d2b16",
} as const;
type Fill = keyof typeof C;

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

/* inside (clip) and outline paths for each vessel, in a 120×120 box */
const V: Record<Vessel, { inner: string; outer: string; top: number; bottom: number; x: [number, number]; opaque?: string; extra?: React.ReactNode }> = {
  demitasse: { inner: "M44 62 H76 L72 90 Q60 93 48 90 Z", outer: "M42 60 H78 L73 92 Q60 96 47 92 Z", top: 62, bottom: 92, x: [44, 76], opaque: "#fffdf9",
    extra: <><path className="da-line" d="M77 66 q11 1 8 11 q-2 6 -10 6" fill="none" /><ellipse className="da-saucer" cx="60" cy="97" rx="27" ry="4" /></> },
  cup: { inner: "M30 52 H90 L83 82 Q60 94 37 82 Z", outer: "M28 50 H92 L84 84 Q60 98 36 84 Z", top: 52, bottom: 90, x: [30, 90], opaque: "#fffdf9",
    extra: <><path className="da-line" d="M90 58 q14 2 10 15 q-3 7 -14 6" fill="none" /><ellipse className="da-saucer" cx="60" cy="98" rx="38" ry="5" /></> },
  mug: { inner: "M34 38 H80 V88 Q57 92 34 88 Z", outer: "M32 36 H82 V90 Q57 95 32 90 Z", top: 38, bottom: 92, x: [34, 80], opaque: "#fffdf9",
    extra: <path className="da-line" d="M82 48 q16 0 16 16 q0 15 -16 15" fill="none" /> },
  olla: { inner: "M36 40 H84 Q88 68 80 90 Q60 96 40 90 Q32 68 36 40 Z", outer: "M34 38 H86 Q91 68 82 92 Q60 99 38 92 Q29 68 34 38 Z", top: 40, bottom: 94, x: [36, 84], opaque: "#c56a3c",
    extra: <path d="M86 50 q12 2 10 14 q-2 8 -12 8" fill="none" stroke="#9c4f2a" strokeWidth="3" /> },
  kaapi: { inner: "M44 24 H76 L73 76 H47 Z", outer: "M42 22 H78 L75 78 H45 Z", top: 24, bottom: 78, x: [44, 76], opaque: "#c9cfd4",
    extra: <path d="M24 78 H96 L89 98 H31 Z" fill="#dde2e6" stroke="#8d949b" strokeWidth="2" strokeLinejoin="round" /> },
  latte: { inner: "M40 24 H80 L77 98 H43 Z", outer: "M38 22 H82 L78 100 H42 Z", top: 24, bottom: 98, x: [40, 80] },
  rocks: { inner: "M32 48 H88 L84 96 H36 Z", outer: "M30 46 H90 L86 98 H34 Z", top: 48, bottom: 96, x: [32, 88] },
  highball: { inner: "M41 14 H79 L77 100 H43 Z", outer: "M39 12 H81 L79 102 H41 Z", top: 14, bottom: 100, x: [41, 79] },
  cortado: { inner: "M42 54 H78 L75 96 H45 Z", outer: "M40 52 H80 L77 98 H43 Z", top: 54, bottom: 96, x: [42, 78] },
  bowl: { inner: "M28 50 H92 Q90 84 60 86 Q30 84 28 50 Z", outer: "M26 48 H94 Q92 88 60 90 Q28 88 26 48 Z", top: 50, bottom: 86, x: [28, 92],
    extra: <path className="da-glass" d="M48 89 h24 l3 8 h-30 z" /> },
  martini: { inner: "M24 30 H96 L60 66 Z", outer: "M22 28 H98 L60 68 Z", top: 30, bottom: 66, x: [24, 96],
    extra: <><path className="da-line" d="M60 68 V98" /><ellipse className="da-glass" cx="60" cy="100" rx="16" ry="3" /></> },
  irish: { inner: "M40 24 H80 L76 76 Q60 82 44 76 Z", outer: "M38 22 H82 L78 78 Q60 85 42 78 Z", top: 24, bottom: 80, x: [40, 80],
    extra: <><path className="da-line" d="M60 84 V98" /><ellipse className="da-glass" cx="60" cy="100" rx="15" ry="3" /><path className="da-line" d="M81 32 q12 2 10 14 q-2 9 -12 9" fill="none" /></> },
  jar: { inner: "M36 30 H84 V95 Q60 99 36 95 Z", outer: "M34 28 H86 V96 Q60 101 34 96 Z", top: 30, bottom: 98, x: [36, 84],
    extra: <rect x="32" y="17" width="56" height="11" rx="3" fill="#c8ad80" stroke="#8b6b3e" strokeWidth="2" /> },
};

const DRINK: Record<string, Spec> = {
  affogato: { v: "bowl", layers: [["espresso", 0.35]], scoop: true },
  americano: { v: "mug", layers: [["coffee", 0.9]], art: "dot", steam: true },
  cappuccino: { v: "cup", layers: [["foam", 1]], art: "dust", steam: true },
  latte: { v: "latte", layers: [["latte", 0.72], ["foam", 0.14]], steam: true },
  "flat-white": { v: "cup", layers: [["flatwhite", 1]], art: "heart", steam: true },
  cortado: { v: "cortado", layers: [["espresso", 0.4], ["latte", 0.42], ["foam", 0.06]] },
  macchiato: { v: "demitasse", layers: [["crema", 1]], art: "dot", steam: true },
  mocha: { v: "mug", layers: [["latte", 1]], whip: true, art: "dust" },
  "con-panna": { v: "demitasse", layers: [["espresso", 1]], whip: true },
  "cafe-bombon": { v: "cortado", layers: [["condensed", 0.42], ["espresso", 0.45]] },
  "spanish-latte-home": { v: "highball", layers: [["condensed", 0.14], ["milk", 0.46], ["coffee", 0.22]], ice: 4, straw: true },
  "iced-latte-home": { v: "highball", layers: [["milk", 0.55], ["coffee", 0.28]], ice: 4, straw: true },
  "iced-americano-home": { v: "highball", layers: [["coffee", 0.86]], ice: 4 },
  "espresso-tonic": { v: "highball", layers: [["tonic", 0.55], ["espresso", 0.28]], ice: 4, garnish: "orange" },
  shakerato: { v: "martini", layers: [["espresso", 0.75], ["crema", 0.2]] },
  "freddo-cappuccino": { v: "rocks", layers: [["espresso", 0.45], ["foam", 0.4]], ice: 3, straw: true },
  "espresso-martini": { v: "martini", layers: [["martini", 0.8], ["crema", 0.14]], garnish: "beans" },
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
  "my-clean": { v: "mug", layers: [["light", 1]], steam: true },
  "my-everyday": { v: "mug", layers: [["coffee", 1]], steam: true },
  "my-bypass": { v: "mug", layers: [["coffee", 1]], art: "dot", steam: true },
  "my-milk": { v: "latte", layers: [["latte", 0.7], ["foam", 0.12]], steam: true },
  "my-espresso": { v: "demitasse", layers: [["crema", 1]], steam: true },
  "my-moka": "moka",
  "my-coldbrew": { v: "jar", layers: [["coldbrew", 0.82]] },
  "my-coke": { v: "highball", layers: [["cola", 0.55], ["coffee", 0.26]], ice: 4 },
};

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
  const liquidTop = surfaceY;
  const [x0, x1] = v.x;
  const top = s.layers.length ? C[s.layers[s.layers.length - 1][0]] : C.coffee;

  // ice cubes inside the liquid
  const cubes = [];
  for (let i = 0; i < (s.ice || 0); i++) {
    const col = i % 3;
    const cx = col === 0 ? x0 + 4 : col === 1 ? x1 - 17 : (x0 + x1) / 2 - 6;
    const cy = liquidTop + 3 + Math.floor(i / 3) * 15 + col * 7;
    cubes.push(<rect key={i} className="da-ice" x={cx} y={cy} width="12" height="11" rx="2.5" transform={`rotate(${(i % 2 ? 1 : -1) * 12} ${cx + 6} ${cy + 5})`} />);
  }

  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={title} className="drink-art">
      <defs><clipPath id={id}><path d={v.inner} /></clipPath></defs>
      {s.steam && (
        <g className="da-steam" aria-hidden="true">
          <path d={`M${(x0 + x1) / 2 - 8} ${v.top - 6} q-5 -7 0 -14 q5 -7 0 -14`} />
          <path d={`M${(x0 + x1) / 2} ${v.top - 9} q-5 -7 0 -14 q5 -7 0 -14`} />
          <path d={`M${(x0 + x1) / 2 + 8} ${v.top - 6} q-5 -7 0 -14 q5 -7 0 -14`} />
        </g>
      )}
      {v.extra}
      {v.opaque ? (
        <>
          <path d={v.outer} fill={v.opaque} className="da-body" />
          <ellipse cx={(x0 + x1) / 2} cy={v.top + 1.5} rx={(x1 - x0) / 2 - 1} ry="4.5" fill={top} />
          {s.art === "heart" && <path d={`M60 ${v.top + 3} c-4 -3 -8 -1 -5 -4 c2 -2 5 0 5 1 c0 -1 3 -3 5 -1 c3 3 -1 1 -5 4`} fill={C.foam} />}
          {s.art === "dot" && <ellipse cx="60" cy={v.top + 1.5} rx="5" ry="1.8" fill={C.crema} opacity=".8" />}
          {s.art === "swirl" && <path d={`M50 ${v.top + 1} q10 3 20 0`} stroke={C.foam} strokeWidth="2" fill="none" strokeLinecap="round" />}
          {s.art === "dust" && [52, 57, 61, 66, 70, 55, 64].map((x, i) => <circle key={i} cx={x} cy={v.top + (i % 3)} r=".9" fill="#7a4a2a" />)}
        </>
      ) : (
        <>
          <g clipPath={`url(#${id})`}>{rects}{cubes}</g>
          <path d={v.outer} className="da-glass" fill="none" />
          <path d={v.inner} className="da-sheen" fill="none" />
        </>
      )}
      {s.scoop && (
        <g>
          <circle cx="54" cy={v.top + 4} r="13" fill={C.icecream} stroke="#e2cfa8" strokeWidth="1.5" />
          <circle cx="68" cy={v.top + 6} r="11" fill={C.icecream} stroke="#e2cfa8" strokeWidth="1.5" />
          <path d={`M48 ${v.top + 10} q10 8 24 2`} stroke={C.espresso} strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />
        </g>
      )}
      {s.whip && (
        <path d={`M${x0 + 4} ${v.top + 2} q2 -10 10 -8 q4 -10 14 -6 q8 -8 14 2 q8 -2 8 8 Z`}
          transform={`translate(${(x1 - x0 - 50) / 2} 0)`} fill={C.cream} stroke="#eadcc4" strokeWidth="1.5" />
      )}
      {s.whip && s.art === "dust" && [50, 56, 62, 68].map((x, i) => <circle key={i} cx={x} cy={v.top - 6 + (i % 2) * 2} r=".9" fill="#7a4a2a" />)}
      {s.straw && <path d={`M${x1 - 8} ${v.bottom - 10} L${x1 + 4} ${v.top - 14}`} stroke="#c0392b" strokeWidth="3.5" strokeLinecap="round" />}
      {s.garnish === "lemon" && <g transform={`translate(${x1 - 2} ${v.top + 2})`}><circle r="9" fill="#f6dd4b" stroke="#d8b81f" strokeWidth="1.5" /><path d="M0 -6 V6 M-6 0 H6 M-4 -4 L4 4 M4 -4 L-4 4" stroke="#fff6b8" strokeWidth="1" /></g>}
      {s.garnish === "orange" && <g transform={`translate(${x1 - 2} ${v.top + 2})`}><circle r="9" fill="#f39a3d" stroke="#d9751c" strokeWidth="1.5" /><path d="M0 -6 V6 M-6 0 H6 M-4 -4 L4 4 M4 -4 L-4 4" stroke="#ffd4a3" strokeWidth="1" /></g>}
      {s.garnish === "beans" && [52, 60, 68].map((x, i) => <ellipse key={i} cx={x} cy={surfaceY + 1} rx="3" ry="2" fill="#3a2010" transform={`rotate(${i * 25 - 25} ${x} ${surfaceY + 1})`} />)}
      {s.garnish === "cinnamon" && <rect x="66" y={v.top - 18} width="5" height="30" rx="2" fill="#8b4a22" transform={`rotate(20 68 ${v.top})`} />}
    </svg>
  );
}

function MokaArt({ title }: { title: string }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={title} className="drink-art">
      <path d="M38 64 H82 L88 98 H32 Z" fill="#c4cad0" stroke="#6f777e" strokeWidth="2" strokeLinejoin="round" />
      <path d="M42 62 H78 L74 56 H46 Z" fill="#9aa2a9" stroke="#6f777e" strokeWidth="2" strokeLinejoin="round" />
      <path d="M44 56 L38 26 H82 L76 56 Z" fill="#d6dbe0" stroke="#6f777e" strokeWidth="2" strokeLinejoin="round" />
      <path d="M36 26 Q60 14 84 26 Z" fill="#9aa2a9" stroke="#6f777e" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="60" cy="16" r="3.5" fill="#2b2b2b" />
      <path d="M38 28 L28 22 L34 30 Z" fill="#9aa2a9" stroke="#6f777e" strokeWidth="2" strokeLinejoin="round" />
      <path d="M82 32 h10 q4 0 4 4 v14 q0 4 -4 4 h-12" fill="none" stroke="#2b2b2b" strokeWidth="5" strokeLinecap="round" />
      <path d="M30 104 H90" stroke="#e46b2c" strokeWidth="3" strokeLinecap="round" className="da-flame" />
      <path d="M40 108 q4 -6 8 0 q4 -6 8 0 q4 -6 8 0 q4 -6 8 0 q4 -6 8 0" fill="none" stroke="#f0a033" strokeWidth="2" className="da-flame" />
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
