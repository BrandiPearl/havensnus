import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "default" | "light";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  href?: string;
}

const sizes = {
  sm: { mark: 32, text: "text-[1.0625rem]", sub: "text-[0.5625rem]" },
  md: { mark: 38, text: "text-xl", sub: "text-[0.625rem]" },
  lg: { mark: 46, text: "text-2xl", sub: "text-[0.6875rem]" },
};

/** Placeholder mark until the final logo is supplied: a can lid with an H. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("flex-shrink-0", className)}
    >
      <circle cx="16" cy="16" r="15" fill="#13806c" />
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" />
      <path d="M11.5 9.5v13M20.5 9.5v13M11.5 16h9" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({
  variant = "default",
  size = "md",
  showText = true,
  className,
  href = "/",
}: LogoProps) {
  const { mark, text, sub } = sizes[size];

  const textColor = variant === "light" ? "text-white" : "text-slate-900";
  const subColor = variant === "light" ? "text-white/45" : "text-slate-500";

  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={mark} />
      {showText && (
        <div className="text-left leading-none">
          <div
            className={cn("font-display display-wide font-extrabold tracking-[-0.03em]", text, textColor)}
          >
            Haven
          </div>
          <div className={cn("mt-[3px] font-mono uppercase tracking-[0.3em]", sub, subColor)}>
            Snus
          </div>
        </div>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="flex-shrink-0" aria-label="Haven Snus home">
      {content}
    </Link>
  );
}
