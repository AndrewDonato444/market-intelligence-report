"use client";

import { PasswordInput } from "@/components/ui/password-input";
import { useEffect, useRef, useState } from "react";

export function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const newPasswordTooShort = newPassword.length > 0 && newPassword.length < 8;
  const sameAsCurrentPassword =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    currentPassword === newPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword.length <= 256 &&
    !sameAsCurrentPassword &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword &&
    !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Verify current password via dedicated endpoint
      const verifyRes = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: currentPassword }),
      });

      if (!verifyRes.ok) {
        const verifyData = await verifyRes.json();
        setError(verifyData.error || "Current password is incorrect");
        return;
      }

      // Update password
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update password");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Clear success after 3 seconds
      successTimerRef.current = setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] border border-[var(--color-app-border)] p-[var(--spacing-6)] mt-[var(--spacing-6)]">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--color-app-text)]">
        Change Password
      </h3>

      {success && (
        <div className="mt-[var(--spacing-3)] bg-green-50 border border-green-200 rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)]">
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-success)]">
            Password updated
          </p>
        </div>
      )}

      {error && (
        <div className="mt-[var(--spacing-3)] bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)]">
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-error)]">
            {error}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-[var(--spacing-4)] space-y-[var(--spacing-4)]"
      >
        <div>
          <label
            htmlFor="currentPassword"
            className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-app-text)] mb-[var(--spacing-1)]"
          >
            Current password
          </label>
          <PasswordInput
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-app-text)] mb-[var(--spacing-1)]"
          >
            New password
          </label>
          <PasswordInput
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Enter new password"
          />
          {newPasswordTooShort && (
            <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-error)] mt-[var(--spacing-1)]">
              Password must be at least 8 characters
            </p>
          )}
          {sameAsCurrentPassword && (
            <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-error)] mt-[var(--spacing-1)]">
              New password must be different from current password
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmNewPassword"
            className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-app-text)] mb-[var(--spacing-1)]"
          >
            Confirm new password
          </label>
          <PasswordInput
            id="confirmNewPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Confirm new password"
          />
          {passwordsMismatch && (
            <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-error)] mt-[var(--spacing-1)]">
              Passwords do not match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="px-[var(--spacing-6)] py-[var(--spacing-2)] bg-[var(--color-app-accent)] text-[var(--color-app-surface)] rounded-[var(--radius-sm)] font-[family-name:var(--font-body)] text-sm font-semibold hover:bg-[var(--color-app-accent-hover)] disabled:opacity-50 transition-colors duration-[var(--duration-default)]"
        >
          {loading ? "Updating\u2026" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
