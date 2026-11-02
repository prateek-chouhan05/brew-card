/* Generated from the original Brew Card page. Edit freely — this is now the source of truth. */
import type { GroupId, SegKind } from '../types';
import type { IconName } from '../icons';

export const ICON: Record<SegKind | "serve", IconName> = {pour:"pour", wait:"wait", swirl:"swirl", stir:"stir", press:"press", flip:"flip", serve:"done"};

export const KIND_LABEL: Record<SegKind | "serve", string> = {pour:"Pour", wait:"Wait", swirl:"Swirl", stir:"Stir", press:"Press", flip:"Flip", serve:"Serve"};
/** The one-word name of a step: its own short name ("Bloom", "Drain") if it has one, else its kind's. */
export const segWord = (s: { k: SegKind; short?: string }) => s.short ?? KIND_LABEL[s.k];

export const GROUPS: { id: GroupId | ""; label: string; icon: IconName | "" }[] = [
  {id:"",      label:"All",               icon:""},
  {id:"mine",  label:"My methods",        icon:"mine"},
  {id:"drink", label:"Coffee drinks",     icon:"drinks"},
  {id:"champ", label:"Championship",      icon:"champ"},
  {id:"pro",   label:"Barista & roaster", icon:"barista"},
  {id:"fan",   label:"Enthusiast",        icon:"home"}
];

export const GROUP_ICON: Record<GroupId, IconName> = {mine:"mine", drink:"drinks", champ:"champ", pro:"barista", fan:"home"};

export const VOLUMES: { id: string; label: string; icon: IconName; gain: number }[] = [
  {id:"high", label:"High", icon:"volHigh", gain:1.0},
  {id:"med",  label:"Medium", icon:"volLow", gain:0.5},
  {id:"low",  label:"Low", icon:"volLow", gain:0.2},
  {id:"off",  label:"Off", icon:"volOff", gain:0}
];
