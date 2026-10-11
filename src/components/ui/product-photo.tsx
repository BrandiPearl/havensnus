"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductPhotoProps {
  src?: string;
  alt: string;
  name: string;
  priority?: boolean;
  className?: string;
}

/**
 * Can shots are square packshots on white or transparent backgrounds, so
 * they are contained (never cropped) on a white tile with breathing room.
 */
export function ProductPhoto({ src, alt, name, priority = false, className }: ProductPhotoProps) {
  // Remember which URL failed, so a new src gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string>();

  if (!src || failedSrc === src) {
    return <PhotoPlaceholder name={name} />;
  }

  return (
    <div className="absolute inset-0 bg-white">
      {/* R2 serves sized webp already; a plain img avoids a second optimisation hop. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className={cn("absolute inset-0 h-full w-full object-contain p-[9%]", className)}
        onError={() => setFailedSrc(src)}
      />
    </div>
  );
}

function PhotoPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(/[\s–-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-slate-100"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, rgba(19,26,32,0.045) 0 1px, transparent 1px 9px)",
      }}
    >
      <span className="font-display display-wide text-4xl font-extrabold tracking-tight text-slate-300">
        {initials}
      </span>
    </div>
  );
}
