import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect, notFound } from "next/navigation";
import { getReportWithMarket } from "@/lib/services/report";
import { getSocialMediaKit } from "@/lib/services/social-media-kit";
import { KitViewer } from "@/components/reports/kit-viewer";
import { GenerateKitButton } from "@/components/reports/generate-kit-button";
import Link from "next/link";
import type { SocialMediaKitContent } from "@/lib/db/schema";

export default async function KitViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authId = await getAuthUserId();
  if (!authId) redirect("/sign-in");

  const { id } = await params;
  const report = await getReportWithMarket(authId, id);

  if (!report) {
    notFound();
  }

  const kit = await getSocialMediaKit(id);

  // Kit completed — show the viewer
  if (kit?.status === "completed" && kit.content) {
    return (
      <KitViewer
        reportId={id}
        content={kit.content as SocialMediaKitContent}
        generatedAt={kit.generatedAt?.toISOString() ?? null}
      />
    );
  }

  // Kit generating — show status
  if (kit?.status === "generating" || kit?.status === "queued") {
    return (
      <div className="space-y-6">
        <Link
          href={`/reports/${id}`}
          className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          &larr; Back to Report
        </Link>
        <div className="text-center py-12 space-y-4">
          <h1 className="font-[family-name:var(--font-sans)] text-xl font-bold text-[var(--color-text)]">
            Generating Social Media Kit
          </h1>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
            The Social Media Agent is analyzing your report and creating content...
          </p>
          <GenerateKitButton
            reportId={id}
            initialKitStatus={kit.status as "queued" | "generating"}
          />
        </div>
      </div>
    );
  }

  // Kit failed — show error with retry
  if (kit?.status === "failed") {
    return (
      <div className="space-y-6">
        <Link
          href={`/reports/${id}`}
          className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          &larr; Back to Report
        </Link>
        <div className="text-center py-12 space-y-4">
          <h1 className="font-[family-name:var(--font-sans)] text-xl font-bold text-[var(--color-text)]">
            Kit Generation Failed
          </h1>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-error)]">
            {kit.errorMessage ?? "An error occurred during kit generation."}
          </p>
          <GenerateKitButton
            reportId={id}
            initialKitStatus="failed"
            initialErrorMessage={kit.errorMessage}
          />
        </div>
      </div>
    );
  }

  // No kit — show generate CTA
  return (
    <div className="space-y-6">
      <Link
        href={`/reports/${id}`}
        className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
      >
        &larr; Back to Report
      </Link>
      <div className="text-center py-12 space-y-4">
        <h1 className="font-[family-name:var(--font-sans)] text-xl font-bold text-[var(--color-text)]">
          No Social Media Kit Found
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          Generate a social media kit from your completed report to get
          platform-optimized posts, captions, polls, and more.
        </p>
        {report.status === "completed" && (
          <GenerateKitButton reportId={id} initialKitStatus="none" />
        )}
      </div>
    </div>
  );
}
