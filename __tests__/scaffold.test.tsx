import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import fs from "fs";
import path from "path";

// Mock window.matchMedia (not available in JSDOM)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock next/font/google
jest.mock("next/font/google", () => ({
  Playfair_Display: () => ({
    className: "playfair-mock",
    variable: "--font-serif",
  }),
  Inter: () => ({
    className: "inter-mock",
    variable: "--font-sans",
  }),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    return <img {...props} />;
  },
}));

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import Home from "@/app/page";

describe("Project Scaffold", () => {
  describe("Landing page renders", () => {
    it("renders the Modern Signal Advisory wordmark in navigation", () => {
      render(<Home />);
      const nav = screen.getByRole("navigation");
      expect(
        within(nav).getByText(/Modern Signal Advisory/i)
      ).toBeInTheDocument();
    });

    it("renders the hero section", () => {
      render(<Home />);
      expect(
        screen.getByTestId("hero-section")
      ).toBeInTheDocument();
    });

    it("renders the main element", () => {
      render(<Home />);
      expect(
        screen.getByRole("main")
      ).toBeInTheDocument();
    });
  });

  describe("Project structure", () => {
    it("has app/layout.tsx", () => {
      const filePath = path.join(process.cwd(), "app", "layout.tsx");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("has app/page.tsx", () => {
      const filePath = path.join(process.cwd(), "app", "page.tsx");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("has app/globals.css", () => {
      const filePath = path.join(process.cwd(), "app", "globals.css");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("has tailwind.config.ts", () => {
      const filePath = path.join(process.cwd(), "tailwind.config.ts");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("has tsconfig.json", () => {
      const filePath = path.join(process.cwd(), "tsconfig.json");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("has components/ directory", () => {
      const dirPath = path.join(process.cwd(), "components");
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    it("has public/ directory", () => {
      const dirPath = path.join(process.cwd(), "public");
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  describe("TypeScript configuration", () => {
    it("has strict mode enabled", () => {
      const tsconfig = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), "tsconfig.json"),
          "utf8"
        )
      );
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it("has path alias @/* configured", () => {
      const tsconfig = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), "tsconfig.json"),
          "utf8"
        )
      );
      expect(tsconfig.compilerOptions.paths["@/*"]).toEqual(["./*"]);
    });
  });

  describe("Design tokens in globals.css", () => {
    let cssContent: string;

    beforeAll(() => {
      cssContent = fs.readFileSync(
        path.join(process.cwd(), "app", "globals.css"),
        "utf8"
      );
    });

    it("defines --color-primary as #0F172A", () => {
      expect(cssContent).toContain("--color-primary: #0F172A");
    });

    it("defines --color-accent as #CA8A04", () => {
      expect(cssContent).toContain("--color-accent: #CA8A04");
    });

    it("defines --color-background as #F8FAFC", () => {
      expect(cssContent).toContain("--color-background: #F8FAFC");
    });

    it("defines --color-text as #020617", () => {
      expect(cssContent).toContain("--color-text: #020617");
    });

    it("defines --font-serif with Playfair Display", () => {
      expect(cssContent).toContain("Playfair Display");
    });

    it("defines --font-sans with Inter", () => {
      expect(cssContent).toContain("Inter");
    });

    it("defines spacing tokens", () => {
      expect(cssContent).toContain("--spacing-4: 16px");
    });

    it("defines radius tokens", () => {
      expect(cssContent).toContain("--radius-sm: 4px");
      expect(cssContent).toContain("--radius-md: 6px");
    });

    it("defines shadow tokens", () => {
      expect(cssContent).toContain("--shadow-sm:");
      expect(cssContent).toContain("--shadow-lg:");
    });

    it("defines chart color tokens", () => {
      expect(cssContent).toContain("--color-chart-primary:");
      expect(cssContent).toContain("--color-chart-accent:");
    });

    it("defines report-specific tokens", () => {
      expect(cssContent).toContain("--color-report-bg:");
      expect(cssContent).toContain("--color-report-rating-a:");
    });

    it("defines confidence tokens", () => {
      expect(cssContent).toContain("--color-confidence-fill:");
      expect(cssContent).toContain("--color-confidence-empty:");
    });
  });

  describe("Tailwind configuration", () => {
    let tailwindConfig: string;

    beforeAll(() => {
      tailwindConfig = fs.readFileSync(
        path.join(process.cwd(), "tailwind.config.ts"),
        "utf8"
      );
    });

    it("includes design token colors", () => {
      expect(tailwindConfig).toContain('"#0F172A"');
      expect(tailwindConfig).toContain('"#CA8A04"');
    });

    it("includes custom font families", () => {
      expect(tailwindConfig).toContain("Playfair Display");
      expect(tailwindConfig).toContain("Inter");
    });

    it("includes custom border radius values", () => {
      expect(tailwindConfig).toContain('"4px"');
      expect(tailwindConfig).toContain('"6px"');
    });

    it("includes custom shadow values", () => {
      expect(tailwindConfig).toContain("rgba(15, 23, 42,");
    });
  });

  describe("Package configuration", () => {
    let packageJson: Record<string, unknown>;

    beforeAll(() => {
      packageJson = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), "package.json"),
          "utf8"
        )
      );
    });

    it("has next as a dependency", () => {
      const deps = packageJson.dependencies as Record<string, string>;
      expect(deps.next).toBeDefined();
    });

    it("has react as a dependency", () => {
      const deps = packageJson.dependencies as Record<string, string>;
      expect(deps.react).toBeDefined();
    });

    it("has tailwindcss as a dev dependency", () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps.tailwindcss).toBeDefined();
    });

    it("has dev script configured", () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts.dev).toBe("next dev");
    });

    it("has build script configured", () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts.build).toBe("next build");
    });

    it("has test script configured", () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts.test).toBe("jest");
    });
  });
});
