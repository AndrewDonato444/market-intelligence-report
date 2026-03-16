export function Footer() {
  return (
    <footer
      data-testid="copyright-footer"
      className="bg-[var(--color-primary)] py-[var(--spacing-4)] text-center"
    >
      <p className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-text-tertiary)]">
        &copy; {new Date().getFullYear()} Modern Signal Advisory
      </p>
    </footer>
  );
}
