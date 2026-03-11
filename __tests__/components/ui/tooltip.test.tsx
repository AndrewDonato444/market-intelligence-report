import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// Mock framer-motion to avoid JSDOM animation issues
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

import { Tooltip } from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTooltip(
  props: Partial<React.ComponentProps<typeof Tooltip>> = {},
) {
  return render(
    <Tooltip content="Test tooltip text" {...props}>
      <button>Hover me</button>
    </Tooltip>,
  );
}

// ---------------------------------------------------------------------------
// Tooltip scenarios
// ---------------------------------------------------------------------------

describe("Tooltip", () => {
  describe("Scenario: Displays contextual guidance on hover", () => {
    it("shows tooltip text when hovering the trigger", async () => {
      renderTooltip({
        content: "We'll use this to find luxury transactions in your area",
      });
      const trigger = screen.getByTestId("tooltip-trigger");
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        expect(screen.getByRole("tooltip")).toHaveTextContent(
          "We'll use this to find luxury transactions in your area",
        );
      });
    });

    it("applies design token styles to the tooltip", async () => {
      renderTooltip();
      const trigger = screen.getByTestId("tooltip-trigger");
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip.style.backgroundColor).toBe(
          "var(--color-surface-elevated)",
        );
        expect(tooltip.style.boxShadow).toBe("var(--shadow-lg)");
        expect(tooltip.style.fontFamily).toBe("var(--font-sans)");
        expect(tooltip.style.color).toBe("var(--color-text)");
      });
    });
  });

  describe("Scenario: Tooltip disappears on mouse leave", () => {
    it("removes tooltip when mouse leaves trigger", async () => {
      renderTooltip();
      const trigger = screen.getByTestId("tooltip-trigger");
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
      fireEvent.mouseLeave(trigger);
      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });
  });

  describe("Scenario: Tooltip supports configurable placement", () => {
    it('renders with data-placement="top" by default', async () => {
      renderTooltip();
      const trigger = screen.getByTestId("tooltip-trigger");
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        expect(screen.getByTestId("tooltip")).toHaveAttribute(
          "data-placement",
          "top",
        );
      });
    });

    it('supports placement="bottom"', async () => {
      renderTooltip({ placement: "bottom" });
      const trigger = screen.getByTestId("tooltip-trigger");
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        expect(screen.getByTestId("tooltip")).toHaveAttribute(
          "data-placement",
          "bottom",
        );
      });
    });

    it('supports placement="right"', async () => {
      renderTooltip({ placement: "right" });
      const trigger = screen.getByTestId("tooltip-trigger");
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        expect(screen.getByTestId("tooltip")).toHaveAttribute(
          "data-placement",
          "right",
        );
      });
    });

    it('supports placement="left"', async () => {
      renderTooltip({ placement: "left" });
      const trigger = screen.getByTestId("tooltip-trigger");
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        expect(screen.getByTestId("tooltip")).toHaveAttribute(
          "data-placement",
          "left",
        );
      });
    });
  });

  describe("Scenario: Tooltip is accessible via keyboard", () => {
    it("has role=tooltip and proper aria attributes", async () => {
      renderTooltip();
      const trigger = screen.getByTestId("tooltip-trigger");
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toHaveAttribute("id");
        expect(trigger).toHaveAttribute(
          "aria-describedby",
          tooltip.getAttribute("id"),
        );
      });
    });

    it("shows on Enter keypress", async () => {
      renderTooltip();
      const trigger = screen.getByTestId("tooltip-trigger");
      fireEvent.keyDown(trigger, { key: "Enter" });
      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
    });

    it("dismisses on Escape keypress", async () => {
      renderTooltip();
      const trigger = screen.getByTestId("tooltip-trigger");
      fireEvent.keyDown(trigger, { key: "Enter" });
      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
      fireEvent.keyDown(trigger, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });

    it("trigger is focusable (tabIndex=0)", () => {
      renderTooltip();
      const trigger = screen.getByTestId("tooltip-trigger");
      expect(trigger).toHaveAttribute("tabindex", "0");
    });
  });

  describe("Scenario: Tooltip supports rich content", () => {
    it("renders React nodes as content", async () => {
      renderTooltip({
        content: (
          <div data-testid="rich-content">
            <strong>Bold text</strong> and <em>italic</em>
          </div>
        ),
      });
      const trigger = screen.getByTestId("tooltip-trigger");
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        expect(screen.getByTestId("rich-content")).toBeInTheDocument();
        expect(screen.getByText("Bold text")).toBeInTheDocument();
      });
    });
  });

  describe("Scenario: Tooltip renders via portal", () => {
    it("renders tooltip content as a child of document.body", async () => {
      renderTooltip();
      const trigger = screen.getByTestId("tooltip-trigger");
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip.parentElement).toBe(document.body);
      });
    });
  });
});
