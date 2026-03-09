"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AccountSettingsProps {
  email: string;
  memberSince: string;
  stats: {
    reportCount: number;
    marketCount: number;
  };
}

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function AccountSettings({
  email,
  memberSince,
  stats,
}: AccountSettingsProps) {
  const router = useRouter();

  async function handleSignOutEverywhere() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/sign-in");
  }

  const cardClass =
    "bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6";
  const headingClass =
    "font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-primary)]";
  const subTextClass =
    "font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1";
  const accentLine = "w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-6";

  return (
    <div className="space-y-8">
      {/* Account Information */}
      <div className={cardClass}>
        <h2 className={headingClass}>Account Information</h2>
        <p className={subTextClass}>Your account details and usage summary.</p>
        <div className={accentLine} />

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Email
            </dt>
            <dd className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] mt-1">
              {email}
            </dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Member Since
            </dt>
            <dd className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] mt-1">
              {formatMemberSince(memberSince)}
            </dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Reports Generated
            </dt>
            <dd className="font-[family-name:var(--font-sans)] text-2xl font-bold text-[var(--color-primary)] mt-1">
              {stats.reportCount}
            </dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Markets Defined
            </dt>
            <dd className="font-[family-name:var(--font-sans)] text-2xl font-bold text-[var(--color-primary)] mt-1">
              {stats.marketCount}
            </dd>
          </div>
        </dl>
      </div>

      {/* Session Management */}
      <div className={cardClass}>
        <h2 className={headingClass}>Session Management</h2>
        <p className={subTextClass}>
          Manage your active sessions across devices.
        </p>
        <div className={accentLine} />

        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] mb-4">
          Sign out from all active sessions. You will need to sign in again on
          every device.
        </p>
        <button
          onClick={handleSignOutEverywhere}
          className="px-4 py-2 bg-[var(--color-error)] hover:bg-[var(--color-error)]/90 text-white font-[family-name:var(--font-sans)] font-medium text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
        >
          Sign Out Everywhere
        </button>
      </div>
    </div>
  );
}
