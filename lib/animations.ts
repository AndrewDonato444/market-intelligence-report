/**
 * Shared animation variants for the Report Creation Experience.
 *
 * All durations and easings match the design tokens defined in
 * .specs/design-system/tokens.md and wired through app/globals.css.
 */

import type { Variants, Transition, Easing } from "framer-motion";

// ---------------------------------------------------------------------------
// Duration & easing constants (mirror CSS custom-property values)
// ---------------------------------------------------------------------------

export const DURATION_FAST = 0.1; // 100ms
export const DURATION_DEFAULT = 0.2; // 200ms
export const DURATION_SLOW = 0.3; // 300ms

export const EASING_DEFAULT: Easing = [0.4, 0, 0.2, 1];
export const EASING_SPRING: Easing = [0.34, 1.56, 0.64, 1];

// ---------------------------------------------------------------------------
// Transition presets
// ---------------------------------------------------------------------------

const transitionSlow: Transition = {
  duration: DURATION_SLOW,
  ease: EASING_DEFAULT,
};

const transitionDefault: Transition = {
  duration: DURATION_DEFAULT,
  ease: EASING_DEFAULT,
};

// ---------------------------------------------------------------------------
// fadeVariant
// ---------------------------------------------------------------------------

export const fadeVariant: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitionSlow },
  exit: { opacity: 0, transition: transitionSlow },
};

// ---------------------------------------------------------------------------
// slideVariant(direction)
// ---------------------------------------------------------------------------

export type SlideDirection = "left" | "right" | "up" | "down";

const slideOffsets: Record<SlideDirection, { x?: number; y?: number }> = {
  left: { x: -20 },
  right: { x: 20 },
  up: { y: -20 },
  down: { y: 20 },
};

export function slideVariant(direction: SlideDirection = "left"): Variants {
  const oppositeMap: Record<SlideDirection, SlideDirection> = {
    left: "right",
    right: "left",
    up: "down",
    down: "up",
  };
  const enterOffset = slideOffsets[oppositeMap[direction]];
  const exitOffset = slideOffsets[direction];

  return {
    initial: { opacity: 0, ...enterOffset },
    animate: { opacity: 1, x: 0, y: 0, transition: transitionSlow },
    exit: { opacity: 0, ...exitOffset, transition: transitionSlow },
  };
}

// ---------------------------------------------------------------------------
// scaleVariant
// ---------------------------------------------------------------------------

export const scaleVariant: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: transitionDefault },
  exit: { opacity: 0, scale: 0.95, transition: transitionDefault },
};

// ---------------------------------------------------------------------------
// selectionVariant (tap feedback)
// ---------------------------------------------------------------------------

export const selectionVariant = {
  tap: { scale: 1.02 },
  transition: {
    duration: DURATION_FAST,
    ease: EASING_SPRING,
  },
};

// ---------------------------------------------------------------------------
// staggerContainer
// ---------------------------------------------------------------------------

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      when: "beforeChildren",
    },
  },
};

// ---------------------------------------------------------------------------
// pageTransition(direction)
// ---------------------------------------------------------------------------

export type PageDirection = "forward" | "backward";

export function pageTransition(direction: PageDirection = "forward"): Variants {
  const sign = direction === "forward" ? 1 : -1;

  return {
    initial: { opacity: 0, x: 20 * sign },
    animate: { opacity: 1, x: 0, transition: transitionSlow },
    exit: { opacity: 0, x: -20 * sign, transition: transitionSlow },
  };
}
