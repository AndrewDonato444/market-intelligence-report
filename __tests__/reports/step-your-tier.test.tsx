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

describe("Step 2: Your Tier (#153)", () => {
  describe("File structure", () => {
    it("CMP-153-01: has StepYourTier component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/steps/step-your-tier.tsx")
        )
      ).toBe(true);
    });
  });

  describe("StepYourTier", () => {
    let StepYourTier: React.ComponentType<{
      onStepComplete: (data: { luxuryTier: string; priceFloor: number; priceCeiling?: number }) => void;
      onValidationChange?: (valid: boolean) => void;
    }>;

    beforeAll(async () => {
      const mod = await import("@/components/reports/steps/step-your-tier");
      StepYourTier = mod.StepYourTier;
    });

    it("CMP-153-02: renders the heading", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      expect(screen.getByText("What's your price point?")).toBeInTheDocument();
    });

    it("CMP-153-03: renders helper text about transactions", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      expect(
        screen.getByText(/This determines which transactions we analyze for your market/)
      ).toBeInTheDocument();
    });

    it("CMP-153-04: renders three tier cards", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      expect(screen.getByText("Luxury")).toBeInTheDocument();
      expect(screen.getByText("High Luxury")).toBeInTheDocument();
      expect(screen.getByText("Ultra Luxury")).toBeInTheDocument();
    });

    it("CMP-153-05: tier cards show price ranges", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      expect(screen.getByText("$1M - $6M")).toBeInTheDocument();
      expect(screen.getByText("$6M - $10M")).toBeInTheDocument();
      expect(screen.getByText("$10M+")).toBeInTheDocument();
    });

    it("CMP-153-06: tier cards show taglines", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      expect(screen.getByText("The broadest luxury segment")).toBeInTheDocument();
      expect(screen.getByText("Established luxury enclaves")).toBeInTheDocument();
      expect(screen.getByText("Trophy properties and estates")).toBeInTheDocument();
    });

    it("CMP-153-07: no tier is pre-selected by default", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      const radios = screen.getAllByRole("radio");
      radios.forEach((radio) => {
        expect(radio).toHaveAttribute("aria-checked", "false");
      });
    });

    it("CMP-153-08: reports invalid when no tier is selected", () => {
      const onValidationChange = jest.fn();
      render(
        React.createElement(StepYourTier, {
          onStepComplete: jest.fn(),
          onValidationChange,
        })
      );
      expect(onValidationChange).toHaveBeenCalledWith(false);
    });

    it("CMP-153-09: selecting a tier highlights it", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      const luxuryCard = screen.getByText("Luxury").closest("[role='radio']")!;
      fireEvent.click(luxuryCard);
      expect(luxuryCard).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-153-10: selecting a tier reports valid", () => {
      const onValidationChange = jest.fn();
      render(
        React.createElement(StepYourTier, {
          onStepComplete: jest.fn(),
          onValidationChange,
        })
      );
      const luxuryCard = screen.getByText("Luxury").closest("[role='radio']")!;
      fireEvent.click(luxuryCard);
      expect(onValidationChange).toHaveBeenCalledWith(true);
    });

    it("CMP-153-11: selecting a tier sets the default price floor", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      const highLuxuryCard = screen.getByText("High Luxury").closest("[role='radio']")!;
      fireEvent.click(highLuxuryCard);
      const floorInput = screen.getByLabelText(/price floor/i) as HTMLInputElement;
      expect(floorInput.value).toBe("6000000");
    });

    it("CMP-153-12: switching tiers updates price floor", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      // Select luxury first
      const luxuryCard = screen.getByText("Luxury").closest("[role='radio']")!;
      fireEvent.click(luxuryCard);
      const floorInput = screen.getByLabelText(/price floor/i) as HTMLInputElement;
      expect(floorInput.value).toBe("1000000");

      // Switch to ultra luxury
      const ultraCard = screen.getByText("Ultra Luxury").closest("[role='radio']")!;
      fireEvent.click(ultraCard);
      expect(floorInput.value).toBe("10000000");
    });

    it("CMP-153-13: only one tier can be selected at a time", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      const luxuryCard = screen.getByText("Luxury").closest("[role='radio']")!;
      const highCard = screen.getByText("High Luxury").closest("[role='radio']")!;

      fireEvent.click(luxuryCard);
      expect(luxuryCard).toHaveAttribute("aria-checked", "true");
      expect(highCard).toHaveAttribute("aria-checked", "false");

      fireEvent.click(highCard);
      expect(luxuryCard).toHaveAttribute("aria-checked", "false");
      expect(highCard).toHaveAttribute("aria-checked", "true");
    });

    it("CMP-153-14: price ceiling input has placeholder", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      const luxuryCard = screen.getByText("Luxury").closest("[role='radio']")!;
      fireEvent.click(luxuryCard);
      expect(screen.getByPlaceholderText("No ceiling")).toBeInTheDocument();
    });

    it("CMP-153-15: emits step data when tier is selected", () => {
      const onStepComplete = jest.fn();
      render(React.createElement(StepYourTier, { onStepComplete }));
      const luxuryCard = screen.getByText("Luxury").closest("[role='radio']")!;
      fireEvent.click(luxuryCard);
      expect(onStepComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          luxuryTier: "luxury",
          priceFloor: 1000000,
        })
      );
    });

    it("CMP-153-16: shows validation error for price floor below $500,000", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      const luxuryCard = screen.getByText("Luxury").closest("[role='radio']")!;
      fireEvent.click(luxuryCard);
      const floorInput = screen.getByLabelText(/price floor/i);
      fireEvent.change(floorInput, { target: { value: "400000" } });
      expect(screen.getByText(/Price floor must be at least \$500,000/)).toBeInTheDocument();
    });

    it("CMP-153-17: shows validation error when ceiling <= floor", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      const luxuryCard = screen.getByText("Luxury").closest("[role='radio']")!;
      fireEvent.click(luxuryCard);
      const ceilingInput = screen.getByPlaceholderText("No ceiling");
      fireEvent.change(ceilingInput, { target: { value: "500000" } });
      expect(screen.getByText(/Ceiling must be higher than the floor/)).toBeInTheDocument();
    });

    it("CMP-153-18: reports invalid when price floor is below minimum", () => {
      const onValidationChange = jest.fn();
      render(
        React.createElement(StepYourTier, {
          onStepComplete: jest.fn(),
          onValidationChange,
        })
      );
      const luxuryCard = screen.getByText("Luxury").closest("[role='radio']")!;
      fireEvent.click(luxuryCard);
      const floorInput = screen.getByLabelText(/price floor/i);
      fireEvent.change(floorInput, { target: { value: "100000" } });
      expect(onValidationChange).toHaveBeenCalledWith(false);
    });

    it("CMP-153-19: has radiogroup ARIA attributes", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    });

    it("CMP-153-20: renders accent divider line", () => {
      render(React.createElement(StepYourTier, { onStepComplete: jest.fn() }));
      const divider = document.querySelector(".bg-\\[var\\(--color-accent\\)\\]");
      expect(divider).toBeInTheDocument();
    });
  });
});
