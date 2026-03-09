export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-[var(--spacing-8)] max-w-md w-full text-center">
        <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold text-[var(--color-primary)]">
          Modern Signal Advisory
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-lg text-[var(--color-text-secondary)] mt-[var(--spacing-2)]">
          Luxury Market Intelligence
        </p>
        <div className="w-48 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-4)]" />
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-tertiary)] mt-[var(--spacing-4)]">
          Platform initializing...
        </p>
      </div>
    </main>
  );
}
