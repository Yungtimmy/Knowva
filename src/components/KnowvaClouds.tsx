const BLOB =
  "M20 70C2 70 0 48 14 42 8 24 30 14 40 24 46 6 72 8 74 24 92 18 106 34 96 48 110 58 98 78 82 72 74 86 50 84 46 74 36 82 22 80 20 70Z";

type Eyes = {
  e1: readonly [number, number];
  e2: readonly [number, number];
  p1: readonly [number, number];
  p2: readonly [number, number];
  rx?: number;
  ry?: number;
  pr?: number;
};

/** Shared pair used by header, auth, and CTA clusters in the design pack. */
const PAIR: Eyes = {
  e1: [46, 40],
  e2: [62, 40],
  p1: [44, 43],
  p2: [60, 43],
};

const HERO: { width: number; height: number; fill: string; front?: boolean; eyes: Eyes }[] = [
  {
    width: 110,
    height: 90,
    fill: "#2412B0",
    eyes: { e1: [44, 40], e2: [60, 38], p1: [41, 42], p2: [57, 40] },
  },
  {
    width: 150,
    height: 120,
    fill: "#FF4A1C",
    front: true,
    eyes: { e1: [46, 42], e2: [62, 42], p1: [43, 45], p2: [59, 45] },
  },
  {
    width: 105,
    height: 86,
    fill: "#FBE062",
    eyes: { e1: [46, 38], e2: [62, 38], p1: [48, 40], p2: [64, 40] },
  },
];

const CLUSTERS = {
  brand: [
    { width: 26, height: 21, fill: "#2412B0" },
    { width: 32, height: 26, fill: "#FF4A1C" },
    { width: 24, height: 19, fill: "#FBE062" },
  ],
  auth: [
    { width: 44, height: 36, fill: "#2412B0" },
    { width: 58, height: 47, fill: "#FF4A1C" },
    { width: 42, height: 34, fill: "#FBE062" },
  ],
  cta: [
    { width: 56, height: 45, fill: "#2412B0" },
    { width: 70, height: 57, fill: "#FF4A1C" },
    { width: 52, height: 42, fill: "#FBE062" },
  ],
} as const;

function Cloud({
  width,
  height,
  fill,
  eyes = PAIR,
  className,
}: {
  width: number;
  height: number;
  fill: string;
  eyes?: Eyes;
  className?: string;
}) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 110 90" aria-hidden="true">
      <path d={BLOB} fill={fill} />
      <ellipse cx={eyes.e1[0]} cy={eyes.e1[1]} rx={eyes.rx ?? 7} ry={eyes.ry ?? 10} fill="#fff" />
      <ellipse cx={eyes.e2[0]} cy={eyes.e2[1]} rx={eyes.rx ?? 7} ry={eyes.ry ?? 10} fill="#fff" />
      <circle cx={eyes.p1[0]} cy={eyes.p1[1]} r={eyes.pr ?? 4} fill="#1C1B19" />
      <circle cx={eyes.p2[0]} cy={eyes.p2[1]} r={eyes.pr ?? 4} fill="#1C1B19" />
    </svg>
  );
}

export function KnowvaClouds({ size = "brand" }: { size?: "hero" | "brand" | "auth" | "cta" }) {
  if (size === "hero") {
    return (
      <div className="knowva-clouds knowva-clouds--hero" aria-hidden="true">
        {HERO.map((cloud) => (
          <Cloud
            key={cloud.fill}
            className={cloud.front ? "front" : undefined}
            width={cloud.width}
            height={cloud.height}
            fill={cloud.fill}
            eyes={cloud.eyes}
          />
        ))}
      </div>
    );
  }

  const clouds = CLUSTERS[size];
  const className = size === "brand" ? "brand-clouds" : size === "auth" ? "auth-clouds" : "cta-clouds";
  return (
    <div className={className} aria-hidden="true">
      {clouds.map((cloud) => (
        <Cloud key={cloud.fill} {...cloud} />
      ))}
    </div>
  );
}

export function AuthFloats() {
  return (
    <>
      <Cloud className="auth-float auth-float-1" width={90} height={73} fill="#2412B0" />
      <Cloud className="auth-float auth-float-2" width={80} height={65} fill="#FBE062" />
      <Cloud className="auth-float auth-float-3" width={60} height={49} fill="#FF4A1C" />
    </>
  );
}
