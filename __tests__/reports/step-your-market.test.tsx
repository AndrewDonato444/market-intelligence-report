import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    },
    AnimatePresence: ({
      children,
    }: {
      children: React.ReactNode;
    }) => React.createElement(React.Fragment, null, children),
  };
});

const MOCK_MARKETS = [
  {
    id: "market-1",
    name: "Naples Luxury",
    geography: { city: "Naples", state: "Florida" },
    luxuryTier: "ultra_luxury",
    isDefault: 1,
  },
  {
    id: "market-2",
    name: "Miami Beach Elite",
    geography: { city: "Miami Beach", state: "Florida" },
    luxuryTier: "high_luxury",
    isDefault: 0,
  },
];

describe("Step 1: Your Market (#152)", () => {
  describe("File structure", () => {
    it("CMP-152-01: has StepYourMarket component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/steps/step-your-market.tsx")
        )
      ).toBe(true);
    });

    it("CMP-152-02: has MarketAutocomplete component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/steps/market-autocomplete.tsx")
        )
      ).toBe(true);
    });

    it("CMP-152-03: has MarketPreviewCard component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/steps/market-preview-card.tsx")
        )
      ).toBe(true);
    });
  });

  describe("StepYourMarket", () => {
    let StepYourMarket: React.ComponentType<{
      markets: typeof MOCK_MARKETS;
      onStepComplete: (data: Record<string, unknown>) => void;
      onValidationChange?: (valid: boolean) => void;
    }>;

    beforeAll(async () => {
      const mod = await import("@/components/reports/steps/step-your-market");
      StepYourMarket = mod.StepYourMarket;
    });

    it("CMP-152-04: renders the heading", () => {
      render(React.createElement(StepYourMarket, { markets: [], onStepComplete: jest.fn() }));
      expect(screen.getByText("Where do you operate?")).toBeInTheDocument();
    });

    it("CMP-152-05: renders helper text about luxury transactions", () => {
      render(React.createElement(StepYourMarket, { markets: [], onStepComplete: jest.fn() }));
      expect(screen.getByText(/We'll use this to find luxury transactions in your area/)).toBeInTheDocument();
    });

    it("CMP-152-06: renders city input with placeholder", () => {
      render(React.createElement(StepYourMarket, { markets: [], onStepComplete: jest.fn() }));
      expect(screen.getByPlaceholderText("e.g., Naples")).toBeInTheDocument();
    });

    it("CMP-152-07: renders state selector", () => {
      render(React.createElement(StepYourMarket, { markets: [], onStepComplete: jest.fn() }));
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    });

    it("CMP-152-08: renders Refine your area toggle collapsed by default", () => {
      render(React.createElement(StepYourMarket, { markets: [], onStepComplete: jest.fn() }));
      expect(screen.getByText(/Refine your area/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/county/i)).not.toBeInTheDocument();
    });

    it("CMP-152-09: shows county and region when Refine your area is clicked", () => {
      render(React.createElement(StepYourMarket, { markets: [], onStepComplete: jest.fn() }));
      fireEvent.click(screen.getByText(/Refine your area/));
      expect(screen.getByLabelText(/county/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/region/i)).toBeInTheDocument();
    });

    it("CMP-152-10: does not show existing markets section when no markets exist", () => {
      render(React.createElement(StepYourMarket, { markets: [], onStepComplete: jest.fn() }));
      expect(screen.queryByText(/Use an existing market/)).not.toBeInTheDocument();
    });

    it("CMP-152-11: shows existing markets section when markets exist", () => {
      render(React.createElement(StepYourMarket, { markets: MOCK_MARKETS, onStepComplete: jest.fn() }));
      expect(screen.getByText(/Use an existing market/)).toBeInTheDocument();
      expect(screen.getByText("Naples Luxury")).toBeInTheDocument();
      expect(screen.getByText("Miami Beach Elite")).toBeInTheDocument();
    });

    it("CMP-152-12: selecting an existing market populates the form", () => {
      render(React.createElement(StepYourMarket, { markets: MOCK_MARKETS, onStepComplete: jest.fn() }));
      fireEvent.click(screen.getByText("Naples Luxury"));
      const cityInput = screen.getByPlaceholderText("e.g., Naples") as HTMLInputElement;
      expect(cityInput.value).toBe("Naples");
    });

    it("CMP-152-13: shows market name field pre-filled with City Luxury", () => {
      render(React.createElement(StepYourMarket, { markets: [], onStepComplete: jest.fn() }));
      const cityInput = screen.getByPlaceholderText("e.g., Naples");
      fireEvent.change(cityInput, { target: { value: "Naples" } });
      const marketNameInput = screen.getByLabelText(/market name/i) as HTMLInputElement;
      expect(marketNameInput.value).toBe("Naples Luxury");
    });

    it("CMP-152-14: shows market preview card when city and state are provided", () => {
      render(React.createElement(StepYourMarket, { markets: [], onStepComplete: jest.fn() }));
      fireEvent.change(screen.getByPlaceholderText("e.g., Naples"), { target: { value: "Naples" } });
      fireEvent.change(screen.getByLabelText(/state/i), { target: { value: "Florida" } });
      expect(screen.getByTestId("market-preview-card")).toBeInTheDocument();
    });

    it("CMP-152-15: does not show market preview when city or state is missing", () => {
      render(React.createElement(StepYourMarket, { markets: [], onStepComplete: jest.fn() }));
      expect(screen.queryByTestId("market-preview-card")).not.toBeInTheDocument();
    });

    it("CMP-152-16: reports valid when city and state are filled", () => {
      const onValidationChange = jest.fn();
      render(React.createElement(StepYourMarket, { markets: [], onStepComplete: jest.fn(), onValidationChange }));
      fireEvent.change(screen.getByPlaceholderText("e.g., Naples"), { target: { value: "Naples" } });
      fireEvent.change(screen.getByLabelText(/state/i), { target: { value: "Florida" } });
      expect(onValidationChange).toHaveBeenCalledWith(true);
    });

    it("CMP-152-17: reports invalid when required fields are empty", () => {
      const onValidationChange = jest.fn();
      render(React.createElement(StepYourMarket, { markets: [], onStepComplete: jest.fn(), onValidationChange }));
      expect(onValidationChange).toHaveBeenCalledWith(false);
    });
  });

  describe("MarketAutocomplete", () => {
    let MarketAutocomplete: React.ComponentType<{
      value: string;
      onChange: (value: string) => void;
      onSelect: (city: string, state: string) => void;
      placeholder?: string;
    }>;

    beforeAll(async () => {
      const mod = await import("@/components/reports/steps/market-autocomplete");
      MarketAutocomplete = mod.MarketAutocomplete;
    });

    it("CMP-152-18: renders an input with the provided placeholder", () => {
      render(React.createElement(MarketAutocomplete, { value: "", onChange: jest.fn(), onSelect: jest.fn(), placeholder: "e.g., Naples" }));
      expect(screen.getByPlaceholderText("e.g., Naples")).toBeInTheDocument();
    });

    it("CMP-152-19: shows autocomplete dropdown after typing 2+ characters", async () => {
      render(React.createElement(MarketAutocomplete, { value: "Na", onChange: jest.fn(), onSelect: jest.fn() }));
      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });
    });

    it("CMP-152-20: does not show dropdown for 1 character", () => {
      render(React.createElement(MarketAutocomplete, { value: "N", onChange: jest.fn(), onSelect: jest.fn() }));
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("CMP-152-21: filters suggestions based on input", async () => {
      render(React.createElement(MarketAutocomplete, { value: "Nap", onChange: jest.fn(), onSelect: jest.fn() }));
      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
        expect(screen.getByText(/Naples/)).toBeInTheDocument();
      });
    });

    it("CMP-152-22: calls onSelect when a suggestion is clicked", async () => {
      const onSelect = jest.fn();
      render(React.createElement(MarketAutocomplete, { value: "Nap", onChange: jest.fn(), onSelect }));
      await waitFor(() => { expect(screen.getByRole("listbox")).toBeInTheDocument(); });
      fireEvent.mouseDown(screen.getByText(/Naples, FL/));
      expect(onSelect).toHaveBeenCalledWith("Naples", "Florida");
    });

    it("CMP-152-23: has combobox ARIA attributes", () => {
      render(React.createElement(MarketAutocomplete, { value: "", onChange: jest.fn(), onSelect: jest.fn() }));
      const input = screen.getByRole("combobox");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("aria-expanded");
    });

    it("CMP-152-24: closes dropdown on Escape", async () => {
      render(React.createElement(MarketAutocomplete, { value: "Na", onChange: jest.fn(), onSelect: jest.fn() }));
      await waitFor(() => { expect(screen.getByRole("listbox")).toBeInTheDocument(); });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  describe("MarketPreviewCard", () => {
    let MarketPreviewCard: React.ComponentType<{
      city: string;
      state: string;
      county?: string;
      region?: string;
    }>;

    beforeAll(async () => {
      const mod = await import("@/components/reports/steps/market-preview-card");
      MarketPreviewCard = mod.MarketPreviewCard;
    });

    it("CMP-152-25: renders city and state", () => {
      render(React.createElement(MarketPreviewCard, { city: "Naples", state: "Florida" }));
      expect(screen.getByText("Naples, Florida")).toBeInTheDocument();
    });

    it("CMP-152-26: renders county and region when provided", () => {
      render(React.createElement(MarketPreviewCard, { city: "Naples", state: "Florida", county: "Collier County", region: "Southwest Florida" }));
      expect(screen.getByText(/Collier County/)).toBeInTheDocument();
      expect(screen.getByText(/Southwest Florida/)).toBeInTheDocument();
    });

    it("CMP-152-27: has the correct test id", () => {
      render(React.createElement(MarketPreviewCard, { city: "Naples", state: "Florida" }));
      expect(screen.getByTestId("market-preview-card")).toBeInTheDocument();
    });

    it("CMP-152-28: does not show county/region detail line when not provided", () => {
      render(React.createElement(MarketPreviewCard, { city: "Naples", state: "Florida" }));
      expect(screen.queryByTestId("market-preview-detail")).not.toBeInTheDocument();
    });
  });
});
