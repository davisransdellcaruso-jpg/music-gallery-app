// Sends email through Resend's REST API (no extra package needed).
// If you already use another provider, replace the body of this one function.

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM, // e.g. "Davis Caruso <hello@daviscaruso.com>"
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Email send failed: ${res.status} ${await res.text()}`);
  }
}