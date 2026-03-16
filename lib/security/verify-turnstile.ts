const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 5000;

interface TurnstileVerifyResult {
  success: boolean;
  errorCodes?: string[];
}

/**
 * Server-side verification of a Cloudflare Turnstile token.
 * If TURNSTILE_SECRET_KEY is not set, verification is skipped (returns success).
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If no secret key configured, skip verification (dev mode)
  if (!secretKey) {
    return { success: true };
  }

  const body: Record<string, string> = {
    secret: secretKey,
    response: token,
  };
  if (remoteIp) {
    body.remoteip = remoteIp;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
      signal: controller.signal,
    });

    const data = await res.json();

    return {
      success: !!data.success,
      errorCodes: data["error-codes"] || undefined,
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return { success: false, errorCodes: ["timeout"] };
    }
    return { success: false, errorCodes: ["network-error"] };
  } finally {
    clearTimeout(timeout);
  }
}
