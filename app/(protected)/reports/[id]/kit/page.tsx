import { Suspense } from "react";
import { getAuthUserId } from "@/lib/supabase/auth";
import { redirect, notFound } from "next/navigation";
import { getReportWithMarket } from "@/lib/services/report";
import { getSocialMediaKit } from "@/lib/services/social-media-kit";
import { getEmailCampaign } from "@/lib/services/email-campaign";
import { checkEntitlement } from "@/lib/services/entitlement-check";
import { ContentStudioPage } from "@/components/reports/content-studio-page";

export default async function ContentStudioRoute({
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

  // Fetch both content types in parallel
  const [kit, campaign, kitEntitlement, emailEntitlement] = await Promise.all([
    report.status === "completed" ? getSocialMediaKit(id) : Promise.resolve(null),
    report.status === "completed" ? getEmailCampaign(id) : Promise.resolve(null),
    checkEntitlement(authId, "social_media_kits"),
    checkEntitlement(authId, "email_campaigns"),
  ]);

  return (
    <Suspense>
      <ContentStudioPage
        reportId={id}
        kitStatus={kit?.status ?? null}
        kitContent={(kit?.status === "completed" ? kit.content : null) as Record<string, unknown> | null}
        kitGeneratedAt={kit?.generatedAt?.toISOString() ?? null}
        emailStatus={campaign?.status ?? null}
        emailContent={(campaign?.status === "completed" ? campaign.content : null) as Record<string, unknown> | null}
        emailGeneratedAt={campaign?.generatedAt?.toISOString() ?? null}
        kitEntitlement={{ allowed: kitEntitlement.allowed, limit: kitEntitlement.limit }}
        emailEntitlement={{ allowed: emailEntitlement.allowed, limit: emailEntitlement.limit }}
      />
    </Suspense>
  );
}
