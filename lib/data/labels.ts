/* Generated from the original Brew Card page. Edit freely — this is now the source of truth. */
import type { GroupId, SegKind } from '../types';

export const ICON: Record<SegKind | "serve", string> = {pour:"💧", wait:"⏳", swirl:"🌀", stir:"🥄", press:"⬇️", flip:"🔄", serve:"☕"};

export const KIND_LABEL: Record<SegKind | "serve", string> = {pour:"Pour", wait:"Wait", swirl:"Swirl", stir:"Stir", press:"Press", flip:"Flip", serve:"Serve"};

export const GROUPS: { id: GroupId | ""; label: string; emoji: string }[] = [
  {id:"",      label:"All",               emoji:""},
  {id:"mine",  label:"My methods",        emoji:"🌟"},
  {id:"drink", label:"Coffee drinks",     emoji:"🍹"},
  {id:"champ", label:"Championship",      emoji:"🏆"},
  {id:"pro",   label:"Barista & roaster", emoji:"🎓"},
  {id:"fan",   label:"Enthusiast",        emoji:"🏠"}
];

export const GROUP_EMOJI: Record<GroupId, string> = {mine:"🌟", drink:"🍹", champ:"🏆", pro:"🎓", fan:"🏠"};

export const VOLUMES: { id: string; label: string; gain: number }[] = [
  {id:"high", label:"🔊 HIGH", gain:1.0},
  {id:"med",  label:"🔉 MED",  gain:0.5},
  {id:"low",  label:"🔈 LOW",  gain:0.2},
  {id:"off",  label:"🔕 OFF",  gain:0}
];
