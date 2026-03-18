/**
 * Waitlist confirmation email — HTML template.
 * Branded with marketing palette (warm tone, gold accents).
 */

interface WaitlistEmailProps {
  firstName: string;
}

export function getWaitlistConfirmationEmail({ firstName }: WaitlistEmailProps) {
  return {
    subject: "You're on the Modern Signal Advisory waitlist",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F7F4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F4EF; padding: 48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 40px; text-align: center;">
              <span style="font-family: Georgia, serif; font-size: 16px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #2C2825;">
                MODERN <span style="color: #B8975A;">SIGNAL</span> ADVISORY
              </span>
            </td>
          </tr>

          <!-- Gold rule -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <div style="width: 48px; height: 2px; background-color: #B8975A;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="font-family: Georgia, serif; font-size: 28px; font-weight: 300; color: #2C2825; margin: 0; line-height: 1.3; text-align: center;">
                You're on the list, ${firstName}.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom: 32px;">
              <p style="font-size: 16px; color: #8A8077; line-height: 1.7; margin: 0; text-align: center;">
                Your position in the Modern Signal Advisory founding cohort has been reserved.
                We're limiting the first cohort to 25 advisors &mdash;
                <strong style="color: #B8975A;">7 spots remain</strong>.
              </p>
            </td>
          </tr>

          <!-- What happens next -->
          <tr>
            <td style="background-color: #FDFCFA; border: 1px solid #E8E0D4; padding: 32px; margin-bottom: 32px;">
              <p style="font-family: Georgia, serif; font-size: 18px; color: #2C2825; margin: 0 0 16px 0;">
                What happens next
              </p>
              <p style="font-size: 15px; color: #8A8077; line-height: 1.7; margin: 0;">
                A member of our team will reach out to you personally when the founding cohort opens.
                You'll get founding pricing, direct access to the team building the platform,
                and the intelligence edge that changes how clients see you.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 40px; text-align: center;">
              <p style="font-size: 12px; color: #C4B9A8; margin: 0;">
                &copy; 2026 Modern Signal Advisory, LLC &middot; Confidential
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}
