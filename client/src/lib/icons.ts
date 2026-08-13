/**
 * The stroke weight every lucide icon draws at. It was written out at 61 call sites and declared
 * again in four components, and had already drifted to 2 in one of them — which is exactly the kind
 * of difference nobody spots in review but everybody sees on screen.
 */
export const ICON_STROKE = 1.75

/**
 * The only sizes an icon may be drawn at. There were eight before this — 12 through 18 and 24 — and
 * the same icon appeared at three of them depending on the file, so the steps are named for where
 * they belong rather than how big they are.
 */
export const ICON = {
  /** The dismiss ✕ inside a chip, and nothing else — the one place 16 is too heavy. */
  xs: 12,
  /** Sitting in a line of text: meta pills, inline markers. */
  sm: 14,
  /** Inside a button, next to its label. A spinner standing in for one of these matches it. */
  md: 16,
  /** A button that is only an icon, and rows in the sidebar. */
  lg: 18,
  /** Page-level: an empty state, or the spinner that covers the whole app. */
  xl: 24,
} as const
