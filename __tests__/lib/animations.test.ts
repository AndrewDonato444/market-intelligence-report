import {
  fadeVariant,
  slideVariant,
  scaleVariant,
  selectionVariant,
  staggerContainer,
  pageTransition,
  DURATION_FAST,
  DURATION_DEFAULT,
  DURATION_SLOW,
  EASING_DEFAULT,
  EASING_SPRING,
} from "@/lib/animations";

// ---------------------------------------------------------------------------
// Duration & easing constants
// ---------------------------------------------------------------------------

describe("Animation constants", () => {
  it("exports design-token-matching durations", () => {
    expect(DURATION_FAST).toBe(0.1);
    expect(DURATION_DEFAULT).toBe(0.2);
    expect(DURATION_SLOW).toBe(0.3);
  });

  it("exports design-token-matching easings", () => {
    expect(EASING_DEFAULT).toEqual([0.4, 0, 0.2, 1]);
    expect(EASING_SPRING).toEqual([0.34, 1.56, 0.64, 1]);
  });
});

// ---------------------------------------------------------------------------
// fadeVariant
// ---------------------------------------------------------------------------

describe("fadeVariant", () => {
  it("has initial opacity 0", () => {
    expect(fadeVariant.initial).toEqual({ opacity: 0 });
  });

  it("animates to opacity 1 with duration-slow (300ms)", () => {
    const animate = fadeVariant.animate as Record<string, unknown>;
    expect(animate.opacity).toBe(1);
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.duration).toBe(DURATION_SLOW);
  });

  it("exits to opacity 0", () => {
    const exit = fadeVariant.exit as Record<string, unknown>;
    expect(exit.opacity).toBe(0);
  });

  it("uses easing-default", () => {
    const animate = fadeVariant.animate as Record<string, unknown>;
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.ease).toEqual(EASING_DEFAULT);
  });
});

// ---------------------------------------------------------------------------
// slideVariant
// ---------------------------------------------------------------------------

describe("slideVariant", () => {
  it('slides in from the right when direction is "left"', () => {
    const variant = slideVariant("left");
    const initial = variant.initial as Record<string, unknown>;
    // "enters from left" means initial offset on opposite side (+20 x)
    expect(initial.x).toBe(20);
    expect(initial.opacity).toBe(0);
  });

  it('slides up from below when direction is "up"', () => {
    const variant = slideVariant("up");
    const initial = variant.initial as Record<string, unknown>;
    expect(initial.y).toBe(20);
    expect(initial.opacity).toBe(0);
  });

  it("animates to x:0, y:0, opacity:1", () => {
    const variant = slideVariant("left");
    const animate = variant.animate as Record<string, unknown>;
    expect(animate.opacity).toBe(1);
    expect(animate.x).toBe(0);
    expect(animate.y).toBe(0);
  });

  it("uses duration-slow (300ms) with easing-default", () => {
    const variant = slideVariant("left");
    const animate = variant.animate as Record<string, unknown>;
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.duration).toBe(DURATION_SLOW);
    expect(transition.ease).toEqual(EASING_DEFAULT);
  });

  it("supports all four directions", () => {
    const directions = ["left", "right", "up", "down"] as const;
    for (const dir of directions) {
      const variant = slideVariant(dir);
      expect(variant.initial).toBeDefined();
      expect(variant.animate).toBeDefined();
      expect(variant.exit).toBeDefined();
    }
  });

  it("exit slides in the requested direction", () => {
    const variant = slideVariant("left");
    const exit = variant.exit as Record<string, unknown>;
    expect(exit.x).toBe(-20);
    expect(exit.opacity).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// scaleVariant
// ---------------------------------------------------------------------------

describe("scaleVariant", () => {
  it("starts at scale 0.95, opacity 0", () => {
    expect(scaleVariant.initial).toEqual({ opacity: 0, scale: 0.95 });
  });

  it("animates to scale 1.0, opacity 1 with duration-default (200ms)", () => {
    const animate = scaleVariant.animate as Record<string, unknown>;
    expect(animate.opacity).toBe(1);
    expect(animate.scale).toBe(1);
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.duration).toBe(DURATION_DEFAULT);
    expect(transition.ease).toEqual(EASING_DEFAULT);
  });

  it("exits to scale 0.95, opacity 0", () => {
    const exit = scaleVariant.exit as Record<string, unknown>;
    expect(exit.opacity).toBe(0);
    expect(exit.scale).toBe(0.95);
  });
});

// ---------------------------------------------------------------------------
// selectionVariant
// ---------------------------------------------------------------------------

describe("selectionVariant", () => {
  it("scales to 1.02 on tap", () => {
    expect(selectionVariant.tap).toEqual({ scale: 1.02 });
  });

  it("uses duration-fast (100ms) with easing-spring", () => {
    expect(selectionVariant.transition.duration).toBe(DURATION_FAST);
    expect(selectionVariant.transition.ease).toEqual(EASING_SPRING);
  });
});

// ---------------------------------------------------------------------------
// staggerContainer
// ---------------------------------------------------------------------------

describe("staggerContainer", () => {
  it("staggers children with 50ms delay", () => {
    const animate = staggerContainer.animate as Record<string, unknown>;
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.staggerChildren).toBe(0.05);
  });

  it("waits for children (beforeChildren)", () => {
    const animate = staggerContainer.animate as Record<string, unknown>;
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.when).toBe("beforeChildren");
  });
});

// ---------------------------------------------------------------------------
// pageTransition
// ---------------------------------------------------------------------------

describe("pageTransition", () => {
  it("forward: enters from right (+20), exits to left (-20)", () => {
    const variant = pageTransition("forward");
    const initial = variant.initial as Record<string, unknown>;
    const exit = variant.exit as Record<string, unknown>;
    expect(initial.x).toBe(20);
    expect(initial.opacity).toBe(0);
    expect(exit.x).toBe(-20);
    expect(exit.opacity).toBe(0);
  });

  it("backward: enters from left (-20), exits to right (+20)", () => {
    const variant = pageTransition("backward");
    const initial = variant.initial as Record<string, unknown>;
    const exit = variant.exit as Record<string, unknown>;
    expect(initial.x).toBe(-20);
    expect(initial.opacity).toBe(0);
    expect(exit.x).toBe(20);
    expect(exit.opacity).toBe(0);
  });

  it("uses duration-slow (300ms)", () => {
    const variant = pageTransition("forward");
    const animate = variant.animate as Record<string, unknown>;
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.duration).toBe(DURATION_SLOW);
  });

  it("defaults to forward direction", () => {
    const variant = pageTransition();
    const initial = variant.initial as Record<string, unknown>;
    expect(initial.x).toBe(20);
  });
});
