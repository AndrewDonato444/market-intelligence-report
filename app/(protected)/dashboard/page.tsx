import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-[var(--spacing-6)]">
        <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
          Welcome, Agent
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-[var(--color-text-secondary)] mt-[var(--spacing-2)]">
          Your market intelligence platform is ready. Start by defining your target market.
        </p>
        <div className="w-48 h-0.5 bg-[var(--color-accent)] mt-[var(--spacing-4)]" />
      </div>
    </div>
  );
}
