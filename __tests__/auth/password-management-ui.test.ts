/**
 * Password Management UI Tests
 *
 * Structural tests verifying the existence and content of password-related pages/components.
 *
 * Spec: .specs/features/auth/password-management.feature.md
 *
 * @jest-environment node
 */

import fs from "fs";
import path from "path";

describe("Password Management - File Structure", () => {
  // CMP-PWD-01: Forgot password page exists
  it("CMP-PWD-01: forgot password page exists", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "app/(auth)/forgot-password/page.tsx")
      )
    ).toBe(true);
  });

  // CMP-PWD-02: Reset password page exists
  it("CMP-PWD-02: reset password page exists", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "app/(auth)/reset-password/page.tsx")
      )
    ).toBe(true);
  });

  // CMP-PWD-03: Forgot password API route exists
  it("CMP-PWD-03: forgot password API route exists", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "app/api/auth/forgot-password/route.ts")
      )
    ).toBe(true);
  });

  // CMP-PWD-04: Reset password API route exists
  it("CMP-PWD-04: reset password API route exists", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "app/api/auth/reset-password/route.ts")
      )
    ).toBe(true);
  });

  // CMP-PWD-05: Admin reset password API route exists
  it("CMP-PWD-05: admin reset password API route exists", () => {
    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          "app/api/admin/users/[id]/reset-password/route.ts"
        )
      )
    ).toBe(true);
  });

  // CMP-PWD-06: Change password section component exists
  it("CMP-PWD-06: change password section component exists", () => {
    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          "components/account/change-password-section.tsx"
        )
      )
    ).toBe(true);
  });

  // CMP-PWD-07: Verify password API route exists
  it("CMP-PWD-07: verify password API route exists", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "app/api/auth/verify-password/route.ts")
      )
    ).toBe(true);
  });

  // CMP-PWD-08: Shared brand panel component exists
  it("CMP-PWD-08: shared brand panel component exists", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "components/auth/brand-panel.tsx")
      )
    ).toBe(true);
  });
});

describe("Password Management - Sign-In Page Integration", () => {
  let signInContent: string;

  beforeAll(() => {
    signInContent = fs.readFileSync(
      path.join(
        process.cwd(),
        "app/(auth)/sign-in/[[...sign-in]]/page.tsx"
      ),
      "utf8"
    );
  });

  // CMP-PWD-10: Sign-in page has forgot password link
  it("CMP-PWD-10: sign-in page contains forgot password link", () => {
    expect(signInContent).toContain("forgot-password");
  });
});

describe("Password Management - Auth Callback Handles Recovery", () => {
  let callbackContent: string;

  beforeAll(() => {
    callbackContent = fs.readFileSync(
      path.join(process.cwd(), "app/auth/callback/route.ts"),
      "utf8"
    );
  });

  // CMP-PWD-20: Auth callback detects recovery type
  it("CMP-PWD-20: auth callback handles recovery type", () => {
    expect(callbackContent).toContain("recovery");
  });

  // CMP-PWD-21: Auth callback redirects to reset-password
  it("CMP-PWD-21: auth callback redirects to reset-password page", () => {
    expect(callbackContent).toContain("reset-password");
  });
});

describe("Password Management - Account Settings Integration", () => {
  let accountContent: string;

  beforeAll(() => {
    accountContent = fs.readFileSync(
      path.join(
        process.cwd(),
        "app/(protected)/settings/account/page.tsx"
      ),
      "utf8"
    );
  });

  // CMP-PWD-30: Account settings includes change password section
  it("CMP-PWD-30: account settings page imports ChangePasswordSection", () => {
    expect(accountContent).toContain("ChangePasswordSection");
  });
});
