export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-auto bg-[var(--color-background)] p-[var(--spacing-6)]">
      {children}
    </main>
  );
}
