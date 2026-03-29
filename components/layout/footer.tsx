export function Footer() {
  return (
    <footer
      data-testid="copyright-footer"
      className="bg-[var(--color-app-nav-bg)] py-[var(--spacing-4)] text-center"
    >
      <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-tertiary)]">
        &copy; {new Date().getFullYear()} Modern Signal Advisory
      </p>
    </footer>
  );
}
