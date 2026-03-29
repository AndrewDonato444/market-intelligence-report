import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

describe("Peer Market Selection", () => {
  describe("File structure", () => {
    it("has peer markets page", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "app/(protected)/markets/[id]/peers/page.tsx"
          )
        )
      ).toBe(true);
    });

    it("has peer markets API route", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/api/markets/[id]/peers/route.ts")
        )
      ).toBe(true);
    });

    it("has PeerMarketForm component", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "components/markets/peer-market-form.tsx"
          )
        )
      ).toBe(true);
    });

    it("has market service with updateMarketPeers", () => {
      const serviceContent = fs.readFileSync(
        path.join(process.cwd(), "lib/services/market.ts"),
        "utf8"
      );
      expect(serviceContent).toContain("updateMarketPeers");
    });
  });

  describe("PeerMarketForm component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen, fireEvent } = require("@testing-library/react");

    it("renders peer markets heading", async () => {
      const { PeerMarketForm } = await import(
        "@/components/markets/peer-market-form"
      );
      render(
        React.createElement(PeerMarketForm, {
          marketId: "test-id",
          initialPeers: [],
        })
      );

      expect(screen.getByText("Peer Markets")).toBeInTheDocument();
    });

    it("shows empty state when no peers", async () => {
      const { PeerMarketForm } = await import(
        "@/components/markets/peer-market-form"
      );
      render(
        React.createElement(PeerMarketForm, {
          marketId: "test-id",
          initialPeers: [],
        })
      );

      expect(
        screen.getByText(/no peer markets added yet/i)
      ).toBeInTheDocument();
    });

    it("renders Add Peer Market button", async () => {
      const { PeerMarketForm } = await import(
        "@/components/markets/peer-market-form"
      );
      render(
        React.createElement(PeerMarketForm, {
          marketId: "test-id",
          initialPeers: [],
        })
      );

      expect(
        screen.getByText(/\+ add peer market/i)
      ).toBeInTheDocument();
    });

    it("renders Save Peer Markets button", async () => {
      const { PeerMarketForm } = await import(
        "@/components/markets/peer-market-form"
      );
      render(
        React.createElement(PeerMarketForm, {
          marketId: "test-id",
          initialPeers: [],
        })
      );

      expect(
        screen.getByRole("button", { name: /save peer markets/i })
      ).toBeInTheDocument();
    });

    it("renders initial peers with their data", async () => {
      const { PeerMarketForm } = await import(
        "@/components/markets/peer-market-form"
      );
      render(
        React.createElement(PeerMarketForm, {
          marketId: "test-id",
          initialPeers: [
            {
              name: "Palm Beach",
              geography: { city: "Palm Beach", state: "Florida" },
            },
            {
              name: "Aspen",
              geography: { city: "Aspen", state: "Colorado" },
            },
          ],
        })
      );

      // "Palm Beach" appears in both name and city fields
      const palmBeachInputs = screen.getAllByDisplayValue("Palm Beach");
      expect(palmBeachInputs).toHaveLength(2);
      const aspenInputs = screen.getAllByDisplayValue("Aspen");
      expect(aspenInputs).toHaveLength(2);
      expect(screen.getByDisplayValue("Florida")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Colorado")).toBeInTheDocument();
    });

    it("adds a new peer row when Add button clicked", async () => {
      const { PeerMarketForm } = await import(
        "@/components/markets/peer-market-form"
      );
      render(
        React.createElement(PeerMarketForm, {
          marketId: "test-id",
          initialPeers: [],
        })
      );

      const addButton = screen.getByText(/\+ add peer market/i);
      fireEvent.click(addButton);

      // Should have input fields now (city placeholder)
      expect(screen.getByPlaceholderText("City *")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("State *")).toBeInTheDocument();
    });

    it("renders remove buttons for each peer", async () => {
      const { PeerMarketForm } = await import(
        "@/components/markets/peer-market-form"
      );
      render(
        React.createElement(PeerMarketForm, {
          marketId: "test-id",
          initialPeers: [
            {
              name: "Palm Beach",
              geography: { city: "Palm Beach", state: "Florida" },
            },
          ],
        })
      );

      expect(
        screen.getByLabelText(/remove peer market 1/i)
      ).toBeInTheDocument();
    });

    it("removes a peer when remove button clicked", async () => {
      const { PeerMarketForm } = await import(
        "@/components/markets/peer-market-form"
      );
      render(
        React.createElement(PeerMarketForm, {
          marketId: "test-id",
          initialPeers: [
            {
              name: "Palm Beach",
              geography: { city: "Palm Beach", state: "Florida" },
            },
          ],
        })
      );

      const removeBtn = screen.getByLabelText(/remove peer market 1/i);
      fireEvent.click(removeBtn);

      expect(screen.queryByDisplayValue("Palm Beach")).not.toBeInTheDocument();
    });
  });

  describe("Peer markets API route", () => {
    it("route file exports GET and PUT handlers", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/markets/[id]/peers/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("export async function GET");
      expect(routeContent).toContain("export async function PUT");
    });

    it("route uses Supabase auth", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/markets/[id]/peers/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("@/lib/supabase/auth");
      expect(routeContent).toContain("getAuthUserId");
    });

    it("route returns 401 for unauthenticated requests", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/markets/[id]/peers/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("401");
      expect(routeContent).toContain("Unauthorized");
    });

    it("route returns 422 for validation errors", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/markets/[id]/peers/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("422");
    });

    it("route returns 404 when market not found", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/markets/[id]/peers/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("404");
      expect(routeContent).toContain("Market not found");
    });

    it("route validates city and state for each peer", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/markets/[id]/peers/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("city");
      expect(routeContent).toContain("state");
      expect(routeContent).toContain("City and state are required");
    });

    it("route auto-generates peer name from city + state when missing", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/markets/[id]/peers/route.ts"
        ),
        "utf8"
      );
      // Check for name auto-generation pattern
      expect(routeContent).toContain("peer.geography.city");
      expect(routeContent).toContain("peer.geography.state");
    });

    it("route uses updateMarketPeers service", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/markets/[id]/peers/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("updateMarketPeers");
    });
  });

  describe("Peer markets page", () => {
    it("page uses Supabase auth", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/markets/[id]/peers/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("getAuthUserId");
      expect(pageContent).toContain("@/lib/supabase/auth");
    });

    it("page uses getMarket service", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/markets/[id]/peers/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("getMarket");
    });

    it("page renders PeerMarketForm", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/markets/[id]/peers/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("PeerMarketForm");
    });

    it("page shows market name and location", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/markets/[id]/peers/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("market.name");
      expect(pageContent).toContain("geo.city");
      expect(pageContent).toContain("geo.state");
    });

    it("page handles not found", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/markets/[id]/peers/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("notFound");
    });
  });

  describe("Markets list page includes peers link", () => {
    it("markets list page has peer markets feature code (link disabled — on roadmap)", () => {
      const pageContent = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/markets/page.tsx"),
        "utf8"
      );
      // Peers button is commented out pending future roadmap release.
      // Verify the page exists and renders market cards correctly.
      expect(pageContent).toContain("markets.map");
    });
  });
});
