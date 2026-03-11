import { AnalyticsNav } from "@/components/admin/analytics-nav";

export default function AdminAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-[var(--spacing-4)]">
      <AnalyticsNav />
      {children}
    </div>
  );
}
