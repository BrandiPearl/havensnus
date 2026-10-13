import { useId } from "react";
import { cn } from "@/lib/utils";

/** Points for an n-pointed star centred on (cx, cy). */
function star(cx: number, cy: number, outer: number, points: number, innerRatio = 0.44) {
  const inner = outer * innerRatio;
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

/**
 * Australian flag as inline SVG (2:1). Emoji flags render as plain "AU"
 * letters on Windows, so we draw it to look the same everywhere.
 */
export function AuFlag({ className, title = "Australia" }: { className?: string; title?: string }) {
  const clipId = useId();
  return (
    <svg viewBox="0 0 40 20" className={cn("h-3.5 w-7 shrink-0 rounded-[2px]", className)} role="img" aria-label={title}>
      <rect width="40" height="20" fill="#00247d" />
      {/* Union Jack canton */}
      <clipPath id={clipId}>
        <rect width="20" height="10" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path d="M0,0 L20,10 M20,0 L0,10" stroke="#fff" strokeWidth="2" />
        <path d="M0,0 L20,10 M20,0 L0,10" stroke="#cf142b" strokeWidth="0.7" />
        <path d="M10,0 V10 M0,5 H20" stroke="#fff" strokeWidth="3.3" />
        <path d="M10,0 V10 M0,5 H20" stroke="#cf142b" strokeWidth="2" />
      </g>
      {/* Commonwealth Star */}
      <polygon points={star(10, 15, 3, 7)} fill="#fff" />
      {/* Southern Cross */}
      <polygon points={star(30, 3.4, 1.4, 7)} fill="#fff" />
      <polygon points={star(25.4, 8.6, 1.4, 7)} fill="#fff" />
      <polygon points={star(34.4, 7.6, 1.4, 7)} fill="#fff" />
      <polygon points={star(30, 16.6, 1.4, 7)} fill="#fff" />
      <polygon points={star(32.1, 10.6, 0.8, 5, 0.42)} fill="#fff" />
    </svg>
  );
}
