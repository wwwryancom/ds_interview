export const PIGGY = {
  reading: "/piggy/piggy-reading.png",
  growth: "/piggy/piggy-growth.png",
  mock: "/piggy/piggy-mock.png",
  avatar: "/piggy/piggy-avatar.png",
} as const;

/** Round avatar of 小猪 (uses the illustrated headshot). */
export function Mascot({ size = 64, src = PIGGY.avatar }: { size?: number; src?: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose-50 ring-1 ring-rose-100/80"
      style={{ width: size, height: size }}
    >
      <img src={src} alt="小猪" className="h-full w-full object-cover" draggable={false} />
    </span>
  );
}

/** Larger scene illustration (reading / growth / mock), not cropped to a circle. */
export function PiggyArt({
  src,
  alt = "小猪",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`select-none rounded-xl2 object-contain ${className}`}
    />
  );
}
