export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-[var(--spacing-8)]">
          <h1 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
            Modern Signal Advisory
          </h1>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">
            Luxury Market Intelligence
          </p>
          <div className="w-24 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-3)]" />
        </div>
        {children}
      </div>
    </main>
  );
}
