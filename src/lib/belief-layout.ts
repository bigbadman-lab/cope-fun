export const BELIEF_TOP_VH = 0.14;
export const NAV_HEIGHT = "3.5rem";

/** Viewport Y where the belief top edge should sit (below nav). */
export function getBeliefTopViewportPx(): number {
  return window.innerHeight * BELIEF_TOP_VH;
}

/** Offset from the main content area (below nav) to align with getBeliefTopViewportPx(). */
export const BELIEF_TOP_IN_MAIN = `calc(${BELIEF_TOP_VH * 100}vh - ${NAV_HEIGHT})`;
