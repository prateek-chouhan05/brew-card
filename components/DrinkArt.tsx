"use client";
import { useId } from "react";
import type { Entry } from "@/lib/types";
import { artCard, artScene } from "@/lib/art";

/** The picture for any recipe. `card`: the vessel alone, cut open. `scene`: on the table with a companion and a layer ruler. */
export function RecipeArt({ entry, className, level = "card" }: { entry: Entry; className?: string; level?: "card" | "scene" }) {
  const idp = "a" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const html = level === "scene" ? artScene(entry, idp) : artCard(entry, idp);
  return <span className={"recipe-art" + (className ? " " + className : "")} dangerouslySetInnerHTML={{ __html: html }} />;
}

export { DRINK_IDS_WITH_ART } from "@/lib/art";
