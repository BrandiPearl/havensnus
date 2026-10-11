import { STRENGTH_LEVELS, strengthDots } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** Six-dot strength scale, the convention printed on most can lids. */
export function StrengthDots({
  level,
  className,
  size = "sm",
}: {
  level?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const filled = strengthDots(level);
  if (!filled) return null;

  return (
    <span
      className={cn("inline-flex items-center gap-[3px]", className)}
      role="img"
      aria-label={`Strength ${filled} of ${STRENGTH_LEVELS.length}: ${level}`}
    >
      {STRENGTH_LEVELS.map((_, i) => (
        <span
          key={i}
          className={cn(
            "rounded-full",
            size === "md" ? "h-2.5 w-2.5" : "h-[7px] w-[7px]",
            i < filled ? "bg-slate-900" : "border border-slate-300 bg-transparent"
          )}
        />
      ))}
    </span>
  );
}
