/**
 * ExportButton Component Tests
 *
 * Spec: .specs/features/admin/analytics-data-export.feature.md
 *
 * Test IDs:
 *   CMP-135-01: Renders with correct text
 *   CMP-135-02: Opens dropdown on click
 *   CMP-135-03: CSV option calls onExportCsv
 *   CMP-135-04: JSON option calls onExportJson
 *   CMP-135-05: Closes dropdown after selection
 *   CMP-135-06: Disabled when disabled prop is true
 *
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExportButton } from "@/components/admin/export-button";

describe("ExportButton component", () => {
  it("CMP-135-01: renders with correct text", () => {
    render(<ExportButton onExportCsv={jest.fn()} onExportJson={jest.fn()} />);
    expect(screen.getByTestId("export-button")).toHaveTextContent("Export");
  });

  it("CMP-135-02: opens dropdown on click", () => {
    render(<ExportButton onExportCsv={jest.fn()} onExportJson={jest.fn()} />);
    fireEvent.click(screen.getByTestId("export-button"));
    expect(screen.getByTestId("export-dropdown")).toBeInTheDocument();
    expect(screen.getByTestId("export-csv")).toHaveTextContent("Export CSV");
    expect(screen.getByTestId("export-json")).toHaveTextContent("Export JSON");
  });

  it("CMP-135-03: CSV option calls onExportCsv", () => {
    const onExportCsv = jest.fn();
    render(<ExportButton onExportCsv={onExportCsv} onExportJson={jest.fn()} />);
    fireEvent.click(screen.getByTestId("export-button"));
    fireEvent.click(screen.getByTestId("export-csv"));
    expect(onExportCsv).toHaveBeenCalledTimes(1);
  });

  it("CMP-135-04: JSON option calls onExportJson", () => {
    const onExportJson = jest.fn();
    render(<ExportButton onExportCsv={jest.fn()} onExportJson={onExportJson} />);
    fireEvent.click(screen.getByTestId("export-button"));
    fireEvent.click(screen.getByTestId("export-json"));
    expect(onExportJson).toHaveBeenCalledTimes(1);
  });

  it("CMP-135-05: closes dropdown after selection", () => {
    render(<ExportButton onExportCsv={jest.fn()} onExportJson={jest.fn()} />);
    fireEvent.click(screen.getByTestId("export-button"));
    expect(screen.getByTestId("export-dropdown")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("export-csv"));
    expect(screen.queryByTestId("export-dropdown")).not.toBeInTheDocument();
  });

  it("CMP-135-06: is disabled when disabled prop is true", () => {
    render(<ExportButton onExportCsv={jest.fn()} onExportJson={jest.fn()} disabled />);
    expect(screen.getByTestId("export-button")).toBeDisabled();
  });
});
