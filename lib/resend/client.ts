/**
 * Resend client wrapper — lazy-initialized, same pattern as lib/stripe/client.ts.
 * Returns null if RESEND_API_KEY is not set (graceful degradation for local dev).
 */

import { Resend } from "resend";

let resendInstance: Resend | null = null;

export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }

  return resendInstance;
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export function getFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL ||
    "Modern Signal Advisory <onboarding@resend.dev>"
  );
}
