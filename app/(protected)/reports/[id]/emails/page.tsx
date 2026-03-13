import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect, notFound } from "next/navigation";
import { getReportWithMarket } from "@/lib/services/report";
import { getEmailCampaign } from "@/lib/services/email-campaign";
import { EmailCampaignViewer } from "@/components/reports/email-viewer";
import { GenerateEmailButton } from "@/components/reports/generate-email-button";
import Link from "next/link";
import type { EmailCampaignContent } from "@/lib/db/schema";

export default async function EmailCampaignPage({
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

  const campaign = await getEmailCampaign(id);

  // Campaign completed — show the viewer
  if (campaign?.status === "completed" && campaign.content) {
    return (
      <EmailCampaignViewer
        reportId={id}
        content={campaign.content as EmailCampaignContent}
        generatedAt={campaign.generatedAt?.toISOString() ?? null}
      />
    );
  }

  // Campaign generating — show status
  if (campaign?.status === "generating" || campaign?.status === "queued") {
    return (
      <div className="space-y-6">
        <Link
          href={`/reports/${id}`}
          className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          &larr; Back to Report
        </Link>
        <div className="text-center py-12 space-y-4">
          <h1 className="font-[family-name:var(--font-sans)] text-lg text-[var(--color-text)]">
            Your email campaign is being generated...
          </h1>
          <div className="w-64 mx-auto h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
            <div className="h-full bg-[var(--color-accent)] rounded-full animate-pulse w-2/3" />
          </div>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
            Crafting drip sequences, newsletters, and persona copy from your market intelligence data.
          </p>
          <GenerateEmailButton
            reportId={id}
            initialCampaignStatus={campaign.status as "queued" | "generating"}
          />
        </div>
      </div>
    );
  }

  // Campaign failed — show error with retry
  if (campaign?.status === "failed") {
    return (
      <div className="space-y-6">
        <Link
          href={`/reports/${id}`}
          className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          &larr; Back to Report
        </Link>
        <div className="text-center py-12 space-y-4">
          <h1 className="font-[family-name:var(--font-sans)] text-lg text-[var(--color-error)]">
            Campaign Generation Failed
          </h1>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
            {campaign.errorMessage ?? "An error occurred during campaign generation."}
          </p>
          <GenerateEmailButton
            reportId={id}
            initialCampaignStatus="failed"
            initialErrorMessage={campaign.errorMessage}
          />
        </div>
      </div>
    );
  }

  // No campaign — show generate CTA
  return (
    <div className="space-y-6">
      <Link
        href={`/reports/${id}`}
        className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
      >
        &larr; Back to Report
      </Link>
      <div className="text-center py-12 space-y-4">
        <h1 className="font-[family-name:var(--font-sans)] text-lg text-[var(--color-text)]">
          No email campaign has been generated yet
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          Generate drip sequences, newsletters, and persona-targeted emails from your report data.
        </p>
        {report.status === "completed" && (
          <GenerateEmailButton reportId={id} initialCampaignStatus="none" />
        )}
      </div>
    </div>
  );
}
