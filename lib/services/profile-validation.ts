// Pure validation logic — no database dependencies.
// This can be imported safely in both server and test contexts.

export interface ProfileData {
  name: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  bio?: string;
  logoUrl?: string;
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  } | null;
}

export interface ValidationResult {
  success: boolean;
  errors?: Record<string, string>;
  data?: ProfileData;
}

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const PHONE_REGEX = /^[+]?[\d\s()./-]{7,20}$/;

export function validateProfileData(
  data: Partial<ProfileData>
): ValidationResult {
  const errors: Record<string, string> = {};

  // Name is required
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) {
    errors.name = "Name is required";
  }

  // Phone validation (optional but must be valid if provided)
  let phone = data.phone;
  if (phone) {
    phone = phone.trim();
    if (!PHONE_REGEX.test(phone)) {
      errors.phone =
        "Enter a valid phone number (e.g., (239) 555-0147 or +1 239 555 0147)";
    }
  }

  // Brand colors validation (optional but must be valid hex if provided)
  if (data.brandColors) {
    const { primary, secondary, accent } = data.brandColors;
    const invalidColors: string[] = [];

    if (primary && !HEX_COLOR_REGEX.test(primary)) {
      invalidColors.push("primary");
    }
    if (secondary && !HEX_COLOR_REGEX.test(secondary)) {
      invalidColors.push("secondary");
    }
    if (accent && !HEX_COLOR_REGEX.test(accent)) {
      invalidColors.push("accent");
    }

    if (invalidColors.length > 0) {
      errors.brandColors = `Invalid hex color format for: ${invalidColors.join(", ")}. Use format #RRGGBB.`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // Return cleaned data
  return {
    success: true,
    data: {
      name,
      company: data.company?.trim() || undefined,
      title: data.title?.trim() || undefined,
      phone: phone || undefined,
      bio: data.bio?.trim() || undefined,
      logoUrl: data.logoUrl?.trim() || undefined,
      brandColors: data.brandColors || undefined,
    },
  };
}
