/**
 * The stroke weight every lucide icon draws at. It was written out at 61 call sites and declared
 * again in four components, and had already drifted to 2 in one of them — which is exactly the kind
 * of difference nobody spots in review but everybody sees on screen.
 */
export const ICON_STROKE = 1.75
