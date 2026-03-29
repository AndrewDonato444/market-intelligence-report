import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Modern Signal Advisory",
};

export default function TermsPage() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "var(--spacing-12) var(--spacing-6)",
        fontFamily: "var(--font-sans)",
        color: "var(--color-text)",
      }}
    >
      <Link
        href="/sign-up"
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-accent)",
          textDecoration: "none",
          fontWeight: "var(--font-medium)",
        }}
      >
        &larr; Back to Sign Up
      </Link>

      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "var(--text-3xl)",
          fontWeight: "var(--font-bold)",
          color: "var(--color-primary)",
          marginTop: "var(--spacing-6)",
        }}
      >
        Terms of Service
      </h1>

      <p
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-text-tertiary)",
          marginTop: "var(--spacing-2)",
        }}
      >
        Last updated: March 2026
      </p>

      <div
        style={{
          marginTop: "var(--spacing-8)",
          fontSize: "var(--text-base)",
          lineHeight: 1.7,
          color: "var(--color-text-secondary)",
        }}
      >
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-semibold)", color: "var(--color-text)", marginTop: "var(--spacing-6)", marginBottom: "var(--spacing-3)" }}>
          1. Acceptance of Terms
        </h2>
        <p>
          By creating an account on the Modern Signal Advisory platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform.
        </p>

        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-semibold)", color: "var(--color-text)", marginTop: "var(--spacing-6)", marginBottom: "var(--spacing-3)" }}>
          2. Service Description
        </h2>
        <p>
          Modern Signal Advisory provides AI-powered market intelligence reports for luxury real estate professionals. Reports are generated using publicly available data, proprietary analytics, and artificial intelligence models.
        </p>

        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-semibold)", color: "var(--color-text)", marginTop: "var(--spacing-6)", marginBottom: "var(--spacing-3)" }}>
          3. Data and Privacy
        </h2>
        <p>
          Your account information and usage data are stored securely. We do not sell personal information to third parties. Market data used in reports is sourced from public records and licensed data providers.
        </p>

        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-semibold)", color: "var(--color-text)", marginTop: "var(--spacing-6)", marginBottom: "var(--spacing-3)" }}>
          4. Report Accuracy
        </h2>
        <p>
          While we strive for accuracy, market intelligence reports are provided for informational purposes only and should not be considered financial or legal advice. Users should independently verify data before making business decisions.
        </p>

        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-semibold)", color: "var(--color-text)", marginTop: "var(--spacing-6)", marginBottom: "var(--spacing-3)" }}>
          5. Account Responsibilities
        </h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately of any unauthorized use.
        </p>

        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-semibold)", color: "var(--color-text)", marginTop: "var(--spacing-6)", marginBottom: "var(--spacing-3)" }}>
          6. Modifications
        </h2>
        <p>
          We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms.
        </p>
      </div>
    </div>
  );
}
