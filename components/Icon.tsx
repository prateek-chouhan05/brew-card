import { ICONS, LIB_ROAST_SWATCH, ROAST_SWATCH, TASTE_ICON, type IconName } from "@/lib/icons";
import type { FlavourId, RoastId } from "@/lib/types";

type Labelled = { className?: string; label?: string };

/** One drawn icon. Decorative unless given a label. Sized by CSS (1.15em by default). */
export function Icon({ name, className, label }: { name: IconName } & Labelled) {
  return (
    <svg className={"ic" + (className ? " " + className : "")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
      strokeLinecap="round" strokeLinejoin="round" {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      dangerouslySetInnerHTML={{ __html: (label ? `<title>${label}</title>` : "") + ICONS[name] }} />
  );
}

/** A taste family, drawn in its own colour. */
export function TasteMark({ id, className, label }: { id: FlavourId } & Labelled) {
  const t = TASTE_ICON[id];
  return (
    <svg className={"ic taste" + (className ? " " + className : "")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
      strokeLinecap="round" strokeLinejoin="round" style={{ color: t.color }} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      dangerouslySetInnerHTML={{ __html: (label ? `<title>${label}</title>` : "") + t.d }} />
  );
}

/** The colour of the beans. `any` (library recipes with no stated roast) is an empty ring. */
export function RoastSwatch({ id, lib, className, label }: { id?: RoastId; lib?: string } & Labelled) {
  const c = id ? ROAST_SWATCH[id] : LIB_ROAST_SWATCH[lib ?? "any"] ?? null;
  return (
    <span className={"sw" + (c ? "" : " any") + (className ? " " + className : "")} style={c ? { background: c } : undefined}
      {...(label ? { role: "img", "aria-label": label, title: label } : { "aria-hidden": true })} />
  );
}

/** Rating marker for taste: a dot on a line, left (sour) to right (bitter). */
export function ScaleMark({ pos }: { pos: 0 | 1 | 2 }) {
  return (
    <svg className="mark" viewBox="0 0 30 12" aria-hidden="true">
      <path d="M3 6h24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".45" />
      <circle cx={3 + pos * 12} cy="6" r="4" fill="currentColor" />
    </svg>
  );
}

/** Rating marker for strength: one to three rising bars. */
export function StrengthMark({ k }: { k: 1 | 2 | 3 }) {
  return (
    <svg className="mark" viewBox="0 0 30 12" aria-hidden="true">
      {[0, 1, 2].map((i) => <rect key={i} x={6 + i * 7} y={8 - i * 3} width="4" height={4 + i * 3} rx="1" fill="currentColor" opacity={i < k ? 1 : 0.25} />)}
    </svg>
  );
}

/** The app mark: a lowercase b whose bowl holds coffee and crema ("A filled b"). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={"brandmark" + (className ? " " + className : "")} viewBox="0 0 512 512" aria-hidden="true">
      <rect width="512" height="512" rx="112" fill="#8a2846" />
      <rect x="140" y="92" width="58" height="306" rx="12" fill="#fff" />
      <circle cx="276" cy="300" r="116" fill="#fff" />
      <circle cx="276" cy="300" r="86" fill="#f6e6ec" />
      <path d="M190 300h172a86 86 0 0 1-172 0z" fill="#3f2416" />
      <path d="M190 300H362L360.85 314H191.15Z" fill="#c99a63" />
    </svg>
  );
}
