import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";
import { Footer } from "@/components/layout/footer";

describe("Copyright Footer (CMP-Footer)", () => {
  describe("Component rendering", () => {
    it("renders the copyright symbol and year", () => {
      render(<Footer />);
      const year = new Date().getFullYear();
      expect(
        screen.getByText(`© ${year} Modern Signal Advisory`)
      ).toBeInTheDocument();
    });

    it("has the correct data-testid", () => {
      render(<Footer />);
      expect(screen.getByTestId("copyright-footer")).toBeInTheDocument();
    });

    it("renders as a footer element", () => {
      render(<Footer />);
      const el = screen.getByTestId("copyright-footer");
      expect(el.tagName).toBe("FOOTER");
    });
  });

  describe("Present in all layouts", () => {
    it("protected layout imports Footer", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/layout.tsx"),
        "utf8"
      );
      expect(content).toContain("Footer");
    });

    it("admin layout imports Footer", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/admin/layout.tsx"),
        "utf8"
      );
      expect(content).toContain("Footer");
    });

    it("auth layout imports Footer", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/(auth)/layout.tsx"),
        "utf8"
      );
      expect(content).toContain("Footer");
    });

    it("landing page imports Footer", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/page.tsx"),
        "utf8"
      );
      expect(content).toContain("Footer");
    });
  });

  describe("Barrel export", () => {
    it("is exported from components/layout/index.ts", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "components/layout/index.ts"),
        "utf8"
      );
      expect(content).toContain("Footer");
    });
  });
});
