/* The drawn icon set: 24 px grid, 1.75 px stroke, round ends, drawn in the text colour.
   Presented and approved as "Brew Card Icons"; every emoji in the app maps to one of these. */
import type { FlavourId, RoastId } from "./types";

export const ICONS = {
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
  timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V9.5M10 2.8h4M12 2.8v3.7M17.6 7.4l1.4-1.4"/>',
  guides: '<path d="M12 6.6C10.4 5.2 8 4.7 4 4.7v13.2c4 0 6.4.5 8 2 1.6-1.5 4-2 8-2V4.7c-4 0-6.4.5-8 1.9z"/><path d="M12 6.6v13.3"/>',
  setup: '<path d="M4 7h8.5M17.5 7H20M4 17h2.5M11.5 17H20"/><circle cx="15" cy="7" r="2.5"/><circle cx="9" cy="17" r="2.5"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  external: '<path d="M14 4.5h5.5V10M19.5 4.5L11 13M18 14v4.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1H10"/>',
  install: '<path d="M12 4v10.5M7.5 10l4.5 4.5 4.5-4.5M5 19.5h14"/>',
  recent: '<circle cx="12" cy="12" r="8"/><path d="M12 7.8V12l2.8 1.9"/>',
  refine: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  aeropress: '<path d="M6.5 4.5h11M8.5 4.5V14h7V4.5M7.5 14.5h9"/><path d="M8.5 9.5h7"/><path d="M6.8 17h10.4v1.6a2 2 0 0 1-2 2H8.8a2 2 0 0 1-2-2z"/>',
  inverted: '<path d="M6 19.5h9M7.5 19.5V17M13.5 19.5V17M6.5 17h8M7.5 17V5h6v12M6 5h9"/><path d="M18 8.5a4.5 4.5 0 0 1 0 6.5M18 15l-.3-2.2M18 15l2.1-.6"/>',
  moka: '<path d="M8.5 3.5h6l1.5 6.5H7z"/><path d="M7 10h9M7.5 12.5h8l1.3 8H6.2z"/><path d="M16 5.5h2.2a.8.8 0 0 1 .8.8V10"/><path d="M8.5 3.5L6.5 2.5"/>',
  jar: '<rect x="6.5" y="7" width="11" height="13.5" rx="2.2"/><path d="M8 3.5h8v3.5H8zM6.5 12.5h11"/>',
  assemble: '<path d="M5.5 7.5h10l-1.2 12a1.6 1.6 0 0 1-1.6 1.5H8.3a1.6 1.6 0 0 1-1.6-1.5z"/><path d="M6.2 13h8.6M13.5 3l5 15"/>',
  concentrate: '<path d="M6.5 9.5h9v3.5a4.5 4.5 0 0 1-9 0z"/><path d="M15.5 10.5h1a2 2 0 0 1 0 4h-1.4M5 20h12M9.5 3.8c-.7 1 .7 1.7 0 2.7M12.5 3.8c-.7 1 .7 1.7 0 2.7"/>',
  stovetop: '<path d="M12 17c-2.9 0-4.6-1.9-4.6-4.3 0-2.8 2.7-4 2.7-7.2 1.9 1.1 2.9 2.8 2.9 4.4.6-.5 1-1.4 1.1-2.3 1.5 1.2 2.6 3 2.6 5.1 0 2.4-1.8 4.3-4.7 4.3z"/><path d="M3.5 20h17M7 20v-1.5M17 20v-1.5"/>',
  overnight: '<path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z"/>',
  pour: '<path d="M11 10h8l.8 9a1.4 1.4 0 0 1-1.4 1.5h-6.8A1.4 1.4 0 0 1 10.2 19z"/><path d="M12.6 10l1-2.5h2.8l1 2.5M10.7 16.5C7.2 16.5 6.4 11 3.5 9.5M3.5 13v3"/>',
  wait: '<path d="M7 3.5h10M7 20.5h10M8 3.5c0 5.2 8 3.8 8 8.5s-8 3.3-8 8.5M16 3.5c0 5.2-8 3.8-8 8.5s8 3.3 8 8.5"/>',
  stir: '<path d="M16.5 3.5L10 14"/><path d="M8.6 12.9l3.1 1.9-2.5 4.1-3.1-1.9z"/><path d="M4 20c3.5 1.3 10 1.3 15-2"/>',
  swirl: '<path d="M12.5 12.2a1.2 1.2 0 1 1-1.2-1.4 2.8 2.8 0 1 1-2.6 3.6M8.7 14.4A5.2 5.2 0 1 1 16.4 17M16.4 17a8 8 0 0 1-10.6 1.2"/>',
  flip: '<path d="M4.5 12a7.5 7.5 0 0 1 13-5.1M19.5 12a7.5 7.5 0 0 1-13 5.1"/><path d="M17.8 3.5v3.6h-3.6M6.2 20.5v-3.6h3.6"/>',
  press: '<path d="M12 3v8.5M8.8 8.3 12 11.5l3.2-3.2"/><path d="M6 14.5h12M7.5 14.5v5.5h9v-5.5"/>',
  done: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.4a2 2 0 0 1 0 4H16M8.4 13.3l1.9 1.8 3.2-3.5"/>',
  hot: '<path d="M5 12.5h11v3a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 15.5z"/><path d="M16 13.5h1.2a2 2 0 0 1 0 4H16M8.5 4c-1 1.4 1 2.6 0 4.5M12.5 4c-1 1.4 1 2.6 0 4.5"/>',
  iced: '<path d="M12 3.5l7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7z"/><path d="M4.5 7.7L12 12l7.5-4.3M12 12v8.5"/>',
  milk: '<path d="M8.5 8l1.8-4.5h3.4L15.5 8v12.5h-7z"/><path d="M8.5 8h7M8.5 13h7"/>',
  alcohol: '<path d="M5 4.5h14l-7 7.5z"/><path d="M12 12v8M8.5 20h7M8 8h8"/>',
  mine: '<path d="M7 3.5h10v17l-5-3.8-5 3.8z"/><path d="M9.8 9.6l1.5 1.5 3-3.2"/>',
  drinks: '<path d="M7 7h10l-1.4 12.8a1.4 1.4 0 0 1-1.4 1.2H9.8a1.4 1.4 0 0 1-1.4-1.2z"/><path d="M14 3l-1.6 4M7.5 11.5h9"/>',
  champ: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5.8H5.5A2.5 2.5 0 0 0 8 10M16 5.8h2.5A2.5 2.5 0 0 1 16 10M12 13v4M8.5 20.5h7M10 17h4v3.5h-4z"/>',
  barista: '<path d="M9 3.5h6v2.8a3 3 0 0 1-6 0z"/><path d="M12 9.3v4.2M5.5 13.5h13v1.5a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5z"/>',
  home: '<path d="M4 11l8-7 8 7M6 9.4V20h12V9.4M10 20v-5h4v5"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  pause: '<path d="M9 5.5v13M15 5.5v13"/>',
  reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4.2h4.2"/>',
  volHigh: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  volLow: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/>',
  volOff: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/>',
  voice: '<path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8 9.3h8M8 12.3h5"/>',
  voiceOff: '<path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M3.5 3.5l17 17"/>',
  handsfree: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  save: '<path d="M7 3.5h10v17l-5-3.8-5 3.8z"/>',
  saved: '<path d="M7 3.5h10v17l-5-3.8-5 3.8z" fill="currentColor"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  warning: '<path d="M10.3 4.7a2 2 0 0 1 3.4 0l7 12.2a2 2 0 0 1-1.7 3H5a2 2 0 0 1-1.7-3z"/><path d="M12 10v4M12 17v.01"/>',
  tip: '<path d="M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.2 1.1 2V17h5v-.7c0-.8.5-1.5 1.1-2A6 6 0 0 0 12 3.5z"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.01"/>',
  note: '<path d="M4.5 19.5h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4.5 15.5z"/><path d="M13.5 6.5l4 4"/>',
  bean: '<ellipse cx="12" cy="12" rx="6.2" ry="8.6" transform="rotate(35 12 12)"/><path d="M15.6 6.8c-2.6 1.6-1.2 4.2-3.6 5.2s-3.6 2-3.8 5.2"/>',
  match: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>',
  grind: '<path d="M8.5 10h7l-1 10h-5z"/><path d="M7 10h10M12 10V5.5h5"/><circle cx="17.5" cy="5.5" r="1.4"/>',
  temp: '<path d="M14 14.4V5a2 2 0 0 0-4 0v9.4a4 4 0 1 0 4 0z"/><path d="M12 10.5v6.2"/>',
  filter: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v.01M8.5 10.5v.01M15.5 10.5v.01M9.5 14.5v.01M14.5 14.5v.01M12 12v.01M12 16.5v.01"/>',
  prep: '<rect x="5.5" y="4.5" width="13" height="16" rx="1.6"/><path d="M9.5 3.5h5V6h-5zM8.8 11h6.4M8.8 14.5h6.4"/>',
  scale: '<path d="M6.5 11h11l1.5 3H5z"/><rect x="4" y="14" width="16" height="6" rx="2"/><path d="M10 17h4"/>',
  cup: '<path d="M5 8.5h11V13a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 9.5h1.4a2 2 0 0 1 0 4H16M3.5 20.5h15"/>',
  mug: '<path d="M5 5.5h11V16a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 8.5h1.5a2.5 2.5 0 0 1 0 5H16M5 9.5h11"/>',
  sweet: '<path d="M7 11.5h10l-5 9z"/><path d="M7.2 11.5a4.8 4.8 0 0 1 9.6 0"/><path d="M12 6.7V4.5"/>',
  soda: '<rect x="7" y="5.5" width="10" height="15" rx="2"/><path d="M9 3.5h6M7 9.5h10M7 16.5h10"/>',
} as const;

export type IconName = keyof typeof ICONS;

/** Taste families: drawn, then tinted with their own colour. */
export const TASTE_ICON: Record<FlavourId, { d: string; color: string }> = {
  fruity: { color: "#b8325a", d: '<circle cx="8.5" cy="16" r="3.5"/><circle cx="15.5" cy="15" r="3.5"/><path d="M8.5 12.5C9 8.2 11 5.4 15.2 4M15.5 11.5C15 8.2 14.3 6 15.2 4"/>' },
  citrus: { color: "#c99400", d: '<path d="M3.5 12.5a8.5 8.5 0 0 0 17 0z"/><path d="M12 12.5v8.5M12 12.5l-5.8 5.8M12 12.5l5.8 5.8"/>' },
  floral: { color: "#9a6cc8", d: '<circle cx="12" cy="11" r="2.2"/><path d="M12 8.8C10 6.5 10.6 3.8 12 3.5c1.4.3 2 3 0 5.3M14.1 10.3c2.6-1.6 5.1-.6 5.2.8-.2 1.4-2.9 2.3-5.2 1M13.4 13c1.3 2.8.2 5.2-1.2 5.2s-2.7-2.4-1.6-5.2M10.6 13c-2.8 1-5.2-.4-5-1.8s2.9-2 5.2-.9M12 18.2V21"/>' },
  caramel: { color: "#c98a3a", d: '<path d="M4 20l6.2-6.2"/><ellipse cx="14.2" cy="9.8" rx="4" ry="5.4" transform="rotate(45 14.2 9.8)"/><path d="M11.3 10.2l3.6-3.6M13.1 12l3.6-3.6M18 16v3"/>' },
  nutty: { color: "#9a6b3f", d: '<path d="M12 3.5c3.7 2.7 5.8 6.6 5.8 10.2a5.8 5.8 0 0 1-11.6 0c0-3.6 2.1-7.5 5.8-10.2z"/><path d="M10.5 11.5v.01M13.5 10.5v.01M12 14.5v.01M14 16v.01M10 15.8v.01"/>' },
  chocolate: { color: "#6b4129", d: '<rect x="5" y="3.5" width="14" height="17" rx="1.6"/><path d="M5 9.2h14M5 14.8h14M12 3.5v17"/>' },
  bold: { color: "#3a3230", d: '<path d="M12 21c-3.9 0-6-2.6-6-5.7 0-3.6 3.5-5.2 3.5-9.3 2.4 1.4 3.7 3.6 3.7 5.6.8-.7 1.3-1.8 1.4-3 1.9 1.5 3.4 3.8 3.4 6.6C18 18.5 15.9 21 12 21z"/>' },
};

/** Roast as a colour swatch, light to dark. */
export const ROAST_SWATCH: Record<RoastId, string> = { light: "#c49a6c", medlight: "#a8754a", medium: "#87573a", meddark: "#5e3a24", dark: "#35201a" };

/** Library recipes only say light, medium or dark (or any). */
export const LIB_ROAST_SWATCH: Record<string, string | null> = { light: ROAST_SWATCH.light, medium: ROAST_SWATCH.medium, dark: ROAST_SWATCH.dark, any: null };
