import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import fs from "fs";
import path from "path";

// Mock framer-motion
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(
        (
          {
            initial,
            animate,
            exit,
            variants,
            whileTap,
            ...props
          }: Record<string, unknown>,
          ref: React.Ref<HTMLDivElement>,
        ) => React.createElement("div", { ...props, ref }),
      ),
      button: React.forwardRef(
        (
          {
            initial,
            animate,
            exit,
            variants,
            whileTap,
            ...props
          }: Record<string, unknown>,
          ref: React.Ref<HTMLButtonElement>,
        ) => React.createElement("button", { ...props, ref }),
      ),
    },
    AnimatePresence: ({
      children,
    }: {
      children: React.ReactNode;
    }) => React.createElement(React.Fragment, null, children),
  };
});

describe("Step 3: Your Focus (#154)", () => {
  describe("File structure", () => {
    it("CMP-154-01: has StepYourFocus component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/steps/step-your-focus.tsx")
        )
      ).toBe(true);
    });
  });

  describe("StepYourFocus", () => {
    let StepYourFocus: React.ComponentType<{
      marketData?: { city: string; state: string };
      onStepComplete: (data: { segments: string[]; propertyTypes: string[] }) => void;
      onValidationChange?: (valid: boolean) => void;
    }>;

    beforeAll(async () => {
      const mod = await import("@/components/reports/steps/step-your-focus");
      StepYourFocus = mod.StepYourFocus;
    });

    it("CMP-154-02: renders the heading", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      expect(screen.getByText("What matters in your market?")).toBeInTheDocument();
    });

    it("CMP-154-03: renders helper text", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      expect(
        screen.getByText(/Select the segments and property types that define your area/)
      ).toBeInTheDocument();
    });

    it("CMP-154-04: renders accent divider line", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const divider = document.querySelector(".bg-\\[var\\(--color-accent\\)\\]");
      expect(divider).toBeInTheDocument();
    });

    it("CMP-154-05: renders Market Segments section heading", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      expect(screen.getByText("Market Segments")).toBeInTheDocument();
    });

    it("CMP-154-06: renders Property Types section heading", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      expect(screen.getByText("Property Types")).toBeInTheDocument();
    });

    it("CMP-154-07: renders all 13 segment cards", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const segments = [
        "Waterfront", "Golf Course", "Gated Community", "Ski-In/Ski-Out",
        "Mountain View", "Historic District", "New Development", "Equestrian",
        "Beachfront", "Lakefront", "Vineyard", "Desert", "Island",
      ];
      segments.forEach((name) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    });

    it("CMP-154-08: segment cards show descriptions", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      expect(screen.getByText("Lakefront, riverfront, and canal-front properties")).toBeInTheDocument();
      expect(screen.getByText("Golf and country club communities")).toBeInTheDocument();
      expect(screen.getByText("Private, access-controlled enclaves")).toBeInTheDocument();
      expect(screen.getByText("Direct ocean or gulf access")).toBeInTheDocument();
      expect(screen.getByText("Recently built or under construction")).toBeInTheDocument();
      expect(screen.getByText("Designated historic neighborhoods")).toBeInTheDocument();
      expect(screen.getByText("Direct slope access properties")).toBeInTheDocument();
      expect(screen.getByText("Properties with mountain vistas")).toBeInTheDocument();
      expect(screen.getByText("Horse properties and equestrian estates")).toBeInTheDocument();
      expect(screen.getByText("Direct lake access")).toBeInTheDocument();
      expect(screen.getByText("Wine country and vineyard estates")).toBeInTheDocument();
      expect(screen.getByText("Desert landscape properties")).toBeInTheDocument();
      expect(screen.getByText("Island and barrier island properties")).toBeInTheDocument();
    });

    it("CMP-154-09: renders all 10 property type cards", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const uniqueTypes = [
        "Single Family", "Estate", "Condo", "Co-op",
        "Chalet", "Villa", "Ranch", "Land",
      ];
      uniqueTypes.forEach((name) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
      // "Penthouse" and "Townhouse" appear in both segments and property types
      const duplicates = ["Penthouse", "Townhouse"];
      duplicates.forEach((name) => {
        const matches = screen.getAllByText(name);
        expect(matches.length).toBe(2);
      });
    });

    it("CMP-154-10: clicking a segment card selects it", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const waterfrontCard = screen.getByText("Waterfront").closest("button")!;
      fireEvent.click(waterfrontCard);
      expect(waterfrontCard).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-11: clicking a selected segment card deselects it", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const waterfrontCard = screen.getByText("Waterfront").closest("button")!;
      fireEvent.click(waterfrontCard);
      expect(waterfrontCard).toHaveAttribute("aria-checked", "true");
      fireEvent.click(waterfrontCard);
      expect(waterfrontCard).toHaveAttribute("aria-checked", "false");
    });

    it("CMP-154-12: clicking a property type card selects it", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const estateCard = screen.getByText("Estate").closest("button")!;
      fireEvent.click(estateCard);
      expect(estateCard).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-13: clicking a selected property type card deselects it", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const estateCard = screen.getByText("Estate").closest("button")!;
      fireEvent.click(estateCard);
      expect(estateCard).toHaveAttribute("aria-checked", "true");
      fireEvent.click(estateCard);
      expect(estateCard).toHaveAttribute("aria-checked", "false");
    });

    it("CMP-154-14: can select multiple segments simultaneously", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const waterfront = screen.getByText("Waterfront").closest("button")!;
      const golf = screen.getByText("Golf Course").closest("button")!;
      const island = screen.getByText("Island").closest("button")!;
      fireEvent.click(waterfront);
      fireEvent.click(golf);
      fireEvent.click(island);
      expect(waterfront).toHaveAttribute("aria-checked", "true");
      expect(golf).toHaveAttribute("aria-checked", "true");
      expect(island).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-15: can select multiple property types simultaneously", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const estate = screen.getByText("Estate").closest("button")!;
      const condo = screen.getByText("Condo").closest("button")!;
      fireEvent.click(estate);
      fireEvent.click(condo);
      expect(estate).toHaveAttribute("aria-checked", "true");
      expect(condo).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-16: all cards have role='switch'", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const switches = screen.getAllByRole("switch");
      expect(switches.length).toBe(30);
    });

    it("CMP-154-17: unselected cards have aria-checked=false", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const switches = screen.getAllByRole("switch");
      switches.forEach((s) => {
        expect(s).toHaveAttribute("aria-checked", "false");
      });
    });

    it("CMP-154-18: cards are keyboard-toggleable with Enter", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const waterfrontCard = screen.getByText("Waterfront").closest("button")!;
      fireEvent.keyDown(waterfrontCard, { key: "Enter" });
      expect(waterfrontCard).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-19: cards are keyboard-toggleable with Space", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const estateCard = screen.getByText("Estate").closest("button")!;
      fireEvent.keyDown(estateCard, { key: " " });
      expect(estateCard).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-20: section headings use h3 elements", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const headings = screen.getAllByRole("heading", { level: 3 });
      const headingTexts = headings.map((h) => h.textContent);
      expect(headingTexts).toContain("Market Segments");
      expect(headingTexts).toContain("Property Types");
    });

    it("CMP-154-21: reports invalid when nothing is selected", () => {
      const onValidationChange = jest.fn();
      render(
        React.createElement(StepYourFocus, {
          onStepComplete: jest.fn(),
          onValidationChange,
        })
      );
      expect(onValidationChange).toHaveBeenCalledWith(false);
    });

    it("CMP-154-22: reports valid when a segment is selected", () => {
      const onValidationChange = jest.fn();
      render(
        React.createElement(StepYourFocus, {
          onStepComplete: jest.fn(),
          onValidationChange,
        })
      );
      const waterfrontCard = screen.getByText("Waterfront").closest("button")!;
      fireEvent.click(waterfrontCard);
      expect(onValidationChange).toHaveBeenCalledWith(true);
    });

    it("CMP-154-23: reports valid when a property type is selected", () => {
      const onValidationChange = jest.fn();
      render(
        React.createElement(StepYourFocus, {
          onStepComplete: jest.fn(),
          onValidationChange,
        })
      );
      const estateCard = screen.getByText("Estate").closest("button")!;
      fireEvent.click(estateCard);
      expect(onValidationChange).toHaveBeenCalledWith(true);
    });

    it("CMP-154-24: reports invalid when all selections are removed", () => {
      const onValidationChange = jest.fn();
      render(
        React.createElement(StepYourFocus, {
          onStepComplete: jest.fn(),
          onValidationChange,
        })
      );
      const waterfrontCard = screen.getByText("Waterfront").closest("button")!;
      fireEvent.click(waterfrontCard);
      fireEvent.click(waterfrontCard);
      expect(onValidationChange).toHaveBeenLastCalledWith(false);
    });

    it("CMP-154-25: emits step data with selected segments", () => {
      const onStepComplete = jest.fn();
      render(React.createElement(StepYourFocus, { onStepComplete }));
      const waterfrontCard = screen.getByText("Waterfront").closest("button")!;
      fireEvent.click(waterfrontCard);
      expect(onStepComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          segments: ["waterfront"],
          propertyTypes: [],
        })
      );
    });

    it("CMP-154-26: emits step data with selected property types", () => {
      const onStepComplete = jest.fn();
      render(React.createElement(StepYourFocus, { onStepComplete }));
      const estateCard = screen.getByText("Estate").closest("button")!;
      fireEvent.click(estateCard);
      expect(onStepComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          segments: [],
          propertyTypes: ["estate"],
        })
      );
    });

    it("CMP-154-27: emits updated data on every toggle", () => {
      const onStepComplete = jest.fn();
      render(React.createElement(StepYourFocus, { onStepComplete }));
      const waterfrontCard = screen.getByText("Waterfront").closest("button")!;
      const golfCard = screen.getByText("Golf Course").closest("button")!;
      fireEvent.click(waterfrontCard);
      fireEvent.click(golfCard);
      const lastCall = onStepComplete.mock.calls[onStepComplete.mock.calls.length - 1][0];
      expect(lastCall.segments).toContain("waterfront");
      expect(lastCall.segments).toContain("golf course");
    });

    it("CMP-154-28: does not emit data when nothing is selected", () => {
      const onStepComplete = jest.fn();
      render(React.createElement(StepYourFocus, { onStepComplete }));
      expect(onStepComplete).not.toHaveBeenCalled();
    });

    it("CMP-154-29: pre-selects segments for Florida", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Naples", state: "FL" },
          onStepComplete: jest.fn(),
        })
      );
      expect(screen.getByText("Waterfront").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Beachfront").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("High-Rise").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Private Dock / Marina").closest("button")).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-30: pre-selects property types for Florida", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Naples", state: "FL" },
          onStepComplete: jest.fn(),
        })
      );
      expect(screen.getByText("Single Family").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Estate").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Condo").closest("button")).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-31: pre-selects segments for Colorado", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Aspen", state: "CO" },
          onStepComplete: jest.fn(),
        })
      );
      expect(screen.getByText("Ski-In/Ski-Out").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Mountain View").closest("button")).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-32: pre-selects property types for Colorado", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Aspen", state: "CO" },
          onStepComplete: jest.fn(),
        })
      );
      expect(screen.getByText("Chalet").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Estate").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Single Family").closest("button")).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-33: pre-selects segments for New York", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "New York", state: "NY" },
          onStepComplete: jest.fn(),
        })
      );
      expect(screen.getByText("High-Rise").closest("button")).toHaveAttribute("aria-checked", "true");
      // "Penthouse" and "Townhouse" appear in both segments and property types;
      // use getAllByText and check both are selected
      screen.getAllByText("Penthouse").forEach((el) => {
        expect(el.closest("button")).toHaveAttribute("aria-checked", "true");
      });
      screen.getAllByText("Townhouse").forEach((el) => {
        expect(el.closest("button")).toHaveAttribute("aria-checked", "true");
      });
    });

    it("CMP-154-34: pre-selects property types for New York", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "New York", state: "NY" },
          onStepComplete: jest.fn(),
        })
      );
      expect(screen.getByText("Condo").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Co-op").closest("button")).toHaveAttribute("aria-checked", "true");
      // "Penthouse" and "Townhouse" appear in both segments and property types;
      // both instances should be selected for NY (segments + property types both include them)
      screen.getAllByText("Penthouse").forEach((el) => {
        expect(el.closest("button")).toHaveAttribute("aria-checked", "true");
      });
      screen.getAllByText("Townhouse").forEach((el) => {
        expect(el.closest("button")).toHaveAttribute("aria-checked", "true");
      });
    });

    it("CMP-154-35: pre-selects segments for Arizona (desert)", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Scottsdale", state: "AZ" },
          onStepComplete: jest.fn(),
        })
      );
      expect(screen.getByText("Desert").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Golf Course").closest("button")).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-36: pre-selects property types for Arizona", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Scottsdale", state: "AZ" },
          onStepComplete: jest.fn(),
        })
      );
      expect(screen.getByText("Estate").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Single Family").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Villa").closest("button")).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-37: pre-selects segments for California", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Napa", state: "CA" },
          onStepComplete: jest.fn(),
        })
      );
      expect(screen.getByText("High-Rise").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Beachfront").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Trophy Home").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Vineyard").closest("button")).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-38: uses fallback defaults for unknown state", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Charleston", state: "WV" },
          onStepComplete: jest.fn(),
        })
      );
      expect(screen.getByText("Gated Community").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Single Family").closest("button")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Estate").closest("button")).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-154-39: shows 'Popular in your area' badges for smart defaults", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Naples", state: "FL" },
          onStepComplete: jest.fn(),
        })
      );
      const badges = screen.getAllByText("Popular in your area");
      expect(badges.length).toBe(7);
    });

    it("CMP-154-40: 'Popular' badge remains after deselecting a default card", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Naples", state: "FL" },
          onStepComplete: jest.fn(),
        })
      );
      const waterfrontCard = screen.getByText("Waterfront").closest("button")!;
      fireEvent.click(waterfrontCard);
      expect(waterfrontCard).toHaveAttribute("aria-checked", "false");
      const badges = screen.getAllByText("Popular in your area");
      expect(badges.length).toBe(7);
    });

    it("CMP-154-41: no badges shown when no marketData provided", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const badges = screen.queryAllByText("Popular in your area");
      expect(badges.length).toBe(0);
    });

    it("CMP-154-42: reports valid on mount when smart defaults are applied", () => {
      const onValidationChange = jest.fn();
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Naples", state: "FL" },
          onStepComplete: jest.fn(),
          onValidationChange,
        })
      );
      expect(onValidationChange).toHaveBeenCalledWith(true);
    });

    it("CMP-154-43: emits step data on mount with smart defaults", () => {
      const onStepComplete = jest.fn();
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Naples", state: "FL" },
          onStepComplete,
        })
      );
      expect(onStepComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          segments: expect.arrayContaining(["waterfront", "beachfront", "high-rise", "marina"]),
          propertyTypes: expect.arrayContaining(["single_family", "estate", "condo"]),
        })
      );
    });

    it("CMP-154-44: shows empty state prompt when no selections and no smart defaults", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      expect(
        screen.getByText(/Pick the segments that define your market/)
      ).toBeInTheDocument();
    });

    it("CMP-154-45: empty state prompt disappears when a card is selected", () => {
      render(React.createElement(StepYourFocus, { onStepComplete: jest.fn() }));
      const waterfrontCard = screen.getByText("Waterfront").closest("button")!;
      fireEvent.click(waterfrontCard);
      expect(
        screen.queryByText(/Pick the segments that define your market/)
      ).not.toBeInTheDocument();
    });

    it("CMP-154-46: no empty state when smart defaults are applied", () => {
      render(
        React.createElement(StepYourFocus, {
          marketData: { city: "Naples", state: "FL" },
          onStepComplete: jest.fn(),
        })
      );
      expect(
        screen.queryByText(/Pick the segments that define your market/)
      ).not.toBeInTheDocument();
    });
  });
});
