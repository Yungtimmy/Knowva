const BLOB =
  "M20 70C2 70 0 48 14 42 8 24 30 14 40 24 46 6 72 8 74 24 92 18 106 34 96 48 110 58 98 78 82 72 74 86 50 84 46 74 36 82 22 80 20 70Z";

const FILLS = {
  blue: { body: "#2412B0", eye: "#fff", pupil: "#1C1B19" },
  orange: { body: "#FF4A1C", eye: "#fff", pupil: "#1C1B19" },
  yellow: { body: "#FBE062", eye: "#fff", pupil: "#1C1B19" },
  ink: { body: "#FFFDF8", eye: "#1C1B19", pupil: "#FFFDF8" },
} as const;

export function Mascot({
  variant = "blue",
  color,
  smile = false,
  className = "mascot",
}: {
  variant?: keyof typeof FILLS;
  /** Per-tutor hex. Overrides the named variant fill. Eyes stay cream with ink pupils. */
  color?: string;
  smile?: boolean;
  className?: string;
}) {
  const named = FILLS[variant];
  const fill = color ? { body: color, eye: "#FFFDF8", pupil: "#1C1B19" } : named;
  return (
    <svg className={className} viewBox="0 0 110 90" aria-hidden="true">
      <path d={BLOB} fill={fill.body} />
      <ellipse cx="46" cy="42" rx="7" ry="10" fill={fill.eye} />
      <ellipse cx="64" cy="42" rx="7" ry="10" fill={fill.eye} />
      <circle cx="48" cy="45" r="4" fill={fill.pupil} />
      <circle cx="66" cy="45" r="4" fill={fill.pupil} />
      {smile ? (
        <path d="M48 60q7 6 14 0" stroke="#1C1B19" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}

export function mascotFor(subject: string): { variant: keyof typeof FILLS; smile: boolean; tile: string } {
  if (subject === "Prompt engineering") return { variant: "blue", smile: true, tile: "#F7F4EC" };
  if (subject === "Software engineering") return { variant: "orange", smile: false, tile: "#F7F4EC" };
  if (subject === "Web APIs") return { variant: "yellow", smile: true, tile: "#F7F4EC" };
  return { variant: "ink", smile: false, tile: "#1C1B19" };
}
