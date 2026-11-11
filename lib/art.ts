/* ------------------------------------------------------------------------------------------
   Recipe illustrations: one three-quarter drawing per recipe, cut open, shown at three sizes.
     1 · card   the vessel alone; cups, mugs, steel and clay have their front-left quarter cut away
     2 · scene  the same drawing on a table line, with one companion and a ruler marking each layer
     3 · open   the scene with every layer named, from the recipe's own proportions
   Drawn as SVG strings so the same code serves cards, the recipe header and the opened view.
   One ink outline with round joins, flat coffee fills, and the logo's crema band on coffee.
   ------------------------------------------------------------------------------------------ */
import type { Entry } from "./types";

const INK = "#2d2226", SW = 3, FG = "#1c1619", MUTED = "#6b5f64";
const C = {
  espresso: "#2e1b10", crema: "#c99a63", coffee: "#3f2416", light: "#7b4a26", coldbrew: "#33200f",
  latte: "#c9a17a", flatwhite: "#b98a5f", kaapi: "#a9764e", frappe: "#c79d74", aulait: "#b07f57",
  milk: "#f6efe5", foam: "#fffaf2", cream: "#fff6e6", icecream: "#f7ebd2", condensed: "#ecd7a6",
  chocolate: "#4a2618", egg: "#efd08b", cola: "#4a1a10", tonic: "#e3eee9", lemonade: "#f1e59b",
  martini: "#3a2217", whiskey: "#5a3219",
} as const;
type Fill = keyof typeof C;
const X = {
  ceramic: "#fffdfa", glass: "rgba(255,255,255,.72)", inside: "#ebe3e6", steel: "#d9dee2", steelLight: "#eef1f3", steelDark: "#b4bbc1",
  steelIn: "#c9cfd4", clay: "#c46a3d", clayIn: "#a85a33", kraft: "#c8ad80", water: "#d3e5f0", grounds: "#5a3a24", flame: "#e3893a",
  orange: "#f0a04b", lemon: "#f2d55a", bean: "#2e1b10", wine: "#8a2846", flag: "#8a5a14",
};
const CREMA_TOP = new Set<Fill>(["espresso", "coffee", "coldbrew", "light", "martini"]);
const NAMES: Record<Fill, string> = {
  espresso: "Espresso", crema: "Crema", coffee: "Coffee", light: "Light, clean coffee", coldbrew: "Cold brew",
  latte: "Steamed milk + espresso", flatwhite: "Silky milk + espresso", kaapi: "Coffee + hot milk", frappe: "Blended coffee",
  aulait: "Coffee + hot milk", milk: "Milk", foam: "Foam", cream: "Cream", icecream: "Ice cream", condensed: "Condensed milk",
  chocolate: "Chocolate", egg: "Whipped egg yolk", cola: "Coke Zero", tonic: "Tonic water", lemonade: "Lemonade",
  martini: "Vodka, liqueur, espresso", whiskey: "Whiskey + coffee",
};

type Vessel = "demitasse" | "cup" | "mug" | "latte" | "rocks" | "highball" | "cortado" | "bowl" | "martini" | "irish" | "kaapi" | "jar" | "olla";
type Prop = "beans" | "sugar" | "jug" | "bottle" | "shaker" | "glass" | "demi" | "bag" | "lemon" | "cinnamon" | "cocoa" | "egg" | "can" | "cola" | "whiskey" | "ice" | "instant";
interface Spec {
  v: Vessel;
  layers: [Fill, number][];
  ice?: boolean; whip?: boolean; scoop?: boolean; straw?: boolean; steam?: boolean;
  art?: "heart" | "dust" | "dot" | "swirl";
  garnish?: "lemon" | "orange" | "beans" | "cinnamon";
  prop: Prop;
}

const DRINK: Record<string, Spec> = {
  affogato: { v: "bowl", layers: [["espresso", 0.35]], scoop: true, prop: "beans" },
  americano: { v: "mug", layers: [["coffee", 1]], steam: true, prop: "beans" },
  cappuccino: { v: "cup", layers: [["foam", 1]], art: "dust", steam: true, prop: "cocoa" },
  latte: { v: "latte", layers: [["latte", 0.72], ["foam", 0.14]], steam: true, prop: "jug" },
  "flat-white": { v: "cup", layers: [["flatwhite", 1]], art: "heart", steam: true, prop: "sugar" },
  cortado: { v: "cortado", layers: [["espresso", 0.4], ["latte", 0.42], ["foam", 0.06]], prop: "sugar" },
  macchiato: { v: "demitasse", layers: [["espresso", 1]], art: "dot", steam: true, prop: "beans" },
  mocha: { v: "mug", layers: [["latte", 1]], whip: true, art: "dust", prop: "cocoa" },
  "con-panna": { v: "demitasse", layers: [["espresso", 1]], whip: true, prop: "sugar" },
  "cafe-bombon": { v: "cortado", layers: [["condensed", 0.42], ["espresso", 0.45]], prop: "can" },
  "spanish-latte-home": { v: "highball", layers: [["condensed", 0.14], ["milk", 0.46], ["coffee", 0.22]], ice: true, straw: true, prop: "can" },
  "iced-latte-home": { v: "highball", layers: [["milk", 0.55], ["coffee", 0.28]], ice: true, straw: true, prop: "jug" },
  "iced-americano-home": { v: "highball", layers: [["coffee", 0.86]], ice: true, prop: "ice" },
  "espresso-tonic": { v: "highball", layers: [["tonic", 0.55], ["espresso", 0.28]], ice: true, garnish: "orange", prop: "bottle" },
  shakerato: { v: "martini", layers: [["espresso", 1]], prop: "shaker" },
  "freddo-cappuccino": { v: "rocks", layers: [["espresso", 0.45], ["foam", 0.4]], ice: true, straw: true, prop: "ice" },
  "espresso-martini": { v: "martini", layers: [["martini", 1]], garnish: "beans", prop: "shaker" },
  "irish-coffee": { v: "irish", layers: [["whiskey", 0.68], ["cream", 0.24]], prop: "whiskey" },
  "ca-phe-sua-da": { v: "rocks", layers: [["condensed", 0.22], ["coffee", 0.6]], ice: true, prop: "can" },
  "bac-xiu": { v: "highball", layers: [["condensed", 0.14], ["milk", 0.5], ["coffee", 0.2]], ice: true, straw: true, prop: "can" },
  "egg-coffee": { v: "cup", layers: [["coffee", 0.55], ["egg", 0.45]], art: "dust", steam: true, prop: "egg" },
  "filter-kaapi": { v: "kaapi", layers: [["kaapi", 1]], art: "swirl", steam: true, prop: "beans" },
  dalgona: { v: "latte", layers: [["milk", 0.6], ["frappe", 0.26]], ice: true, prop: "sugar" },
  "instant-coffee": { v: "mug", layers: [["coffee", 1]], steam: true, prop: "instant" },
  "beaten-coffee": { v: "mug", layers: [["kaapi", 0.78], ["foam", 0.22]], art: "dust", steam: true, prop: "instant" },
  "cold-brew-drink": { v: "highball", layers: [["coldbrew", 0.86]], ice: true, prop: "ice" },
  "sweet-cream-cold-brew": { v: "highball", layers: [["coldbrew", 0.6], ["cream", 0.24]], ice: true, straw: true, prop: "jug" },
  "coffee-lemonade": { v: "highball", layers: [["lemonade", 0.5], ["coffee", 0.32]], ice: true, garnish: "lemon", prop: "lemon" },
  "cafe-au-lait": { v: "mug", layers: [["aulait", 1]], steam: true, prop: "jug" },
  "red-eye": { v: "mug", layers: [["coffee", 1]], art: "dot", steam: true, prop: "demi" },
  "cafe-de-olla": { v: "olla", layers: [["coffee", 1]], garnish: "cinnamon", steam: true, prop: "cinnamon" },
  "coffee-frappe": { v: "highball", layers: [["frappe", 0.82]], whip: true, straw: true, prop: "ice" },
};
const HOUSE: Record<string, Spec | "moka" | "press" | "v60"> = {
  "my-clean": { v: "cup", layers: [["light", 1]], steam: true, prop: "bag" },
  "my-everyday": { v: "mug", layers: [["coffee", 1]], steam: true, prop: "beans" },
  "my-bypass": { v: "latte", layers: [["coffee", 0.8]], steam: true, prop: "bag" },
  "my-milk": { v: "latte", layers: [["latte", 0.7], ["foam", 0.12]], steam: true, prop: "jug" },
  "my-espresso": { v: "demitasse", layers: [["espresso", 1]], steam: true, prop: "sugar" },
  "my-moka": "moka",
  "my-kaapi": { v: "kaapi", layers: [["kaapi", 1]], steam: true, prop: "beans" },
  "my-coldbrew": { v: "jar", layers: [["coldbrew", 0.82]], prop: "glass" },
  "my-frenchpress": "press",
  "my-v60": "v60",
  "my-46": "v60",
  "my-coke": { v: "highball", layers: [["cola", 0.55], ["coffee", 0.26]], ice: true, prop: "cola" },
};

/* ---------------- drawing helpers ---------------- */
const K = (w = SW, c = INK) => `stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const ln = (d: string, w = SW) => `<path d="${d}" fill="none" ${K(w)}/>`;
const ell = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = K()) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const rAt = (y: number, y1: number, y2: number, r1: number, r2: number) => r1 + (r2 - r1) * (y - y1) / (y2 - y1);
const body = (cx: number, y1: number, y2: number, r1: number, r2: number, k: number) =>
  `M${cx - r1} ${y1} L${cx - r2} ${y2} A${r2} ${r2 * k} 0 0 0 ${cx + r2} ${y2} L${cx + r1} ${y1} A${r1} ${r1 * k} 0 0 0 ${cx - r1} ${y1} Z`;
const band = (cx: number, ya: number, y2: number, ra: number, r2: number, k: number) =>
  `M${cx - ra} ${ya} L${cx - r2} ${y2} A${r2} ${r2 * k} 0 0 0 ${cx + r2} ${y2} L${cx + ra} ${ya} A${ra} ${ra * k} 0 0 1 ${cx - ra} ${ya} Z`;
const steam = (cx: number, y: number) =>
  `<g class="da-steam">${[-9, 0, 9].map((dx, i) => `<path d="M${cx + dx} ${y - (i === 1 ? 4 : 1)} c-5 -5 5 -9 0 -15" fill="none" ${K(SW, "#b9a9ae")}/>`).join("")}</g>`;
const slice = (x: number, y: number, fill: string) =>
  `<g transform="translate(${x} ${y})"><circle r="9" fill="${fill}" ${K()}/><path d="M0 -9 V9 M-9 0 H9 M-6.4 -6.4 L6.4 6.4 M6.4 -6.4 L-6.4 6.4" stroke="#fff3c9" stroke-width="1.2"/></g>`;
const flames = (y: number) => `<g class="da-flame">${[44, 60, 76].map((x) => `<path d="M${x} ${y} c-4 0 -5 -4 -2 -7 c0 2 1 3 2 3 c0 -2 1 -4 3 -5 c1 3 3 5 3 6 c0 2 -2 3 -6 3 z" fill="${X.flame}"/>`).join("")}</g>`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

type Mark = [number, string];
interface Drawn { o: string; marks: Mark[]; bottom: number; rx: number }
interface Geo { vb: [number, number, number]; foot: number; cx: number; flame?: boolean; draw: (id: () => string) => Drawn }

/** A round vessel with its front-left quarter cut away; `interior` is drawn inside the cut. */
function cut(id: () => string, m: { cx: number; y1: number; y2: number; r1: number; r2: number; k: number; fill: string; rim?: boolean; top?: string }, interior: string) {
  const { cx, y1, y2, r1, r2, k } = m, a = id(), b = id(), c = id(), sil = body(cx, y1, y2, r1, r2, k), rim = m.rim !== false;
  return `<defs><clipPath id="${a}"><path d="${sil}"/></clipPath><clipPath id="${b}"><rect x="-60" y="-60" width="${cx + 60}" height="320"/></clipPath>` +
    `<clipPath id="${c}"><path d="M-60 -60 H260 V300 H${cx} V${y1} H-60 Z"/></clipPath></defs>` +
    `<path d="${sil}" fill="${m.fill}"/>${rim ? ell(cx, y1, r1, r1 * k, m.fill) : ""}${m.top || ""}` +
    `<g clip-path="url(#${a})"><g clip-path="url(#${b})">${interior}</g></g>` +
    `<path d="${sil}" fill="none" ${K()}/>${rim ? `<g clip-path="url(#${c})">${ell(cx, y1, r1, r1 * k, "none")}</g>` : ""}` +
    ln(`M${cx} ${y1 + r1 * k} V${y2 + r2 * k}`);
}
const stack = (layers: [Fill, number][], top: number, bottom: number) => {
  let y = bottom; const H = bottom - top;
  return layers.map(([f, fr]) => { y -= fr * H; return [f, y] as [Fill, number]; });
};
const layerMarks = (s: Spec, tops: [Fill, number][]): Mark[] =>
  tops.map(([f, y], i) => [y, NAMES[f] + (tops.length > 1 ? " " + pct(s.layers[i][1]) : "")]);

function surfaceArt(s: Spec, cx: number, y: number, r: number, k: number) {
  let o = "";
  if (s.art === "heart") o += `<path d="M${cx + 3} ${y + 5} c-8 -3 -11 -8 -5 -9 c3 0 4 1 5 3 c1 -2 2 -3 5 -3 c6 1 3 6 -5 9z" fill="${C.foam}"/>`;
  if (s.art === "dot") o += ell(cx, y, r * .3, r * .3 * k, C.foam, "");
  if (s.art === "swirl") o += `<path d="M${cx - r * .5} ${y} q${r * .5} ${r * k * .8} ${r} 0" fill="none" stroke="${C.foam}" stroke-width="2.4" stroke-linecap="round"/>`;
  if (s.art === "dust" && !s.whip) [-8, -3, 2, 7, -5, 4, 0].forEach((dx, i) => o += `<circle cx="${cx + dx}" cy="${y - 1 + (i % 3) * 1.4}" r="1" fill="#7a4a2a"/>`);
  return o;
}
function toppings(s: Spec, cx: number, y: number, r: number, k: number, marks: Mark[]) {
  let o = "";
  if (s.whip) {
    o += `<path d="M${cx - 20} ${y + 2} q1 -11 10 -9 q4 -10 14 -6 q8 -8 14 2 q9 -1 5 13 Z" fill="${C.cream}" ${K()}/>`;
    if (s.art === "dust") [-8, -2, 4, 10].forEach((dx, i) => o += `<circle cx="${cx + dx}" cy="${y - 6 + (i % 2) * 2}" r="1" fill="#7a4a2a"/>`);
    marks.push([y - 6, "Whipped cream"]);
  }
  if (s.scoop) {
    o += `<g ${K()}><circle cx="${cx - 7}" cy="${y - 6}" r="13" fill="${C.icecream}"/><circle cx="${cx + 9}" cy="${y - 3}" r="11" fill="${C.icecream}"/></g>` +
      `<path d="M${cx - 13} ${y + 1} q11 8 25 1" fill="none" stroke="${C.espresso}" stroke-width="3" stroke-linecap="round"/>`;
    marks.push([y - 8, "Vanilla ice cream"]);
  }
  if (s.garnish === "beans") {
    o += [-8, 0, 8].map((dx, i) => `<ellipse cx="${cx + dx}" cy="${y + (i === 1 ? -1.4 : 1.4)}" rx="4" ry="2.4" fill="${X.bean}" transform="rotate(${i * 25 - 25} ${cx + dx} ${y})"/>`).join("");
    marks.push([y, "Three coffee beans"]);
  }
  if (s.garnish === "orange" || s.garnish === "lemon") { o += slice(cx + r - 1, y - 2, s.garnish === "orange" ? X.orange : X.lemon); marks.push([y - 2, s.garnish === "orange" ? "Orange peel" : "Lemon slice"]); }
  if (s.garnish === "cinnamon") { o += `<rect x="${cx + 4}" y="${y - 24}" width="6" height="30" rx="2" fill="#9a5a2e" ${K()} transform="rotate(22 ${cx + 7} ${y})"/>`; marks.push([y - 10, "Cinnamon stick"]); }
  return o;
}

function ceramic(id: () => string, s: Spec, p: { cx: number; y1: number; y2: number; r1: number; r2: number; k: number; handle?: string; saucer?: string; fill?: string; inside?: string; steamY?: number }): Drawn {
  const { cx, y1, y2, r1, r2, k } = p, w = 3.4, ys = y1 + 5, yb = y2 - 3, ri = (y: number) => rAt(y, y1, y2, r1, r2) - w;
  const tops = stack(s.layers, ys, yb), topF = s.layers[s.layers.length - 1][0];
  let liquid = "";
  for (let i = tops.length - 1; i >= 0; i--) liquid += `<path d="${band(cx, tops[i][1], yb, ri(tops[i][1]), r2 - w, k)}" fill="${C[tops[i][0]]}"/>`;
  const surf = ell(cx, ys, ri(ys), ri(ys) * k, C[topF], CREMA_TOP.has(topF) ? `stroke="${C.crema}" stroke-width="2.5"` : "") + surfaceArt(s, cx, ys, ri(ys), k);
  const inner = body(cx, y1 + 1, yb, r1 - w, r2 - w, k);
  const marks = layerMarks(s, tops);
  const extra = toppings(s, cx, ys, r1, k, marks);
  const o = (p.saucer || "") + (s.steam && p.steamY ? steam(cx, p.steamY) : "") + (p.handle ? ln(p.handle) : "") +
    cut(id, { cx, y1, y2, r1, r2, k, fill: p.fill || X.ceramic, top: surf }, `<path d="${inner}" fill="${p.inside || X.inside}"/>${liquid}${surf}<path d="${inner}" fill="none" ${K(1.3)}/>`) + extra;
  return { o, marks, bottom: yb, rx: cx - Math.max(r1, r2) - 7 };
}

function glass(s: Spec, p: { cx: number; y1: number; y2: number; r1: number; r2: number; k?: number; steamY?: number; under?: string }): Drawn {
  const { cx, y1, y2, r1, r2 } = p, k = p.k ?? .28, ins = 2.6, iy1 = y1 + 2, iy2 = y2 - 3;
  let o = (p.under || "") + (s.steam && p.steamY ? steam(cx, p.steamY) : "") + `<path d="${body(cx, y1, y2, r1, r2, k)}" fill="${X.glass}"/>`;
  const tops = stack(s.layers, iy1, iy2);
  for (let i = tops.length - 1; i >= 0; i--) { const [f, ya] = tops[i]; o += `<path d="${band(cx, ya, iy2, rAt(ya, y1, y2, r1, r2) - ins, r2 - ins, k)}" fill="${C[f]}"/>`; }
  const [tf, ty] = tops[tops.length - 1], tr = rAt(ty, y1, y2, r1, r2) - ins;
  o += ell(cx, ty, tr, tr * k, CREMA_TOP.has(tf) ? C.crema : C[tf], "") + surfaceArt(s, cx, ty, tr, k);
  const marks = layerMarks(s, tops);
  if (s.ice) {
    [[-8, -2, 20], [6, 1, -15], [-1, 4, 35]].forEach(([dx, dy, a]) => o += `<rect x="${cx + dx - 6}" y="${ty + dy - 6}" width="12" height="10" rx="2.5" transform="rotate(${a} ${cx + dx} ${ty + dy})" fill="rgba(255,255,255,.75)" stroke="${INK}" stroke-opacity=".5" stroke-width="1.6"/>`);
    marks.push([ty + 4, "Ice"]);
  }
  if (s.straw) o += `<path d="M${cx + r2 * .3} ${y2 - 12} L${cx + r1 + 6} ${y1 - 14}" stroke="${X.wine}" stroke-width="4" stroke-linecap="round"/>`;
  o += `<path d="${body(cx, y1, y2, r1, r2, k)}" fill="none" ${K()}/>` + ell(cx, y1, r1, r1 * k, "none");
  o += toppings(s, cx, ty, r1, k, marks);
  return { o, marks, bottom: iy2, rx: cx - Math.max(r1, r2) - 7 };
}

function vessel(s: Spec): Geo {
  switch (s.v) {
    case "mug": return { vb: [14, 6, 94], foot: 99, cx: 56, draw: (id) => ceramic(id, s, { cx: 56, y1: 34, y2: 92, r1: 24, r2: 24, k: .3, handle: "M78 46 c19 0 19 32 0 32", steamY: 16 }) };
    case "cup": return { vb: [12, 12, 96], foot: 105, cx: 60, draw: (id) => ceramic(id, s, { cx: 60, y1: 50, y2: 88, r1: 33, r2: 19, k: .28, handle: "M90 56 c15 0 14 19 -6 19", steamY: 34,
      saucer: ell(60, 94, 44, 11, X.ceramic) + ell(60, 92, 22, 5, "none", K(1.6)) }) };
    case "demitasse": return { vb: [24, 28, 74], foot: 104.5, cx: 60, draw: (id) => ceramic(id, s, { cx: 60, y1: 64, y2: 93, r1: 19, r2: 13, k: .3, handle: "M78 69 c10 0 10 13 -3 13", steamY: 50,
      saucer: ell(60, 97, 30, 7.5, X.ceramic) + ell(60, 95.5, 14, 3.4, "none", K(1.6)) }) };
    case "olla": return { vb: [14, 6, 96], foot: 99, cx: 58, draw: (id) => ceramic(id, s, { cx: 58, y1: 38, y2: 92, r1: 26, r2: 22, k: .3, handle: "M83 50 c14 1 13 22 -2 22", steamY: 20, fill: X.clay, inside: X.clayIn }) };
    case "kaapi": return { vb: [14, 4, 96], foot: 104, cx: 60, draw: (id) => {
      const k = .28, t = ceramic(id, s, { cx: 60, y1: 26, y2: 80, r1: 17, r2: 15, k, steamY: 10, fill: X.steel, inside: X.steelIn });
      const dab = `<path d="${body(60, 78, 96, 34, 26, k)}" fill="${X.steel}" ${K()}/>` + ell(60, 78, 34, 34 * k, X.steelIn);
      return { ...t, o: dab + t.o + `<path d="${band(60, 78, 96, 34, 26, k)}" fill="${X.steel}" ${K()}/>` };
    } };
    case "latte": return { vb: [0, 0, 120], foot: 106, cx: 60, draw: () => glass(s, { cx: 60, y1: 22, y2: 101, r1: 21, r2: 17, steamY: 12 }) };
    case "highball": return { vb: [0, 0, 120], foot: 108, cx: 60, draw: () => glass(s, { cx: 60, y1: 12, y2: 103, r1: 20, r2: 18 }) };
    case "rocks": return { vb: [14, 18, 92], foot: 105, cx: 60, draw: () => glass(s, { cx: 60, y1: 46, y2: 98, r1: 28, r2: 25 }) };
    case "cortado": return { vb: [24, 34, 74], foot: 103, cx: 60, draw: () => glass(s, { cx: 60, y1: 54, y2: 98, r1: 20, r2: 17 }) };
    case "bowl": return { vb: [14, 14, 94], foot: 98, cx: 60, draw: () => glass(s, { cx: 60, y1: 50, y2: 84, r1: 34, r2: 14,
      under: `<path d="${body(60, 84, 94, 12, 14, .28)}" fill="${X.glass}" ${K()}/>` }) };
    case "irish": return { vb: [0, 0, 120], foot: 106, cx: 60, draw: () => {
      const g = glass(s, { cx: 60, y1: 22, y2: 80, r1: 21, r2: 16, under: ln("M80 30 c14 1 13 23 -3 23") + ln("M60 84 V99") + ell(60, 101, 17, 5, X.glass) });
      return g;
    } };
    case "jar": return { vb: [0, 0, 120], foot: 107, cx: 60, draw: () => {
      const g = glass(s, { cx: 60, y1: 28, y2: 100, r1: 26, r2: 26, k: .26 });
      g.o += `<path d="${body(60, 16, 28, 28, 28, .26)}" fill="${X.kraft}" ${K()}/>` + ell(60, 16, 28, 28 * .26, "#d8c39b");
      g.marks = g.marks.map(([y, t]) => [y, t === "Cold brew" ? "Cold brew, 12–18 h in the fridge" : t]);
      return g;
    } };
    case "martini": return { vb: [0, 0, 120], foot: 106, cx: 60, draw: () => {
      const k = .27, f = s.layers[0][0], marks: Mark[] = [[46, NAMES[f]]];
      let o = ln("M60 70 V99") + ell(60, 101, 18, 5, X.glass) +
        `<path d="M22 30 L60 70 L98 30 A38 ${38 * k} 0 0 0 22 30 Z" fill="${X.glass}"/>` +
        `<path d="M27 35 L60 68 L93 35 A33 ${33 * k} 0 0 1 27 35 Z" fill="${C[f]}"/>` + ell(60, 35, 33, 33 * k, C.crema, "");
      marks.push([35, "Crema"]);
      o += toppings(s, 60, 35, 33, k, marks);
      o += `<path d="M22 30 L60 70 L98 30" fill="none" ${K()}/>` + ell(60, 30, 38, 38 * k, "none");
      return { o, marks, bottom: 68, rx: 16 };
    } };
  }
}

/* ---------------- brewers ---------------- */
const MOKA: Geo = { vb: [0, 0, 120], foot: 106, cx: 60, flame: true, draw: (id) => {
  const k = .26, cx = 60, rb = rAt(80, 67, 95, 16.5, 23.5), rc = rAt(51, 31, 60, 22.5, 13.5);
  const boiler = cut(id, { cx, y1: 66, y2: 98, r1: 19, r2: 26, k, fill: X.steel, rim: false },
    `<path d="${body(cx, 67, 95, 16.5, 23.5, k)}" fill="${X.steelIn}"/><path d="${band(cx, 80, 95, rb, 23.5, k)}" fill="${X.water}"/>${ell(cx, 80, rb, rb * k, "#e4eff6", "")}` +
    `<path d="${band(cx, 67, 74, 16.5, 17, k)}" fill="${X.grounds}"/><rect x="${cx - 3}" y="74" width="6" height="18" fill="${X.steelDark}"/>`);
  const coll = cut(id, { cx, y1: 30, y2: 62, r1: 25, r2: 16, k, fill: X.steel, rim: false },
    `<path d="${body(cx, 31, 60, 22.5, 13.5, k)}" fill="${X.steelIn}"/><path d="${band(cx, 51, 60, rc, 13.5, k)}" fill="${C.coffee}"/>${ell(cx, 51, rc, rc * k, C.crema, "")}` +
    `<rect x="${cx - 3}" y="36" width="6" height="26" fill="${X.steelDark}"/><path d="M${cx - 4} 36 h8" ${K(2)}/>`);
  return { o: ln("M86 36 h9 a4 4 0 0 1 4 4 v14 a4 4 0 0 1 -4 4 h-12", 6) + boiler +
      `<path d="${body(cx, 60, 66, 16, 17, k)}" fill="${X.steelDark}" ${K()}/>` + coll +
      `<path d="M37 33 L24 24 L38 28" fill="${X.steel}" ${K()}/>` +
      `<path d="M${cx - 25} 30 Q${cx} 12 ${cx + 25} 30 A25 ${25 * k} 0 0 1 ${cx - 25} 30 Z" fill="#c3c9ce" ${K()}/><circle cx="${cx}" cy="18" r="4" fill="${INK}"/>`,
    marks: [[51, "Coffee rises here"], [67, "Grounds in the basket"], [80, "Water to the valve"]], bottom: 95, rx: 28 };
} };

const AERO: Geo = { vb: [-2, 2, 116], foot: 111, cx: 56, draw: (id) => {
  const k = .28, cx = 56;
  const mug = cut(id, { cx, y1: 74, y2: 104, r1: 25, r2: 25, k, fill: X.ceramic },
    `<path d="${body(cx, 75, 101, 21.6, 21.6, k)}" fill="${X.inside}"/><path d="${band(cx, 92, 101, 21.6, 21.6, k)}" fill="${C.coffee}"/>${ell(cx, 92, 21.6, 21.6 * k, C.coffee, `stroke="${C.crema}" stroke-width="2"`)}`);
  return { o: ln("M80 80 c13 0 13 18 0 18") + mug +
      `<path d="${body(cx, 28, 70, 17, 17, k)}" fill="${X.glass}"/><path d="${band(cx, 46, 68, 15, 15, k)}" fill="${C.coffee}"/>` + ell(cx, 46, 15, 15 * k, C.crema, "") +
      `<path d="${body(cx, 28, 70, 17, 17, k)}" fill="none" ${K()}/>` +
      ell(cx, 70, 20, 20 * k, INK, "") + `<path d="M${cx - 18} 69 H${cx + 18}" stroke="#ffffff" stroke-width="1.4" stroke-dasharray="3 2"/>` +
      ell(cx, 28, 23, 23 * k, X.ceramic) + `<path d="${body(cx, 10, 30, 14, 14, k)}" fill="${X.ceramic}" ${K()}/>` +
      `<path d="${band(cx, 27, 31, 14, 14, k)}" fill="${INK}"/>` + ell(cx, 10, 16, 16 * k, X.ceramic),
    marks: [[10, "Plunger"], [46, "Coffee steeping"], [69, "Paper filter in the cap"], [92, "Brewed coffee in the mug"]], bottom: 101, rx: 30 };
} };

const AERO_INV: Geo = { vb: [-2, 2, 116], foot: 108, cx: 54, draw: () => {
  const k = .28, cx = 54;
  return { o:
      `<path d="${body(cx, 80, 104, 14, 14, k)}" fill="${X.ceramic}" ${K()}/>` + ell(cx, 80, 17, 17 * k, X.ceramic) +
      `<path d="${body(cx, 26, 82, 17, 17, k)}" fill="${X.glass}"/>` +
      `<path d="${band(cx, 42, 78, 15, 15, k)}" fill="${C.coffee}"/>` + ell(cx, 42, 15, 15 * k, C.crema, "") +
      `<path d="${band(cx, 76, 82, 15, 15, k)}" fill="${INK}"/>` +
      `<path d="${body(cx, 26, 82, 17, 17, k)}" fill="none" ${K()}/>` + ell(cx, 82, 23, 23 * k, "none") + ell(cx, 26, 17, 17 * k, "none") +
      ell(cx, 14, 20, 20 * k, "none", `stroke="${INK}" stroke-width="2" stroke-dasharray="3 3"`) +
      `<path d="M80 26 C94 40 94 62 82 74" fill="none" stroke="${X.flag}" stroke-width="3" stroke-linecap="round"/><path d="M76.5 71 L83 79 L86.5 69 Z" fill="${X.flag}"/>`,
    marks: [[14, "Filter cap goes on at the flip"], [42, "Coffee steeping"], [78, "Plunger seal"], [96, "Plunger, on the table"]], bottom: 104, rx: 28 };
} };

/** A French press with the plunger lowered to the surface, the way the recipe leaves it. */
const PRESS: Geo = { vb: [0, 0, 120], foot: 106, cx: 58, draw: () => {
  const k = .28, cx = 58, r = 20, ri = 17.6;
  return { o:
      ln("M79 40 c17 0 17 46 0 46", 6) + ln("M79 40 c17 0 17 46 0 46", 2.4).replace(INK, X.steelLight) +
      `<path d="${body(cx, 30, 100, r, r, k)}" fill="${X.glass}"/>` +
      `<path d="${band(cx, 46, 98, ri, ri, k)}" fill="${C.coffee}"/>` + ell(cx, 46, ri, ri * k, C.coffee, `stroke="${C.crema}" stroke-width="2"`) +
      `<path d="${band(cx, 91, 98, ri, ri, k)}" fill="${X.grounds}"/>` +
      ln(`M${cx} 12 V43`, 3.4) + ell(cx, 43, ri, ri * k, X.steelLight) +
      `<path d="${body(cx, 30, 100, r, r, k)}" fill="none" ${K()}/>` +
      `<path d="${body(cx, 95, 102, r + 1.5, r + 1.5, k)}" fill="${X.steel}" ${K()}/>` +
      `<path d="M${cx - r} 30 L${cx - r - 7} 26 L${cx - r + 2} 33 Z" fill="${X.steel}" ${K(2)}/>` +
      `<path d="${body(cx, 24, 31, r + 1.5, r + 1.5, k)}" fill="${X.steel}" ${K()}/>` + ell(cx, 24, r + 1.5, (r + 1.5) * k, X.steelLight) +
      `<circle cx="${cx}" cy="10" r="4.6" fill="${INK}"/>`,
    marks: [[10, "Plunger, kept up while it brews"], [43, "Mesh, lowered just to the surface"], [64, "Coffee"], [94, "Grounds settled on the bottom"]], bottom: 98, rx: 31 };
} };

/** A V60 cone, cut open to show the bed in the paper, on a glass server. */
const V60: Geo = { vb: [0, 0, 120], foot: 107, cx: 60, draw: (id) => {
  const k = .28, cx = 60, at = (y: number) => rAt(y, 23, 64, 27, 6.5);
  const server = `<path d="${body(cx, 72, 104, 22, 19, k)}" fill="${X.glass}"/>` +
    `<path d="${band(cx, 88, 101, rAt(88, 72, 104, 22, 19) - 2.4, 16.6, k)}" fill="${C.coffee}"/>` +
    ell(cx, 88, rAt(88, 72, 104, 22, 19) - 2.4, (rAt(88, 72, 104, 22, 19) - 2.4) * k, C.crema, "") +
    `<path d="${body(cx, 72, 104, 22, 19, k)}" fill="none" ${K()}/>` + ell(cx, 72, 22, 22 * k, "none") + ln("M82 78 c9 1 9 16 -2 17");
  const cone = cut(id, { cx, y1: 22, y2: 64, r1: 30, r2: 8, k, fill: X.ceramic },
    `<path d="${body(cx, 23, 64, 27, 6.5, k)}" fill="#fbf6ec"/>` +
    `<path d="${band(cx, 38, 64, at(38), 6.5, k)}" fill="${C.light}"/>` +
    `<path d="${band(cx, 50, 64, at(50), 6.5, k)}" fill="${X.grounds}"/>` +
    ell(cx, 38, at(38), at(38) * k, C.light, `stroke="${C.crema}" stroke-width="2"`) +
    `<path d="M${cx - 2} 64 v4 M${cx + 1} 70 v3" stroke="${C.coffee}" stroke-width="2" stroke-linecap="round"/>`);
  return { o: server + `<path d="${body(cx, 64, 69, 21, 21, k)}" fill="${X.ceramic}" ${K()}/>` + ell(cx, 64, 21, 21 * k, X.ceramic) +
      ln("M88 30 c13 2 11 22 -8 22", 5) + cone,
    marks: [[38, "Water drawing down"], [52, "Coffee bed in a paper filter"], [88, "Coffee in the server"]], bottom: 101, rx: 28 };
} };

/* ---------------- companions for the table scene ---------------- */
const P = 2.4, PK = K(P);
const bean = (x: number, y: number, a: number) => `<g transform="rotate(${a} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="4.6" ry="3.1" fill="${X.bean}"/><path d="M${x - 3} ${y} q3 -1.4 6 0" stroke="#7a5236" stroke-width="1" fill="none"/></g>`;
const cube = (x: number, y: number, s: number, top = "#ffffff", l = "#ece4e7", r = "#e0d6da") =>
  `<path d="M${x} ${y} l${s} ${-s * .5} l${s} ${s * .5} l${-s} ${s * .5} z" fill="${top}" ${PK}/><path d="M${x} ${y} v${s} l${s} ${s * .5} v${-s}" fill="${l}" ${PK}/><path d="M${x + 2 * s} ${y} v${s} l${-s} ${s * .5} v${-s}" fill="${r}" ${PK}/>`;
const cyl = (cx: number, y1: number, y2: number, r: number, fill: string, k = .3) => `<path d="${body(cx, y1, y2, r, r, k)}" fill="${fill}" ${PK}/>` + ell(cx, y1, r, r * k, fill, PK);
const PROPS: Record<Prop, string> = {
  beans: bean(84, 101, 20) + bean(95, 103, -15) + bean(90, 95, 50) + bean(103, 98, 10),
  sugar: cube(84, 92, 7) + cube(97, 96, 7),
  jug: `<path d="M100 88 c7 0 7 11 -1 11" fill="none" ${PK}/>` + cyl(90, 84, 104, 10, X.steel) + ell(90, 84, 7.5, 2.2, C.milk, "") + `<path d="M80 84 l-5 -4 l7 1" fill="${X.steel}" ${PK}/>`,
  bottle: cyl(92, 76, 104, 8, C.tonic) + `<path d="M84 76 Q84 70 89 67 V60 h6 v7 Q100 70 100 76" fill="${C.tonic}" ${PK}/><rect x="88" y="55" width="8" height="5" rx="1" fill="${X.flame}" ${PK}/><path d="M84 86 H100 V94 H84 Z" fill="#ffffff" ${K(1.6)}/>`,
  shaker: cyl(92, 74, 104, 10, X.steel) + `<path d="M82 74 L85 64 H99 L102 74" fill="#c3c9ce" ${PK}/><rect x="89" y="58" width="6" height="6" rx="2" fill="#c3c9ce" ${PK}/>` + bean(76, 103, 15),
  glass: `<path d="${body(92, 70, 104, 10, 9, .3)}" fill="${X.glass}"/><path d="${band(92, 84, 102, 8, 7.5, .3)}" fill="${C.coldbrew}"/>` + ell(92, 84, 8, 2.4, C.milk, "") +
    `<path d="${body(92, 70, 104, 10, 9, .3)}" fill="none" ${PK}/>` + ell(92, 70, 10, 3, "none", PK),
  demi: `<path d="M104 92 c6 0 6 9 -1 9" fill="none" ${PK}/><path d="${body(94, 90, 104, 10, 7, .3)}" fill="${X.ceramic}" ${PK}/>` + ell(94, 90, 10, 3, X.ceramic, PK) + ell(94, 91, 7.5, 2.2, C.espresso, `stroke="${C.crema}" stroke-width="1.6"`),
  bag: `<path d="M84 104 V74 L88 68 H104 L108 74 V104 Z" fill="${X.kraft}" ${PK}/><path d="M108 74 L112 72 V102 L108 104" fill="#b39669" ${PK}/><path d="M84 74 H108" ${K(1.6)}/>` + bean(96, 89, -30),
  lemon: `<path d="M82 104 a12 12 0 0 1 24 0 z" fill="${X.lemon}" ${PK}/><path d="M94 104 V94 M94 104 L86 97 M94 104 L102 97" stroke="#fff3c9" stroke-width="1.4"/>` + ell(94, 104, 12, 2.5, "#fff6c2", PK),
  cinnamon: `<g transform="rotate(-8 94 100)"><rect x="80" y="96" width="30" height="6" rx="3" fill="#9a5a2e" ${PK}/><rect x="82" y="90" width="28" height="6" rx="3" fill="#a8683a" ${PK}/></g>`,
  cocoa: `<path d="M80 104 L84 92 L108 92 L104 104 Z" fill="${C.chocolate}" ${PK}/><path d="M88 92 L84 104 M96 92 L92 104 M82 98 H106" stroke="#6b3a24" stroke-width="1.4"/>`,
  egg: `<path d="M94 80 c8 0 11 12 11 17 c0 6 -5 8 -11 8 c-6 0 -11 -2 -11 -8 c0 -5 3 -17 11 -17z" fill="#f6ead6" ${PK}/>`,
  can: cyl(93, 82, 104, 10, "#ffffff") + `<path d="M83 90 H103 V98 H83 Z" fill="${C.condensed}"/>` + `<path d="${body(93, 82, 104, 10, 10, .3)}" fill="none" ${PK}/>`,
  cola: cyl(93, 76, 104, 9, "#c8ccd0") + `<path d="M84 82 H102 V100 H84 Z" fill="#2d2226"/><path d="M84 90 H102" stroke="#e33" stroke-width="2"/>` + `<path d="${body(93, 76, 104, 9, 9, .3)}" fill="none" ${PK}/>`,
  whiskey: cyl(93, 78, 104, 10, "#7a4a22") + `<path d="M85 78 Q85 72 90 69 V60 h6 v9 Q101 72 101 78" fill="#7a4a22" ${PK}/><rect x="89" y="56" width="8" height="5" rx="1" fill="${INK}"/><path d="M84 86 H102 V96 H84 Z" fill="#f3e6cf" ${K(1.6)}/>`,
  instant: cyl(93, 82, 104, 10, C.chocolate) + `<path d="M83 88 H103 V98 H83 Z" fill="#ffffff" ${K(1.6)}/>` + `<path d="${body(93, 82, 104, 10, 10, .3)}" fill="none" ${PK}/>` + cyl(93, 76, 82, 11, X.wine),
  ice: cube(82, 96, 6.5, "rgba(255,255,255,.85)", "rgba(255,255,255,.6)", "rgba(230,240,246,.8)") + cube(96, 99, 6, "rgba(255,255,255,.85)", "rgba(255,255,255,.6)", "rgba(230,240,246,.8)"),
};

/* ---------------- choosing and assembling ---------------- */
function geoFor(e: Entry): { g: Geo; prop: Prop } {
  if (e.kind === "library") return { g: e.o === "inverted" ? AERO_INV : AERO, prop: "bag" };
  const s = e.kind === "drink" ? DRINK[e.id] : HOUSE[e.id];
  if (s === "moka") return { g: MOKA, prop: "demi" };
  if (s === "press") return { g: PRESS, prop: "beans" };
  if (s === "v60") return { g: V60, prop: "bag" };
  const spec: Spec = s ?? { v: "mug", layers: [["coffee", 1]], prop: "beans" };
  return { g: vessel(spec), prop: spec.prop };
}
const ruler = (r: Drawn) => {
  const ys = r.marks.map((m) => m[0]).filter((y) => y > 0 && y < r.bottom);
  if (!ys.length) return "";
  return ln(`M${r.rx} ${Math.min(...ys)} V${r.bottom}`, 1.8) + [...ys, r.bottom].map((y) => ln(`M${r.rx - 4} ${y} H${r.rx + 1}`, 1.8)).join("");
};
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Card size: the vessel alone, cut open. */
export function artCard(e: Entry, idp: string): string {
  let n = 0; const id = () => idp + "x" + n++;
  const { g } = geoFor(e), r = g.draw(id), [x, y, s] = g.vb;
  return `<svg viewBox="${x} ${y} ${s} ${s}" role="img" aria-label="${esc(e.name)}">${r.o}${g.flame ? flames(110) : ""}</svg>`;
}

function scene(e: Entry, idp: string) {
  let n = 0; const id = () => idp + "s" + n++;
  const { g, prop } = geoFor(e), r = g.draw(id), sc = .8, tx = 44 - g.cx * sc, ty = 108 - g.foot * sc;
  return { r, tx, ty, sc, o: `<g transform="translate(${tx} ${ty}) scale(${sc})">${r.o}${ruler(r)}${g.flame ? flames(110) : ""}</g>${PROPS[prop]}` + ln("M4 108 H116", P) };
}

/** Recipe header: on the table with one companion, and a ruler marking each layer. */
export function artScene(e: Entry, idp: string): string {
  return `<svg viewBox="0 2 120 120" role="img" aria-label="${esc(e.name)}">${scene(e, idp).o}</svg>`;
}

/** Opened up: the scene with every layer named. */
export function artOpen(e: Entry, idp: string): { svg: string; parts: string[] } {
  const s = scene(e, idp), XO = 78;
  let labels = "", last = -99;
  const sorted = s.r.marks.slice().sort((a, b) => a[0] - b[0]);
  for (const [y, t] of sorted) {
    const yy = s.ty + y * s.sc, ly = Math.max(yy, last + 14); last = ly;
    const words = t.split(" "), lines: string[] = []; let cur = "";
    for (const w of words) { if ((cur + " " + w).trim().length > 15) { lines.push(cur.trim()); cur = w; } else cur += " " + w; }
    lines.push(cur.trim());
    const tipX = XO + s.tx + s.r.rx * s.sc - 5;
    labels += `<text x="4" y="${ly - (lines.length - 1) * 5 + 3}" font-size="8.4" font-weight="600" fill="${FG}">${lines.map((l, i) => `<tspan x="4" dy="${i ? 10 : 0}">${esc(l)}${i < lines.length - 1 ? " " : ""}</tspan>`).join("")}</text>` +
      `<path d="M56 ${ly} L${tipX - 1} ${yy}" fill="none" stroke="${MUTED}" stroke-width=".9"/><circle cx="${tipX}" cy="${yy}" r="1.4" fill="${MUTED}"/>`;
    if (lines.length > 1) last += (lines.length - 1) * 10;
  }
  const h = Math.max(122, last + 12);
  return { svg: `<svg viewBox="0 0 198 ${h}" role="img" aria-label="${esc(e.name)}, opened up with each part named">${labels}<g transform="translate(${XO} 0)">${s.o}</g></svg>`, parts: sorted.map((m) => m[1]) };
}

export const DRINK_IDS_WITH_ART = Object.keys(DRINK);
