"use client";
import { useId, useState } from "react";
import type { Entry } from "@/lib/types";
import { artOpen } from "@/lib/art";
import { RecipeArt } from "./DrinkArt";
import { Icon } from "./Icon";
import { useModal } from "./useModal";

function note(e: Entry): string {
  if (e.kind === "house" && e.o === "moka") return "Steam in the base pushes the hot water up through the grounds, and the coffee collects in the top. Pull it off the heat at the first gurgle.";
  if (e.kind === "house" && e.o === "press") return "The coffee steeps in all of the water at once. At the end the mesh plunger only goes down to the surface — it strains as you pour, it doesn't press.";
  if (e.kind === "house" && e.o === "pourover") return "Water runs down through the bed of coffee and the paper filter, and drips into the server. The paper holds back the oils and fines, which is why it tastes so clean.";
  if (e.kind === "library") return e.o === "inverted"
    ? "Brewed upside-down on the plunger, so nothing drips early. At the flip the filter cap goes on and it turns over onto the mug."
    : "Brewed sitting on the mug: the coffee steeps in the chamber, then the plunger pushes it through the paper filter.";
  return "Each mark on the ruler is where a layer starts, drawn to this recipe's proportions.";
}

/** The recipe's picture at the top of the page; tap it to open the drawing with every part named. */
export function HeadArt({ entry }: { entry: Entry }) {
  const [open, setOpen] = useState(false);
  const ref = useModal(open, () => setOpen(false));
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const opened = open ? artOpen(entry, "o" + uid) : null;
  return (
    <>
      <button type="button" className="head-art" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <RecipeArt entry={entry} level="scene" />
        <span className="ha-hint"><Icon name="info" />What&apos;s inside</span>
      </button>
      <dialog className="sheetdlg artdlg" ref={ref} aria-labelledby={"h" + uid}>
        <div className="sheet">
          <div className="sheet-h">
            <h2 id={"h" + uid}>What&apos;s inside: {entry.name}</h2>
            <button type="button" className="x" aria-label="Close" onClick={() => setOpen(false)}><Icon name="close" /></button>
          </div>
          <div className="sheet-b">
            {opened && <div className="art-open" dangerouslySetInnerHTML={{ __html: opened.svg }} />}
            <p className="art-note">{note(entry)}</p>
          </div>
        </div>
      </dialog>
    </>
  );
}
