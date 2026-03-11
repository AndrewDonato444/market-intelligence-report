"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useId,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DURATION_FAST, EASING_DEFAULT } from "@/lib/animations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** Text or React node to render inside the tooltip */
  content: React.ReactNode;
  /** Where to position the tooltip relative to the trigger */
  placement?: TooltipPlacement;
  /** The trigger element(s) — must accept ref forwarding or be a native element */
  children: React.ReactNode;
  /** Extra className applied to the tooltip container */
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GAP = 8; // space between trigger and tooltip

const tooltipVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION_FAST,
      ease: EASING_DEFAULT,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: DURATION_FAST,
      ease: EASING_DEFAULT,
    },
  },
};

// ---------------------------------------------------------------------------
// Positioning helpers
// ---------------------------------------------------------------------------

function computePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  placement: TooltipPlacement,
): { top: number; left: number; actualPlacement: TooltipPlacement } {
  let top = 0;
  let left = 0;
  let actualPlacement = placement;

  switch (placement) {
    case "top":
      top = triggerRect.top - tooltipRect.height - GAP + window.scrollY;
      left =
        triggerRect.left +
        triggerRect.width / 2 -
        tooltipRect.width / 2 +
        window.scrollX;
      break;
    case "bottom":
      top = triggerRect.bottom + GAP + window.scrollY;
      left =
        triggerRect.left +
        triggerRect.width / 2 -
        tooltipRect.width / 2 +
        window.scrollX;
      break;
    case "left":
      top =
        triggerRect.top +
        triggerRect.height / 2 -
        tooltipRect.height / 2 +
        window.scrollY;
      left = triggerRect.left - tooltipRect.width - GAP + window.scrollX;
      break;
    case "right":
      top =
        triggerRect.top +
        triggerRect.height / 2 -
        tooltipRect.height / 2 +
        window.scrollY;
      left = triggerRect.right + GAP + window.scrollX;
      break;
  }

  // Viewport-aware repositioning
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (left + tooltipRect.width > vw) {
    // Overflows right — try left placement
    if (placement === "right") {
      left = triggerRect.left - tooltipRect.width - GAP + window.scrollX;
      actualPlacement = "left";
    } else {
      left = vw - tooltipRect.width - GAP;
    }
  }
  if (left < 0) {
    if (placement === "left") {
      left = triggerRect.right + GAP + window.scrollX;
      actualPlacement = "right";
    } else {
      left = GAP;
    }
  }
  if (top < window.scrollY) {
    if (placement === "top") {
      top = triggerRect.bottom + GAP + window.scrollY;
      actualPlacement = "bottom";
    }
  }
  if (top + tooltipRect.height > vh + window.scrollY) {
    if (placement === "bottom") {
      top = triggerRect.top - tooltipRect.height - GAP + window.scrollY;
      actualPlacement = "top";
    }
  }

  return { top, left, actualPlacement };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Tooltip({
  content,
  placement = "top",
  children,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const { top, left } = computePosition(triggerRect, tooltipRect, placement);
    setPosition({ top, left });
  }, [placement]);

  // Recompute position whenever tooltip becomes visible
  useEffect(() => {
    if (visible) {
      // RAF ensures the tooltip has rendered so we can measure it
      requestAnimationFrame(updatePosition);
    }
  }, [visible, updatePosition]);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        setVisible((v) => !v);
      } else if (e.key === "Escape" && visible) {
        setVisible(false);
      }
    },
    [visible],
  );

  // Portal target — only available on client
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={handleKeyDown}
        aria-describedby={visible ? tooltipId : undefined}
        tabIndex={0}
        style={{ display: "inline-flex" }}
        data-testid="tooltip-trigger"
      >
        {children}
      </span>

      {portalTarget &&
        createPortal(
          <AnimatePresence>
            {visible && (
              <motion.div
                ref={tooltipRef}
                id={tooltipId}
                role="tooltip"
                variants={tooltipVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={className}
                style={{
                  position: "absolute",
                  top: position?.top ?? -9999,
                  left: position?.left ?? -9999,
                  zIndex: 9999,
                  pointerEvents: "none",
                  // Design token styles
                  backgroundColor: "var(--color-surface-elevated)",
                  boxShadow: "var(--shadow-lg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--spacing-2) var(--spacing-3)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.875rem", // text-sm
                  color: "var(--color-text)",
                  maxWidth: 320,
                }}
                data-testid="tooltip"
                data-placement={placement}
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          portalTarget,
        )}
    </>
  );
}
