import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

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

import {
  AnimatedContainer,
  StaggerItem,
} from "@/components/ui/animated-container";

describe("AnimatedContainer", () => {
  describe("Scenario: Wraps children with entrance animation", () => {
    it("renders children inside an animated wrapper", () => {
      render(
        <AnimatedContainer>
          <p>Hello world</p>
        </AnimatedContainer>,
      );
      expect(screen.getByText("Hello world")).toBeInTheDocument();
      expect(screen.getByTestId("animated-container")).toBeInTheDocument();
    });

    it("defaults to fade variant", () => {
      render(
        <AnimatedContainer>
          <p>Content</p>
        </AnimatedContainer>,
      );
      expect(screen.getByTestId("animated-container")).toHaveAttribute(
        "data-variant",
        "fade",
      );
    });
  });

  describe("Scenario: Supports variant selection", () => {
    it("accepts slide variant with direction", () => {
      render(
        <AnimatedContainer variant="slide" direction="up">
          <p>Sliding up</p>
        </AnimatedContainer>,
      );
      expect(screen.getByTestId("animated-container")).toHaveAttribute(
        "data-variant",
        "slide",
      );
    });

    it("accepts scale variant", () => {
      render(
        <AnimatedContainer variant="scale">
          <p>Scaling</p>
        </AnimatedContainer>,
      );
      expect(screen.getByTestId("animated-container")).toHaveAttribute(
        "data-variant",
        "scale",
      );
    });
  });

  describe("Scenario: Supports stagger for lists", () => {
    it("renders stagger container with stagger items", () => {
      render(
        <AnimatedContainer variant="stagger">
          <StaggerItem>Card 1</StaggerItem>
          <StaggerItem>Card 2</StaggerItem>
          <StaggerItem>Card 3</StaggerItem>
          <StaggerItem>Card 4</StaggerItem>
          <StaggerItem>Card 5</StaggerItem>
        </AnimatedContainer>,
      );
      expect(screen.getByTestId("animated-container")).toHaveAttribute(
        "data-variant",
        "stagger",
      );
      const items = screen.getAllByTestId("stagger-item");
      expect(items).toHaveLength(5);
    });

    it("stagger items render their children", () => {
      render(
        <AnimatedContainer variant="stagger">
          <StaggerItem>Market Card A</StaggerItem>
          <StaggerItem>Market Card B</StaggerItem>
        </AnimatedContainer>,
      );
      expect(screen.getByText("Market Card A")).toBeInTheDocument();
      expect(screen.getByText("Market Card B")).toBeInTheDocument();
    });
  });

  describe("Scenario: Accepts className prop", () => {
    it("passes className through to the wrapper", () => {
      render(
        <AnimatedContainer className="custom-class">
          <p>Styled</p>
        </AnimatedContainer>,
      );
      expect(screen.getByTestId("animated-container")).toHaveClass(
        "custom-class",
      );
    });
  });
});
