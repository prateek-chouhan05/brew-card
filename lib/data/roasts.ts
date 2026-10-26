/* Generated from the original Brew Card page. Edit freely — this is now the source of truth. */
import type { Roast } from '../types';

export const ROASTS: Roast[] = [
  {id:"light",    label:"Light",        emoji:"🌕", temp:99, adj:-1, rank:0,
   note:"Dense, hard beans that resist extraction — near-boiling water and a touch finer. Expect high acidity and tea-like body."},
  {id:"medlight", label:"Medium-light", emoji:"🌔", temp:95, adj:-1, rank:1,
   note:"Fruit and fermentation character still intact, but more forgiving than a true light roast. Most experimental lots sit here."},
  {id:"medium",   label:"Medium",       emoji:"🌓", temp:92, adj:0,  rank:2,
   note:"The balanced middle. Sweetness and acidity both present; nothing needs compensating for."},
  {id:"meddark",  label:"Medium-dark",  emoji:"🌒", temp:88, adj:1,  rank:3,
   note:"Roast character starts to dominate. Cooler water and a coarser grind keep the bitterness in check."},
  {id:"dark",     label:"Dark",         emoji:"🌑", temp:85, adj:2,  rank:4,
   note:"Very soluble and quick to turn harsh. Brew cool and coarse, and consider drinking it with milk."}
];

export const OFFBOIL: Record<number, string> = {99:"15 s", 95:"40 s", 92:"60 s", 88:"80 s", 85:"2 min"};

export const LIB_ROAST_RANK: Record<string, number> = {light:0, medium:2, dark:4};

export const LIB_ROAST_EMOJI: Record<string, string> = {light:"🌕", medium:"🌓", dark:"🌑", any:"⚪"};
