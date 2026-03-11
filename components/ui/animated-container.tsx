"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  fadeVariant,
  slideVariant,
  scaleVariant,
  staggerContainer,
  type SlideDirection,
} from "@/lib/animations";
import type { Variants } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnimationVariant = "fade" | "slide" | "scale" | "stagger";

export interface AnimatedContainerProps {
  /** Which animation variant to apply */
  variant?: AnimationVariant;
  /** Direction for slide variant (default: "up") */
  direction?: SlideDirection;
  /** Passed to the wrapping motion.div */
  className?: string;
  children: React.ReactNode;
  /** HTML tag to render as (default: "div") */
  as?: keyof typeof motion;
}

// ---------------------------------------------------------------------------
// Variant resolver
// ---------------------------------------------------------------------------

function resolveVariants(
  variant: AnimationVariant,
  direction: SlideDirection,
): Variants {
  switch (variant) {
    case "fade":
      return fadeVariant;
    case "slide":
      return slideVariant(direction);
    case "scale":
      return scaleVariant;
    case "stagger":
      return staggerContainer;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnimatedContainer({
  variant = "fade",
  direction = "up",
  className,
  children,
}: AnimatedContainerProps) {
  const variants = resolveVariants(variant, direction);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      data-testid="animated-container"
      data-variant={variant}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StaggerItem — child wrapper for stagger containers
// ---------------------------------------------------------------------------

export interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  /** Which variant to use for each stagger child (default: fade) */
  variant?: Exclude<AnimationVariant, "stagger">;
  direction?: SlideDirection;
}

export function StaggerItem({
  children,
  className,
  variant = "fade",
  direction = "up",
}: StaggerItemProps) {
  const variants = resolveVariants(variant, direction);

  return (
    <motion.div
      variants={variants}
      className={className}
      data-testid="stagger-item"
    >
      {children}
    </motion.div>
  );
}
