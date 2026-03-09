import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="bg-[var(--color-primary)] text-[var(--color-text-inverse)] px-[var(--spacing-6)] py-[var(--spacing-3)] flex items-center justify-between">
        <div className="flex items-center gap-[var(--spacing-3)]">
          <h1 className="font-[family-name:var(--font-serif)] text-xl font-semibold">
            Modern Signal Advisory
          </h1>
          <div className="w-px h-6 bg-[var(--color-text-tertiary)]" />
          <span className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-tertiary)]">
            Dashboard
          </span>
        </div>
        <UserButton />
      </header>

      <div className="p-[var(--spacing-6)]">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-[var(--spacing-6)]">
          <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
            Welcome, {user.firstName || "Agent"}
          </h2>
          <p className="font-[family-name:var(--font-sans)] text-[var(--color-text-secondary)] mt-[var(--spacing-2)]">
            Your market intelligence platform is ready. Start by defining your target market.
          </p>
          <div className="w-48 h-0.5 bg-[var(--color-accent)] mt-[var(--spacing-4)]" />
        </div>
      </div>
    </main>
  );
}
