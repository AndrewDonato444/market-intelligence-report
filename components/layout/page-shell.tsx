export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-auto bg-[var(--color-app-bg)] p-[var(--spacing-8)]">
      <div className="app-fade-in">{children}</div>
    </main>
  );
}
