function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check .env.local.example for setup instructions.`
    );
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string = ""): string {
  return process.env[name] || defaultValue;
}

/**
 * Type-safe environment configuration.
 *
 * All required variables are validated when first accessed.
 * Import this module instead of reading process.env directly.
 */
export const env = {
  // --- Database ---
  get DATABASE_URL() {
    return requiredEnv("DATABASE_URL");
  },

  // --- Authentication (Clerk) ---
  get NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY() {
    return requiredEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  },
  get CLERK_SECRET_KEY() {
    return requiredEnv("CLERK_SECRET_KEY");
  },
  get NEXT_PUBLIC_CLERK_SIGN_IN_URL() {
    return optionalEnv("NEXT_PUBLIC_CLERK_SIGN_IN_URL", "/sign-in");
  },
  get NEXT_PUBLIC_CLERK_SIGN_UP_URL() {
    return optionalEnv("NEXT_PUBLIC_CLERK_SIGN_UP_URL", "/sign-up");
  },
  get NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL() {
    return optionalEnv("NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL", "/dashboard");
  },
  get NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL() {
    return optionalEnv("NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL", "/dashboard");
  },

  // --- AI / Anthropic ---
  get ANTHROPIC_API_KEY() {
    return requiredEnv("ANTHROPIC_API_KEY");
  },

  // --- Data APIs ---
  get FRED_API_KEY() {
    return requiredEnv("FRED_API_KEY");
  },
  get REALESTATEAPI_KEY() {
    return requiredEnv("REALESTATEAPI_KEY");
  },
  get SCRAPINGDOG_API_KEY() {
    return requiredEnv("SCRAPINGDOG_API_KEY");
  },

  // --- Storage ---
  get S3_BUCKET() {
    return optionalEnv("S3_BUCKET");
  },
  get S3_REGION() {
    return optionalEnv("S3_REGION", "us-east-1");
  },
  get S3_ACCESS_KEY() {
    return optionalEnv("S3_ACCESS_KEY");
  },
  get S3_SECRET_KEY() {
    return optionalEnv("S3_SECRET_KEY");
  },

  // --- App Config ---
  get NODE_ENV() {
    return optionalEnv("NODE_ENV", "development");
  },
  get NEXT_PUBLIC_APP_URL() {
    return optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  },
} as const;

/**
 * Validate all required environment variables at once.
 * Call this during app startup to fail fast.
 */
export function validateEnv(): void {
  const required = [
    "DATABASE_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "ANTHROPIC_API_KEY",
    "FRED_API_KEY",
    "REALESTATEAPI_KEY",
    "SCRAPINGDOG_API_KEY",
  ];

  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((n) => `  - ${n}`).join("\n")}\n\nSee .env.local.example for setup instructions.`
    );
  }
}
