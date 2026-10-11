/** Strength levels as used on the source catalogue, lightest first. */
export const STRENGTH_LEVELS = [
  "Light",
  "Regular",
  "Strong",
  "Extra Strong",
  "Ultra Strong",
  "Extreme",
] as const;

/** 1–6 dot scale shown on cards and the product page. */
export function strengthDots(level?: string): number {
  const i = STRENGTH_LEVELS.indexOf(level as (typeof STRENGTH_LEVELS)[number]);
  return i < 0 ? 0 : i + 1;
}

export function strengthRank(level?: string): number {
  const dots = strengthDots(level);
  return dots === 0 ? 99 : dots;
}

/** Stable URL value for a facet label, e.g. "Menthol/Ice" → "menthol-ice". */
export function facetSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
