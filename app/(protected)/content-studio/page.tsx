import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { getContentStudios } from "@/lib/services/content-studio";
import { ContentStudioTileGrid } from "@/components/content-studio/content-studio-tile-grid";

export default async function ContentStudioListingPage() {
  const authId = await getAuthUserId();
  if (!authId) redirect("/sign-in");

  let items: Awaited<ReturnType<typeof getContentStudios>> = [];
  try {
    items = await getContentStudios(authId);
  } catch (error) {
    console.error("[ContentStudioListingPage] Failed to load data:", error);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
            Content Studio
          </h2>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
            Your generated marketing content.
          </p>
        </div>
      </div>

      <ContentStudioTileGrid items={items} />
    </div>
  );
}
