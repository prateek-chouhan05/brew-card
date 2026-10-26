/** AeroPress sitting on a mug (standard orientation). */
export function StdArt() {
  return (
    <svg viewBox="0 0 80 100" role="img" aria-label="AeroPress sitting on a mug">
      <rect className="ap-line" x="20" y="22" width="40" height="44" rx="2" />
      <rect className="ap-coffee" x="22" y="40" width="36" height="24" />
      <rect className="ap-line" x="24" y="8" width="32" height="20" />
      <rect className="ap-line" x="18" y="4" width="44" height="5" rx="2" />
      <rect className="ap-cap" x="17" y="64" width="46" height="5" rx="1.5" />
      <path className="ap-handle" d="M64 75 h4 a7 7 0 0 1 0 14 h-4" />
      <rect className="ap-mug" x="16" y="70" width="48" height="26" rx="4" />
    </svg>
  );
}

/** AeroPress upside-down on its plunger, flipped onto the mug later. */
export function InvArt() {
  return (
    <svg viewBox="0 0 80 100" role="img" aria-label="AeroPress upside-down on its plunger, flipped onto the mug later">
      <rect className="ap-ghost" x="17" y="22" width="46" height="5" rx="1.5" />
      <path className="ap-open" d="M20 33 V82 H60 V33" />
      <rect className="ap-coffee" x="22" y="40" width="36" height="24" />
      <rect className="ap-line" x="24" y="64" width="32" height="25" />
      <rect className="ap-line" x="18" y="88" width="44" height="5" rx="2" />
      <rect className="ap-scale" x="8" y="94" width="64" height="4" rx="2" />
      <path className="ap-arrow" d="M67 30 C78 40 78 60 69 70" />
      <polygon className="ap-arrowhead" points="63.5,68 70.5,76.5 73.5,66" />
    </svg>
  );
}
