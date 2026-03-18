import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, market, website } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !market) {
      return NextResponse.json(
        { error: "First name, last name, email, and market are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Dynamic imports to ensure env is loaded
    const { db } = await import("@/lib/db");
    const { waitlist } = await import("@/lib/db/schema");

    // Check for duplicate
    const existing = await db
      .select({ id: waitlist.id })
      .from(waitlist)
      .where(eq(waitlist.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This email is already on our waitlist" },
        { status: 409 }
      );
    }

    // Insert entry
    const [entry] = await db
      .insert(waitlist)
      .values({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        market: market.trim(),
        website: website?.trim() || null,
      })
      .returning({ id: waitlist.id });

    // Send confirmation email (fire-and-forget)
    sendConfirmationEmail(firstName.trim(), email.toLowerCase().trim()).catch(
      (err) => console.error("Failed to send waitlist confirmation email:", err)
    );

    return NextResponse.json(
      { success: true, id: entry.id, message: "You're on the list" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Waitlist submission error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

async function sendConfirmationEmail(firstName: string, email: string) {
  const { getResend, getFromEmail } = await import("@/lib/resend/client");
  const { getWaitlistConfirmationEmail } = await import(
    "@/lib/resend/templates/waitlist-confirmation"
  );

  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping waitlist confirmation email");
    return;
  }

  const { subject, html } = getWaitlistConfirmationEmail({ firstName });

  await resend.emails.send({
    from: getFromEmail(),
    to: email,
    subject,
    html,
  });
}
